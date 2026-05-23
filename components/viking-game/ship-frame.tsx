// Top-down view of a viking longship. Long horizontal hull: bow with
// dragon head on the LEFT, stern with tiller on the RIGHT, two parallel
// gunwales (top + bottom) between them, shields lining each rail. The
// hull is intentionally narrow so the rowers' oars and blades sweep
// clearly OUTSIDE its outline.

const HULL_LEFT = 100 // x where the hull starts (after the bow)
const HULL_RIGHT = 500 // x where the hull ends (before the stern)
const HULL_TOP = 130 // y of the top gunwale
const HULL_BOTTOM = 220 // y of the bottom gunwale

export function ShipFrame() {
  return (
    <g>
      {/* Top gunwale — slight upward arc in the middle */}
      <path
        d={`M ${HULL_LEFT} ${HULL_TOP} Q 300 ${HULL_TOP - 10} ${HULL_RIGHT} ${HULL_TOP}`}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Bottom gunwale — slight downward arc */}
      <path
        d={`M ${HULL_LEFT} ${HULL_BOTTOM} Q 300 ${HULL_BOTTOM + 10} ${HULL_RIGHT} ${HULL_BOTTOM}`}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />

      {/* Bow (left end) — pointed shape narrowing to the dragon */}
      <path
        d={`M ${HULL_LEFT} ${HULL_TOP} Q 70 ${(HULL_TOP + HULL_BOTTOM) / 2} ${HULL_LEFT} ${HULL_BOTTOM}`}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Dragon head poking out from the bow */}
      <path
        d="M 70 165 Q 35 150 25 165 Q 35 168 30 175 Q 45 173 50 180 Q 60 175 70 175 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <circle cx={40} cy={163} r={1.5} fill="currentColor" />

      {/* Stern (right end) — squared off with a tiller */}
      <path
        d={`M ${HULL_RIGHT} ${HULL_TOP} Q 530 ${(HULL_TOP + HULL_BOTTOM) / 2} ${HULL_RIGHT} ${HULL_BOTTOM}`}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1={530}
        y1={(HULL_TOP + HULL_BOTTOM) / 2}
        x2={565}
        y2={(HULL_TOP + HULL_BOTTOM) / 2}
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Inner deck planks (just hints) */}
      {[155, 175, 195].map((y) => (
        <line
          key={y}
          x1={HULL_LEFT + 5}
          y1={y}
          x2={HULL_RIGHT - 5}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={0.15}
        />
      ))}

      {/* Shields along both gunwales */}
      {[150, 220, 290, 360, 430].map((cx) => (
        <g key={`top-${cx}`}>
          <circle
            cx={cx}
            cy={HULL_TOP}
            r={8}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            opacity={0.5}
          />
        </g>
      ))}
      {[150, 220, 290, 360, 430].map((cx) => (
        <g key={`bot-${cx}`}>
          <circle
            cx={cx}
            cy={HULL_BOTTOM}
            r={8}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            opacity={0.5}
          />
        </g>
      ))}
    </g>
  )
}
