import { create } from 'zustand'

interface StreakData {
  playerName: string
  currentStreak: number
  longestStreak: number
}

interface UpdateResult {
  currentStreak: number
  longestStreak: number
  isNewDay: boolean
  streakBroken: boolean
  isNewRecord: boolean
}

interface StreakStore {
  lastActiveStreak: StreakData | null
  lastUpdateResult: UpdateResult | null

  setLastActiveStreak: (data: StreakData | null) => void
  setLastUpdateResult: (result: UpdateResult | null) => void
  clearUpdateResult: () => void
}

export const useStreakStore = create<StreakStore>((set) => ({
  lastActiveStreak: null,
  lastUpdateResult: null,
  setLastActiveStreak: (data) => set({ lastActiveStreak: data }),
  setLastUpdateResult: (result) => set({ lastUpdateResult: result }),
  clearUpdateResult: () => set({ lastUpdateResult: null }),
}))
