// The whip-wielding captain in the center of the ship, facing the
// viewer. Whip arm swings sharply when actively whipping someone.

type Props = {
  x: number
  y: number
  tick: number
  whipping: boolean
  whipDirection: "left" | "right" | null
}

export function StandingViking({ x, y, tick, whipping, whipDirection }: Props) {
  // When whipping, swing the arm out in the direction of the target;
  // when idle, a small back-and-forth idle motion.
  const dir = whipDirection === "left" ? -1 : 1
  const swingTarget = whipping ? 70 * dir : 0
  const idlePhase = Math.sin(tick * 0.12) * 6
  const armAngle = whipping ? swingTarget : idlePhase

  return (
    <g pointerEvents="none">
      <Head x={x} y={y - 40} />

      {/* Body */}
      <line
        x1={x}
        y1={y - 28}
        x2={x}
        y2={y + 22}
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Off-hand resting on hip */}
      <line
        x1={x}
        y1={y - 18}
        x2={x - 12 * dir}
        y2={y - 4}
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* Whip arm — pivots from the shoulder */}
      <g transform={`translate(${x}, ${y - 22}) rotate(${armAngle})`}>
        <line
          x1={0}
          y1={0}
          x2={26}
          y2={0}
          stroke="currentColor"
          strokeWidth="3"
        />
      </g>

      {/* Legs (standing wide) */}
      <line
        x1={x}
        y1={y + 22}
        x2={x - 9}
        y2={y + 40}
        stroke="currentColor"
        strokeWidth="3"
      />
      <line
        x1={x}
        y1={y + 22}
        x2={x + 9}
        y2={y + 40}
        stroke="currentColor"
        strokeWidth="3"
      />
    </g>
  )
}

function Head({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Helmet — bigger than rowers */}
      <circle
        cx={0}
        cy={0}
        r={11}
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Horns */}
      <path
        d="M -10 -6 L -18 -14 M 10 -6 L 18 -14"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Angry brows */}
      <line
        x1={-5}
        y1={-3}
        x2={-1}
        y2={-1}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1={1}
        y1={-1}
        x2={5}
        y2={-3}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Eyes */}
      <circle cx={-3.5} cy={1} r={1.2} fill="currentColor" />
      <circle cx={3.5} cy={1} r={1.2} fill="currentColor" />
      {/* Beard */}
      <path
        d="M -8 6 L -6 14 L 0 16 L 6 14 L 8 6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </g>
  )
}
