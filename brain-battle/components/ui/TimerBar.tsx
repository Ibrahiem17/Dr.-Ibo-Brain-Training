import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated'
import { colors } from '../../constants/colors'

interface TimerBarProps {
  duration: number  // seconds
  onExpire: () => void
  color?: string
  running: boolean
}

export default function TimerBar({ duration, onExpire, color = colors.accent, running }: TimerBarProps) {
  const progress = useSharedValue(0)          // 0 = full, 1 = empty
  const containerWidth = useSharedValue(0)
  const expired = useSharedValue(false)

  useEffect(() => {
    if (running) {
      expired.value = false
      progress.value = withTiming(1, {
        duration: duration * 1000,
        easing: Easing.linear,
      })
    } else {
      cancelAnimation(progress)
    }
  }, [running])

  useEffect(() => () => cancelAnimation(progress), [])

  useAnimatedReaction(
    () => progress.value,
    (val) => {
      if (val >= 0.9999 && !expired.value) {
        expired.value = true
        runOnJS(onExpire)()
      }
    }
  )

  const barStyle = useAnimatedStyle(() => {
    const remaining = (1 - progress.value) * duration
    const barColor = remaining < 2 ? colors.accent2 : color
    return {
      width: containerWidth.value * (1 - progress.value),
      backgroundColor: barColor,
    }
  })

  return (
    <View
      style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width
      }}
    >
      <Animated.View style={[barStyle, { height: '100%', borderRadius: 3 }]} />
    </View>
  )
}
