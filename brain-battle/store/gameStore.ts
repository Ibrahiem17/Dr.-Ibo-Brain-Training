import { create } from 'zustand'

interface GameStore {
  round: number
  totalRounds: number
  score: number
  feedback: 'correct' | 'wrong' | null

  setTotalRounds: (n: number) => void
  addScore: (points: number) => void
  nextRound: () => void
  setFeedback: (f: 'correct' | 'wrong' | null) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  round: 1,
  totalRounds: 1,
  score: 0,
  feedback: null,

  setTotalRounds: (n) => set({ totalRounds: n }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  nextRound: () => set((state) => ({ round: state.round + 1, feedback: null })),
  setFeedback: (f) => set({ feedback: f }),
  reset: () => set({ round: 1, totalRounds: 1, score: 0, feedback: null }),
}))
