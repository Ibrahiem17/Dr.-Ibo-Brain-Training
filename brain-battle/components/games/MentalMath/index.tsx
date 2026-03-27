import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, Keyboard, Platform, AppState } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import TimerBar from '../../ui/TimerBar'
import Button from '../../ui/Button'
import { useMentalMath } from './useMentalMath'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

export default function MentalMath({ onGameComplete, endlessMode, endlessRound }: Props) {
  const [input, setInput] = useState('')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setPaused(state !== 'active')
    })
    return () => sub.remove()
  }, [])

  const {
    question,
    correctAnswer,
    round,
    totalRounds,
    roundDuration,
    score,
    feedback,
    isComplete,
    totalTimeMs,
    accuracy,
    submitAnswer,
    timerExpired,
  } = useMentalMath({ endlessMode, endlessRound })

  // Animations
  const questionScale = useSharedValue(1)
  const shakeX = useSharedValue(0)
  const borderAnim = useSharedValue(0)

  // Track previous question to detect changes
  const prevRoundRef = useRef(0)

  // Clear input on new round (covers timer-expiry path)
  useEffect(() => {
    setInput('')
  }, [round])

  // Pop animation on new question
  useEffect(() => {
    if (round !== prevRoundRef.current) {
      prevRoundRef.current = round
      questionScale.value = 0.8
      questionScale.value = withSpring(1.0, { damping: 12, stiffness: 200 })
    }
  }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  // Feedback effects
  useEffect(() => {
    if (feedback === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      playSound('correct', 0.8)
      borderAnim.value = withTiming(1, { duration: 100 }, () => {
        borderAnim.value = withTiming(0, { duration: 500 })
      })
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
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  // Game complete
  useEffect(() => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const questionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: questionScale.value }],
  }))

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  }))

  const inputBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(borderAnim.value, [0, 1], [colors.border, colors.accent3]),
  }))

  const handleSubmit = () => {
    if (!input.trim() || feedback !== null) return
    Keyboard.dismiss()
    submitAnswer(input)
    setInput('')
  }

  return (
    <Animated.View style={containerStyle}>
      {/* Round indicator */}
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
        ROUND {round} / {totalRounds}
      </Text>
      <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />

      <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
        {/* Timer — remount each round to reset */}
        <TimerBar
          key={round}
          duration={roundDuration}
          onExpire={timerExpired}
          running={!paused && feedback === null}
          color={colors.accent}
        />

        {/* Question */}
        <Animated.Text
          style={[
            questionStyle,
            {
              fontSize: 48,
              fontWeight: '700',
              color: colors.accent,
              textAlign: 'center',
              marginVertical: 8,
            },
          ]}
        >
          {question}
        </Animated.Text>

        {/* Feedback — height always reserved */}
        <View style={{ height: 24, alignItems: 'center', justifyContent: 'center' }}>
          {feedback === 'correct' && (
            <Text style={{ color: colors.accent3, fontSize: 16, fontWeight: '700' }}>Correct!</Text>
          )}
          {feedback === 'wrong' && (
            <Text style={{ color: colors.accent2, fontSize: 16, fontWeight: '700' }}>
              Wrong, answer was {correctAnswer}
            </Text>
          )}
        </View>

        {/* Numeric input */}
        <Animated.View
          style={[
            inputBorderStyle,
            {
              borderWidth: 2,
              borderRadius: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <TextInput
            style={{
              color: colors.text,
              fontSize: 36,
              fontWeight: '700',
              textAlign: 'center',
              paddingVertical: 16,
            }}
            keyboardType="number-pad"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            editable={feedback === null}
            returnKeyType="done"
            placeholderTextColor={colors.muted}
            placeholder="?"
          />
        </Animated.View>

        {/* Submit */}
        <Button
          label="Submit"
          onPress={handleSubmit}
          disabled={!input.trim() || feedback !== null}
          color={colors.accent}
          fullWidth
          size="lg"
        />
      </View>

      {/* Score */}
      <Text
        style={{
          color: colors.muted,
          fontSize: 15,
          textAlign: 'center',
          paddingBottom: 40,
        }}
      >
        Score:{' '}
        <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </Animated.View>
  )
}
