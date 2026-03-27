import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { useEndlessStore } from '../../store/endlessStore'
import { useCoinStore } from '../../store/coinStore'
import { saveEndlessSession, getLeaderboard, type LeaderboardEntry } from '../../db/queries'
import { GAMES } from '../../constants/games'
import Button from '../../components/ui/Button'
import { playSound } from '../../utils/sounds'

export default function EndlessGameOver() {
  const { gameId, playerName, playerColor, endlessRound, reset } = useEndlessStore()
  const coinBalance = useCoinStore((s) => s.balance)

  // endlessRound is already incremented past the losing round, so
  // rounds survived = endlessRound - 1
  const roundsSurvived = Math.max(0, endlessRound - 1)

  const game = GAMES.find((g) => g.id === gameId)

  const savedRef = useRef(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [isPersonalBest, setIsPersonalBest] = useState(false)

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    playSound('results', 1.0)

    const save = async () => {
      if (!gameId) return
      try {
        await saveEndlessSession(playerName, gameId, roundsSurvived)
        const board = await getLeaderboard(gameId, 10)
        setLeaderboard(board)
        // Find rank of this run
        const myRank = board.findIndex(
          (e) => e.playerName === playerName && e.roundsSurvived === roundsSurvived,
        )
        if (myRank !== -1) setRank(myRank + 1)
        // Check if personal best
        const myBest = board.find((e) => e.playerName === playerName)
        if (myBest && myBest.roundsSurvived === roundsSurvived) setIsPersonalBest(true)
      } catch {
        // Never block results
      }
    }
    save()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Animations
  const titleOp = useSharedValue(0)
  const roundsOp = useSharedValue(0)
  const roundsScale = useSharedValue(0.4)
  const boardOp = useSharedValue(0)
  const btnsOp = useSharedValue(0)

  useEffect(() => {
    titleOp.value = withTiming(1, { duration: 400 })
    roundsOp.value = withDelay(300, withTiming(1, { duration: 400 }))
    roundsScale.value = withDelay(300, withSpring(1.0, { damping: 10, stiffness: 180 }))
    boardOp.value = withDelay(800, withTiming(1, { duration: 400 }))
    btnsOp.value = withDelay(1000, withTiming(1, { duration: 400 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOp.value }))
  const roundsStyle = useAnimatedStyle(() => ({
    opacity: roundsOp.value,
    transform: [{ scale: roundsScale.value }],
  }))
  const boardStyle = useAnimatedStyle(() => ({ opacity: boardOp.value }))
  const btnsStyle = useAnimatedStyle(() => ({ opacity: btnsOp.value }))

  const handlePlayAgain = () => {
    reset()
    router.replace('/endless/setup' as Parameters<typeof router.replace>[0])
  }

  const handleHome = () => {
    reset()
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={styles.gameOverLabel}>GAME OVER</Text>
          <Text style={[styles.gameName, { color: playerColor }]}>{game?.label ?? ''}</Text>
        </Animated.View>

        {/* Rounds survived */}
        <Animated.View style={[styles.roundsWrap, roundsStyle]}>
          <Text style={styles.roundsLabel}>ROUNDS SURVIVED</Text>
          <Text style={[styles.roundsNum, { color: playerColor, textShadowColor: playerColor }]}>
            {roundsSurvived}
          </Text>
          {isPersonalBest && (
            <View style={styles.pbBadge}>
              <Text style={styles.pbText}>🏆 PERSONAL BEST!</Text>
            </View>
          )}
          {rank !== null && rank <= 3 && !isPersonalBest && (
            <Text style={styles.rankText}>#{rank} on the leaderboard!</Text>
          )}
        </Animated.View>

        {/* Coin earned this session */}
        <Animated.View style={[styles.coinRow, roundsStyle]}>
          <Text style={styles.coinEarned}>🪙 +{roundsSurvived} coins earned</Text>
          <Text style={styles.coinBalance}>Total: {coinBalance}</Text>
        </Animated.View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Animated.View style={[styles.board, boardStyle]}>
            <Text style={styles.boardTitle}>TOP SCORES</Text>
            {leaderboard.map((entry, i) => {
              const isMe = entry.playerName === playerName && entry.roundsSurvived === roundsSurvived
              return (
                <View
                  key={i}
                  style={[styles.boardRow, isMe && { backgroundColor: colors.gold + '18', borderColor: colors.gold }]}
                >
                  <Text style={[styles.boardRank, i < 3 && { color: colors.gold }]}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </Text>
                  <Text style={styles.boardName} numberOfLines={1}>{entry.playerName}</Text>
                  <Text style={styles.boardScore}>{entry.roundsSurvived}</Text>
                </View>
              )
            })}
          </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View style={[styles.btns, btnsStyle]}>
          <Button label="Play Again" onPress={handlePlayAgain} color={colors.gold} size="md" fullWidth />
          <Button label="Leaderboard" onPress={() => router.push(`/leaderboard?gameId=${gameId}` as Parameters<typeof router.push>[0])} color={colors.muted} size="md" fullWidth />
          <Button label="Home" onPress={handleHome} color={colors.muted} size="md" fullWidth />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, gap: 24, paddingBottom: 40 },
  titleWrap: { alignItems: 'center', gap: 6 },
  gameOverLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 3 },
  gameName: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  roundsWrap: { alignItems: 'center', gap: 8 },
  roundsLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 2 },
  roundsNum: {
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: -4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  pbBadge: {
    backgroundColor: colors.gold + '22',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pbText: { fontSize: 14, fontWeight: '900', color: colors.gold, letterSpacing: 1 },
  rankText: { fontSize: 14, fontWeight: '700', color: colors.amber },
  coinRow: { alignItems: 'center', gap: 4 },
  coinEarned: { fontSize: 18, fontWeight: '800', color: colors.gold },
  coinBalance: { fontSize: 13, color: colors.muted },
  board: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  boardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 2,
    padding: 14,
    paddingBottom: 10,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  boardRank: { fontSize: 16, fontWeight: '800', color: colors.muted, width: 32 },
  boardName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  boardScore: { fontSize: 18, fontWeight: '900', color: colors.text },
  btns: { gap: 10 },
})
