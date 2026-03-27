import { create } from 'zustand'
import { GAMES } from '../constants/games'
import { calcBrainAge } from '../utils/scoring'

export interface SoloPlayer {
  id: number | null
  name: string
  color: string
}

export interface SoloGameResult {
  gameId: string
  score: number
  timeMs: number
  accuracy: number
}

interface SoloStore {
  player: SoloPlayer | null
  currentGameIndex: number
  results: SoloGameResult[]
  phase: 'idle' | 'pregame' | 'countdown' | 'playing' | 'between' | 'results'
  finalBrainAge: number | null
  personalBest: number | null

  setPlayer: (player: SoloPlayer) => void
  setPersonalBest: (age: number | null) => void
  startSession: () => void
  submitGameResult: (result: SoloGameResult) => void
  goToNextGame: () => void
  startNextGame: () => void
  completeSession: () => void
  reset: () => void
  resetForReplay: () => void

  getCurrentGame: () => typeof GAMES[number] | null
  getFinalScores: () => number[]
  getBrainAge: () => number
}

export const useSoloStore = create<SoloStore>((set, get) => ({
  player: null,
  currentGameIndex: 0,
  results: [],
  phase: 'idle',
  finalBrainAge: null,
  personalBest: null,

  setPlayer: (player) => set({ player, phase: 'pregame' }),

  setPersonalBest: (age) => set({ personalBest: age }),

  startSession: () =>
    set({
      currentGameIndex: 0,
      results: [],
      finalBrainAge: null,
      phase: 'countdown',
    }),

  submitGameResult: (result) =>
    set((state) => ({ results: [...state.results, result] })),

  goToNextGame: () =>
    set((state) => ({
      currentGameIndex: state.currentGameIndex + 1,
      phase: 'between',
    })),

  startNextGame: () => set({ phase: 'countdown' }),

  completeSession: () => {
    const state = get()
    const scores = state.getFinalScores()
    const brainAge = calcBrainAge(scores)
    set({ finalBrainAge: brainAge, phase: 'results' })
  },

  reset: () =>
    set({
      player: null,
      currentGameIndex: 0,
      results: [],
      phase: 'idle',
      finalBrainAge: null,
      personalBest: null,
    }),

  resetForReplay: () =>
    set((state) => ({
      currentGameIndex: 0,
      results: [],
      finalBrainAge: null,
      phase: 'pregame',
      // keep player and personalBest
    })),

  getCurrentGame: () => {
    const { currentGameIndex } = get()
    return GAMES[currentGameIndex] ?? null
  },

  getFinalScores: () => {
    const { results } = get()
    return GAMES.map((game) => {
      const result = results.find((r) => r.gameId === game.id)
      return result?.score ?? 0
    })
  },

  getBrainAge: () => {
    const scores = get().getFinalScores()
    return calcBrainAge(scores)
  },
}))
