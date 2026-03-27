import { useEffect } from 'react'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import type { Direction } from './useFlagDirection'
import { colors } from '../../../constants/colors'

// ─── DirectionButton ──────────────────────────────────────────────────────────

interface DirectionButtonProps {
  direction: Direction
  arrow: string
  onPress: (d: Direction) => void
  disabled: boolean
  isHighlighted: boolean
}

function DirectionButton({ direction, arrow, onPress, disabled, isHighlighted }: DirectionButtonProps) {
  const scale = useSharedValue(1)
  const bgOpacity = useSharedValue(isHighlighted ? 1 : 0)

  useEffect(() => {
    bgOpacity.value = withTiming(isHighlighted ? 1 : 0, { duration: 150 })
  }, [isHighlighted]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(255, 159, 0, ${bgOpacity.value * 0.3})`,
  }))

  const handlePress = (): void => {
    if (disabled) return
    scale.value = withSequence(
      withSpring(0.88, { damping: 6 }),
      withSpring(1.0, { damping: 8 }),
    )
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(direction)
  }

  const borderColor = isHighlighted ? colors.amber : colors.border

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.dirBtn, animStyle, { borderColor }]}>
        <Text style={styles.arrow}>{arrow}</Text>
        <Text style={styles.label}>{direction}</Text>
      </Animated.View>
    </Pressable>
  )
}

// ─── DirectionPad ─────────────────────────────────────────────────────────────

interface Props {
  onPress: (dir: Direction) => void
  disabled: boolean
  lastPressed: Direction | null
}

export default function DirectionPad({ onPress, disabled, lastPressed }: Props) {
  return (
    <View style={styles.padContainer}>
      {/* Top row — UP only */}
      <View style={styles.row}>
        <View style={styles.spacer} />
        <DirectionButton
          direction="UP"
          arrow="↑"
          onPress={onPress}
          disabled={disabled}
          isHighlighted={lastPressed === 'UP'}
        />
        <View style={styles.spacer} />
      </View>

      {/* Middle row — LEFT, centre gap, RIGHT */}
      <View style={styles.row}>
        <DirectionButton
          direction="LEFT"
          arrow="←"
          onPress={onPress}
          disabled={disabled}
          isHighlighted={lastPressed === 'LEFT'}
        />
        <View style={styles.centre} />
        <DirectionButton
          direction="RIGHT"
          arrow="→"
          onPress={onPress}
          disabled={disabled}
          isHighlighted={lastPressed === 'RIGHT'}
        />
      </View>

      {/* Bottom row — DOWN only */}
      <View style={styles.row}>
        <View style={styles.spacer} />
        <DirectionButton
          direction="DOWN"
          arrow="↓"
          onPress={onPress}
          disabled={disabled}
          isHighlighted={lastPressed === 'DOWN'}
        />
        <View style={styles.spacer} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  padContainer: {
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dirBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  spacer: {
    width: 90,
    height: 90,
  },
  centre: {
    width: 90,
    height: 90,
  },
  arrow: {
    fontSize: 32,
    color: colors.text,
    lineHeight: 36,
  },
  label: {
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
