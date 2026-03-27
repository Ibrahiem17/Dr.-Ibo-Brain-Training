import { Pressable, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors } from '../../constants/colors'
import { playSound } from '../../utils/sounds'

interface ButtonProps {
  label: string
  onPress: () => void
  color?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const sizeMap = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 11 },
  md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 14 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16 },
}

export default function Button({
  label,
  onPress,
  color = colors.accent,
  disabled = false,
  size = 'md',
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
  }))

  const dims = sizeMap[size]

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
          playSound('buttonTap', 0.35)
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, { damping: 15, stiffness: 300 })
        }}
        onPress={disabled ? undefined : onPress}
        style={{
          borderWidth: 2,
          borderColor: disabled ? colors.muted : color,
          paddingVertical: dims.paddingVertical,
          paddingHorizontal: dims.paddingHorizontal,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text
          style={{
            color: disabled ? colors.muted : color,
            fontSize: dims.fontSize,
            fontWeight: '700',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}
