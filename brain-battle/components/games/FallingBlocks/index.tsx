import { useEffect } from 'react'
import { View, Text, Pressable, Platform, Dimensions, AppState } from 'react-native'
import { MotiView } from 'moti'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import BlockCanvas from './BlockCanvas'
import { useFallingBlocks } from './useFallingBlocks'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// ─── AnswerButton ─────────────────────────────────────────────────────────────

interface AnswerButtonProps {
  label: string
  onPress: () => void
  disabled: boolean
  isCorrect: boolean
  isSelected: boolean
}

function AnswerButton({ label, onPress, disabled, isCorrect, isSelected }: AnswerButtonProps) {
  let borderColor = colors.accent
  let bg = 'rgba(0,229,255,0.08)'

  if (disabled) {
    if (isCorrect) { borderColor = colors.accent3; bg = 'rgba(170,255,0,0.18)' }
    else if (isSelected) { borderColor = colors.accent2; bg = 'rgba(255,45,107,0.12)' }
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        flex: 1,
        marginHorizontal: 6,
        minHeight: 60,
        borderWidth: 2,
        borderRadius: 12,
        borderColor,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled && !isCorrect && !isSelected ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: isCorrect && disabled ? colors.accent3 : colors.text, fontSize: 20, fontWeight: '800' }}>
        {label}
      </Text>
    </Pressable>
  )
}

// ─── FallingBlocks ────────────────────────────────────────────────────────────

export default function FallingBlocks({ onGameComplete, endlessMode, endlessRound }: Props) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', () => {})
    return () => sub.remove()
  }, [])

  const {
    blocks,
    phase,
    round,
    totalRounds,
    questions,
    currentQuestionIndex,
    feedback,
    score,
    isComplete,
    totalTimeMs,
    accuracy,
    onFallingComplete,
    submitAnswer,
  } = useFallingBlocks(SCREEN_W, { endlessMode, endlessRound })

  useEffect(() => {
    if (feedback === 'correct') { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playSound('correct', 0.8) }
    else if (feedback === 'wrong') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); playSound('wrong', 0.8) }
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = questions[currentQuestionIndex]

  // Layout rows for MCQ: try 2 per row, or all in one row if ≤ 2 options
  const choices = currentQuestion?.options ?? []
  const rows: string[][] =
    choices.length <= 2
      ? [choices]
      : [choices.slice(0, 2), choices.slice(2, 4)]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Falling phase ─────────────────────────────────────────────────── */}
      {phase === 'falling' && (
        <>
          {/* Full-screen Skia canvas — absolutely positioned */}
          <BlockCanvas
            blocks={blocks}
            screenHeight={SCREEN_H}
            onComplete={onFallingComplete}
          />

          {/* HUD overlay at top */}
          <View
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 40,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
              ROUND {round} / {totalRounds}
            </Text>
            <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>
              WATCH CAREFULLY!
            </Text>
          </View>
        </>
      )}

      {/* ── Questions phase ───────────────────────────────────────────────── */}
      {phase === 'questions' && currentQuestion && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
          }}
        >
          {/* Round indicator */}
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1 }}>
            ROUND {round} / {totalRounds}
          </Text>
          <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />

          {/* Question counter */}
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12, letterSpacing: 1 }}>
            QUESTION {currentQuestionIndex + 1} / {questions.length}
          </Text>

          {/* Question text */}
          <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: 0.3,
                lineHeight: 28,
              }}
            >
              {currentQuestion.text}
            </Text>

            {/* Feedback line */}
            <View style={{ height: 26, alignItems: 'center', justifyContent: 'center' }}>
              {feedback === 'correct' && (
                <Text style={{ color: colors.accent3, fontSize: 15, fontWeight: '700' }}>Correct!</Text>
              )}
              {feedback === 'wrong' && (
                <Text style={{ color: colors.accent2, fontSize: 15, fontWeight: '700' }}>
                  Wrong! It was {currentQuestion.answer}
                </Text>
              )}
            </View>

            {/* Answer buttons */}
            <View style={{ gap: 10 }}>
              {rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row' }}>
                  {row.map(ch => (
                    <AnswerButton
                      key={ch}
                      label={ch}
                      onPress={() => submitAnswer(ch)}
                      disabled={feedback !== null}
                      isCorrect={feedback !== null && ch === currentQuestion.answer}
                      isSelected={false}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Score */}
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', paddingBottom: 40 }}>
            Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
          </Text>
        </MotiView>
      )}
    </View>
  )
}
