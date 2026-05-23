// POST /api/checkpoint
//   body: { plan, completedDays, planStartedAt, checkpointIndex }
//   returns: CheckpointReview
//
// Compares the user's actual completion pace (real wall-clock days
// between plan start and now vs. days actually checked off) against the
// pace implied by their original quiz answers, then asks Gemini to:
//   - summarize how the user is really doing,
//   - re-forecast the total number of days to mastery,
//   - suggest concrete adjustments going forward.
//
// The route does the deterministic pace math itself and feeds it to the
// model alongside the original plan — the LLM is only responsible for
// the language and the qualitative call, not the arithmetic.

import { NextResponse } from "next/server"

import { callGeminiStructured } from "@/lib/gemini"
import {
  CheckpointRequestSchema,
  CheckpointReviewSchema,
} from "@/lib/schemas/planner-schemas"

const REVIEW_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "paceAnalysis",
    "paceRatio",
    "newTotalDays",
    "newEstimatedTimeframe",
    "suggestions",
  ],
  properties: {
    paceAnalysis: { type: "STRING" },
    paceRatio: { type: "NUMBER" },
    newTotalDays: { type: "INTEGER" },
    newEstimatedTimeframe: { type: "STRING" },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
} as const

const SYSTEM_PROMPT = `You are a learning coach reviewing the user's progress at a checkpoint.

You will be given:
- The original plan (skill, totalDays, weeklyCommitment).
- The checkpoint criteria.
- The user's actual completion log: how many days were checked off, when the plan started, and how many wall-clock days have passed since.
- Pre-computed pace metrics: plannedSessionsPerWeek, actualSessionsPerWeek, paceRatio (= actual/planned).

Return a JSON object that fits the response schema. All user-facing strings MUST be in Ukrainian, addressed informally (на "ти").

Field rules (NON-NEGOTIABLE):
- \`paceAnalysis\`: 2–3 sentences. Plain-language read on the user's pace. Mention the actual vs. planned cadence in everyday words ("ти йдеш приблизно X сесій на тиждень замість обіцяних Y"). Acknowledge effort, but be honest.
- \`paceRatio\`: ECHO the provided paceRatio rounded to 2 decimals.
- \`newTotalDays\`: integer. The revised total number of training days (including days already done) projected from the current pace and the remaining work. If the user is ahead of schedule, this number should DECREASE; behind, INCREASE. Never less than the number of days already completed + 1.
- \`newEstimatedTimeframe\`: short Ukrainian phrase derived from \`newTotalDays\` and the actual pace, e.g. "≈ 12 тижнів" or "≈ 4 місяці".
- \`suggestions\`: 2–4 concrete suggestions for the days ahead. Each suggestion is one sentence, actionable. Examples: "Знизь тривалість сесій до 30 хв, але збережи частоту" / "Додай одну сесію на вихідні, щоб надолужити".

Tone: warm, honest, not preachy.`

function computePaceMetrics(args: {
  weeklyCommitment: string
  planStartedAt: string
  completedCount: number
}) {
  const startMs = Date.parse(args.planStartedAt)
  const now = Date.now()
  const elapsedDays = Math.max((now - startMs) / (1000 * 60 * 60 * 24), 0.5)
  const elapsedWeeks = elapsedDays / 7

  // Parse planned sessions/week from the original string ("4 сесії × 60 хв").
  // We're forgiving — fall back to 3 if the AI's phrasing is unparseable.
  const match = args.weeklyCommitment.match(/(\d+(?:[.,]\d+)?)\s*сес/)
  const plannedSessionsPerWeek = match ? Number(match[1].replace(",", ".")) : 3

  const actualSessionsPerWeek =
    elapsedWeeks > 0 ? args.completedCount / elapsedWeeks : 0
  const paceRatio =
    plannedSessionsPerWeek > 0
      ? actualSessionsPerWeek / plannedSessionsPerWeek
      : 1

  return {
    elapsedDays: Math.round(elapsedDays * 10) / 10,
    elapsedWeeks: Math.round(elapsedWeeks * 10) / 10,
    plannedSessionsPerWeek,
    actualSessionsPerWeek: Math.round(actualSessionsPerWeek * 100) / 100,
    paceRatio: Math.round(paceRatio * 100) / 100,
  }
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

  const parsed = CheckpointRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректний запит: " + parsed.error.message },
      { status: 400 }
    )
  }

  const { plan, completedDays, planStartedAt, checkpointIndex } = parsed.data
  const checkpoint = plan.checkpoints[checkpointIndex]
  if (!checkpoint) {
    return NextResponse.json(
      { error: "Цей чекпоінт не існує." },
      { status: 400 }
    )
  }

  const completedCount = Object.keys(completedDays).length
  const metrics = computePaceMetrics({
    weeklyCommitment: plan.weeklyCommitment,
    planStartedAt,
    completedCount,
  })

  const userMessage = [
    `Skill: ${plan.skill}`,
    `Original totalDays: ${plan.totalDays}`,
    `Original weeklyCommitment: ${plan.weeklyCommitment}`,
    `Original estimatedTimeframe: ${plan.estimatedTimeframe}`,
    "",
    `Checkpoint #${checkpointIndex + 1} at day ${checkpoint.atDay}`,
    `Checkpoint criteria: ${checkpoint.criteria}`,
    `Checkpoint planned adjustment: ${checkpoint.adjustment}`,
    "",
    `Completed days so far: ${completedCount}`,
    `Plan started at: ${planStartedAt}`,
    `Elapsed wall-clock: ${metrics.elapsedDays} days (${metrics.elapsedWeeks} weeks)`,
    `Planned sessions/week: ${metrics.plannedSessionsPerWeek}`,
    `Actual sessions/week: ${metrics.actualSessionsPerWeek}`,
    `paceRatio (actual / planned): ${metrics.paceRatio}`,
  ].join("\n")

  try {
    const review = await callGeminiStructured({
      system: SYSTEM_PROMPT,
      userMessage,
      responseSchema: REVIEW_RESPONSE_SCHEMA,
      resultSchema: CheckpointReviewSchema,
      maxOutputTokens: 4096,
    })
    return NextResponse.json(review)
  } catch (err) {
    console.error("[/api/checkpoint] review failed:", err)
    const message =
      err instanceof Error ? err.message : "Не вдалось переоцінити прогрес."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
