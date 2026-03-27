import { useState, useEffect } from 'react'
import { View, Text, Pressable, Platform, AppState } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import { useGridMemory, GridCell, GridMemoryFeedback } from './useGridMemory'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

const CELL_SIZE = 66
const CELL_GAP = 8
const NEUTRAL_COLOR = colors.muted

// ─── GridCellView ────────────────────────────────────────────────────────────

interface GridCellViewProps {
  cell: GridCell
}

function GridCellView({ cell }: GridCellViewProps) {
  const bg = useSharedValue(cell.color)

  useEffect(() => {
    if (cell.isNeutral) {
      bg.value = withDelay(cell.id * 30, withTiming(NEUTRAL_COLOR, { duration: 400 }))
    } else {
      // New round or reset — show color immediately
      bg.value = cell.color
    }
  }, [cell.isNeutral, cell.color]) // eslint-disable-line react-hooks/exhaustive-deps

  const cellStyle = useAnimatedStyle(() => ({
    backgroundColor: bg.value,
  }))

  return (
    <Animated.View
      style={[
        cellStyle,
        {
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: CELL_SIZE / 2,
          borderWidth: cell.isLit ? 3 : 0,
          borderColor: '#ffffff',
        },
      ]}
    />
  )
}

// ─── AnswerButton ─────────────────────────────────────────────────────────────

interface AnswerButtonProps {
  number: number
  onPress: () => void
  disabled: boolean
  pulseNow: boolean
}

function AnswerButton({ number, onPress, disabled, pulseNow }: AnswerButtonProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    if (pulseNow) {
      scale.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1.0, { damping: 8 }))
    }
  }, [pulseNow]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: disabled ? colors.muted : colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
          margin: 4,
        }}
      >
        <Text
          style={{
            color: disabled ? colors.muted : colors.accent,
            fontSize: 18,
            fontWeight: '700',
          }}
        >
          {number}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

// ─── GridMemory ───────────────────────────────────────────────────────────────

export default function GridMemory({ onGameComplete, endlessMode, endlessRound }: Props) {
  const { grid, phase, round, totalRounds, score, feedback, isComplete, totalTimeMs, accuracy, submitAnswer } =
    useGridMemory({ endlessMode, endlessRound })

  useEffect(() => {
    const sub = AppState.addEventListener('change', () => {})
    return () => sub.remove()
  }, [])

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // Shake on wrong
  const answerRowShakeX = useSharedValue(0)

  const answerRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: answerRowShakeX.value }],
  }))

  // Feedback effects
  useEffect(() => {
    if (feedback === 'correct') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      playSound('correct', 0.8)
    } else if (feedback === 'wrong') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      playSound('wrong', 0.8)
      answerRowShakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
    // Reset selection when feedback clears
    if (feedback === null) {
      setSelectedAnswer(null)
    }
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  // Game complete
  useEffect(() => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (n: number) => {
    setSelectedAnswer(n)
    submitAnswer(n)
  }

  const gridWidth = 4 * CELL_SIZE + 3 * CELL_GAP

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
      }}
    >
      {/* Round indicator */}
      <Text
        style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}
      >
        ROUND {round} / {totalRounds}
      </Text>
      <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />

      {/* Grid */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: gridWidth,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: CELL_GAP,
          }}
        >
          {grid.map((cell) => (
            <GridCellView key={cell.id} cell={cell} />
          ))}
        </View>

        {/* Recall phase UI */}
        {phase === 'recall' && (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
              How many balls were lit?
            </Text>

            {/* Feedback line */}
            <View style={{ height: 22, justifyContent: 'center' }}>
              {feedback === 'correct' && (
                <Text style={{ color: colors.accent3, fontSize: 15, fontWeight: '700' }}>Correct!</Text>
              )}
              {feedback === 'wrong' && (
                <Text style={{ color: colors.accent2, fontSize: 15, fontWeight: '700' }}>Wrong!</Text>
              )}
            </View>

            {/* Answer buttons 1-10 in two rows of 5 */}
            <Animated.View
              style={[answerRowStyle, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }]}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <AnswerButton
                  key={n}
                  number={n}
                  onPress={() => handleAnswer(n)}
                  disabled={!!feedback}
                  pulseNow={selectedAnswer === n && feedback === 'correct'}
                />
              ))}
            </Animated.View>
          </View>
        )}

        {/* Showing phase hint */}
        {phase === 'showing' && (
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center' }}>
            Remember the lit balls…
          </Text>
        )}
      </View>

      {/* Score */}
      <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', paddingBottom: 40 }}>
        Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </View>
  )
}
