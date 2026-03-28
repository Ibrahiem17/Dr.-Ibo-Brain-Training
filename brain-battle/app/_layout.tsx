import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { initDB } from '../db/client'
import { ToastProvider } from '../hooks/useToast'
import { preloadSounds, setAudioActive } from '../utils/sounds'
import { useProfileStore } from '../store/profileStore'
import { useCoinStore } from '../store/coinStore'
import { useStreakStore } from '../store/streakStore'
import { useShopStore } from '../store/shopStore'
import { getLastActiveStreak } from '../db/queries'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const loadCoins = useCoinStore((s) => s.load)
  const loadOwned = useShopStore((s) => s.loadOwned)
  const setLastActiveStreak = useStreakStore((s) => s.setLastActiveStreak)

  useEffect(() => {
    async function init() {
      try {
        await initDB()
        await preloadSounds()
        await loadProfile()

        const profile = useProfileStore.getState()
        if (!profile.isFirstTime && profile.username) {
          await loadCoins(profile.username)
          await loadOwned(profile.username)
          const streak = await getLastActiveStreak()
          if (streak) setLastActiveStreak(streak)
        }
      } catch (e) {
        console.error('Init failed', e)
      } finally {
        setAppReady(true)
        await SplashScreen.hideAsync()
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAudioActive(state === 'active')
    })
    return () => sub.remove()
  }, [])

  if (!appReady) return null

  return (
    <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="handoff" options={{ animation: 'fade' }} />
        <Stack.Screen name="results" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="shop" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="endless" options={{ headerShown: false }} />
      </Stack>
    </ToastProvider>
  )
}
