import { Stack } from 'expo-router'

export default function EndlessLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="setup" />
      <Stack.Screen name="countdown" options={{ animation: 'fade' }} />
      <Stack.Screen name="game/[gameId]" />
      <Stack.Screen name="gameover" options={{ animation: 'fade' }} />
    </Stack>
  )
}
