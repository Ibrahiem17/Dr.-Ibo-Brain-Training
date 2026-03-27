import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { useSettingsStore } from '../store/settingsStore'
import { createOrGetPlayer, createSession } from '../db/queries'
import { useSessionStore } from '../store/sessionStore'
import Button from '../components/ui/Button'

export default function SetupScreen() {
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()
  const startSession = useSessionStore((s) => s.startSession)
  const { player1Color, player2Color } = useSettingsStore()

  const p1X = useSharedValue(-240)
  const p2X = useSharedValue(240)
  const p1Style = useAnimatedStyle(() => ({ transform: [{ translateX: p1X.value }] }))
  const p2Style = useAnimatedStyle(() => ({ transform: [{ translateX: p2X.value }] }))

  useEffect(() => {
    p1X.value = withSpring(0, { damping: 18, stiffness: 160 })
    p2X.value = withSpring(0, { damping: 18, stiffness: 160 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    setLoading(true)
    try {
      const p1 = await createOrGetPlayer('Player 1', player1Color)
      const p2 = await createOrGetPlayer('Player 2', player2Color)
      const session = await createSession(p1.id, p2.id)
      startSession(
        { id: p1.id, name: 'Player 1', color: player1Color },
        { id: p2.id, name: 'Player 2', color: player2Color },
        session.id,
      )
      router.push('/game/mental-math')
    } catch {
      Alert.alert('Error', 'Could not start game. Please try again.')
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>FULL BATTLE</Text>
      <Text style={styles.subtitle}>7 games · Brain age · Winner</Text>

      <View style={styles.cardsRow}>
        <Animated.View style={[styles.card, { borderColor: player1Color }, p1Style]}>
          <Text style={[styles.dot, { color: player1Color }]}>●</Text>
          <Text style={styles.playerLabel}>PLAYER 1</Text>
          <Text style={[styles.playerName, { color: player1Color }]}>Player 1</Text>
        </Animated.View>

        <Text style={styles.vs}>VS</Text>

        <Animated.View style={[styles.card, { borderColor: player2Color }, p2Style]}>
          <Text style={[styles.dot, { color: player2Color }]}>●</Text>
          <Text style={styles.playerLabel}>PLAYER 2</Text>
          <Text style={[styles.playerName, { color: player2Color }]}>Player 2</Text>
        </Animated.View>
      </View>

      <Button
        label={loading ? 'Starting…' : 'START BATTLE'}
        onPress={handleStart}
        disabled={loading}
        color={colors.accent}
        size="lg"
        fullWidth
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 20,
  },
  back: { alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -10,
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  dot: { fontSize: 32 },
  playerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  vs: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.muted,
    letterSpacing: 2,
  },
})
