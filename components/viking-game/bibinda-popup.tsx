// Pops near a viking right after a successful whip. Fades out and
// floats upward over its ~640ms lifetime.

import { POPUP_DURATION } from "./types"

type Props = {
  x: number
  y: number
  bornAtTick: number
  tick: number
}

export function BibindaPopup({ x, y, bornAtTick, tick }: Props) {
  const age = tick - bornAtTick
  const progress = Math.min(age / POPUP_DURATION, 1)
  const dy = -progress * 20 // floats upward
  const opacity = 1 - progress

  return (
    <g
      transform={`translate(${x}, ${y + dy})`}
      pointerEvents="none"
      opacity={opacity}
    >
      <text
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        БІБІНДА!
      </text>
    </g>
  )
}
