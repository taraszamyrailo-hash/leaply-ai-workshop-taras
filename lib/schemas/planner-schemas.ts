// Zod schemas for the skill-learning planner. These are the single source
// of truth for shape: the API routes parse with .parse() before returning
// anything to the client.
//
// IMPORTANT: AI-generated string fields use `aiText(max)` which CLAMPS
// over-long output instead of rejecting it. We've been bitten enough by
// "expected <= N characters" failures from the model that the working
// rule is: structural validity (type/shape/required) is strict; length
// caps are best-effort and silently truncated.

import { z } from "zod"

// A string field produced by the LLM. Required to be a non-empty string,
// but any overflow past `maxLength` is sliced off rather than failing
// validation. Use this anywhere Gemini might overrun a tight limit.
function aiText(maxLength: number) {
  return z
    .string()
    .min(1)
    .transform((s) => (s.length > maxLength ? s.slice(0, maxLength) : s))
}

// Same idea but the field is optional (may be missing entirely).
function aiTextOptional(maxLength: number) {
  return z
    .string()
    .transform((s) => (s.length > maxLength ? s.slice(0, maxLength) : s))
    .optional()
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

// Every quiz has the same five mandatory questions (per the user's spec):
//   time         — minutes per session
//   frequency    — sessions per week
//   targetLevel  — where they want to end up
//   currentLevel — where they are now
//   learningSpeed — self-assessed learning pace
// Additional skill-specific questions are appended by the AI.
//
// We use a discriminated union on `type` so the UI knows how to render each
// question (single-choice, scale, number, free text).

const QuestionBase = z.object({
  id: z.string().min(1),
  prompt: aiText(400),
  helper: aiTextOptional(400),
  category: z
    .enum([
      "time",
      "frequency",
      "target_level",
      "current_level",
      "learning_speed",
      "context",
    ])
    .default("context"),
})

export const SingleChoiceQuestionSchema = QuestionBase.extend({
  type: z.literal("single_choice"),
  options: z
    .array(
      z.object({
        value: aiText(120),
        label: aiText(160),
      })
    )
    .min(2)
    .max(8),
})

// Per-type fields below carry defaults so a Gemini drift (e.g. omitting
// `max` on a scale question) doesn't blow up the whole quiz.

export const ScaleQuestionSchema = QuestionBase.extend({
  type: z.literal("scale"),
  min: z.number().int().default(1),
  max: z.number().int().default(5),
  minLabel: aiText(80).default("мінімум"),
  maxLabel: aiText(80).default("максимум"),
})

export const NumberQuestionSchema = QuestionBase.extend({
  type: z.literal("number"),
  unit: aiText(80).default(""),
  min: z.number().nonnegative().default(0),
  max: z.number().positive().default(1000),
})

export const TextQuestionSchema = QuestionBase.extend({
  type: z.literal("text"),
  placeholder: aiTextOptional(160),
  maxLength: z.number().int().positive().default(500),
})

export const QuizQuestionSchema = z.discriminatedUnion("type", [
  SingleChoiceQuestionSchema,
  ScaleQuestionSchema,
  NumberQuestionSchema,
  TextQuestionSchema,
])

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

export const QuizSchema = z.object({
  skill: z.string().min(1),
  questions: z.array(QuizQuestionSchema).min(3).max(12),
})

export type Quiz = z.infer<typeof QuizSchema>

// ---------------------------------------------------------------------------
// Quiz answers
// ---------------------------------------------------------------------------

export const QuizAnswersSchema = z.record(z.string(), z.string())
export type QuizAnswers = z.infer<typeof QuizAnswersSchema>

// ---------------------------------------------------------------------------
// Learning plan
// ---------------------------------------------------------------------------

export const ExerciseSchema = z.object({
  title: aiText(120),
  summary: aiText(400),
  steps: z.array(aiText(600)).min(1).max(15),
  visualHint: aiTextOptional(400),
  durationMinutes: z.number().int().positive(),
})

export type Exercise = z.infer<typeof ExerciseSchema>

export const PlanDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  weekNumber: z.number().int().positive(),
  label: aiText(80),
  goal: aiText(400),
  exercises: z.array(ExerciseSchema).min(1).max(10),
})

export type PlanDay = z.infer<typeof PlanDaySchema>

export const PlanCheckpointSchema = z.object({
  atDay: z.number().int().positive(),
  criteria: aiText(500),
  adjustment: aiText(500),
})

export type PlanCheckpoint = z.infer<typeof PlanCheckpointSchema>

export const LearningPlanSchema = z.object({
  skill: z.string().min(1),
  summary: aiText(1200),
  estimatedTimeframe: aiText(120),
  weeklyCommitment: aiText(120),
  // FULL projected horizon to mastery, in training days. Used by the
  // "days remaining" progress chart. Can be — and usually is — larger
  // than `days.length`: we only detail the near-term chunk to keep the
  // first response small.
  totalDays: z.number().int().positive(),
  // The chunk of days the user has concrete instructions for right now.
  // Always 1..totalDays. The rest of the journey is implied by
  // `totalDays` and the checkpoint schedule.
  days: z.array(PlanDaySchema).min(1).max(60),
  checkpoints: z.array(PlanCheckpointSchema).min(1).max(15),
})

export type LearningPlan = z.infer<typeof LearningPlanSchema>

// ---------------------------------------------------------------------------
// Checkpoint reassessment
// ---------------------------------------------------------------------------

export const CheckpointReviewSchema = z.object({
  paceAnalysis: aiText(1000),
  paceRatio: z.number().positive(),
  newTotalDays: z.number().int().positive(),
  newEstimatedTimeframe: aiText(120),
  suggestions: z.array(aiText(500)).min(1).max(8),
})

export type CheckpointReview = z.infer<typeof CheckpointReviewSchema>

// ---------------------------------------------------------------------------
// API request bodies
// ---------------------------------------------------------------------------

export const QuizRequestSchema = z.object({
  // User-supplied; we keep a hard cap here on purpose (anti-abuse).
  skill: z.string().min(1).max(200),
})
export type QuizRequest = z.infer<typeof QuizRequestSchema>

export const PlanRequestSchema = z.object({
  skill: z.string().min(1).max(200),
  questions: z.array(QuizQuestionSchema).min(1).max(12),
  answers: QuizAnswersSchema,
})
export type PlanRequest = z.infer<typeof PlanRequestSchema>

const IsoString = z.string().min(1)

export const CompletedDaysSchema = z.record(z.string(), IsoString)
export type CompletedDays = z.infer<typeof CompletedDaysSchema>

export const CheckpointRequestSchema = z.object({
  plan: LearningPlanSchema,
  completedDays: CompletedDaysSchema,
  planStartedAt: IsoString,
  checkpointIndex: z.number().int().nonnegative(),
})
export type CheckpointRequest = z.infer<typeof CheckpointRequestSchema>
