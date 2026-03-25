import { create } from 'zustand'
import { calcBrainAge } from '../utils/scoring'

interface Player {
  id: number
  name: string
  color: string
}

interface ScoreEntry {
  score: number
  timeMs: number
  accuracy: number
}

interface SessionStore {
  player1: Player | null
  player2: Player | null
  sessionId: number | null
  currentGameIndex: number
  currentPlayer: 1 | 2
  phase: 'idle' | 'playing' | 'handoff' | 'results'
  scores: Record<number, { player1?: ScoreEntry; player2?: ScoreEntry }>

  startSession: (p1: Player, p2: Player, sessionId: number) => void
  submitScore: (player: 1 | 2, gameIndex: number, entry: ScoreEntry) => void
  advanceAfterHandoff: () => void
  resetSession: () => void

  getPlayerScores: (player: 1 | 2) => number[]
  getBrainAge: (player: 1 | 2) => number
  getWinner: () => 1 | 2 | 'tie'
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  player1: null,
  player2: null,
  sessionId: null,
  currentGameIndex: 0,
  currentPlayer: 1,
  phase: 'idle',
  scores: {},

  startSession: (p1, p2, sessionId) =>
    set({
      player1: p1,
      player2: p2,
      sessionId,
      currentGameIndex: 0,
      currentPlayer: 1,
      phase: 'playing',
      scores: {},
    }),

  submitScore: (player, gameIndex, entry) => {
    const state = get()
    const gameScores = state.scores[gameIndex] ?? {}

    if (player === 1) {
      set({
        scores: { ...state.scores, [gameIndex]: { ...gameScores, player1: entry } },
        phase: 'handoff',
        currentPlayer: 2,
      })
    } else {
      const isLastGame = gameIndex >= 6
      const nextIndex = gameIndex + 1
      set({
        scores: { ...state.scores, [gameIndex]: { ...gameScores, player2: entry } },
        phase: isLastGame ? 'results' : 'handoff',
        currentGameIndex: isLastGame ? gameIndex : nextIndex,
        currentPlayer: 1,
      })
    }
  },

  advanceAfterHandoff: () => {
    const state = get()
    set({ phase: 'playing' })
  },

  resetSession: () =>
    set({
      player1: null,
      player2: null,
      sessionId: null,
      currentGameIndex: 0,
      currentPlayer: 1,
      phase: 'idle',
      scores: {},
    }),

  getPlayerScores: (player) => {
    const { scores } = get()
    return Array.from({ length: 7 }, (_, i) => {
      const entry = scores[i]?.[player === 1 ? 'player1' : 'player2']
      return entry?.score ?? 0
    })
  },

  getBrainAge: (player) => {
    const scores = get().getPlayerScores(player)
    return calcBrainAge(scores)
  },

  getWinner: () => {
    const state = get()
    const p1Scores = state.getPlayerScores(1)
    const p2Scores = state.getPlayerScores(2)
    const p1Total = p1Scores.reduce((a, b) => a + b, 0)
    const p2Total = p2Scores.reduce((a, b) => a + b, 0)
    if (p1Total > p2Total) return 1
    if (p2Total > p1Total) return 2
    return 'tie'
  },
}))
