import { create } from 'zustand'
import { getOwnedItems, purchaseItem } from '../db/queries'
import { useCoinStore } from './coinStore'

interface ShopStore {
  ownedItems: string[]
  loadOwned: (playerName: string) => Promise<void>
  buy: (playerName: string, itemId: string, price: number) => Promise<boolean>
  owns: (itemId: string) => boolean
  reset: () => void
}

export const useShopStore = create<ShopStore>((set, get) => ({
  ownedItems: [],

  loadOwned: async (playerName) => {
    try {
      const items = await getOwnedItems(playerName)
      set({ ownedItems: items })
    } catch {
      // silently ignore
    }
  },

  buy: async (playerName, itemId, price) => {
    try {
      const newBalance = await purchaseItem(playerName, itemId, price)
      if (newBalance === null) return false
      set((state) => ({ ownedItems: [...state.ownedItems, itemId] }))
      useCoinStore.getState().setBalance(newBalance)
      return true
    } catch {
      return false
    }
  },

  owns: (itemId) => get().ownedItems.includes(itemId),

  reset: () => set({ ownedItems: [] }),
}))
