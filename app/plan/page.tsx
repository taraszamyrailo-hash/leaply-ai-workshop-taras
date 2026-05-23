"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { CheckpointCard } from "@/components/checkpoint-card"
import { ErrorCard } from "@/components/error-card"
import { PlanDayList } from "@/components/plan-day-list"
import { PlanProgressCharts } from "@/components/plan-progress-charts"
import { VikingShipGame } from "@/components/viking-game/viking-ship-game"
import {
  KnotworkBand,
  RuneBanner,
  RuneDivider,
} from "@/components/viking-ornaments"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { generatePlan } from "@/lib/api-client"
import { usePlannerStore } from "@/lib/stores/planner-store"

export default function PlanPage() {
  const router = useRouter()

  const skill = usePlannerStore((s) => s.skill)
  const questions = usePlannerStore((s) => s.questions)
  const answers = usePlannerStore((s) => s.answers)
  const plan = usePlannerStore((s) => s.plan)
  const status = usePlannerStore((s) => s.status)
  const error = usePlannerStore((s) => s.error)
  const completedDays = usePlannerStore((s) => s.completedDays)

  const startPlanGeneration = usePlannerStore((s) => s.startPlanGeneration)
  const setPlan = usePlannerStore((s) => s.setPlan)
  const setError = usePlannerStore((s) => s.setError)
  const reset = usePlannerStore((s) => s.reset)

  const hasHydrated = usePlannerStore((s) => s._hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return
    if (!skill || questions.length === 0) {
      router.replace("/")
    }
  }, [hasHydrated, skill, questions.length, router])

  function regenerate() {
    startPlanGeneration()
    generatePlan({ skill, questions, answers })
      .then((p) => setPlan(p))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Невідома помилка")
      })
  }

  if (!hasHydrated) return <Shell />

  if (status === "generating_plan" || (!plan && !error)) {
    return (
      <Shell>
        <VikingShipGame
          title="Поки AI будує план…"
          description="Дай Бібінду вікінгам! Клікни лінивого — нехай гребе далі."
        />
      </Shell>
    )
  }

  if (status === "error" || error || !plan) {
    return (
      <Shell>
        <ErrorCard
          title="Не вийшло побудувати план"
          message={error ?? "Сталася помилка."}
          onRetry={regenerate}
          onBack={() => router.push("/")}
        />
      </Shell>
    )
  }

  const completedCount = Object.keys(completedDays).length

  // 2-region layout: TOP (charts + meta) is pinned; everything else —
  // day list, checkpoints, action buttons — scrolls together below it.
  return (
    <main className="flex h-svh flex-col">
      {/* TOP — frozen, capped at ~1/3 of viewport height */}
      <div className="max-h-[34vh] flex-shrink-0 overflow-y-auto border-b border-border bg-background px-6 py-3">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="vk-card relative py-3">
            <KnotworkBand className="absolute top-0 right-0 left-0 -translate-y-1/2 text-border/70" />
            <CardHeader className="gap-1 pt-5 pb-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <RuneBanner runes={["othala", "tiwaz"]}>
                    Сага навички
                  </RuneBanner>
                  <CardTitle className="truncate font-display text-2xl tracking-wide">
                    {plan.skill}
                  </CardTitle>
                </div>
                <div className="flex shrink-0 gap-3 text-xs text-muted-foreground">
                  <span>
                    <span className="font-display tracking-wider uppercase">
                      Термін:
                    </span>{" "}
                    <span className="font-medium text-foreground">
                      {plan.estimatedTimeframe}
                    </span>
                  </span>
                  <span>
                    <span className="font-display tracking-wider uppercase">
                      Темп:
                    </span>{" "}
                    <span className="font-medium text-foreground">
                      {plan.weeklyCommitment}
                    </span>
                  </span>
                </div>
              </div>
              <CardDescription className="line-clamp-2 text-xs italic">
                {plan.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <PlanProgressCharts
                plan={plan}
                completedDayCount={completedCount}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BODY — scrollable: day list + checkpoints + action buttons */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <section className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-wide">
                Покроковий похід
              </h2>
              <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
                {completedCount} / {plan.totalDays} днів
              </span>
            </header>
            <RuneDivider runes={["raidho", "tiwaz", "raidho"]} />
            {plan.days.length < plan.totalDays ? (
              <p className="text-sm text-muted-foreground italic">
                Деталізовано перші {plan.days.length} днів — це етап до
                найближчого чекпоінту. Решта {plan.totalDays - plan.days.length}{" "}
                днів зявиться, коли ти переоціниш прогрес на чекпоінті.
              </p>
            ) : null}
            <PlanDayList plan={plan} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl tracking-wide">
              Рунічні чекпоінти
            </h2>
            <RuneDivider runes={["algiz", "othala", "algiz"]} />
            <p className="text-sm text-muted-foreground italic">
              Точки, де AI оцінить твій реальний темп проти обіцяного й оновить
              прогноз. Кнопка стає активною, коли ти доходиш до відповідного
              дня.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {plan.checkpoints.map((cp, idx) => (
                <CheckpointCard
                  key={idx}
                  checkpoint={cp}
                  index={idx}
                  plan={plan}
                  completedCount={completedCount}
                />
              ))}
            </div>
          </section>

          <RuneDivider runes={["dagaz", "othala", "dagaz"]} />

          <div className="flex flex-wrap gap-2 pb-6">
            <Button
              onClick={regenerate}
              variant="outline"
              className="font-display tracking-widest uppercase"
            >
              Згенерувати інший варіант
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                reset()
                router.push("/")
              }}
              className="font-display tracking-widest uppercase"
            >
              Почати нову навичку
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function Shell({
  children,
  wide,
}: {
  children?: React.ReactNode
  wide?: boolean
}) {
  if (wide) {
    return <main className="min-h-svh p-6">{children}</main>
  }
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      {children}
    </main>
  )
}
