import { useEffect } from 'react'
import { View, Text, Platform, AppState, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import Svg, { Circle, Line } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import ProgressBar from '../../ui/ProgressBar'
import DirectionPad from './DirectionPad'
import { useFlagDirection, DIRECTION_ANGLES, DIRECTION_DISPLAY } from './useFlagDirection'
import type { Direction } from './useFlagDirection'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

// ─── StickFigure ──────────────────────────────────────────────────────────────

const SVG_W = 200
const SVG_H = 200
const CX = SVG_W / 2        // 100
const HEAD_R = 20
const SHOULDER_Y = HEAD_R * 2 + 10  // 50
const BODY_BOTTOM_Y = SHOULDER_Y + 55
const ARM_LEN = 58
const ARM_H = 5

interface StickFigureProps {
  armAngleDeg: number
}

function StickFigure({ armAngleDeg }: StickFigureProps) {
  const armAngle = useSharedValue(armAngleDeg)

  useEffect(() => {
    // Shortest angular path
    const diff = ((armAngleDeg - armAngle.value + 540) % 360) - 180
    armAngle.value = withSpring(armAngle.value + diff, { damping: 12, stiffness: 180 })
  }, [armAngleDeg]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => cancelAnimation(armAngle), []) // eslint-disable-line react-hooks/exhaustive-deps

  const armStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(ARM_LEN / 2) },
      { rotate: `${armAngle.value}deg` },
      { translateX: ARM_LEN / 2 },
    ],
  }))

  return (
    <View style={{ width: SVG_W, height: SVG_H, alignItems: 'center' }}>
      <Svg width={SVG_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Head */}
        <Circle cx={CX} cy={HEAD_R + 4} r={HEAD_R} stroke={colors.accent} strokeWidth={2.5} fill="none" />
        {/* Body */}
        <Line x1={CX} y1={SHOULDER_Y} x2={CX} y2={BODY_BOTTOM_Y} stroke={colors.text} strokeWidth={2.5} />
        {/* Left arm (static — pointing down-left) */}
        <Line x1={CX} y1={SHOULDER_Y} x2={CX - ARM_LEN * 0.7} y2={SHOULDER_Y + ARM_LEN * 0.7} stroke={colors.text} strokeWidth={2.5} />
        {/* Left leg */}
        <Line x1={CX} y1={BODY_BOTTOM_Y} x2={CX - 22} y2={BODY_BOTTOM_Y + 42} stroke={colors.text} strokeWidth={2.5} />
        {/* Right leg */}
        <Line x1={CX} y1={BODY_BOTTOM_Y} x2={CX + 22} y2={BODY_BOTTOM_Y + 42} stroke={colors.text} strokeWidth={2.5} />
      </Svg>

      {/* Animated right arm — rotates around shoulder */}
      <Animated.View
        style={[
          armStyle,
          {
            position: 'absolute',
            left: CX,
            top: SHOULDER_Y - ARM_H / 2,
            width: ARM_LEN,
            height: ARM_H,
            backgroundColor: colors.accent2,
            borderRadius: ARM_H / 2,
          },
        ]}
      >
        {/* Flag at tip */}
        <View
          style={{
            position: 'absolute',
            right: -2,
            top: -(12 - ARM_H) / 2,
            width: 10,
            height: 14,
            backgroundColor: colors.amber,
            borderRadius: 2,
          }}
        />
      </Animated.View>
    </View>
  )
}

// ─── FlagDirection ────────────────────────────────────────────────────────────

function getArmAngle(dir: Direction | null): number {
  if (dir === null) return 90  // rest — arm pointing down
  return DIRECTION_ANGLES[dir]
}

export default function FlagDirection({ onGameComplete, endlessMode, endlessRound }: Props) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', () => {})
    return () => sub.remove()
  }, [])

  const {
    round,
    totalRounds,
    phase,
    sequence,
    displayDirection,
    playerInput,
    feedback,
    isComplete,
    totalTimeMs,
    score,
    accuracy,
    tapDirection,
  } = useFlagDirection({ endlessMode, endlessRound })

  // Direction beep during showing phase
  useEffect(() => {
    if (displayDirection) playSound('countdownBeep', 0.4)
  }, [displayDirection]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Arm follows display direction during showing, last tap during inputting
  const activeDir: Direction | null = (() => {
    if (phase === 'showing') return displayDirection
    if (phase === 'inputting' && playerInput.length > 0) return playerInput[playerInput.length - 1]
    return null
  })()

  const armAngle = getArmAngle(activeDir)

  // Large direction arrow animation
  const arrowScale = useSharedValue(0.6)
  const arrowOpacity = useSharedValue(0)

  useEffect(() => {
    if (displayDirection) {
      arrowScale.value = withSpring(1.0, { damping: 12, stiffness: 200 })
      arrowOpacity.value = withTiming(1, { duration: 150 })
    } else {
      arrowOpacity.value = withTiming(0, { duration: 180 })
    }
  }, [displayDirection]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    cancelAnimation(arrowScale)
    cancelAnimation(arrowOpacity)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const arrowDisplayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: arrowScale.value }],
    opacity: arrowOpacity.value,
  }))

  const instructionText = (() => {
    if (phase === 'showing') return 'WATCH THE SEQUENCE'
    if (phase === 'inputting') return 'NOW REPEAT'
    if (phase === 'feedback') return feedback === 'correct' ? '✓ PERFECT!' : 'WRONG — SEE CORRECT:'
    return ''
  })()

  const instructionColor = (() => {
    if (phase === 'feedback') return feedback === 'correct' ? colors.accent3 : colors.accent2
    return colors.muted
  })()

  const lastPressed = playerInput.length > 0 ? playerInput[playerInput.length - 1] : null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        alignItems: 'center',
      }}
      scrollEnabled={false}
    >
      {/* Round indicator */}
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, letterSpacing: 1, alignSelf: 'stretch' }}>
        ROUND {round} / {totalRounds}
      </Text>
      <View style={{ alignSelf: 'stretch', marginBottom: 4 }}>
        <ProgressBar current={round - 1} total={totalRounds} color={colors.accent} />
      </View>

      {/* Sequence dots — during 'showing' */}
      {phase === 'showing' && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 }}>
          {sequence.map((_, i) => {
            const shown = displayDirection !== null
              ? sequence.indexOf(displayDirection) > i
              : false
            const isCurrent = displayDirection !== null && sequence.indexOf(displayDirection) === i
            return (
              <View
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: (shown || isCurrent) ? colors.accent : 'transparent',
                  borderWidth: 1.5,
                  borderColor: (shown || isCurrent) ? colors.accent : colors.border,
                }}
              />
            )
          })}
        </View>
      )}

      {/* Input slots — during 'inputting' and 'feedback' */}
      {(phase === 'inputting' || phase === 'feedback') && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 }}>
          {sequence.map((_, i) => {
            const entered = playerInput[i]
            return (
              <View
                key={i}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: entered
                    ? (feedback === 'correct' ? colors.accent3 : feedback === 'wrong' ? colors.accent2 : colors.amber)
                    : colors.border,
                  backgroundColor: entered ? 'rgba(255,159,0,0.1)' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {entered ? (
                  <Text style={{ fontSize: 22, color: colors.text }}>{DIRECTION_DISPLAY[entered].arrow}</Text>
                ) : null}
              </View>
            )
          })}
        </View>
      )}

      {/* Instruction */}
      <Text
        style={{
          color: instructionColor,
          fontSize: 13,
          textAlign: 'center',
          marginTop: 8,
          letterSpacing: 1,
          fontWeight: '700',
          minHeight: 18,
        }}
      >
        {instructionText}
      </Text>

      {/* Correct sequence shown on wrong feedback */}
      {phase === 'feedback' && feedback === 'wrong' && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {sequence.map((dir, i) => (
            <Text key={i} style={{ fontSize: 24, color: colors.accent }}>
              {DIRECTION_DISPLAY[dir].arrow}
            </Text>
          ))}
        </View>
      )}

      {/* Stick figure */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <StickFigure armAngleDeg={armAngle} />
      </View>

      {/* Large direction arrow — during 'showing' */}
      {phase === 'showing' && (
        <Animated.View style={[arrowDisplayStyle, { alignItems: 'center', marginTop: 4, minHeight: 100 }]}>
          <Text style={{ fontSize: 72, color: colors.text, lineHeight: 80 }}>
            {displayDirection ? DIRECTION_DISPLAY[displayDirection].arrow : ' '}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, letterSpacing: 2, fontWeight: '700' }}>
            {displayDirection ? DIRECTION_DISPLAY[displayDirection].label : ' '}
          </Text>
        </Animated.View>
      )}

      {/* Spacer when not showing */}
      {phase !== 'showing' && <View style={{ height: 100 }} />}

      {/* Direction pad — during 'inputting' */}
      {phase === 'inputting' && (
        <View style={{ marginTop: 16 }}>
          <DirectionPad
            onPress={tapDirection}
            disabled={false}
            lastPressed={lastPressed}
          />
        </View>
      )}

      {/* Score */}
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
        Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </ScrollView>
  )
}
