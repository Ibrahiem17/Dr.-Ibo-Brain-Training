import { create } from 'zustand'
import {
  saveProfile, loadUsername, loadUserColor,
  isProfileSet, updateUsername, updateUserColor, deleteProfile,
} from '../utils/profile'

interface ProfileStore {
  username: string
  color: string
  isProfileLoaded: boolean
  isFirstTime: boolean

  loadProfile: () => Promise<void>
  createProfile: (username: string, color: string) => Promise<void>
  changeUsername: (newName: string) => Promise<void>
  changeColor: (color: string) => Promise<void>
  clearProfile: () => Promise<void>
}

export const useProfileStore = create<ProfileStore>((set) => ({
  username: '',
  color: '#00e5ff',
  isProfileLoaded: false,
  isFirstTime: false,

  loadProfile: async () => {
    try {
      const profileSet = await isProfileSet()
      if (!profileSet) {
        set({ isProfileLoaded: true, isFirstTime: true })
        return
      }
      const username = await loadUsername()
      const color = await loadUserColor()
      set({
        username: username ?? '',
        color: color ?? '#00e5ff',
        isProfileLoaded: true,
        isFirstTime: false,
      })
    } catch (e) {
      console.error('Failed to load profile', e)
      set({ isProfileLoaded: true, isFirstTime: true })
    }
  },

  createProfile: async (username, color) => {
    await saveProfile(username, color)
    set({ username, color, isFirstTime: false })
  },

  changeUsername: async (newName) => {
    await updateUsername(newName)
    set({ username: newName })
  },

  changeColor: async (color) => {
    await updateUserColor(color)
    set({ color })
  },

  clearProfile: async () => {
    await deleteProfile()
    set({ username: '', color: '#00e5ff', isFirstTime: true })
  },
}))
