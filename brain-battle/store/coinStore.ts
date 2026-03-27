import { create } from 'zustand'
import { getCoins, earnCoins } from '../db/queries'

interface CoinStore {
  balance: number
  setBalance: (n: number) => void
  load: (playerName: string) => Promise<void>
  earn: (playerName: string, amount: number) => Promise<void>
}

export const useCoinStore = create<CoinStore>((set) => ({
  balance: 0,

  setBalance: (n) => set({ balance: n }),

  load: async (playerName) => {
    try {
      const bal = await getCoins(playerName)
      set({ balance: bal })
    } catch {
      // silently ignore
    }
  },

  earn: async (playerName, amount) => {
    try {
      const newBalance = await earnCoins(playerName, amount)
      set({ balance: newBalance })
    } catch {
      // silently ignore
    }
  },
}))
