import { create } from 'zustand'
import { setMuted } from '../utils/sounds'

interface SettingsState {
  muted: boolean
  hapticsEnabled: boolean
  player1Color: string
  player2Color: string
  toggleMute: () => void
  toggleHaptics: () => void
  setPlayer1Color: (color: string) => void
  setPlayer2Color: (color: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  muted: false,
  hapticsEnabled: true,
  player1Color: '#00e5ff',
  player2Color: '#ff2d6b',
  toggleMute: () => {
    const next = !get().muted
    set({ muted: next })
    setMuted(next)
  },
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
  setPlayer1Color: (color) => set({ player1Color: color }),
  setPlayer2Color: (color) => set({ player2Color: color }),
}))
