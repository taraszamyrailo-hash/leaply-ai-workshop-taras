// Shared types for the viking ship mini-game.

export type Mood = "rowing" | "slacking" | "whipped"

export type Rower = {
  mood: Mood
  whippedUntilTick: number
}

// In a top-down view of the ship, "top" rowers sit along the upper
// gunwale and stroke their oars OUT into the water above the ship;
// "bottom" rowers sit along the lower gunwale and stroke into the
// water below.
export type Side = "top" | "bottom"

export type WhipTarget = {
  index: number
  untilTick: number
}

// Floating "Бібінда!" feedback that pops near a viking right after a hit.
export type Popup = {
  id: number
  index: number
  untilTick: number
}

export const NUM_ROWERS = 4
export const ROWERS_PER_SIDE = 2
export const TICK_MS = 80 // ~12 FPS — smooth enough for stick figures
export const MIN_SLACK_INTERVAL = 8 // ticks (~640 ms)
export const MAX_SLACK_INTERVAL = 28 // ticks (~2.2 s)
export const WHIP_DURATION = 5 // ticks (~400 ms)
export const POPUP_DURATION = 8 // ticks (~640 ms)
