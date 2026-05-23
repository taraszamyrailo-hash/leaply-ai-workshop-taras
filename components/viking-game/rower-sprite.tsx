// One rower viking — top-down view. He sits on a bench inside the ship,
// gripping the oar handle with both hands. The oar pivots OVER the
// gunwale (a point just outside his seat, between him and the water)
// with the blade sticking OUT past the ship's edge. Rowing stroke is a
// horizontal sweep around that pivot — handle moves one way inside the
// ship, blade moves the opposite way outside.

import type { Mood, Side } from "./types"

type Props = {
  x: number
  y: number
  side: Side
  mood: Mood
  tick: number
  onClick: () => void
}

// Geometry (in SVG units):
const PIVOT_OFFSET = 28 // distance from seat to the gunwale pivot
const HANDLE_REACH = 10 // pivot → handle (inside the ship)
const BLADE_REACH = 95 // pivot → blade tip (way outside the ship)
const BODY_OFFSET = 14 // seat → shoulder
const HEAD_OFFSET = 24 // seat → head center
const HEAD_RADIUS = 9
const HORN_LEN = 10

export function RowerSprite({ x, y, side, mood, tick, onClick }: Props) {
  // For TOP rowers the body+oar extend UPWARD (negative y).
  // For BOTTOM rowers everything mirrors DOWNWARD (positive y).
  const outDir = side === "top" ? -1 : 1
  const cursor = mood === "slacking" ? "pointer" : "default"

  // Rowing stroke phase. +1 ↔ blade pushed to one side; -1 ↔ the other.
  const strokePhase = mood === "rowing" ? Math.sin(tick * 0.45) : 0

  // Rotation of the oar around the gunwale pivot, in degrees.
  // We invert sign between top and bottom so all four blades sweep
  // horizontally in the same direction (synchronized stroke).
  const oarRotDegBase =
    mood === "rowing" ? strokePhase * 22 : mood === "slacking" ? 45 : -15
  const oarRotDeg = oarRotDegBase * outDir
  const rad = (oarRotDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Pivot point (on the gunwale, between the rower and the water).
  const pivotX = x
  const pivotY = y + PIVOT_OFFSET * outDir

  // Oar end positions BEFORE rotation, relative to the pivot:
  //   Handle is on the inside (toward the rower).
  //   Blade is on the outside (away from the ship).
  const handleBaseDy = -HANDLE_REACH * outDir // toward the seat
  const bladeBaseDy = BLADE_REACH * outDir // away from the seat

  // Apply rotation around the pivot.
  const handleX = pivotX - handleBaseDy * sin
  const handleY = pivotY + handleBaseDy * cos
  const bladeX = pivotX - bladeBaseDy * sin
  const bladeY = pivotY + bladeBaseDy * cos

  // Body always sits upright with head pointing UP, regardless of side
  // — bottom rowers just reach further down to their handle below the
  // seat. This keeps the figures visually right-side-up.
  const shoulderY = y - BODY_OFFSET
  const headY = y - HEAD_OFFSET
  // Small forward lean tracking the stroke.
  const lean = strokePhase * 3

  // Oar angle for the blade orientation.
  const oarAngleDeg =
    (Math.atan2(bladeY - handleY, bladeX - handleX) * 180) / Math.PI

  return (
    <g>
      {/* Hitbox — onClick lives here for reliable clicks. */}
      <rect
        x={x - 28}
        y={Math.min(y, headY) - 14}
        width={56}
        height={Math.abs(headY - y) + BODY_OFFSET + 28}
        fill="transparent"
        pointerEvents="all"
        style={{ cursor }}
        onClick={onClick}
        role={mood === "slacking" ? "button" : undefined}
        aria-label={
          mood === "slacking" ? "Покарати лінивого вікінга" : undefined
        }
      />

      {/* Bench plank — visual cue that he's sitting */}
      <line
        x1={x - 16}
        y1={y}
        x2={x + 16}
        y2={y}
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={0.4}
        pointerEvents="none"
      />

      <Head x={x + lean} y={headY} mood={mood} />

      {/* Torso — from seat to shoulders, leaning slightly with stroke */}
      <line
        x1={x}
        y1={y}
        x2={x + lean}
        y2={shoulderY}
        stroke="currentColor"
        strokeWidth="2.5"
        pointerEvents="none"
      />

      {/* Arms — both grip the same oar handle */}
      <line
        x1={x + lean - 3}
        y1={shoulderY}
        x2={handleX}
        y2={handleY + 1.5 * outDir}
        stroke="currentColor"
        strokeWidth="2"
        pointerEvents="none"
      />
      <line
        x1={x + lean + 3}
        y1={shoulderY}
        x2={handleX}
        y2={handleY - 1.5 * outDir}
        stroke="currentColor"
        strokeWidth="2"
        pointerEvents="none"
      />

      {/* The oar — single thick line from handle through pivot to blade */}
      <line
        x1={handleX}
        y1={handleY}
        x2={bladeX}
        y2={bladeY}
        stroke="currentColor"
        strokeWidth="2.5"
        pointerEvents="none"
      />

      {/* Blade — elongated oval at the far end */}
      <Blade cx={bladeX} cy={bladeY} angleDeg={oarAngleDeg} />

      {/* Slacker indicator — floats above his head */}
      {mood === "slacking" ? (
        <text
          x={x}
          y={headY - HEAD_RADIUS - 4}
          textAnchor="middle"
          fontSize="14"
          fill="currentColor"
          opacity={0.6 + 0.4 * Math.sin(tick * 0.3)}
          pointerEvents="none"
        >
          💤
        </text>
      ) : null}
    </g>
  )
}

function Head({ x, y, mood }: { x: number; y: number; mood: Mood }) {
  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      <circle
        cx={0}
        cy={0}
        r={HEAD_RADIUS}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Horns always point up — keeps the helmet visually right-side-up. */}
      <line
        x1={-7}
        y1={-4}
        x2={-13}
        y2={-(4 + HORN_LEN)}
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1={7}
        y1={-4}
        x2={13}
        y2={-(4 + HORN_LEN)}
        stroke="currentColor"
        strokeWidth="2"
      />
      <Eyes mood={mood} />
    </g>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "whipped") {
    return (
      <>
        <path
          d="M -4 -2 L -1 1 M -4 1 L -1 -2"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M 1 -2 L 4 1 M 1 1 L 4 -2"
          stroke="currentColor"
          strokeWidth="1"
        />
      </>
    )
  }
  if (mood === "slacking") {
    return (
      <>
        <line
          x1={-4}
          y1={0}
          x2={-1}
          y2={0}
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1={1}
          y1={0}
          x2={4}
          y2={0}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    )
  }
  return (
    <>
      <circle cx={-2.5} cy={-1} r={1} fill="currentColor" />
      <circle cx={2.5} cy={-1} r={1} fill="currentColor" />
    </>
  )
}

function Blade({
  cx,
  cy,
  angleDeg,
}: {
  cx: number
  cy: number
  angleDeg: number
}) {
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}>
      <ellipse
        cx={6}
        cy={0}
        rx={10}
        ry={4}
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </g>
  )
}
