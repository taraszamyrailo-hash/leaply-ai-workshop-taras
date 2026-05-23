"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ErrorCard } from "@/components/error-card"
import { QuizQuestionCard } from "@/components/quiz-question-card"
import { VikingShipGame } from "@/components/viking-game/viking-ship-game"
import {
  KnotworkBand,
  RuneBanner,
  RuneShield,
} from "@/components/viking-ornaments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { generatePlan, generateQuiz } from "@/lib/api-client"
import { usePlannerStore } from "@/lib/stores/planner-store"

export default function QuizPage() {
  const router = useRouter()

  const skill = usePlannerStore((s) => s.skill)
  const questions = usePlannerStore((s) => s.questions)
  const answers = usePlannerStore((s) => s.answers)
  const status = usePlannerStore((s) => s.status)
  const error = usePlannerStore((s) => s.error)

  const startQuizGeneration = usePlannerStore((s) => s.startQuizGeneration)
  const setQuiz = usePlannerStore((s) => s.setQuiz)
  const setAnswer = usePlannerStore((s) => s.setAnswer)
  const startPlanGeneration = usePlannerStore((s) => s.startPlanGeneration)
  const setPlan = usePlannerStore((s) => s.setPlan)
  const setError = usePlannerStore((s) => s.setError)

  const [index, setIndex] = useState(0)
  // The store rehydrates from localStorage on mount. Until that finishes
  // we shouldn't redirect away just because `skill` looks empty.
  const hasHydrated = usePlannerStore((s) => s._hasHydrated)

  // No skill in the store — user navigated here directly. Send them back.
  useEffect(() => {
    if (hasHydrated && !skill) {
      router.replace("/")
    }
  }, [hasHydrated, skill, router])

  // When we arrive with a fresh skill but no questions yet, kick off the
  // quiz generation request. We do this in an effect (not at click time on
  // the home page) so the user sees the in-progress UI immediately.
  useEffect(() => {
    if (!hasHydrated || !skill) return
    if (questions.length > 0) return
    if (status === "generating_quiz") return

    let cancelled = false
    startQuizGeneration()
    generateQuiz(skill)
      .then((quiz) => {
        if (cancelled) return
        setQuiz(quiz.questions)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Невідома помилка")
      })

    return () => {
      cancelled = true
    }
    // We intentionally exclude `status` so we don't loop on its updates;
    // the early-return above handles the in-flight case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, skill, questions.length])

  if (!hasHydrated || !skill) {
    return <CenterShell />
  }

  if (status === "generating_quiz" || (questions.length === 0 && !error)) {
    return (
      <CenterShell>
        <VikingShipGame
          title="Поки AI готує запитання…"
          description="Дай Бібінду вікінгам! Клікни лінивого — нехай гребе далі."
        />
      </CenterShell>
    )
  }

  if (status === "error" || error) {
    // If we already have questions, the failure must have happened on the
    // plan-generation step — phrase the title accordingly.
    const failedOnPlan = questions.length > 0
    return (
      <CenterShell>
        <ErrorCard
          title={
            failedOnPlan
              ? "Не вийшло побудувати план"
              : "Не вийшло згенерувати запитання"
          }
          message={error ?? "Сталася помилка."}
          onRetry={() => {
            if (failedOnPlan) {
              submitForPlan()
            } else {
              startQuizGeneration()
              generateQuiz(skill)
                .then((quiz) => setQuiz(quiz.questions))
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error ? err.message : "Невідома помилка"
                  )
                })
            }
          }}
          onBack={() => router.push("/")}
        />
      </CenterShell>
    )
  }

  const current = questions[index]
  if (!current) {
    return <CenterShell />
  }

  const total = questions.length
  const answeredHere = answers[current.id]?.trim() ?? ""
  const canGoNext = answeredHere.length > 0
  const isLast = index === total - 1
  // The Submit button mirrors the Next button: enable as soon as the
  // current question has an answer. Since Next never lets the user skip
  // a question, by the time they land on the last one every prior
  // question must have been answered too. Using a separate
  // "allAnswered" check has bitten us on id-collisions returned by the
  // LLM (e.g. two questions sharing an id) — the new rule sidesteps
  // that entirely.
  const canSubmit = canGoNext

  async function submitForPlan() {
    startPlanGeneration()
    try {
      const plan = await generatePlan({ skill, questions, answers })
      setPlan(plan)
      router.push("/plan")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невідома помилка")
    }
  }

  if (status === "generating_plan") {
    return (
      <CenterShell>
        <VikingShipGame
          title="Поки AI будує план…"
          description="Дай Бібінду вікінгам! Клікни лінивого — нехай гребе далі."
        />
      </CenterShell>
    )
  }

  return (
    <CenterShell decorate>
      <Card className="vk-card relative w-full max-w-xl">
        <KnotworkBand className="absolute top-0 right-0 left-0 -translate-y-1/2 text-border/70" />
        <CardHeader className="gap-3 pt-7">
          <RuneBanner runes={["raidho", "ansuz"]}>
            Випробування скальда
          </RuneBanner>
          <div className="flex items-center justify-between text-xs">
            <span className="font-display tracking-wider text-muted-foreground uppercase">
              Запитання {index + 1} з {total}
            </span>
            <span className="truncate pl-2 text-muted-foreground italic">
              {skill}
            </span>
          </div>
          <Progress value={((index + 1) / total) * 100} />
        </CardHeader>
        <CardContent>
          <QuizQuestionCard
            question={current}
            value={answers[current.id] ?? ""}
            onChange={(v) => setAnswer(current.id, v)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="font-display tracking-widest uppercase"
          >
            Назад
          </Button>
          {isLast ? (
            <Button
              disabled={!canSubmit}
              onClick={submitForPlan}
              className="font-display tracking-widest uppercase"
            >
              Згенерувати план
            </Button>
          ) : (
            <Button
              disabled={!canGoNext}
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              className="font-display tracking-widest uppercase"
            >
              Далі
            </Button>
          )}
        </CardFooter>
        <KnotworkBand className="absolute right-0 bottom-0 left-0 translate-y-1/2 text-border/70" />
      </Card>
    </CenterShell>
  )
}

function CenterShell({
  children,
  decorate,
}: {
  children?: React.ReactNode
  decorate?: boolean
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      {decorate ? (
        <>
          <RuneShield
            rune="ansuz"
            size={200}
            className="pointer-events-none absolute -top-12 -left-16 text-border/25 sm:left-6"
          />
          <RuneShield
            rune="raidho"
            size={200}
            className="pointer-events-none absolute -right-16 -bottom-12 text-border/25 sm:right-6"
          />
        </>
      ) : null}
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </main>
  )
}
