import { useEffect, useMemo } from 'react'
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
import { useShopStore } from '../../store/shopStore'
import { GAMES, GAME_ICONS } from '../../constants/games'
import { colors } from '../../constants/colors'
import Button from '../../components/ui/Button'

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

  const IconComponent = GAME_ICONS[game.id]

  return (
    <Animated.View style={[styles.gameRow, { borderLeftColor: game.color }, style]}>
      <Text style={styles.gameNum}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={[styles.iconBox, { backgroundColor: `${game.color}15` }]}>
        <IconComponent size={36} color={game.color} />
      </View>
      <Text style={styles.gameName}>{game.label}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i < game.difficulty ? game.color : colors.border }]} />
        ))}
      </View>
    </Animated.View>
  )
}

export default function SoloPregame() {
  const { player, personalBest, startSession } = useSoloStore()
  const { owns } = useShopStore()

  const availableGames = useMemo(
    () => GAMES.filter((g) => !g.locked || owns(g.id)) as unknown as typeof GAMES[number][],
    [owns],
  )

  if (!player) {
    router.replace('/solo/setup')
    return null
  }

  const handleStart = () => {
    startSession(availableGames)
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
        <Text style={styles.sub}>{availableGames.length} games · Your best time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {availableGames.map((g, i) => (
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
    padding: 10,
  },
  gameNum: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1, width: 24 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
