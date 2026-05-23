"use client"

// A single checkpoint card. Shows the planned criteria + adjustment, and
// — once enough days are checked off to reach this checkpoint — offers a
// "Переоцінити прогрес" button that calls /api/checkpoint to get an
// AI-generated pace review and an updated total-days projection.

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { reviewCheckpoint } from "@/lib/api-client"
import type {
  CheckpointReview,
  LearningPlan,
  PlanCheckpoint,
} from "@/lib/schemas/planner-schemas"
import { usePlannerStore } from "@/lib/stores/planner-store"

type Props = {
  checkpoint: PlanCheckpoint
  index: number
  plan: LearningPlan
  completedCount: number
}

export function CheckpointCard({
  checkpoint,
  index,
  plan,
  completedCount,
}: Props) {
  const completedDays = usePlannerStore((s) => s.completedDays)
  const planStartedAt = usePlannerStore((s) => s.planStartedAt)
  const cachedReview = usePlannerStore(
    (s) => s.checkpointReviews[String(index)]
  )
  const setCheckpointReview = usePlannerStore((s) => s.setCheckpointReview)
  const applyCheckpointAdjustment = usePlannerStore(
    (s) => s.applyCheckpointAdjustment
  )

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reached = completedCount >= checkpoint.atDay
  const review: CheckpointReview | undefined = cachedReview

  async function runReview() {
    if (!planStartedAt) return
    setPending(true)
    setError(null)
    try {
      const result = await reviewCheckpoint({
        plan,
        completedDays,
        planStartedAt,
        checkpointIndex: index,
      })
      setCheckpointReview(index, result)
      applyCheckpointAdjustment(result.newTotalDays)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невідома помилка")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="vk-card flex flex-col gap-3 rounded-md p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display tracking-wide">
          Чекпоінт {index + 1} · день {checkpoint.atDay}
        </span>
        <span
          className={[
            "rounded-sm border px-2 py-0.5 font-display text-[10px] tracking-[0.18em] uppercase",
            reached
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {reached
            ? "досягнуто"
            : `за ${checkpoint.atDay - completedCount} днів`}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Перевір
        </span>
        <p>{checkpoint.criteria}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Якщо потрібно скоригувати
        </span>
        <p>{checkpoint.adjustment}</p>
      </div>

      {reached ? (
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={runReview}
            disabled={pending}
            size="sm"
            variant={review ? "outline" : "default"}
            className="self-start font-display tracking-widest uppercase"
          >
            {pending
              ? "AI рахує…"
              : review
                ? "Переоцінити ще раз"
                : "Переоцінити прогрес"}
          </Button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {review ? <ReviewBlock review={review} /> : null}
        </div>
      ) : null}
    </div>
  )
}

function ReviewBlock({ review }: { review: CheckpointReview }) {
  const ratioPct = Math.round(review.paceRatio * 100)
  return (
    <div className="mt-1 flex flex-col gap-3 rounded-md border border-border/60 bg-muted/40 p-3">
      <div className="flex flex-wrap gap-3 text-xs">
        <Metric
          label="Реальний темп"
          value={`${ratioPct}%`}
          helper="від обіцяного"
        />
        <Metric
          label="Новий прогноз"
          value={review.newEstimatedTimeframe}
          helper={`${review.newTotalDays} днів усього`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Аналіз
        </span>
        <p className="text-sm leading-relaxed">{review.paceAnalysis}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          Що скоригувати
        </span>
        <ul className="flex flex-col gap-1 text-sm">
          {review.suggestions.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent">ᛟ</span>
              <span className="flex-1">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="flex min-w-32 flex-col gap-0.5 rounded-sm border border-border/70 bg-background p-2">
      <span className="font-display text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-display text-base tracking-wide">{value}</span>
      <span className="text-[10px] text-muted-foreground italic">{helper}</span>
    </div>
  )
}
