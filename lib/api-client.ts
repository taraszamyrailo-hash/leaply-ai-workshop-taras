// Thin browser-side wrappers around our server API routes. They live in
// lib/ (not in a component) so the calling code stays declarative and easy
// to test/mock later. Every response is parsed with zod before being
// returned — see Rule 4 in CLAUDE.md.

import {
  CheckpointReviewSchema,
  LearningPlanSchema,
  QuizSchema,
  type CheckpointReview,
  type CompletedDays,
  type LearningPlan,
  type Quiz,
  type QuizAnswers,
  type QuizQuestion,
} from "@/lib/schemas/planner-schemas"

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    // Try to surface the server's plain-text error; fall back to status.
    let detail = ""
    try {
      const data = (await res.json()) as { error?: string }
      detail = data?.error ?? ""
    } catch {
      // ignore — body wasn't JSON
    }
    throw new Error(
      detail || `Request to ${url} failed with status ${res.status}`
    )
  }

  return (await res.json()) as T
}

export async function generateQuiz(skill: string): Promise<Quiz> {
  const raw = await postJson<unknown>("/api/quiz", { skill })
  return QuizSchema.parse(raw)
}

export async function generatePlan(input: {
  skill: string
  questions: QuizQuestion[]
  answers: QuizAnswers
}): Promise<LearningPlan> {
  const raw = await postJson<unknown>("/api/plan", input)
  return LearningPlanSchema.parse(raw)
}

export async function reviewCheckpoint(input: {
  plan: LearningPlan
  completedDays: CompletedDays
  planStartedAt: string
  checkpointIndex: number
}): Promise<CheckpointReview> {
  const raw = await postJson<unknown>("/api/checkpoint", input)
  return CheckpointReviewSchema.parse(raw)
}
