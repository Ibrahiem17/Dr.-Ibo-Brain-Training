import { useState, useEffect } from 'react'
import { View, Text, Platform, AppState } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../../constants/colors'
import { playSound } from '../../../utils/sounds'
import { TARGET_COLOR } from './useExplodingCube'
import ProgressBar from '../../ui/ProgressBar'
import TimerBar from '../../ui/TimerBar'
import Button from '../../ui/Button'
import CubeScene from './CubeScene'
import { useExplodingCube } from './useExplodingCube'

interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

export default function ExplodingCube({ onGameComplete, endlessMode, endlessRound }: Props) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setPaused(state !== 'active')
    })
    return () => sub.remove()
  }, [])

  const {
    round,
    totalRounds,
    phase,
    cubelets,
    feedback,
    isComplete,
    totalTimeMs,
    score,
    accuracy,
    studyDuration,
    targetCount,
    selectedCount,
    onStudyEnd,
    onExplosionComplete,
    selectCubelet,
    confirmAnswer,
  } = useExplodingCube({ endlessMode, endlessRound })

  // Explosion thud
  useEffect(() => {
    if (phase === 'exploding') playSound('wrong', 0.5)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Haptics + sounds
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

  // Study countdown bar animation
  const studyBarProgress = useSharedValue(1)
  useEffect(() => {
    if (phase === 'study') {
      studyBarProgress.value = 1
      studyBarProgress.value = withTiming(0, { duration: studyDuration })
    }
  }, [phase, round]) // eslint-disable-line react-hooks/exhaustive-deps

  const studyBarStyle = useAnimatedStyle(() => ({
    width: `${studyBarProgress.value * 100}%`,
  }))

  const instruction = (() => {
    if (phase === 'study') return `Memorise the PINK cubelets — they will turn white!`
    if (phase === 'exploding') return 'Watch where they scatter...'
    if (phase === 'settling') return 'Get ready...'
    if (phase === 'selecting') return `Tap the ${targetCount} cubelets that were pink`
    if (phase === 'feedback') return feedback === 'correct' ? 'CORRECT!' : 'WRONG!'
    return ''
  })()

  const instructionColor = (() => {
    if (phase === 'feedback') return feedback === 'correct' ? colors.accent3 : colors.accent2
    if (phase === 'study') return TARGET_COLOR
    return colors.muted
  })()

  const canConfirm = phase === 'selecting' && selectedCount === targetCount

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

      {/* Study countdown bar */}
      <View style={{ marginTop: 14, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        {phase === 'study' && (
          <Animated.View
            style={[
              studyBarStyle,
              { height: '100%', backgroundColor: TARGET_COLOR, borderRadius: 3 },
            ]}
          />
        )}
      </View>

      {/* Study timer (hidden bar drives the logic) */}
      <View style={{ height: 0, overflow: 'hidden' }}>
        {phase === 'study' && (
          <TimerBar
            key={`${round}-study`}
            duration={studyDuration / 1000}
            onExpire={onStudyEnd}
            running={!paused}
            color={TARGET_COLOR}
          />
        )}
      </View>

      {/* Instruction */}
      <Text
        style={{
          color: instructionColor,
          fontSize: 13,
          textAlign: 'center',
          marginTop: 10,
          letterSpacing: 0.8,
          fontWeight: '700',
          minHeight: 18,
        }}
      >
        {instruction}
      </Text>

      {/* Cube canvas — remounts each round */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <CubeScene
          key={round}
          cubelets={cubelets}
          phase={phase}
          onExplosionComplete={onExplosionComplete}
          onSelectCubelet={selectCubelet}
        />
      </View>

      {/* CONFIRM button — appears when exactly targetCount selected */}
      <View style={{ paddingHorizontal: 0, paddingBottom: 12, minHeight: 56 }}>
        {canConfirm && (
          <Button
            label={`CONFIRM (${selectedCount}/${targetCount})`}
            onPress={confirmAnswer}
            color={colors.accent3}
            size="lg"
            fullWidth
          />
        )}
      </View>

      {/* Score */}
      <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', paddingBottom: 32 }}>
        Score: <Text style={{ color: colors.text, fontWeight: '700' }}>{score}</Text>
      </Text>
    </View>
  )
}
