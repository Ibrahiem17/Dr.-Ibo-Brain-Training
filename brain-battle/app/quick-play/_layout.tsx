import { useEffect } from 'react'
import { Stack, router, usePathname } from 'expo-router'
import { useQuickPlayStore } from '../../store/quickPlayStore'

export default function QuickPlayLayout() {
  const phase = useQuickPlayStore((s) => s.phase)
  const pathname = usePathname()

  useEffect(() => {
    const safeRoutes = ['/quick-play/setup', '/quick-play/select']
    const isSafe = safeRoutes.some((r) => pathname === r || pathname.startsWith(r))
    if (phase === 'idle' && !isSafe) {
      router.replace('/quick-play/setup')
    }
  }, [phase, pathname])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="select" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="countdown" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="handoff" options={{ animation: 'fade' }} />
      <Stack.Screen name="results" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="game/[gameId]" options={{ animation: 'fade' }} />
    </Stack>
  )
}
