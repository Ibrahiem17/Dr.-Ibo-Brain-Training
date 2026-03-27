import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { useQuickPlayStore, type QuickPlayResult } from '../../store/quickPlayStore'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import { createOrGetPlayer, saveQuickPlayScore, updateStreak } from '../../db/queries'
import { useStreakStore } from '../../store/streakStore'
import Button from '../../components/ui/Button'
import StreakBadge from '../../components/ui/StreakBadge'

function useCountUp(target: number, duration: number, delay: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now()
      const step = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setValue(Math.round(target * progress))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return value
}

function useCountDown(from: number, target: number, duration: number, delay: number): number {
  const [value, setValue] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now()
      const step = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        setValue(Math.round(from - (from - target) * progress))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(t)
  }, [from, target, duration, delay])
  return value
}

function performanceLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'EXCEPTIONAL', color: colors.accent3 }
  if (score >= 70) return { label: 'GREAT', color: colors.accent }
  if (score >= 50) return { label: 'GOOD', color: colors.amber }
  if (score >= 30) return { label: 'KEEP PRACTISING', color: colors.accent2 }
  return { label: 'TRY AGAIN', color: colors.accent2 }
}

export default function QuickPlayResults() {
  const {
    isSolo, player1Result, player2Result,
    selectedGameId, player1, player2,
    resetForReplay, reset,
  } = useQuickPlayStore()

  const savedRef = useRef(false)

  const game = GAMES.find((g) => g.id === selectedGameId) ?? GAMES[0]

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const save = async () => {
      try {
        if (isSolo && player1Result) {
          const p = player1Result.player
          const dbPlayer = await createOrGetPlayer(p.name, p.color)
          await saveQuickPlayScore(dbPlayer.id, game.id, player1Result.score, player1Result.timeMs, player1Result.accuracy)
        } else if (!isSolo && player1Result && player2Result) {
          const [dbP1, dbP2] = await Promise.all([
            createOrGetPlayer(player1Result.player.name, player1Result.player.color),
            createOrGetPlayer(player2Result.player.name, player2Result.player.color),
          ])
          await Promise.all([
            saveQuickPlayScore(dbP1.id, game.id, player1Result.score, player1Result.timeMs, player1Result.accuracy),
            saveQuickPlayScore(dbP2.id, game.id, player2Result.score, player2Result.timeMs, player2Result.accuracy),
          ])
        }
        // Update streaks
        if (isSolo && player1Result) {
          const name = player1Result.player.name
          if (name) updateStreak(name).then((r) => {
            useStreakStore.getState().setLastUpdateResult(r)
            useStreakStore.getState().setLastActiveStreak({ playerName: name, currentStreak: r.currentStreak, longestStreak: r.longestStreak })
          }).catch(() => {})
        } else if (!isSolo && player1Result && player2Result) {
          if (player1Result.player.name) updateStreak(player1Result.player.name).catch(() => {})
          if (player2Result.player.name) updateStreak(player2Result.player.name).catch(() => {})
        }
      } catch {
        // never block results on DB error
      }
    }
    save()
  }, [])

  useEffect(() => {
    return () => useStreakStore.getState().clearUpdateResult()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAgain = () => {
    resetForReplay()
    router.replace('/quick-play/countdown')
  }

  const handleChangeGame = () => {
    reset()
    // re-enter with same players
    if (player1) {
      useQuickPlayStore.getState().setPlayers(
        { ...player1, id: null },
        player2 ? { ...player2, id: null } : null,
        isSolo,
      )
    }
    router.replace('/quick-play/select')
  }

  const handleHome = () => {
    reset()
    router.replace('/')
  }

  if (!player1Result) {
    return (
      <View style={styles.fallback}>
        <Text style={{ color: colors.text }}>Loading results…</Text>
      </View>
    )
  }

  if (isSolo) {
    return (
      <SoloResults
        result={player1Result}
        game={game}
        onPlayAgain={handlePlayAgain}
        onChangeGame={handleChangeGame}
      />
    )
  }

  if (!player2Result) {
    return (
      <View style={styles.fallback}>
        <Text style={{ color: colors.text }}>Loading results…</Text>
      </View>
    )
  }

  return (
    <TwoPlayerResults
      p1Result={player1Result}
      p2Result={player2Result}
      game={game}
      onPlayAgain={handlePlayAgain}
      onChangeGame={handleChangeGame}
      onHome={handleHome}
    />
  )
}

// ─── Solo Results ────────────────────────────────────────────────────────────

function SoloResults({
  result,
  game,
  onPlayAgain,
  onChangeGame,
}: {
  result: QuickPlayResult
  game: typeof GAMES[number]
  onPlayAgain: () => void
  onChangeGame: () => void
}) {
  const score = useCountUp(result.score, 1000, 300)
  const brainAge = useCountDown(99, result.brainAge, 1200, 500)
  const perf = performanceLabel(result.score)
  const { lastUpdateResult } = useStreakStore()

  const fadeIn = useSharedValue(0)
  const slideUp = useSharedValue(30)
  const streakOp = useSharedValue(0)
  useEffect(() => {
    fadeIn.value = withDelay(100, withTiming(1, { duration: 500 }))
    slideUp.value = withDelay(100, withSpring(0, { damping: 18 }))
    streakOp.value = withDelay(1000, withTiming(1, { duration: 400 }))
  }, [])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }))
  const streakNotifStyle = useAnimatedStyle(() => ({ opacity: streakOp.value }))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View style={[styles.soloContainer, containerStyle]}>
        <Text style={styles.header}>YOUR RESULT</Text>

        <View style={styles.gameTag}>
          <Text style={styles.gameTagIcon}>{game.icon}</Text>
          <Text style={styles.gameTagLabel}>{game.label}</Text>
        </View>

        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeNum}>{score}</Text>
          <Text style={styles.scoreBadgeLabel}>SCORE</Text>
        </View>

        <View style={styles.brainAgeBox}>
          <Text style={styles.brainAgeLabel}>Brain Age</Text>
          <Text style={styles.brainAgeNum}>{brainAge}</Text>
        </View>

        <Text style={[styles.perfLabel, { color: perf.color }]}>{perf.label}</Text>
      </Animated.View>

      {lastUpdateResult?.isNewDay && (
        <Animated.View style={[styles.streakNotif, streakNotifStyle]}>
          {lastUpdateResult.streakBroken ? (
            <>
              <Text style={styles.streakNotifIcon}>💔</Text>
              <Text style={styles.streakNotifText}>Streak reset — start a new one!</Text>
              <StreakBadge streak={1} size="sm" />
            </>
          ) : lastUpdateResult.isNewRecord ? (
            <>
              <Text style={styles.streakNotifIcon}>🏆</Text>
              <Text style={styles.streakNotifText}>New streak record!</Text>
              <StreakBadge streak={lastUpdateResult.currentStreak} size="sm" />
            </>
          ) : (
            <>
              <Text style={styles.streakNotifIcon}>🔥</Text>
              <Text style={styles.streakNotifText}>
                {lastUpdateResult.currentStreak === 1
                  ? 'Streak started! Come back tomorrow!'
                  : `${lastUpdateResult.currentStreak} day streak!`}
              </Text>
              <StreakBadge streak={lastUpdateResult.currentStreak} size="sm" />
            </>
          )}
        </Animated.View>
      )}

      <View style={styles.bottomBar}>
        <Button label="Play Again" onPress={onPlayAgain} color={colors.accent} size="md" />
        <Button label="Change Game" onPress={onChangeGame} color={colors.amber} size="md" />
      </View>
    </SafeAreaView>
  )
}

// ─── Two-Player Results ───────────────────────────────────────────────────────

function PlayerResultCard({
  result,
  isWinner,
  delay,
}: {
  result: QuickPlayResult
  isWinner: boolean
  delay: number
}) {
  const score = useCountUp(result.score, 1000, delay)
  const brainAge = useCountDown(99, result.brainAge, 1200, delay + 200)

  const glow = useSharedValue(0)
  const cardStyle = useAnimatedStyle(() => ({
    opacity: isWinner ? 1 : withTiming(0.85, { duration: 600 }),
    shadowOpacity: glow.value,
    shadowColor: result.player.color,
    shadowRadius: 16,
    elevation: isWinner ? 8 : 0,
  }))

  useEffect(() => {
    if (isWinner) glow.value = withDelay(800, withTiming(0.6, { duration: 600 }))
  }, [isWinner])

  return (
    <Animated.View
      style={[
        styles.playerCard,
        { borderColor: isWinner ? result.player.color : colors.border },
        isWinner && { borderWidth: 2 },
        cardStyle,
      ]}
    >
      <Text style={[styles.pcName, { color: result.player.color }]}>{result.player.name}</Text>
      <Text style={styles.pcScore}>{score}</Text>
      <Text style={styles.pcScoreLabel}>SCORE</Text>
      <View style={styles.pcDivider} />
      <Text style={styles.pcBrainAgeLabel}>Brain Age</Text>
      <Text style={[styles.pcBrainAge, { color: result.player.color }]}>{brainAge}</Text>
    </Animated.View>
  )
}

function TwoPlayerResults({
  p1Result,
  p2Result,
  game,
  onPlayAgain,
  onChangeGame,
  onHome,
}: {
  p1Result: QuickPlayResult
  p2Result: QuickPlayResult
  game: typeof GAMES[number]
  onPlayAgain: () => void
  onChangeGame: () => void
  onHome: () => void
}) {
  const isTie = p1Result.score === p2Result.score
  const p1Wins = p1Result.score > p2Result.score

  const bannerY = useSharedValue(-60)
  const bannerOpacity = useSharedValue(0)
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
    opacity: bannerOpacity.value,
  }))

  useEffect(() => {
    bannerY.value = withDelay(1400, withSpring(0, { damping: 16 }))
    bannerOpacity.value = withDelay(1400, withTiming(1, { duration: 300 }))
  }, [])

  const winner = isTie ? null : p1Wins ? p1Result : p2Result

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.twoHeader}>
        <Text style={styles.header}>RESULTS</Text>
        <View style={styles.gameTag}>
          <Text style={styles.gameTagIcon}>{game.icon}</Text>
          <Text style={styles.gameTagLabel}>{game.label}</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <PlayerResultCard result={p1Result} isWinner={!isTie && p1Wins} delay={300} />
        <PlayerResultCard result={p2Result} isWinner={!isTie && !p1Wins} delay={500} />
      </View>

      <Animated.View style={[styles.winnerBanner, bannerStyle]}>
        {isTie ? (
          <Text style={[styles.winnerText, { color: colors.amber }]}>IT'S A TIE!</Text>
        ) : (
          <Text style={[styles.winnerText, { color: winner?.player.color }]}>
            {winner?.player.name.toUpperCase()} WINS!
          </Text>
        )}
      </Animated.View>

      <View style={[styles.bottomBar, { gap: 10 }]}>
        <Button label="Play Again" onPress={onPlayAgain} color={colors.accent} size="sm" />
        <Button label="Change Game" onPress={onChangeGame} color={colors.amber} size="sm" />
        <Button label="Home" onPress={onHome} color={colors.muted} size="sm" />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Solo
  soloContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  header: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 3,
  },
  gameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameTagIcon: { fontSize: 20, color: colors.accent, fontWeight: '900' },
  gameTagLabel: { fontSize: 14, color: colors.muted, fontWeight: '600', letterSpacing: 0.5 },
  scoreBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent + '18',
    gap: 2,
  },
  scoreBadgeNum: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: -2,
  },
  scoreBadgeLabel: { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 2 },
  brainAgeBox: {
    alignItems: 'center',
    gap: 4,
  },
  brainAgeLabel: { fontSize: 12, color: colors.muted, fontWeight: '700', letterSpacing: 1.5 },
  brainAgeNum: { fontSize: 52, fontWeight: '900', color: colors.text, letterSpacing: -2 },
  perfLabel: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  // Two player
  twoHeader: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    alignItems: 'center',
  },
  playerCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  pcName: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  pcScore: { fontSize: 44, fontWeight: '900', color: colors.text, letterSpacing: -2 },
  pcScoreLabel: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 2 },
  pcDivider: { height: 1, width: '80%', backgroundColor: colors.border, marginVertical: 8 },
  pcBrainAgeLabel: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 1.5 },
  pcBrainAge: { fontSize: 28, fontWeight: '900' },
  winnerBanner: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  winnerText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  streakNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    alignSelf: 'center',
  },
  streakNotifIcon: { fontSize: 18 },
  streakNotifText: { fontSize: 12, color: colors.muted, flex: 1 },
})
