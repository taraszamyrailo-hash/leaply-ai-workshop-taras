"use client"

// Side sheet that shows the full instruction for one exercise. Opens
// when the user clicks an exercise inside an expanded day card.

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Exercise } from "@/lib/schemas/planner-schemas"

type Props = {
  exercise: Exercise | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExerciseSheet({ exercise, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {exercise ? (
          <>
            <SheetHeader>
              <span className="font-display text-[10px] tracking-[0.3em] text-accent uppercase">
                ᚠ ᚱ ᛁ ᛏ
              </span>
              <SheetTitle className="font-display text-2xl tracking-wide">
                {exercise.title}
              </SheetTitle>
              <SheetDescription className="italic">
                {exercise.summary}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="font-display text-xs tracking-wider text-muted-foreground uppercase">
                Орієнтовно {exercise.durationMinutes} хв
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-display text-sm tracking-wider uppercase">
                  Покрокова сага
                </h3>
                <ol className="flex flex-col gap-2">
                  {exercise.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border/70 bg-muted font-display text-xs text-foreground">
                        {idx + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {exercise.visualHint ? (
                <VisualHintBlock hint={exercise.visualHint} />
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

// Renders the visual reference as a YouTube search link if the AI gave
// us one in the "youtube: ..." form; otherwise as plain text.
function VisualHintBlock({ hint }: { hint: string }) {
  const youtubeMatch = hint.match(/^(?:youtube|YouTube)\s*[:|-]\s*(.+)$/)
  const query = youtubeMatch?.[1]?.trim() ?? null
  const youtubeUrl = query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    : null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/70 bg-muted/40 p-3">
      <div className="font-display text-xs tracking-wider text-muted-foreground uppercase">
        Візуальний орієнтир
      </div>
      {youtubeUrl ? (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Шукати на YouTube: &quot;{query}&quot;
        </a>
      ) : (
        <p className="text-sm">{hint}</p>
      )}
    </div>
  )
}
