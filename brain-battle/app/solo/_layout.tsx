import { useEffect } from 'react'
import { Stack, router, usePathname } from 'expo-router'
import { useSoloStore } from '../../store/soloStore'

export default function SoloLayout() {
  const phase = useSoloStore((s) => s.phase)
  const pathname = usePathname()

  useEffect(() => {
    if (phase === 'idle' && !pathname.endsWith('/setup')) {
      router.replace('/solo/setup')
    }
  }, [phase, pathname])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="pregame"      options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="countdown"    options={{ animation: 'fade' }} />
      <Stack.Screen name="game/[gameId]" options={{ animation: 'fade' }} />
      <Stack.Screen name="between"      options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="results"      options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  )
}
