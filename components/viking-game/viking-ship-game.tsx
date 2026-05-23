"use client"

// Black-and-white mini-game shown on long AI loading screens. View from
// the middle of a viking longship: captain with whip in the center,
// three rowers on each side. Every ~1s a random rower stops rowing —
// click them to whip them back into rhythm and pop a "БІБІНДА!" cheer.
//
// All time-driven state lives in a reducer (see ./game-reducer); this
// component just runs the clock (setInterval → dispatch "tick") and
// wires up click handlers (→ dispatch "whip"). Keeps React's
// set-state-in-effect rule happy and makes the game logic testable.

import { useEffect, useMemo, useReducer } from "react"

import { BibindaPopup } from "./bibinda-popup"
import { gameReducer, initialGameState } from "./game-reducer"
import { RowerSprite } from "./rower-sprite"
import { ShipFrame } from "./ship-frame"
import { StandingViking } from "./standing-viking"
import { POPUP_DURATION, TICK_MS, type Side } from "./types"
import { WhipLine } from "./whip-line"

type Props = {
  title?: string
  description?: string
}

// Top-down view of a longship: hull runs left-right, bow on the left,
// stern on the right. 2 rowers along the top gunwale, 2 along the
// bottom. Their oars stroke OUTWARD — over the top of the SVG for the
// top pair, over the bottom for the bottom pair — so the action is
// clearly outside the ship.
const ROWER_LAYOUT: Array<{ x: number; y: number; side: Side }> = [
  { x: 200, y: 140, side: "top" },
  { x: 400, y: 140, side: "top" },
  { x: 200, y: 200, side: "bottom" },
  { x: 400, y: 200, side: "bottom" },
]
const CAPTAIN = { x: 300, y: 170 }

export function VikingShipGame({
  title = "Поки вантажаться дані…",
  description = "Дай Бібінду вікінгам! Клікни лінивого — нехай гребе далі.",
}: Props) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  const { tick, rowers, score, whipTarget, popups } = state

  // Master clock. The only effect — runs once, ticks forever.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "tick" }), TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Which side of the captain the whip is swinging toward — based on
  // the X-axis position of the target relative to the captain.
  const whipDirection: "left" | "right" | null = useMemo(() => {
    if (!whipTarget) return null
    const target = ROWER_LAYOUT[whipTarget.index]
    return target.x < CAPTAIN.x ? "left" : "right"
  }, [whipTarget])

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-5 text-foreground">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="font-display text-[10px] tracking-[0.35em] text-accent uppercase">
          ᚠ ᚱ ᛁ ᛏ
        </span>
        <h2 className="heading-carved text-2xl tracking-wide">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground italic">
          {description}
        </p>
      </div>

      <svg
        viewBox="0 0 600 320"
        className="h-auto max-h-[70vh] w-full text-foreground"
        role="img"
        aria-label="Дракар вікінгів"
      >
        <ShipFrame />

        <StandingViking
          x={CAPTAIN.x}
          y={CAPTAIN.y}
          tick={tick}
          whipping={whipTarget !== null}
          whipDirection={whipDirection}
        />

        {whipTarget ? (
          <WhipLine
            from={{ x: CAPTAIN.x, y: CAPTAIN.y - 22 }}
            to={{
              x: ROWER_LAYOUT[whipTarget.index].x,
              y: ROWER_LAYOUT[whipTarget.index].y - 35,
            }}
          />
        ) : null}

        {rowers.map((rower, i) => (
          <RowerSprite
            key={i}
            x={ROWER_LAYOUT[i].x}
            y={ROWER_LAYOUT[i].y}
            side={ROWER_LAYOUT[i].side}
            mood={rower.mood}
            // Slight per-rower phase offset so they don't row in unison.
            tick={tick + i * 3}
            onClick={() => dispatch({ type: "whip", index: i })}
          />
        ))}

        {popups.map((p) => (
          <BibindaPopup
            key={p.id}
            x={ROWER_LAYOUT[p.index].x}
            y={ROWER_LAYOUT[p.index].y - 55}
            bornAtTick={p.untilTick - POPUP_DURATION}
            tick={tick}
          />
        ))}
      </svg>

      <div aria-live="polite" className="text-center">
        <div className="font-display text-xs tracking-[0.25em] text-muted-foreground uppercase">
          Бібінда Count
        </div>
        <div className="font-display text-3xl tabular-nums">{score}</div>
      </div>
    </div>
  )
}
