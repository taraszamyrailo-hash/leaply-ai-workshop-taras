"use client"

// Standalone test page for the viking ship mini-game. Lets us iterate on
// gameplay/visuals without having to trigger an AI request first.
// Once the game feels right we wire it back into the loading screens.

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { VikingShipGame } from "@/components/viking-game/viking-ship-game"

export default function GameTestPage() {
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 p-6">
      <header className="flex w-full max-w-3xl items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground underline">
          ← На головну
        </Link>
        <span className="text-xs tracking-wider text-muted-foreground uppercase">
          Полігон гри
        </span>
      </header>

      <VikingShipGame
        title="Дракар вікінгів — тестова арена"
        description="Тут можна гратись скільки завгодно — гра не залежить від AI. Скажи, що не так, і ми поправимо."
      />

      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        Перезапустити гру
      </Button>
    </main>
  )
}
