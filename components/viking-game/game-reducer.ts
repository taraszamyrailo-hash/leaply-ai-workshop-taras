// Pure game reducer. All time-driven transitions (whips ending, new
// slackers spawning, popups expiring) live here so the React component
// just dispatches "tick" actions from setInterval and "whip" actions
// from click handlers. No setState-inside-useEffect needed.

import {
  MAX_SLACK_INTERVAL,
  MIN_SLACK_INTERVAL,
  NUM_ROWERS,
  POPUP_DURATION,
  WHIP_DURATION,
  type Mood,
  type Popup,
  type Rower,
  type WhipTarget,
} from "./types"

export type GameState = {
  tick: number
  rowers: Rower[]
  score: number
  whipTarget: WhipTarget | null
  popups: Popup[]
  nextSlackTick: number
  nextPopupId: number
}

export type GameAction = { type: "tick" } | { type: "whip"; index: number }

export const initialGameState: GameState = {
  tick: 0,
  rowers: Array.from({ length: NUM_ROWERS }, () => ({
    mood: "rowing" as Mood,
    whippedUntilTick: 0,
  })),
  score: 0,
  whipTarget: null,
  popups: [],
  nextSlackTick: 15,
  nextPopupId: 1,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "tick":
      return advanceTick(state)
    case "whip":
      return applyWhip(state, action.index)
  }
}

function advanceTick(state: GameState): GameState {
  const tick = state.tick + 1

  // 1. End any whips whose timer has elapsed.
  let rowers = state.rowers.map((r) =>
    r.mood === "whipped" && tick >= r.whippedUntilTick
      ? { mood: "rowing" as Mood, whippedUntilTick: 0 }
      : r
  )

  // 2. Spawn a new slacker on schedule.
  let nextSlackTick = state.nextSlackTick
  if (tick >= state.nextSlackTick) {
    const rowingIndices = rowers.flatMap((r, i) =>
      r.mood === "rowing" ? [i] : []
    )
    if (rowingIndices.length > 0) {
      const pick =
        rowingIndices[Math.floor(Math.random() * rowingIndices.length)]
      rowers = rowers.map((r, i) =>
        i === pick ? { mood: "slacking" as Mood, whippedUntilTick: 0 } : r
      )
    }
    nextSlackTick =
      tick +
      MIN_SLACK_INTERVAL +
      Math.floor(Math.random() * (MAX_SLACK_INTERVAL - MIN_SLACK_INTERVAL))
  }

  // 3. Clear expired whip line and popups.
  const whipTarget =
    state.whipTarget && tick >= state.whipTarget.untilTick
      ? null
      : state.whipTarget
  const popups = state.popups.filter((p) => tick < p.untilTick)

  return {
    ...state,
    tick,
    rowers,
    whipTarget,
    popups,
    nextSlackTick,
  }
}

function applyWhip(state: GameState, index: number): GameState {
  const target = state.rowers[index]
  if (!target || target.mood !== "slacking") return state

  return {
    ...state,
    rowers: state.rowers.map((r, i) =>
      i === index
        ? {
            mood: "whipped" as Mood,
            whippedUntilTick: state.tick + WHIP_DURATION,
          }
        : r
    ),
    score: state.score + 1,
    whipTarget: { index, untilTick: state.tick + WHIP_DURATION },
    popups: [
      ...state.popups,
      {
        id: state.nextPopupId,
        index,
        untilTick: state.tick + POPUP_DURATION,
      } satisfies Popup,
    ],
    nextPopupId: state.nextPopupId + 1,
  }
}
