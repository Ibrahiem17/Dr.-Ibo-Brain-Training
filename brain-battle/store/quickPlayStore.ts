import { create } from 'zustand'

export interface QuickPlayPlayer {
  id: number | null
  name: string
  color: string
}

export interface QuickPlayResult {
  player: QuickPlayPlayer
  score: number
  timeMs: number
  accuracy: number
  brainAge: number
}

function singleGameBrainAge(score: number): number {
  if (score >= 90) return 20
  if (score >= 75) return 28
  if (score >= 60) return 35
  if (score >= 45) return 45
  if (score >= 30) return 55
  return 65
}

interface QuickPlayStore {
  selectedGameId: string | null
  player1: QuickPlayPlayer | null
  player2: QuickPlayPlayer | null
  isSolo: boolean
  currentPlayer: 1 | 2
  player1Result: QuickPlayResult | null
  player2Result: QuickPlayResult | null
  phase: 'idle' | 'p1-playing' | 'handoff' | 'p2-playing' | 'results'

  selectGame: (gameId: string) => void
  setPlayers: (p1: QuickPlayPlayer, p2: QuickPlayPlayer | null, isSolo: boolean) => void
  submitResult: (player: 1 | 2, score: number, timeMs: number, accuracy: number) => void
  advanceToHandoff: () => void
  advanceFromHandoff: () => void
  reset: () => void
  resetForReplay: () => void
}

export const useQuickPlayStore = create<QuickPlayStore>((set, get) => ({
  selectedGameId: null,
  player1: null,
  player2: null,
  isSolo: true,
  currentPlayer: 1,
  player1Result: null,
  player2Result: null,
  phase: 'idle',

  selectGame: (gameId) => set({ selectedGameId: gameId }),

  setPlayers: (p1, p2, isSolo) =>
    set({
      player1: p1,
      player2: p2,
      isSolo,
      currentPlayer: 1,
      player1Result: null,
      player2Result: null,
      phase: 'p1-playing',
    }),

  submitResult: (player, score, timeMs, accuracy) => {
    const state = get()
    const playerData = player === 1 ? state.player1 : state.player2
    if (!playerData) return

    const result: QuickPlayResult = {
      player: playerData,
      score,
      timeMs,
      accuracy,
      brainAge: singleGameBrainAge(score),
    }

    if (player === 1) {
      set({ player1Result: result })
    } else {
      set({ player2Result: result, phase: 'results' })
    }
  },

  advanceToHandoff: () => set({ phase: 'handoff', currentPlayer: 2 }),

  advanceFromHandoff: () => set({ phase: 'p2-playing' }),

  reset: () =>
    set({
      selectedGameId: null,
      player1: null,
      player2: null,
      isSolo: true,
      currentPlayer: 1,
      player1Result: null,
      player2Result: null,
      phase: 'idle',
    }),

  resetForReplay: () =>
    set({
      currentPlayer: 1,
      player1Result: null,
      player2Result: null,
      phase: 'p1-playing',
    }),
}))
