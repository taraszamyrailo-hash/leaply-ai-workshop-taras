// POST /api/plan
//   body: { skill, questions, answers }
//   returns: LearningPlan
//
// Day-based personalized learning plan with concrete exercises and
// step-by-step instructions for each one. Generated via Gemini with
// structured JSON output, then re-validated with zod.

import { NextResponse } from "next/server"

import { callGeminiStructured } from "@/lib/gemini"
import {
  LearningPlanSchema,
  PlanRequestSchema,
} from "@/lib/schemas/planner-schemas"

// Gemini-compatible response schema. See lib/gemini.ts for the subset
// of OpenAPI 3.0 that Gemini supports (no additionalProperties, etc.).
const PLAN_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "skill",
    "summary",
    "estimatedTimeframe",
    "weeklyCommitment",
    "totalDays",
    "days",
    "checkpoints",
  ],
  properties: {
    skill: { type: "STRING" },
    summary: { type: "STRING" },
    estimatedTimeframe: { type: "STRING" },
    weeklyCommitment: { type: "STRING" },
    totalDays: { type: "INTEGER" },
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["dayNumber", "weekNumber", "label", "goal", "exercises"],
        properties: {
          dayNumber: { type: "INTEGER" },
          weekNumber: { type: "INTEGER" },
          label: { type: "STRING" },
          goal: { type: "STRING" },
          exercises: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["title", "summary", "steps", "durationMinutes"],
              properties: {
                title: { type: "STRING" },
                summary: { type: "STRING" },
                steps: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                visualHint: { type: "STRING" },
                durationMinutes: { type: "INTEGER" },
              },
            },
          },
        },
      },
    },
    checkpoints: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["atDay", "criteria", "adjustment"],
        properties: {
          atDay: { type: "INTEGER" },
          criteria: { type: "STRING" },
          adjustment: { type: "STRING" },
        },
      },
    },
  },
} as const

const SYSTEM_PROMPT = `You are an expert learning coach. Given a user's skill goal and a quiz
they just completed, design a realistic, actionable, DAY-BY-DAY learning plan.

# Two numbers you must keep straight

There are TWO different "lengths" in this plan:
  - \`totalDays\` = the FULL projected number of training days from start
    to mastery. Calibrate from target level + current level + learning
    speed + sessions per week. Examples: 1 session/week for 3 months → ~12;
    4 sessions/week for 8 weeks → 32; 5 sessions/week for 5 months → ~100.
  - \`days.length\` = the number of training days you DETAIL right now.
    Cap this at 30. If totalDays > 30, you ONLY detail the first 30 days
    (or first phase up to the first checkpoint, whichever is shorter).
    The rest is implied by \`totalDays\` and \`checkpoints\`.

These two numbers can differ. \`totalDays\` is almost always >= days.length.

# Output rules (NON-NEGOTIABLE)

- Return a single JSON object that fits the provided response schema. Never include prose outside the JSON.
- All user-facing strings MUST be in Ukrainian. Address the user informally (на "ти").
- \`summary\`: 2–3 sentences. If days.length < totalDays, mention that the detailed plan covers the first phase and will extend at the next checkpoint.
- \`estimatedTimeframe\`: short Ukrainian phrase derived from \`totalDays\` (e.g. "8 тижнів", "≈ 3 місяці"). MUST be consistent with totalDays / sessions-per-week.
- \`weeklyCommitment\`: e.g. "≈ 3 год / тиждень (1 сесія × 180 хв)" — echo the user's session length and frequency from the quiz.
- SIZE BUDGET (HARD): days.length ≤ 30. AT MOST 4 exercises per day. AT MOST 6 steps per exercise.
- \`days\`: \`dayNumber\` is global, 1-based, strictly increasing by 1, STARTING at 1. \`weekNumber\` groups consecutive days; days per week MUST match the user's stated frequency from the quiz. \`label\` is short, e.g. "День 1".
- \`days[i].goal\`: ONE concrete sentence (~120 chars).
- \`days[i].exercises[j]\`:
  - \`title\`: short noun phrase, 3–8 words.
  - \`summary\`: one short sentence (~100 chars).
  - \`steps\`: 3–6 short imperative sentences. Each ~120 chars or less. Be concrete (counts, times, positions) but BRIEF.
  - \`visualHint\` (optional): a short YouTube search query like "youtube: handstand wall hold tutorial". Skip if not useful.
  - \`durationMinutes\`: integer, multiple of 5. Sum across exercises ≈ user's per-session time.
- \`checkpoints\`: 3–5 milestones distributed across the FULL plan (atDay can exceed days.length — checkpoints span the whole journey to mastery, not just the detailed first phase). atDay values MUST be between 1 and \`totalDays\`, strictly increasing. The FIRST checkpoint SHOULD land at or before days.length, so the user has detailed instructions to reach it.
- Progression: early days = fundamentals; later days build on them. No generic "practice" placeholders.
- Calibrate realistically. Don't over-promise.
- Echo the user's original skill string in \`skill\` verbatim.

KEEP TEXT TERSE. Every saved token reduces the chance of truncation.`

function formatAnswersForPrompt(input: {
  skill: string
  questions: { id: string; prompt: string; category: string }[]
  answers: Record<string, string>
}) {
  const lines: string[] = []
  lines.push(`Skill: ${input.skill}`)
  lines.push("")
  lines.push("Quiz answers:")
  for (const q of input.questions) {
    const ans = input.answers[q.id] ?? ""
    lines.push(`- [${q.category}] ${q.prompt}`)
    lines.push(`  → ${ans || "(no answer)"}`)
  }
  return lines.join("\n")
}

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

  const parsed = PlanRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректний запит: " + parsed.error.message },
      { status: 400 }
    )
  }

  try {
    const plan = await callGeminiStructured({
      system: SYSTEM_PROMPT,
      userMessage: formatAnswersForPrompt(parsed.data),
      responseSchema: PLAN_RESPONSE_SCHEMA,
      resultSchema: LearningPlanSchema,
      maxOutputTokens: 65536,
    })
    return NextResponse.json(plan)
  } catch (err) {
    console.error("[/api/plan] generation failed:", err)
    const message =
      err instanceof Error ? err.message : "Невідома помилка генерації плану."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
