"use client"

// Two radial progress charts at the top of the plan page:
//   - "До опанування": how many days remain out of totalDays.
//   - "До наступного чекпоінту": how many days remain inside the current
//     checkpoint window (days between the previous checkpoint and the
//     next one the user hasn't reached yet).
//
// Built on top of shadcn's <ChartContainer> wrapper around Recharts'
// RadialBarChart per CLAUDE.md Rule 0 (never use raw Recharts).

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { LearningPlan } from "@/lib/schemas/planner-schemas"

type Props = {
  plan: LearningPlan
  completedDayCount: number
}

const CHART_CONFIG = {
  done: { label: "Виконано", color: "var(--chart-1, hsl(142 76% 36%))" },
} satisfies ChartConfig

export function PlanProgressCharts({ plan, completedDayCount }: Props) {
  const total = Math.max(plan.totalDays, 1)
  const doneClamped = Math.min(completedDayCount, total)
  const remaining = Math.max(total - doneClamped, 0)

  const checkpointWindow = nextCheckpointWindow(plan, doneClamped)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ProgressCard
        title="До опанування навички"
        primaryLabel={`${remaining}`}
        primarySuffix={remaining === 1 ? "день" : "днів"}
        helper={`${doneClamped} / ${total} днів виконано`}
        percent={(doneClamped / total) * 100}
      />
      {checkpointWindow ? (
        <ProgressCard
          title={`До чекпоінту ${checkpointWindow.checkpointNumber}`}
          primaryLabel={`${checkpointWindow.daysRemaining}`}
          primarySuffix={checkpointWindow.daysRemaining === 1 ? "день" : "днів"}
          helper={`${checkpointWindow.doneInWindow} / ${checkpointWindow.windowSize} днів цього етапу`}
          percent={
            (checkpointWindow.doneInWindow / checkpointWindow.windowSize) * 100
          }
        />
      ) : (
        <ProgressCard
          title="Чекпоінти"
          primaryLabel="✓"
          primarySuffix="усі пройдено"
          helper="Лишилось дочекатись фінального дня."
          percent={100}
        />
      )}
    </div>
  )
}

type CardProps = {
  title: string
  primaryLabel: string
  primarySuffix: string
  helper: string
  percent: number
}

function ProgressCard({
  title,
  primaryLabel,
  primarySuffix,
  helper,
  percent,
}: CardProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const data = [{ key: "done", value: clamped, fill: "var(--color-done)" }]

  return (
    <div className="vk-card flex items-center gap-3 rounded-md p-3">
      <div className="relative h-16 w-16 shrink-0">
        <ChartContainer
          config={CHART_CONFIG}
          className="aspect-square h-full w-full"
        >
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: "var(--muted)" }}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="font-display text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          {title}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl leading-none tabular-nums">
            {primaryLabel}
          </span>
          <span className="text-sm text-muted-foreground italic">
            {primarySuffix}
          </span>
        </div>
        <div className="truncate text-xs text-muted-foreground italic">
          {helper}
        </div>
      </div>
    </div>
  )
}

// Returns information about the *next* upcoming checkpoint window, or
// null if every checkpoint has already been reached.
function nextCheckpointWindow(plan: LearningPlan, doneCount: number) {
  // Sort by atDay ascending and number them in display order.
  const ordered = plan.checkpoints
    .map((cp, idx) => ({ ...cp, originalIndex: idx }))
    .sort((a, b) => a.atDay - b.atDay)

  const nextIdx = ordered.findIndex((cp) => cp.atDay > doneCount)
  if (nextIdx === -1) return null

  const next = ordered[nextIdx]
  const prev = nextIdx === 0 ? null : ordered[nextIdx - 1]
  const windowStart = prev ? prev.atDay : 0
  const windowSize = Math.max(next.atDay - windowStart, 1)
  const doneInWindow = Math.max(doneCount - windowStart, 0)
  const daysRemaining = Math.max(next.atDay - doneCount, 0)

  return {
    checkpointNumber: next.originalIndex + 1,
    windowStart,
    windowEnd: next.atDay,
    windowSize,
    doneInWindow,
    daysRemaining,
  }
}
