import { useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors } from '../../../constants/colors'
import { useReactionTap } from './useReactionTap'

const GAME_COLOR = '#f43f5e'

type Props = {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

export default function ReactionTap({ onGameComplete, endlessMode, endlessRound }: Props) {
  const { phase, round, totalRounds, lastReactionMs, isEarlyTap, score, isComplete, totalTimeMs, accuracy, handleTap } =
    useReactionTap({ endlessMode, endlessRound })

  const calledRef = useRef(false)
  useEffect(() => {
    if (isComplete && !calledRef.current) {
      calledRef.current = true
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const onTap = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 })
    })
    handleTap()
  }

  const isReady = phase === 'ready'
  const btnColor = isReady ? GAME_COLOR : colors.border
  const btnBg = isReady ? `${GAME_COLOR}22` : colors.surface

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundLabel}>
          ROUND {round} / {totalRounds}
        </Text>
        <Text style={styles.gameTitle}>REACTION TAP</Text>
      </View>

      <View style={styles.body}>
        {phase === 'result' && (
          <View style={styles.feedbackWrap}>
            {isEarlyTap ? (
              <Text style={styles.earlyText}>TOO EARLY!</Text>
            ) : (
              <>
                <Text style={[styles.reactionMs, { color: GAME_COLOR }]}>{lastReactionMs} ms</Text>
                <Text style={styles.reactionLabel}>
                  {(lastReactionMs ?? 999) <= 300 ? 'LIGHTNING!' : (lastReactionMs ?? 999) <= 500 ? 'FAST!' : (lastReactionMs ?? 999) <= 700 ? 'GOOD' : 'SLOW'}
                </Text>
              </>
            )}
          </View>
        )}

        {phase !== 'complete' && (
          <Animated.View style={animStyle}>
            <Pressable
              onPress={onTap}
              style={[styles.tapBtn, { borderColor: btnColor, backgroundColor: btnBg }]}
            >
              <Text style={[styles.tapLabel, { color: isReady ? GAME_COLOR : colors.muted }]}>
                {phase === 'waiting' ? 'WAIT...' : phase === 'ready' ? 'TAP!' : '...'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === 'waiting' && (
          <Text style={styles.hint}>Tap as fast as possible when you see TAP!</Text>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    gap: 4,
  },
  roundLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 2 },
  gameTitle: { fontSize: 20, fontWeight: '900', color: GAME_COLOR, letterSpacing: 2 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 40,
  },
  feedbackWrap: { alignItems: 'center', gap: 4, minHeight: 60 },
  earlyText: { fontSize: 26, fontWeight: '900', color: colors.accent2, letterSpacing: 2 },
  reactionMs: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  reactionLabel: { fontSize: 14, fontWeight: '700', color: colors.muted, letterSpacing: 2 },
  tapBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapLabel: { fontSize: 30, fontWeight: '900', letterSpacing: 3 },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center', fontWeight: '500', lineHeight: 20 },
})
