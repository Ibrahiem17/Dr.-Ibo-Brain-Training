import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { FACTS } from '../../constants/facts'
import { colors } from '../../constants/colors'

interface Props {
  bottomInset?: number
}

export default function FactsTicker({ bottomInset = 0 }: Props) {
  const startIndex = useRef(Math.floor(Math.random() * FACTS.length)).current
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [displayedFact, setDisplayedFact] = useState(FACTS[startIndex])

  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)

  const animateToNext = () => {
    // Slide out to the left + fade out
    translateX.value = withTiming(-30, { duration: 350, easing: Easing.in(Easing.ease) })
    opacity.value = withTiming(0, { duration: 300 }, () => {
      // Update the fact text while invisible
      runOnJS(setCurrentIndex)((prev: number) => {
        const next = (prev + 1) % FACTS.length
        runOnJS(setDisplayedFact)(FACTS[next])
        return next
      })
      // Slide in from the right + fade in
      translateX.value = 30
      translateX.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) })
      opacity.value = withTiming(1, { duration: 350 })
    })
  }

  useEffect(() => {
    const interval = setInterval(animateToNext, 7000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    flex: 1,
  }))

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <Text style={styles.label}>DID YOU KNOW</Text>
      <View style={styles.divider} />
      <Animated.View style={animatedStyle}>
        <Text style={styles.fact} numberOfLines={2} ellipsizeMode="tail">
          {displayedFact}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    overflow: 'hidden',
  },
  label: {
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 2,
    fontWeight: '700',
    width: 52,
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  fact: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
})
