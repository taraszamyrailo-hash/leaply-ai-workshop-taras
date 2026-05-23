// Zustand store for the skill-learning planner.
//
// Holds the current session end-to-end: skill name, generated quiz, the
// user's answers, the resulting plan, completion checkmarks for each
// day, and (after a reassessment) the latest checkpoint review. All of
// it is persisted to localStorage so the user can close the tab and
// come back later without losing state.
//
// Persist version is bumped to 2 — the v1 plan had weeks[].sessions[],
// the v2 plan has days[].exercises[]. We don't bother migrating; the
// user just re-generates if they had an old plan.

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type {
  CheckpointReview,
  CompletedDays,
  LearningPlan,
  QuizAnswers,
  QuizQuestion,
} from "@/lib/schemas/planner-schemas"

export type PlannerStatus =
  | "idle"
  | "generating_quiz"
  | "quiz_ready"
  | "generating_plan"
  | "plan_ready"
  | "reviewing_checkpoint"
  | "error"

type PlannerState = {
  skill: string
  questions: QuizQuestion[]
  answers: QuizAnswers
  plan: LearningPlan | null
  // ISO timestamp when the plan was first set. Used by the checkpoint
  // reassessment to compute the user's real pace.
  planStartedAt: string | null
  // Map of dayNumber -> ISO timestamp when the user checked it off.
  // Stored as Record<string, string> for JSON-friendliness; numeric keys
  // are stringified.
  completedDays: CompletedDays
  // Per-checkpoint cached AI review, keyed by checkpoint index.
  checkpointReviews: Record<string, CheckpointReview>
  status: PlannerStatus
  error: string | null
  _hasHydrated: boolean

  // Actions
  setSkill: (skill: string) => void
  startQuizGeneration: () => void
  setQuiz: (questions: QuizQuestion[]) => void
  setAnswer: (questionId: string, value: string) => void
  startPlanGeneration: () => void
  setPlan: (plan: LearningPlan) => void
  toggleDayCompletion: (dayNumber: number) => void
  startCheckpointReview: () => void
  setCheckpointReview: (
    checkpointIndex: number,
    review: CheckpointReview
  ) => void
  applyCheckpointAdjustment: (newTotalDays: number) => void
  setError: (message: string) => void
  reset: () => void
  _setHydrated: () => void
}

const emptyDataState = {
  skill: "",
  questions: [] as QuizQuestion[],
  answers: {} as QuizAnswers,
  plan: null as LearningPlan | null,
  planStartedAt: null as string | null,
  completedDays: {} as CompletedDays,
  checkpointReviews: {} as Record<string, CheckpointReview>,
  status: "idle" as PlannerStatus,
  error: null as string | null,
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...emptyDataState,
      _hasHydrated: false,

      setSkill: (skill) =>
        set({
          ...emptyDataState,
          skill: skill.trim(),
        }),

      startQuizGeneration: () =>
        set({
          questions: [],
          answers: {},
          plan: null,
          planStartedAt: null,
          completedDays: {},
          checkpointReviews: {},
          status: "generating_quiz",
          error: null,
        }),

      setQuiz: (questions) =>
        set({
          questions,
          answers: {},
          status: "quiz_ready",
          error: null,
        }),

      setAnswer: (questionId, value) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        })),

      startPlanGeneration: () =>
        set({
          plan: null,
          planStartedAt: null,
          completedDays: {},
          checkpointReviews: {},
          status: "generating_plan",
          error: null,
        }),

      setPlan: (plan) =>
        set({
          plan,
          // Stamp the start of the journey the moment the plan lands.
          planStartedAt: new Date().toISOString(),
          completedDays: {},
          checkpointReviews: {},
          status: "plan_ready",
          error: null,
        }),

      toggleDayCompletion: (dayNumber) =>
        set((state) => {
          const key = String(dayNumber)
          const next = { ...state.completedDays }
          if (next[key]) {
            delete next[key]
          } else {
            next[key] = new Date().toISOString()
          }
          return { completedDays: next }
        }),

      startCheckpointReview: () =>
        set({ status: "reviewing_checkpoint", error: null }),

      setCheckpointReview: (checkpointIndex, review) =>
        set((state) => ({
          checkpointReviews: {
            ...state.checkpointReviews,
            [String(checkpointIndex)]: review,
          },
          status: "plan_ready",
          error: null,
        })),

      // After a checkpoint review, update the plan's total-days estimate
      // so the "days remaining" chart reflects the AI's revised forecast.
      // We deliberately do NOT regenerate the day schedule itself — the
      // user keeps following the days they have; only the projected
      // finish line moves.
      applyCheckpointAdjustment: (newTotalDays) => {
        const plan = get().plan
        if (!plan) return
        set({
          plan: { ...plan, totalDays: newTotalDays },
        })
      },

      setError: (message) =>
        set({
          status: "error",
          error: message,
        }),

      reset: () => set({ ...emptyDataState }),

      _setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: "leaply-planner",
      version: 2,
      partialize: (state) => ({
        skill: state.skill,
        questions: state.questions,
        answers: state.answers,
        plan: state.plan,
        planStartedAt: state.planStartedAt,
        completedDays: state.completedDays,
        checkpointReviews: state.checkpointReviews,
      }),
      // Drop any persisted state from older versions — schemas changed.
      // The persist middleware infers the partialized shape strictly;
      // we cast through `unknown` because v1 → v2 is a hard reset rather
      // than a field-level migration.
      migrate: (persistedState, version) => {
        if (version < 2) {
          return {
            skill: "",
            questions: [],
            answers: {},
            plan: null,
            planStartedAt: null,
            completedDays: {},
            checkpointReviews: {},
          } as unknown as PlannerState
        }
        return persistedState as PlannerState
      },
      onRehydrateStorage: () => (state) => {
        state?._setHydrated()
      },
    }
  )
)
