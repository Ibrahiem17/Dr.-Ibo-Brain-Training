import { useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated'
import { useSoloStore } from '../../store/soloStore'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import Button from '../../components/ui/Button'
import { useQuitGame } from '../../hooks/useQuitGame'

const GAME_COLOR: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

const GAME_DESC: Record<string, string> = {
  'mental-math':     'Solve fast',
  'grid-memory':     'Count the lit balls',
  'stroop-test':     'Name the ink colour',
  'number-sequence': 'Repeat the digits',
  'falling-blocks':  'Watch & count',
  'exploding-cube':  'Find the pieces',
  'flag-direction':  'Copy the sequence',
}

function scoreFeedback(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'GREAT!', color: colors.accent3 }
  if (score >= 50) return { label: 'GOOD', color: colors.accent }
  return { label: 'KEEP GOING', color: colors.amber }
}

function ProgressDots({ completedCount, totalCount, justCompletedIndex }: {
  completedCount: number
  totalCount: number
  justCompletedIndex: number
}) {
  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false,
    )
    return () => cancelAnimation(pulse)
  }, [])
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  return (
    <View style={dotStyles.row}>
      {Array.from({ length: totalCount }, (_, i) => {
        const isCompleted = i < completedCount
        const isJust = i === justCompletedIndex
        const gameColor = GAME_COLOR[GAMES[i].id] ?? colors.accent

        if (isJust) {
          return (
            <Animated.View
              key={i}
              style={[
                dotStyles.dot,
                dotStyles.dotLarge,
                { backgroundColor: gameColor },
                pulseStyle,
              ]}
            />
          )
        }
        return (
          <View
            key={i}
            style={[
              dotStyles.dot,
              isCompleted
                ? { backgroundColor: gameColor }
                : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
            ]}
          />
        )
      })}
    </View>
  )
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLarge: { width: 14, height: 14, borderRadius: 7 },
})

export default function SoloBetween() {
  const { currentGameIndex, results, startNextGame } = useSoloStore()
  const { handleConfirmQuit } = useQuitGame('solo')

  // currentGameIndex has been incremented — last completed is at index currentGameIndex - 1
  const lastResult  = results[results.length - 1]
  const lastGame    = GAMES[currentGameIndex - 1]
  const nextGame    = GAMES[currentGameIndex]
  const lastColor   = lastGame ? (GAME_COLOR[lastGame.id] ?? colors.accent) : colors.accent
  const nextColor   = nextGame ? (GAME_COLOR[nextGame.id] ?? colors.accent) : colors.accent

  // Slide in animation
  const translateY = useSharedValue(40)
  const opacity    = useSharedValue(0)
  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 160 })
    opacity.value    = withTiming(1, { duration: 350 })
  }, [])
  const containerStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  // Pulse on NEXT GAME button
  const btnScale = useSharedValue(1)
  useEffect(() => {
    btnScale.value = withRepeat(
      withSequence(withTiming(1.02, { duration: 800 }), withTiming(1.0, { duration: 800 })),
      -1,
      false,
    )
    return () => cancelAnimation(btnScale)
  }, [])
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const handleNext = () => {
    startNextGame()
    router.replace('/solo/countdown')
  }

  if (!lastGame || !nextGame || !lastResult) {
    return null
  }

  const fb = scoreFeedback(lastResult.score)

  return (
    <Animated.View style={[{ backgroundColor: colors.bg }, containerStyle]}>
      {/* Last game result */}
      <View style={styles.lastSection}>
        <Text style={[styles.lastIcon, { color: lastColor }]}>{lastGame.icon}</Text>
        <Text style={styles.lastGameName}>{lastGame.label}</Text>

        <View style={[styles.scoreBadge, { borderColor: lastColor }]}>
          <Text style={[styles.scoreNum, { color: lastColor }]}>{lastResult.score}</Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>

        <Text style={[styles.feedbackLabel, { color: fb.color }]}>{fb.label}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.progressSection}>
        <ProgressDots
          completedCount={currentGameIndex}
          totalCount={7}
          justCompletedIndex={currentGameIndex - 1}
        />
        <Text style={styles.progressText}>
          Game {currentGameIndex} of 7 complete
        </Text>
      </View>

      {/* Next game */}
      <View style={[styles.nextSection, { borderColor: nextColor }]}>
        <Text style={styles.upNextLabel}>UP NEXT</Text>
        <View style={styles.nextRow}>
          <Text style={[styles.nextIcon, { color: nextColor }]}>{nextGame.icon}</Text>
          <View style={styles.nextInfo}>
            <Text style={styles.nextName}>{nextGame.label}</Text>
            <Text style={styles.nextDesc}>{GAME_DESC[nextGame.id] ?? ''}</Text>
          </View>
        </View>
      </View>

      {/* Button */}
      <Animated.View style={[styles.btnWrap, btnStyle]}>
        <Button
          label="NEXT GAME"
          onPress={handleNext}
          color={nextColor}
          size="lg"
          fullWidth
        />
      </Animated.View>
      <Pressable onPress={handleConfirmQuit} style={styles.quitLink}>
        <Text style={styles.quitLinkText}>Quit to Home</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  lastSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 60,
  },
  lastIcon: { fontSize: 56, fontWeight: '900' },
  lastGameName: { fontSize: 14, color: colors.muted, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  scoreBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 2,
  },
  scoreNum: { fontSize: 40, fontWeight: '900', letterSpacing: -2 },
  scoreLabel: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 2 },
  feedbackLabel: { fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  progressSection: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  progressText: { fontSize: 12, color: colors.muted, fontWeight: '600', letterSpacing: 0.5 },
  nextSection: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  upNextLabel: { fontSize: 10, color: colors.muted, fontWeight: '800', letterSpacing: 2.5 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextIcon: { fontSize: 36, fontWeight: '900' },
  nextInfo: { flex: 1, gap: 3 },
  nextName: { fontSize: 18, fontWeight: '700', color: colors.text },
  nextDesc: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  btnWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  quitLink: { alignSelf: 'center', padding: 8, paddingBottom: 28 },
  quitLinkText: { fontSize: 13, color: colors.muted, fontWeight: '600', textDecorationLine: 'underline' },
})
