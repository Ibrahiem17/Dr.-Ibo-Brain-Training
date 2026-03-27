import { useEffect, useRef } from 'react'
import { View, Text, Pressable, Platform, AppState } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import { useNumberSequence } from './useNumberSequence'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

// ─── DigitSlot ────────────────────────────────────────────────────────────────

interface SlotProps {
  value: number | null
  isCorrect: boolean  // green tint on correct feedback
}

function DigitSlot({ value, isCorrect }: SlotProps) {
  const scale = useSharedValue(1)
  const prevValue = useRef<number | null>(null)

  useEffect(() => {
    if (value === null) {
      prevValue.current = null  // Reset so next entry always animates
    } else if (value !== prevValue.current) {
      prevValue.current = value
      scale.value = 0.8
      scale.value = withSpring(1.0, { damping: 12, stiffness: 250 })
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 44,
          height: 54,
          borderWidth: 2,
          borderColor: isCorrect ? colors.accent3 : value !== null ? colors.accent : colors.border,
          borderRadius: 8,
          backgroundColor: isCorrect ? 'rgba(170,255,0,0.12)' : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          margin: 3,
        },
      ]}
    >
      <Text style={{ color: isCorrect ? colors.accent3 : colors.text, fontSize: 22, fontWeight: '800' }}>
        {value !== null ? value : ''}
      </Text>
    </Animated.View>
  )
}

// ─── FlashDigit ───────────────────────────────────────────────────────────────

interface FlashDigitProps {
  digit: number | null
}

function FlashDigit({ digit }: FlashDigitProps) {
  const scale = useSharedValue(0.3)
  const opacity = useSharedValue(0)
  const prevDigit = useRef<number | null>(null)

  useEffect(() => {
    if (digit !== null) {
      prevDigit.current = digit
      scale.value = withSpring(1.0, { damping: 10, stiffness: 200 })
      opacity.value = withTiming(1, { duration: 80 })
    } else {
      opacity.value = withTiming(0, { duration: 150 })
      scale.value = withTiming(0.3, { duration: 150 })
    }
  }, [digit]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.Text
      style={[
        animStyle,
        {
          fontSize: 96,
          fontWeight: '900',
          color: colors.amber,
          letterSpacing: -4,
          textAlign: 'center',
        },
      ]}
    >
      {digit !== null ? digit : prevDigit.current ?? ''}
    </Animated.Text>
  )
}

// ─── NumPadButton ─────────────────────────────────────────────────────────────

interface NumPadButtonProps {
  digit: number
  onPress: () => void
  disabled: boolean
}

function NumPadButton({ digit, onPress, disabled }: NumPadButtonProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={[animStyle, { margin: 5 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15 }) }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 15 }) }}
        onPress={disabled ? undefined : onPress}
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          borderWidth: 2,
          borderColor: disabled ? colors.muted : colors.accent,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text style={{ color: disabled ? colors.muted : colors.text, fontSize: 24, fontWeight: '700' }}>
          {digit}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

// ─── NumberSequence ───────────────────────────────────────────────────────────

export default function NumberSequence({ onGameComplete, endlessMode, endlessRound }: Props) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', () => {})
    return () => sub.remove()
  }, [])

  const {
    currentDisplayDigit,
    sequenceLength,
    slots,
    phase,
    round,
    totalRounds,
    score,
    feedback,
    isComplete,
    totalTimeMs,
    accuracy,
    pressDigit,
  } = useNumberSequence({ endlessMode, endlessRound })

  const slotsShakeX = useSharedValue(0)

  const slotsRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slotsShakeX.value }],
  }))

  // Digit beep during showing phase
  useEffect(() => {
    if (currentDisplayDigit !== null) playSound('countdownBeep', 0.4)
  }, [currentDisplayDigit]) // eslint-disable-line react-hooks/exhaustive-deps

  // Feedback effects
  useEffect(() => {
    if (feedback === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      playSound('correct', 0.8)
    } else if (feedback === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      playSound('wrong', 0.8)
      slotsShakeX.value = withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  // Game complete
  useEffect(() => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCorrectFeedback = feedback === 'correct'
  const isDisabled = phase === 'showing' || !!feedback

  // Number pad layout: rows 1-3 (1-9) + bottom row (0)
  const padRows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]

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

      {/* Slots row */}
      <View style={{ marginTop: 20 }}>
        <Animated.View
          style={[slotsRowStyle, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }]}
        >
          {slots.map((val, i) => (
            <DigitSlot key={i} value={val} isCorrect={isCorrectFeedback} />
          ))}
        </Animated.View>
      </View>

      {/* Instruction */}
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
        {phase === 'showing' ? 'Remember the sequence…' : 'Enter the sequence'}
      </Text>

      {/* Main content area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'showing' && (
          <FlashDigit digit={currentDisplayDigit} />
        )}

        {phase === 'input' && (
          <View style={{ alignItems: 'center', gap: 4 }}>
            {/* Feedback */}
            <View style={{ height: 22, justifyContent: 'center', marginBottom: 8 }}>
              {feedback === 'correct' && (
                <Text style={{ color: colors.accent3, fontSize: 15, fontWeight: '700' }}>Correct!</Text>
              )}
              {feedback === 'wrong' && (
                <Text style={{ color: colors.accent2, fontSize: 15, fontWeight: '700' }}>Wrong!</Text>
              )}
            </View>

            {/* 3×3 pad */}
            {padRows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row' }}>
                {row.map((digit) => (
                  <NumPadButton
                    key={digit}
                    digit={digit}
                    onPress={() => pressDigit(digit)}
                    disabled={isDisabled}
                  />
                ))}
              </View>
            ))}

            {/* 0 below center */}
            <NumPadButton digit={0} onPress={() => pressDigit(0)} disabled={isDisabled} />
          </View>
        )}
      </View>

      {/* Score */}
      <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', paddingBottom: 40 }}>
        Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </View>
  )
}
