import { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSoloStore } from '../../store/soloStore'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import Button from '../../components/ui/Button'

const GAME_COLOR: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

const GAME_DIFFICULTY: Record<string, number> = {
  'mental-math': 2, 'grid-memory': 2, 'stroop-test': 1,
  'number-sequence': 3, 'falling-blocks': 3, 'exploding-cube': 3, 'flag-direction': 2,
}

function GameRow({ game, index }: { game: typeof GAMES[number]; index: number }) {
  const translateX = useSharedValue(60)
  const opacity    = useSharedValue(0)

  useEffect(() => {
    const delay = 200 + index * 100
    translateX.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }))
    opacity.value    = withDelay(delay, withTiming(1, { duration: 250 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  const gc = GAME_COLOR[game.id] ?? colors.accent
  const diff = GAME_DIFFICULTY[game.id] ?? 1

  return (
    <Animated.View style={[styles.gameRow, { borderLeftColor: gc }, style]}>
      <Text style={styles.gameNum}>{String(index + 1).padStart(2, '0')}</Text>
      <Text style={[styles.gameIcon, { color: gc }]}>{game.icon}</Text>
      <Text style={styles.gameName}>{game.label}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i < diff ? gc : colors.border }]} />
        ))}
      </View>
    </Animated.View>
  )
}

export default function SoloPregame() {
  const { player, personalBest, startSession } = useSoloStore()

  if (!player) {
    router.replace('/solo/setup')
    return null
  }

  const handleStart = () => {
    startSession()
    router.replace('/solo/countdown')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: player?.color ?? colors.accent3 }]}>
          GET READY, {(player?.name ?? 'PLAYER').toUpperCase()}
        </Text>
        <Text style={styles.sub}>7 games · Your best time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {GAMES.map((g, i) => (
          <GameRow key={g.id} game={g} index={i} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {personalBest !== null ? (
          <Text style={styles.bestText}>
            Your best brain age: <Text style={[styles.bestNum, { color: colors.accent3 }]}>{personalBest}</Text>
            {'  '}· Can you beat it?
          </Text>
        ) : (
          <Text style={styles.bestText}>First run! No record to beat yet.</Text>
        )}

        <Button
          label="START"
          onPress={handleStart}
          color={colors.accent3}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  sub: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  list: { padding: 16, gap: 10 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    padding: 14,
  },
  gameNum: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1, width: 24 },
  gameIcon: { fontSize: 22, fontWeight: '900', width: 28, textAlign: 'center' },
  gameName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  footer: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bestText: { fontSize: 13, color: colors.muted, fontWeight: '500', textAlign: 'center' },
  bestNum: { fontWeight: '900' },
})
