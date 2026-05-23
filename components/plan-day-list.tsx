"use client"

// Accordion-based day list for the plan page. Each day is a collapsible
// item: header shows the checkbox + label + goal + total duration; body
// shows the exercises as clickable cards that open the ExerciseSheet.

import { useState } from "react"

import { ExerciseSheet } from "@/components/exercise-sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import type {
  Exercise,
  LearningPlan,
  PlanDay,
} from "@/lib/schemas/planner-schemas"
import { usePlannerStore } from "@/lib/stores/planner-store"

type Props = {
  plan: LearningPlan
}

export function PlanDayList({ plan }: Props) {
  const completedDays = usePlannerStore((s) => s.completedDays)
  const toggleDay = usePlannerStore((s) => s.toggleDayCompletion)
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  // Group days into weeks for visual section headers. We use the
  // `weekNumber` already attached to each day rather than recomputing.
  const byWeek = new Map<number, PlanDay[]>()
  for (const day of plan.days) {
    const arr = byWeek.get(day.weekNumber) ?? []
    arr.push(day)
    byWeek.set(day.weekNumber, arr)
  }
  const weeks = Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0])

  return (
    <div className="flex flex-col gap-6">
      {weeks.map(([weekNumber, days]) => (
        <section key={weekNumber} className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 font-display text-xs tracking-[0.25em] text-muted-foreground uppercase">
            <span className="text-accent">ᚱ</span>
            Тиждень {weekNumber}
            <span className="ml-1 h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </h3>
          <Accordion type="multiple" className="flex flex-col gap-2">
            {days.map((day) => {
              const isDone = Boolean(completedDays[String(day.dayNumber)])
              const totalMinutes = day.exercises.reduce(
                (sum, ex) => sum + ex.durationMinutes,
                0
              )
              return (
                <AccordionItem
                  key={day.dayNumber}
                  value={`day-${day.dayNumber}`}
                  className="vk-card rounded-md px-3"
                >
                  <div className="flex items-center gap-3 py-1">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => toggleDay(day.dayNumber)}
                      aria-label={`Позначити ${day.label} виконаним`}
                      onClick={(e) => e.stopPropagation()}
                      className="size-5"
                    />
                    <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                      <div className="flex min-w-0 flex-1 items-baseline gap-3">
                        <span
                          className={[
                            "font-display tracking-wide",
                            isDone ? "text-muted-foreground line-through" : "",
                          ].join(" ")}
                        >
                          {day.label}
                        </span>
                        <span className="truncate text-sm text-muted-foreground italic">
                          {day.goal}
                        </span>
                      </div>
                      <span className="mr-2 font-display text-xs tracking-wider whitespace-nowrap text-muted-foreground">
                        {totalMinutes} хв
                      </span>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="pb-4">
                    <ul className="flex flex-col gap-2">
                      {day.exercises.map((exercise, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => setActiveExercise(exercise)}
                            className="group flex w-full items-start gap-3 rounded-md border border-border/70 p-3 text-left transition-colors hover:bg-muted/60"
                          >
                            <span
                              aria-hidden
                              className="mt-0.5 font-display text-accent"
                            >
                              ᛏ
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-sm tracking-wide">
                                  {exercise.title}
                                </span>
                                <span className="text-xs text-muted-foreground italic">
                                  {exercise.durationMinutes} хв
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground italic">
                                {exercise.summary}
                              </p>
                            </div>
                            <span
                              aria-hidden
                              className="text-sm text-muted-foreground group-hover:text-foreground"
                            >
                              ›
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </section>
      ))}

      <ExerciseSheet
        exercise={activeExercise}
        open={activeExercise !== null}
        onOpenChange={(open) => {
          if (!open) setActiveExercise(null)
        }}
      />
    </div>
  )
}
