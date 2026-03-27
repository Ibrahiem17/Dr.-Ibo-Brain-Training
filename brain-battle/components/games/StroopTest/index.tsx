import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, Platform, AppState } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import TimerBar from '../../ui/TimerBar'
import { useStroopTest } from './useStroopTest'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

// Hex color → rgba at given opacity
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Color name → hex lookup
const COLOR_HEX: Record<string, string> = {
  RED:    '#ff2d6b',
  BLUE:   '#00e5ff',
  GREEN:  '#aaff00',
  ORANGE: '#ff9f00',
  PURPLE: '#c084fc',
}

// ─── WordDisplay ──────────────────────────────────────────────────────────────
// Re-mounts each round (key={round}) to trigger entry animation

interface WordDisplayProps {
  word: string
  inkColor: string
  shakeX: SharedValue<number>
}

function WordDisplay({ word, inkColor, shakeX }: WordDisplayProps) {
  const scale = useSharedValue(0.5)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(1.0, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 200 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const wordStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.Text
      style={[
        wordStyle,
        {
          fontSize: 52,
          fontWeight: '900',
          color: inkColor,
          letterSpacing: 3,
          textAlign: 'center',
        },
      ]}
    >
      {word}
    </Animated.Text>
  )
}

// ─── OptionButton ─────────────────────────────────────────────────────────────

interface OptionButtonProps {
  name: string
  onPress: () => void
  disabled: boolean
  flashState: 'correct' | 'wrong' | null  // for wrong-answer highlight
}

function OptionButton({ name, onPress, disabled, flashState }: OptionButtonProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    if (flashState === 'correct') {
      scale.value = withSequence(withSpring(1.08), withSpring(1.0))
    } else if (flashState === 'wrong') {
      scale.value = withSequence(
        withSpring(0.92, { damping: 8 }),
        withSpring(1.0),
      )
    }
  }, [flashState]) // eslint-disable-line react-hooks/exhaustive-deps

  const hex = COLOR_HEX[name] ?? colors.accent
  const borderColor = flashState === 'correct' ? colors.accent3 : hex
  const bgColor = flashState === 'correct'
    ? hexToRgba(colors.accent3, 0.25)
    : hexToRgba(hex, 0.2)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={[animStyle, { flex: 1, margin: 6 }]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={{
          minHeight: 64,
          borderWidth: 2,
          borderColor,
          borderRadius: 12,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ color: hex, fontSize: 15, fontWeight: '800', letterSpacing: 1.5 }}>
          {name}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

// ─── StroopTest ───────────────────────────────────────────────────────────────

export default function StroopTest({ onGameComplete, endlessMode, endlessRound }: Props) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setPaused(state !== 'active')
    })
    return () => sub.remove()
  }, [])

  const {
    word,
    inkColor,
    correctAnswer,
    options,
    round,
    totalRounds,
    roundDuration,
    score,
    feedback,
    isComplete,
    totalTimeMs,
    accuracy,
    selectAnswer,
    timerExpired,
  } = useStroopTest({ endlessMode, endlessRound })

  const shakeX = useSharedValue(0)

  // Track which button was tapped for per-button flash
  const selectedRef = useRef<string | null>(null)

  // Feedback effects
  useEffect(() => {
    if (feedback === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      playSound('correct', 0.8)
    } else if (feedback === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      playSound('wrong', 0.8)
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
    if (feedback === null) {
      selectedRef.current = null
    }
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  // Game complete
  useEffect(() => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (name: string) => {
    selectedRef.current = name
    selectAnswer(name)
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
      }}
    >
      {/* Round indicator */}
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
        ROUND {round} / {totalRounds}
      </Text>
      <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />

      {/* Timer — remount each round */}
      <View style={{ marginTop: 14 }}>
        <TimerBar
          key={round}
          duration={roundDuration}
          onExpire={timerExpired}
          running={!paused && feedback === null}
          color={colors.accent}
        />
      </View>

      {/* Word — re-mounts each round for entry animation */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <WordDisplay key={round} word={word} inkColor={inkColor} shakeX={shakeX} />

        <Text style={{ color: colors.muted, fontSize: 13, letterSpacing: 1, marginTop: 4 }}>
          TAP THE INK COLOUR
        </Text>

        {/* Feedback line */}
        <View style={{ height: 22, justifyContent: 'center' }}>
          {feedback === 'correct' && (
            <Text style={{ color: colors.accent3, fontSize: 15, fontWeight: '700' }}>Correct!</Text>
          )}
          {feedback === 'wrong' && (
            <Text style={{ color: colors.accent2, fontSize: 15, fontWeight: '700' }}>
              Wrong! It was {correctAnswer}
            </Text>
          )}
        </View>

        {/* 2×2 option grid */}
        <View style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row' }}>
            {options.slice(0, 2).map((name) => (
              <OptionButton
                key={name}
                name={name}
                onPress={() => handleSelect(name)}
                disabled={!!feedback}
                flashState={
                  feedback !== null && name === correctAnswer
                    ? 'correct'
                    : feedback === 'wrong' && name === selectedRef.current
                    ? 'wrong'
                    : null
                }
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {options.slice(2, 4).map((name) => (
              <OptionButton
                key={name}
                name={name}
                onPress={() => handleSelect(name)}
                disabled={!!feedback}
                flashState={
                  feedback !== null && name === correctAnswer
                    ? 'correct'
                    : feedback === 'wrong' && name === selectedRef.current
                    ? 'wrong'
                    : null
                }
              />
            ))}
          </View>
        </View>
      </View>

      {/* Score */}
      <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', paddingBottom: 40 }}>
        Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </View>
  )
}
