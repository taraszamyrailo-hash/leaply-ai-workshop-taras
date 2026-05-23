// POST /api/quiz
//   body: { skill: string }
//   returns: { skill, questions: QuizQuestion[] }
//
// Asks Gemini to generate an assessment quiz for the given skill. The
// schema below is a JSON Schema mirror of QuizSchema/QuizQuestionSchema in
// lib/schemas/planner-schemas.ts — they must stay in sync. We re-validate
// Gemini's output with zod before returning to defend against drift.

import { NextResponse } from "next/server"

import { callGeminiStructured } from "@/lib/gemini"
import { QuizRequestSchema, QuizSchema } from "@/lib/schemas/planner-schemas"

// Gemini-compatible response schema. Gemini supports a SUBSET of OpenAPI
// 3.0: type / properties / required / items / enum / description, but NOT
// additionalProperties, $ref, oneOf, allOf, etc. We instead lean on the
// system prompt to enforce per-type field requirements, and zod re-checks
// the result.
const QUIZ_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["skill", "questions"],
  properties: {
    skill: { type: "STRING" },
    questions: {
      type: "ARRAY",
      minItems: 5,
      maxItems: 10,
      items: {
        type: "OBJECT",
        required: ["id", "prompt", "type", "category"],
        properties: {
          id: { type: "STRING" },
          prompt: { type: "STRING" },
          helper: { type: "STRING" },
          category: {
            type: "STRING",
            enum: [
              "time",
              "frequency",
              "target_level",
              "current_level",
              "learning_speed",
              "context",
            ],
          },
          type: {
            type: "STRING",
            enum: ["single_choice", "scale", "number", "text"],
          },
          // single_choice
          options: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["value", "label"],
              properties: {
                value: { type: "STRING" },
                label: { type: "STRING" },
              },
            },
          },
          // scale
          min: { type: "NUMBER" },
          max: { type: "NUMBER" },
          minLabel: { type: "STRING" },
          maxLabel: { type: "STRING" },
          // number
          unit: { type: "STRING" },
          // text
          placeholder: { type: "STRING" },
          maxLength: { type: "NUMBER" },
        },
      },
    },
  },
} as const

const SYSTEM_PROMPT = `You design short personal-learning assessment quizzes for any skill.

Output rules (NON-NEGOTIABLE):
- Always return a single JSON object that fits the provided response schema. Never include prose outside the JSON.
- Generate 6–8 questions total in Ukrainian (UI is Ukrainian).
- The first FIVE questions, in this exact order, MUST cover:
  1. category="time"           — how long the user can dedicate per session (use type="number", unit="хвилин")
  2. category="frequency"      — sessions per week (use type="number", unit="сесій на тиждень")
  3. category="target_level"   — desired proficiency target (use type="single_choice" with 3–5 sensible levels for THIS skill)
  4. category="current_level"  — self-assessed current level (use type="scale", 1–5, with skill-specific minLabel/maxLabel)
  5. category="learning_speed" — how quickly the user typically picks up new skills (use type="scale", 1–5, minLabel="повільно", maxLabel="дуже швидко")
- Then add 1–3 more questions (category="context") that are useful for THIS specific skill — e.g. for a language: prior languages; for a physical skill: previous sport experience; for a habit: triggers/blockers. Choose appropriate type per question.
- Question \`id\` must be a short slug like "time", "freq", "target", "current", "speed", "context-1".
- Keep prompts plain-language, friendly, addressed informally (на "ти").
- For \`type="scale"\` always include integer \`min\`, \`max\`, \`minLabel\`, \`maxLabel\`.
- For \`type="number"\` always include \`unit\`, \`min\`, \`max\`.
- For \`type="single_choice"\` provide 3–5 options with short labels. Do NOT include \`options\` for any other question type.
- Echo back the user's skill string verbatim in the \`skill\` field.

Tone: warm, concise, no jargon. Never refer to yourself. Never wrap output in prose.`

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Невалідний JSON у запиті." },
      { status: 400 }
    )
  }

  const parsed = QuizRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректний запит: " + parsed.error.message },
      { status: 400 }
    )
  }
  const { skill } = parsed.data

  try {
    const quiz = await callGeminiStructured({
      system: SYSTEM_PROMPT,
      userMessage: `Згенеруй квіз для опанування навички: ${skill}`,
      responseSchema: QUIZ_RESPONSE_SCHEMA,
      resultSchema: QuizSchema,
    })
    return NextResponse.json(quiz)
  } catch (err) {
    console.error("[/api/quiz] generation failed:", err)
    const message =
      err instanceof Error ? err.message : "Невідома помилка генерації квіза."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
