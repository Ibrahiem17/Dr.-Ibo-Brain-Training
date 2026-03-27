import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors } from '../../constants/colors'

interface Props {
  streak: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return '#ffd700'
  if (streak >= 14) return colors.accent
  if (streak >= 7)  return colors.accent2
  if (streak >= 3)  return colors.amber
  return colors.muted
}

export default function StreakBadge({ streak, size = 'md', showLabel = false }: Props) {
  const scale = useSharedValue(0.5)
  const color = getStreakColor(streak)

  useEffect(() => {
    scale.value = withSpring(1.0, { damping: 8, stiffness: 180 })
  }, [streak]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const flameSizes = { sm: 14, md: 20, lg: 28 }
  const numSizes   = { sm: 14, md: 20, lg: 32 }

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={{ fontSize: flameSizes[size] }}>🔥</Text>
      <View style={styles.textGroup}>
        <Text style={[styles.number, { fontSize: numSizes[size], color }]}>
          {streak}
        </Text>
        {showLabel && (
          <Text style={styles.label}>DAY STREAK</Text>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textGroup: {
    alignItems: 'flex-start',
  },
  number: {
    fontWeight: '700',
    lineHeight: 36,
  },
  label: {
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: -4,
  },
})
