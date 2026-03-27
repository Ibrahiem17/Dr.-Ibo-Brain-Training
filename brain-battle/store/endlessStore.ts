import { create } from 'zustand'

interface EndlessStore {
  gameId: string | null
  playerName: string
  playerColor: string
  endlessRound: number   // 1-indexed; rounds survived so far + 1 = current round being played

  setup: (gameId: string, playerName: string, playerColor: string) => void
  advanceRound: () => void
  reset: () => void
}

export const useEndlessStore = create<EndlessStore>((set) => ({
  gameId: null,
  playerName: '',
  playerColor: '#00e5ff',
  endlessRound: 1,

  setup: (gameId, playerName, playerColor) =>
    set({ gameId, playerName, playerColor, endlessRound: 1 }),

  advanceRound: () => set((s) => ({ endlessRound: s.endlessRound + 1 })),

  reset: () => set({ gameId: null, playerName: '', playerColor: '#00e5ff', endlessRound: 1 }),
}))
