// Dashed curve from the whip-viking's hand to a target rower's head,
// plus an impact mark (✱) where it lands. Lives for ~400 ms.

type Props = {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export function WhipLine({ from, to }: Props) {
  const midX = (from.x + to.x) / 2
  const midY = Math.min(from.y, to.y) - 50
  return (
    <g>
      <path
        d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="4 3"
      />
      <text
        x={to.x}
        y={to.y - 6}
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="currentColor"
      >
        ✱
      </text>
    </g>
  )
}
