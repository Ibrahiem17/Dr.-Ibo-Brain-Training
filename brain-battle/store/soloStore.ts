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

type GameEntry = typeof GAMES[number]

interface SoloStore {
  player: SoloPlayer | null
  gameList: GameEntry[]
  currentGameIndex: number
  results: SoloGameResult[]
  phase: 'idle' | 'pregame' | 'countdown' | 'playing' | 'between' | 'results'
  finalBrainAge: number | null
  personalBest: number | null

  setPlayer: (player: SoloPlayer) => void
  setPersonalBest: (age: number | null) => void
  startSession: (gameList: GameEntry[]) => void
  submitGameResult: (result: SoloGameResult) => void
  goToNextGame: () => void
  startNextGame: () => void
  completeSession: () => void
  reset: () => void
  resetForReplay: () => void

  getCurrentGame: () => GameEntry | null
  getFinalScores: () => number[]
  getBrainAge: () => number
}

const BASE_GAMES = GAMES.filter((g) => !g.locked) as unknown as GameEntry[]

export const useSoloStore = create<SoloStore>((set, get) => ({
  player: null,
  gameList: [...BASE_GAMES],
  currentGameIndex: 0,
  results: [],
  phase: 'idle',
  finalBrainAge: null,
  personalBest: null,

  setPlayer: (player) => set({ player, phase: 'pregame' }),

  setPersonalBest: (age) => set({ personalBest: age }),

  startSession: (gameList) =>
    set({
      gameList,
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
      gameList: [...BASE_GAMES],
      currentGameIndex: 0,
      results: [],
      phase: 'idle',
      finalBrainAge: null,
      personalBest: null,
    }),

  resetForReplay: () =>
    set({
      currentGameIndex: 0,
      results: [],
      finalBrainAge: null,
      phase: 'pregame',
      // keep player, personalBest, gameList
    }),

  getCurrentGame: () => {
    const { currentGameIndex, gameList } = get()
    return gameList[currentGameIndex] ?? null
  },

  getFinalScores: () => {
    const { results, gameList } = get()
    return gameList.map((game) => {
      const result = results.find((r) => r.gameId === game.id)
      return result?.score ?? 0
    })
  },

  getBrainAge: () => {
    const scores = get().getFinalScores()
    return calcBrainAge(scores)
  },
}))
