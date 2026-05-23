// Viking-themed decorative SVG ornaments used across the app to fill
// empty space with runes, knotwork and shield motifs. Pure presentation —
// every shape is drawn with `currentColor` so the surrounding text color
// drives the tone (set className="text-muted-foreground" etc).
//
// Runes are hand-built SVG paths (not Unicode) so they render
// identically on every machine and pair with the Cinzel display face.

import { cn } from "@/lib/utils"

// Each rune is an SVG `path d=...` inside a 24×24 viewBox. Stroke-based,
// no fills — they read as engraved marks regardless of background color.
const RUNES = {
  fehu: "M12 4 V20 M12 8 L19 5 M12 13 L19 10",
  uruz: "M6 20 V8 L12 4 L18 8 V14",
  thurisaz: "M12 4 V20 M12 9 L18 12 L12 15",
  ansuz: "M12 4 V20 M12 7 L19 10 M12 12 L19 15",
  raidho: "M12 4 V20 M12 4 L18 6 L18 11 L12 12 M12 12 L18 20",
  kenaz: "M18 5 L12 12 L18 19",
  gebo: "M5 5 L19 19 M19 5 L5 19",
  wunjo: "M12 4 V20 M12 4 L18 7 L12 10",
  hagalaz: "M7 4 V20 M17 4 V20 M7 12 L17 12",
  nauthiz: "M12 4 V20 M7 10 L17 14",
  isa: "M12 3 V21",
  algiz: "M12 20 V11 M12 11 L6 4 M12 11 L18 4",
  tiwaz: "M12 20 V6 M12 6 L7 11 M12 6 L17 11",
  berkano: "M8 4 V20 M8 4 L15 5 L17 8 L15 11 L8 12 L15 13 L17 16 L15 19 L8 20",
  ehwaz: "M6 20 V6 L12 12 L18 6 V20",
  mannaz: "M6 20 V6 L12 14 L18 6 V20 M6 6 L18 20 M18 6 L6 20",
  laguz: "M10 4 V20 L17 17",
  dagaz: "M6 6 L18 18 M6 18 L18 6 M6 6 V18 M18 6 V18",
  othala: "M12 3 L19 10 L12 17 L5 10 Z M5 14 L12 21 L19 14",
} as const

type RuneKey = keyof typeof RUNES

function RuneGlyph({
  rune,
  size = 20,
  className,
}: {
  rune: RuneKey
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={RUNES[rune]} />
    </svg>
  )
}

// Inline strip of runes — drop into any heading row to fill negative
// space. The default sequence reads as Fehu-Ansuz-Raidho-Algiz-Tiwaz
// ("wealth, message, journey, defense, victory") — a friendly omen.
export function RuneStrip({
  runes = ["fehu", "ansuz", "raidho", "algiz", "tiwaz"],
  size = 16,
  gap = 14,
  className,
}: {
  runes?: RuneKey[]
  size?: number
  gap?: number
  className?: string
}) {
  return (
    <div
      className={cn("flex items-center text-rune/80", className)}
      style={{ gap }}
      aria-hidden
    >
      {runes.map((r, i) => (
        <RuneGlyph key={i} rune={r} size={size} />
      ))}
    </div>
  )
}

// Horizontal divider: thin line — three runes centered — thin line.
// Use between sections instead of a plain <hr/>.
export function RuneDivider({
  runes = ["algiz", "tiwaz", "algiz"],
  className,
}: {
  runes?: RuneKey[]
  className?: string
}) {
  return (
    <div
      className={cn("flex w-full items-center gap-3 text-rune/70", className)}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
      <span className="flex items-center gap-2">
        {runes.map((r, i) => (
          <RuneGlyph key={i} rune={r} size={16} />
        ))}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
    </div>
  )
}

// Knotwork ribbon. Interlaced sine wave used as a decorative band — say,
// at the top of a card or under a hero heading. Width-fluid SVG.
export function KnotworkBand({
  className,
  height = 18,
}: {
  className?: string
  height?: number
}) {
  return (
    <svg
      viewBox="0 0 240 24"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={cn("text-border", className)}
      aria-hidden
    >
      <defs>
        <pattern
          id="knot-loop"
          width="40"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          {/* Two interlaced S-curves crossing at 20,12 give a braid look */}
          <path
            d="M0 12 C 10 0, 30 0, 40 12 C 30 24, 10 24, 0 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <path
            d="M20 0 C 10 8, 30 16, 20 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.85" />
        </pattern>
      </defs>
      <rect width="240" height="24" fill="url(#knot-loop)" />
    </svg>
  )
}

// Small triangular flourish meant to sit in a card corner. Combines a
// rune with a hint of knotwork curl.
export function CornerKnot({
  className,
  flip,
}: {
  className?: string
  flip?: "x" | "y" | "xy"
}) {
  const transform = flip
    ? flip === "x"
      ? "scale(-1 1) translate(-56 0)"
      : flip === "y"
        ? "scale(1 -1) translate(0 -56)"
        : "scale(-1 -1) translate(-56 -56)"
    : undefined
  return (
    <svg
      viewBox="0 0 56 56"
      width="56"
      height="56"
      className={cn("text-border", className)}
      aria-hidden
    >
      <g
        transform={transform}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      >
        <path d="M2 2 H 30" />
        <path d="M2 2 V 30" />
        <path d="M2 2 Q 18 18 28 28" />
        <circle cx="28" cy="28" r="3" />
        <path d="M28 28 Q 36 26 38 18" />
        <path d="M28 28 Q 26 36 18 38" />
        <path d="M14 2 L 14 8 M 18 2 L 18 6" opacity="0.7" />
        <path d="M2 14 L 8 14 M 2 18 L 6 18" opacity="0.7" />
      </g>
    </svg>
  )
}

// Decorative "carved-stone" shield used to dress up empty hero areas.
// Top arc + cross-banded face with a single bold rune in the middle.
export function RuneShield({
  rune = "algiz",
  size = 80,
  className,
}: {
  rune?: RuneKey
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 80 96"
      width={size}
      height={(size * 96) / 80}
      className={cn("text-border", className)}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 14 Q 40 4 70 14 L 70 56 Q 40 92 10 56 Z" />
        <path d="M16 22 Q 40 14 64 22" opacity="0.6" />
        <path d="M40 14 V 78" opacity="0.45" />
        <path d="M14 36 H 66" opacity="0.45" />
      </g>
      <g transform="translate(28 32) scale(1)" className="text-rune">
        <svg x="0" y="0" width="24" height="24" viewBox="0 0 24 24">
          <path
            d={RUNES[rune]}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </g>
    </svg>
  )
}

// Decorative inscription bar — three runes flanked by carved brackets.
// Use as a "section caption" replacing the plain uppercase eyebrow.
export function RuneBanner({
  children,
  runes = ["algiz", "tiwaz", "algiz"],
  className,
}: {
  children?: React.ReactNode
  runes?: RuneKey[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs tracking-[0.25em] text-muted-foreground uppercase",
        className
      )}
    >
      <span className="flex items-center gap-1.5 text-rune">
        {runes.map((r, i) => (
          <RuneGlyph key={i} rune={r} size={12} />
        ))}
      </span>
      {children ? <span className="font-display">{children}</span> : null}
      <span className="flex items-center gap-1.5 text-rune">
        {runes
          .slice()
          .reverse()
          .map((r, i) => (
            <RuneGlyph key={i} rune={r} size={12} />
          ))}
      </span>
    </div>
  )
}

// Frame: wraps children in a parchment-style box with corner knots at
// every corner. Use as a heavy-duty hero/empty-state frame.
export function RuneFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <CornerKnot className="absolute -top-2 -left-2 text-border" />
      <CornerKnot flip="x" className="absolute -top-2 -right-2 text-border" />
      <CornerKnot flip="y" className="absolute -bottom-2 -left-2 text-border" />
      <CornerKnot
        flip="xy"
        className="absolute -right-2 -bottom-2 text-border"
      />
      {children}
    </div>
  )
}
