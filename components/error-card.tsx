// Display an error in a contained card with a retry CTA. We intentionally
// keep wording plain-language because the audience is non-technical.

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RuneBanner, RuneShield } from "@/components/viking-ornaments"

type Props = {
  title: string
  message: string
  onRetry?: () => void
  onBack?: () => void
  retryLabel?: string
  backLabel?: string
}

export function ErrorCard({
  title,
  message,
  onRetry,
  onBack,
  retryLabel = "Спробувати ще раз",
  backLabel = "На головну",
}: Props) {
  return (
    <Card className="vk-card relative w-full max-w-lg overflow-hidden">
      <RuneShield
        rune="hagalaz"
        size={140}
        className="pointer-events-none absolute -top-4 -right-6 text-border/30"
      />
      <CardHeader className="relative">
        <RuneBanner runes={["hagalaz", "nauthiz"]}>Лиха звістка</RuneBanner>
        <CardTitle className="font-display text-2xl tracking-wide">
          {title}
        </CardTitle>
        <CardDescription className="italic">{message}</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-xs text-muted-foreground italic">
          Найчастіша причина — у проєкті ще не доданий ключ Gemini API, або
          немає інтернет-з&apos;єднання.
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onRetry ? (
          <Button
            onClick={onRetry}
            className="font-display tracking-widest uppercase"
          >
            {retryLabel}
          </Button>
        ) : null}
        {onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            className="font-display tracking-widest uppercase"
          >
            {backLabel}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
