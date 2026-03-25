import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { colors } from '../constants/colors'
import Button from '../components/ui/Button'

const { width: W, height: H } = Dimensions.get('window')

const PARTICLE_COUNT = 7

// Fixed positions and sizes so they don't re-randomize on render
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: (i * (W / PARTICLE_COUNT) + 30 + (i % 2) * 40) % (W - 40),
  y: 60 + (i * 97) % (H - 140),
  size: 20 + (i * 13) % 30,
}))

function Particle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.08, { duration: 1400 + delay * 100 }),
      -1,
      true
    )
    return () => cancelAnimation(opacity)
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
        },
      ]}
    />
  )
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Animated background particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} delay={i} />
      ))}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>BRAIN{'\n'}BATTLE</Text>
        <Text style={styles.subtitle}>7 games · 2 players · 1 winner</Text>

        <View style={styles.buttons}>
          <Button
            label="New Game"
            onPress={() => router.push('/setup')}
            color={colors.accent}
            size="lg"
            fullWidth
          />
          <Button
            label="History"
            onPress={() => router.push('/history')}
            color={colors.muted}
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 32,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
})
