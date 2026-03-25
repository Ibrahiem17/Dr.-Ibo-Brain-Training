import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'
import { initDB } from '../db/client'
import { colors } from '../constants/colors'

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('DB init failed', err)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}
