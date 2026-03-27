import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { useEndlessStore } from '../../store/endlessStore'
import { GAMES } from '../../constants/games'
import { playSound } from '../../utils/sounds'

export default function EndlessCountdown() {
  const { gameId, playerName, playerColor } = useEndlessStore()
  const game = GAMES.find((g) => g.id === gameId)

  const [count, setCount] = useState(3)
  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0)

  const pop = () => {
    scale.value = 0.4
    opacity.value = 0
    scale.value = withSpring(1.0, { damping: 10, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 150 })
  }

  useEffect(() => {
    pop()
    playSound('countdownBeep', 0.6)
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (count > 0) {
      const t = setTimeout(() => setCount((c) => c - 1), 900)
      return () => clearTimeout(t)
    } else {
      // count === 0 → show "GO!", then navigate
      pop()
      const t = setTimeout(() => {
        router.replace(`/endless/game/${gameId}` as Parameters<typeof router.replace>[0])
      }, 600)
      return () => clearTimeout(t)
    }
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.gameName}>{game?.label ?? ''}</Text>
      <View style={[styles.playerDot, { backgroundColor: playerColor }]} />
      <Text style={[styles.playerName, { color: playerColor }]}>{playerName}</Text>

      <Animated.Text style={[styles.count, numStyle]}>
        {count > 0 ? String(count) : 'GO!'}
      </Animated.Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playerDot: { width: 16, height: 16, borderRadius: 8, marginTop: 4 },
  playerName: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  count: {
    fontSize: 100,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: -4,
    marginTop: 24,
  },
})
