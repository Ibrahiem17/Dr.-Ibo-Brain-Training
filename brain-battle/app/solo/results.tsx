import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { useSoloStore, type SoloGameResult } from '../../store/soloStore'
import { playSound } from '../../utils/sounds'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import { createOrGetPlayer, saveSoloSession, saveSoloGameScores, updateStreak } from '../../db/queries'
import { useStreakStore } from '../../store/streakStore'
import { useCoinStore } from '../../store/coinStore'
import Button from '../../components/ui/Button'
import StreakBadge from '../../components/ui/StreakBadge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GAME_COLOR: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

function brainAgeColor(age: number): string {
  if (age <= 25) return colors.accent3
  if (age <= 35) return colors.accent
  if (age <= 45) return colors.amber
  return colors.accent2
}

function performanceMessage(age: number): string {
  if (age <= 20) return 'LEGENDARY MIND'
  if (age <= 25) return 'EXCEPTIONAL'
  if (age <= 30) return 'SHARP AS A TACK'
  if (age <= 35) return 'ABOVE AVERAGE'
  if (age <= 45) return 'SOLID PERFORMANCE'
  if (age <= 55) return 'ROOM TO GROW'
  return 'KEEP TRAINING'
}

function useCountDown(from: number, to: number, duration: number, delay: number): number {
  const [val, setVal] = useState(from)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        setVal(Math.round(from - (from - to) * p))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [from, to, duration, delay])
  return val
}

// ─── Animated game score row ───────────────────────────────────────────────────

function ScoreRow({ result, index }: { result: SoloGameResult; index: number }) {
  const game = GAMES.find((g) => g.id === result.gameId)
  const gc   = GAME_COLOR[result.gameId] ?? colors.accent

  const tx  = useSharedValue(50)
  const op  = useSharedValue(0)
  useEffect(() => {
    const delay = 600 + index * 120
    tx.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }))
    op.value = withDelay(delay, withTiming(1, { duration: 250 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }))

  const isHigh = result.score >= 70

  return (
    <Animated.View style={[styles.scoreRow, isHigh && { backgroundColor: colors.accent3 + '14' }, style]}>
      <View style={[styles.scoreRowLeft, { borderLeftColor: gc }]}>
        <Text style={[styles.srIcon, { color: gc }]}>{game?.icon ?? '?'}</Text>
        <Text style={styles.srName}>{game?.label ?? result.gameId}</Text>
      </View>
      <Text style={[styles.srScore, { color: gc }]}>{result.score}</Text>
    </Animated.View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SoloResults() {
  const { player, results, finalBrainAge, personalBest, resetForReplay, reset } = useSoloStore()
  const savedRef = useRef(false)
  const [isNewBest, setIsNewBest] = useState(false)
  const { lastUpdateResult, setLastUpdateResult, setLastActiveStreak, clearUpdateResult } = useStreakStore()
  const earnCoins = useCoinStore((s) => s.earn)

  const brainAge = finalBrainAge ?? 65
  const totalScore = results.reduce((s, r) => s + r.score, 0)

  // ── DB save ──
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const save = async () => {
      if (!player) return
      try {
        const dbPlayer = await createOrGetPlayer(player.name, player.color)
        const sessionId = await saveSoloSession(dbPlayer.id, brainAge, totalScore)
        await saveSoloGameScores(sessionId, dbPlayer.id, results)
        // Award coins for completing a solo session
        earnCoins(player.name, 5)
        if (player?.name) {
          updateStreak(player.name)
            .then((result) => {
              setLastUpdateResult(result)
              setLastActiveStreak({ playerName: player.name, currentStreak: result.currentStreak, longestStreak: result.longestStreak })
            })
            .catch(() => {})
        }
      } catch {
        // Never block results
      }
    }
    save()

    // Check personal best
    if (personalBest === null || brainAge < personalBest) {
      setIsNewBest(true)
    }

    playSound('results', 1.0)
  }, [])

  useEffect(() => {
    return () => clearUpdateResult()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // New best sound — 2 s after it's revealed
  useEffect(() => {
    if (!isNewBest) return
    const t = setTimeout(() => playSound('newBest', 1.0), 2000)
    return () => clearTimeout(t)
  }, [isNewBest])

  // ── Animation values ──
  const screenOp   = useSharedValue(0)
  const headerY    = useSharedValue(-30)
  const playerOp   = useSharedValue(0)
  const dividerW   = useSharedValue(0)
  const baLabelOp  = useSharedValue(0)
  const baOp       = useSharedValue(0)
  const pbOp       = useSharedValue(0)
  const perfOp     = useSharedValue(0)
  const btnsOp     = useSharedValue(0)
  const newBestScale = useSharedValue(0.5)
  const streakOp   = useSharedValue(0)

  // Row count: 7 rows, last stagger delay = 600 + 6*120 = 1320ms
  const AFTER_ROWS  = 1320 + 120 + 400   // 1840
  const DIVIDER_D   = AFTER_ROWS           // 1840
  const BA_LABEL_D  = DIVIDER_D + 450      // 2290
  const BA_D        = BA_LABEL_D + 200     // 2490
  const BA_DUR      = 1500
  const PB_D        = BA_D + BA_DUR + 300  // 4290
  const PERF_D      = PB_D + 400           // 4690
  const BTNS_D      = PERF_D + 500         // 5190

  const baDisplayed = useCountDown(99, brainAge, BA_DUR, BA_D)

  useEffect(() => {
    screenOp.value  = withTiming(1, { duration: 400 })
    headerY.value   = withDelay(250, withSpring(0, { damping: 18, stiffness: 200 }))
    playerOp.value  = withDelay(450, withTiming(1, { duration: 350 }))
    dividerW.value  = withDelay(DIVIDER_D, withTiming(1, { duration: 400 }))
    baLabelOp.value = withDelay(BA_LABEL_D, withTiming(1, { duration: 300 }))
    baOp.value      = withDelay(BA_D, withTiming(1, { duration: 300 }))
    pbOp.value      = withDelay(PB_D, withTiming(1, { duration: 350 }))
    perfOp.value    = withDelay(PERF_D, withTiming(1, { duration: 350 }))
    btnsOp.value    = withDelay(BTNS_D, withTiming(1, { duration: 400 }))
    streakOp.value  = withDelay(1000, withTiming(1, { duration: 400 }))
    if (isNewBest) {
      newBestScale.value = withDelay(PB_D + 100,
        withSequence(
          withSpring(1.2, { damping: 10, stiffness: 300 }),
          withSpring(1.0, { damping: 15, stiffness: 200 }),
        )
      )
    }
  }, [isNewBest])

  const screenStyle  = useAnimatedStyle(() => ({ opacity: screenOp.value }))
  const headerStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: headerY.value }] }))
  const playerStyle  = useAnimatedStyle(() => ({ opacity: playerOp.value }))
  const dividerStyle = useAnimatedStyle(() => ({ width: `${dividerW.value * 100}%` as `${number}%` }))
  const baLabelStyle = useAnimatedStyle(() => ({ opacity: baLabelOp.value }))
  const baStyle      = useAnimatedStyle(() => ({ opacity: baOp.value }))
  const pbStyle      = useAnimatedStyle(() => ({ opacity: pbOp.value }))
  const perfStyle    = useAnimatedStyle(() => ({ opacity: perfOp.value }))
  const btnsStyle      = useAnimatedStyle(() => ({ opacity: btnsOp.value }))
  const newBestStyle   = useAnimatedStyle(() => ({ transform: [{ scale: newBestScale.value }] }))
  const streakNotifStyle = useAnimatedStyle(() => ({ opacity: streakOp.value }))

  const ageColor = brainAgeColor(brainAge)
  const perfMsg  = performanceMessage(brainAge)

  const handlePlayAgain = () => {
    resetForReplay()
    router.replace('/solo/pregame')
  }

  const handleHome = () => {
    reset()
    router.replace('/')
  }

  const handleQuickPlay = () => {
    reset()
    router.replace('/quick-play/select' as Parameters<typeof router.replace>[0])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View style={[{ flex: 1 }, screenStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View style={[styles.headerWrap, headerStyle]}>
            <Text style={styles.headerTitle}>YOUR RESULTS</Text>
          </Animated.View>

          {/* Player name */}
          <Animated.View style={[styles.playerRow, playerStyle]}>
            <View style={[styles.playerDot, { backgroundColor: player?.color ?? colors.accent3 }]} />
            <Text style={[styles.playerName, { color: player?.color ?? colors.accent3 }]}>
              {player?.name ?? 'Player'}
            </Text>
          </Animated.View>

          {/* Game score rows */}
          <View style={styles.scoresBlock}>
            {results.map((r, i) => (
              <ScoreRow key={r.gameId} result={r} index={i} />
            ))}
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Animated.View style={[styles.divider, dividerStyle]} />
          </View>

          {/* Brain age */}
          <Animated.View style={[styles.baLabelWrap, baLabelStyle]}>
            <Text style={styles.baLabel}>YOUR BRAIN AGE</Text>
          </Animated.View>

          <Animated.View style={[styles.baWrap, baStyle]}>
            <Text style={[styles.baNum, { color: ageColor, textShadowColor: ageColor, textShadowRadius: 20 }]}>
              {baDisplayed}
            </Text>
          </Animated.View>

          {/* Personal best */}
          <Animated.View style={[styles.pbWrap, pbStyle]}>
            {isNewBest ? (
              <Animated.View style={[styles.newBestBadge, newBestStyle]}>
                <Text style={styles.newBestText}>🏆 NEW PERSONAL BEST!</Text>
              </Animated.View>
            ) : personalBest !== null ? (
              <Text style={styles.pbText}>
                Your best: <Text style={{ color: colors.accent3, fontWeight: '800' }}>{personalBest}</Text>
                {'  '}·  +{brainAge - personalBest} to beat it
              </Text>
            ) : (
              <Text style={styles.pbText}>First score! Come back tomorrow to beat it.</Text>
            )}
          </Animated.View>

          {/* Performance message */}
          <Animated.View style={[styles.perfWrap, perfStyle]}>
            <Text style={[styles.perfMsg, { color: ageColor }]}>{perfMsg}</Text>
          </Animated.View>

          {/* Streak notification */}
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

          {/* Buttons */}
          <Animated.View style={[styles.btnsWrap, btnsStyle]}>
            <Button label="Play Again"       onPress={handlePlayAgain} color={colors.accent3} size="md" fullWidth />
            <Button label="Try Quick Play"   onPress={handleQuickPlay} color={colors.amber}   size="md" fullWidth />
            <Button label="Home"             onPress={handleHome}      color={colors.muted}   size="md" fullWidth />
          </Animated.View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 40, gap: 16 },
  headerWrap: { alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: 3 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  playerDot: { width: 14, height: 14, borderRadius: 7 },
  playerName: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  scoresBlock: { gap: 8, marginTop: 8 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  srIcon: { fontSize: 20, fontWeight: '900' },
  srName: { fontSize: 14, fontWeight: '600', color: colors.text },
  srScore: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  dividerContainer: { height: 2, backgroundColor: colors.border, borderRadius: 1, overflow: 'hidden', marginVertical: 8 },
  divider: { height: '100%', backgroundColor: colors.accent3 },
  baLabelWrap: { alignItems: 'center' },
  baLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 2.5 },
  baWrap: { alignItems: 'center' },
  baNum: {
    fontSize: 110,
    fontWeight: '900',
    letterSpacing: -6,
    textShadowOffset: { width: 0, height: 0 },
  },
  pbWrap: { alignItems: 'center', minHeight: 36 },
  pbText: { fontSize: 13, color: colors.muted, fontWeight: '500', textAlign: 'center' },
  newBestBadge: {
    backgroundColor: colors.accent3 + '22',
    borderWidth: 1.5,
    borderColor: colors.accent3,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newBestText: { fontSize: 15, fontWeight: '900', color: colors.accent3, letterSpacing: 1 },
  perfWrap: { alignItems: 'center' },
  perfMsg: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  btnsWrap: { gap: 12, marginTop: 8 },
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
    alignSelf: 'center',
  },
  streakNotifIcon: { fontSize: 18 },
  streakNotifText: { fontSize: 12, color: colors.muted, flex: 1 },
})
