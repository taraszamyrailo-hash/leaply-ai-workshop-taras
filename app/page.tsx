"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  KnotworkBand,
  RuneBanner,
  RuneDivider,
  RuneShield,
} from "@/components/viking-ornaments"
import { usePlannerStore } from "@/lib/stores/planner-store"

const SUGGESTIONS = [
  "Розмовна іспанська",
  "Стійка на руках",
  "Звичка читати щодня",
  "Базовий Python",
  "Гра на гітарі",
]

export default function HomePage() {
  const router = useRouter()
  const setSkill = usePlannerStore((s) => s.setSkill)
  const [value, setValue] = useState("")

  function start(skill: string) {
    const trimmed = skill.trim()
    if (!trimmed) return
    setSkill(trimmed)
    router.push("/quiz")
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      {/* Background ornament shields — pushed off-canvas a little so they
          read as decoration, not content. */}
      <RuneShield
        rune="fehu"
        size={220}
        className="pointer-events-none absolute -top-10 -left-16 text-border/30 sm:left-8"
      />
      <RuneShield
        rune="tiwaz"
        size={220}
        className="pointer-events-none absolute -right-16 -bottom-10 text-border/30 sm:right-8"
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-stretch gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <RuneBanner runes={["fehu", "ansuz", "raidho"]}>
            Сага про навичку
          </RuneBanner>
          <h1 className="heading-carved text-4xl sm:text-5xl">План навчання</h1>
          <p className="max-w-md text-sm text-muted-foreground italic">
            Розкажи скальду, чого хочеш навчитись — від мови до гімнастичного
            трюку чи нової звички. AI поставить кілька запитань, оцінить точку
            старту й викарбує покроковий план з чекпоінтами.
          </p>
        </div>

        <Card className="vk-card relative">
          <KnotworkBand className="absolute top-0 right-0 left-0 -translate-y-1/2 text-border/70" />
          <CardHeader className="pt-7">
            <CardTitle className="font-display text-2xl tracking-wide">
              Почни похід
            </CardTitle>
            <CardDescription className="italic">
              Накресли руну своєї мети — і драккар вирушить.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault()
                start(value)
              }}
            >
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="skill"
                  className="font-display tracking-wider uppercase"
                >
                  Що хочеш опанувати?
                </Label>
                <Input
                  id="skill"
                  name="skill"
                  placeholder="Напр., грати на гітарі акорди улюблених пісень"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                  maxLength={200}
                  className="border-border/80 bg-background/60"
                />
              </div>

              <div className="flex flex-col gap-3">
                <RuneDivider />
                <p className="text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  Або обери шлях відомих воїнів
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue(s)
                        start(s)
                      }}
                      className="font-sans"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!value.trim()}
                className="font-display tracking-widest uppercase"
              >
                Почати похід
              </Button>
            </form>
          </CardContent>
          <KnotworkBand className="absolute right-0 bottom-0 left-0 translate-y-1/2 text-border/70" />
        </Card>

        <RuneDivider runes={["dagaz", "othala", "dagaz"]} className="mt-2" />
      </div>
    </main>
  )
}
