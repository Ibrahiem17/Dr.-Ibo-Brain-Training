import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { colors } from '../../constants/colors'

interface ProgressBarProps {
  current: number
  total: number
  color?: string
}

export default function ProgressBar({ current, total, color = colors.accent }: ProgressBarProps) {
  const containerWidth = useSharedValue(0)
  const fillWidth = useSharedValue(0)

  useEffect(() => {
    const pct = total > 0 ? current / total : 0
    fillWidth.value = withTiming(containerWidth.value * pct, { duration: 300 })
  }, [current, total])

  const barStyle = useAnimatedStyle(() => ({ width: fillWidth.value }))

  return (
    <View
      style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width
        const pct = total > 0 ? current / total : 0
        fillWidth.value = containerWidth.value * pct
      }}
    >
      <Animated.View style={[barStyle, { height: '100%', backgroundColor: color, borderRadius: 3 }]} />
    </View>
  )
}
