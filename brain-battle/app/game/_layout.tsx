import { useEffect } from 'react'
import { Alert } from 'react-native'
import { Stack, router } from 'expo-router'
import { useSessionStore } from '../../store/sessionStore'

export default function GameLayout() {
  const sessionId = useSessionStore((s) => s.sessionId)

  useEffect(() => {
    if (sessionId === null) {
      Alert.alert(
        'Session Expired',
        'Your game session was lost. Please start over.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      )
    }
  }, [])

  return <Stack screenOptions={{ headerShown: false }} />
}
