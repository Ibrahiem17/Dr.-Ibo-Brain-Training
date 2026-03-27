import { useEffect } from 'react'
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSettingsStore } from '../store/settingsStore'
import {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { colors } from '../constants/colors'
import Button from '../components/ui/Button'
import FactsTicker from '../components/ui/FactsTicker'
import StreakBadge from '../components/ui/StreakBadge'
import CoinBadge from '../components/ui/CoinBadge'
import { useStreakStore } from '../store/streakStore'
import { useCoinStore } from '../store/coinStore'
import { getLastActiveStreak } from '../db/queries'
import { getLastKnownPlayer } from '../hooks/useLastKnownPlayer'

const { width: W, height: H } = Dimensions.get('window')
const PARTICLE_COUNT = 7

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: (i * (W / PARTICLE_COUNT) + 30 + (i % 2) * 40) % (W - 40),
  y: 60 + (i * 97) % (H - 140),
  size: 20 + (i * 13) % 30,
}))

function Particle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useSharedValue(0.6)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.08, { duration: 1400 + delay * 100 }), -1, true)
    return () => cancelAnimation(opacity)
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      style={[style, { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent }]}
    />
  )
}

function ModeButton({ label, subtitle, color, onPress }: { label: string; subtitle: string; color: string; onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 80 }) }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }) }}
        onPress={onPress}
        style={[styles.modeButton, { borderColor: color }]}
      >
        <Text style={[styles.modeLabel, { color }]}>{label}</Text>
        <Text style={styles.modeSubtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { muted, toggleMute } = useSettingsStore()
  const { lastActiveStreak, setLastActiveStreak } = useStreakStore()
  const coinBalance = useCoinStore((s) => s.balance)
  const loadCoins = useCoinStore((s) => s.load)

  useEffect(() => {
    getLastActiveStreak()
      .then((data) => { if (data) setLastActiveStreak(data) })
      .catch(() => {})
    const { name } = getLastKnownPlayer()
    if (name) loadCoins(name)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const titleOpacity    = useSharedValue(0)
  const subtitleOpacity = useSharedValue(0)
  const soloOpacity     = useSharedValue(0)
  const div1Opacity     = useSharedValue(0)
  const battleOpacity   = useSharedValue(0)
  const div2Opacity     = useSharedValue(0)
  const quickOpacity    = useSharedValue(0)
  const div3Opacity     = useSharedValue(0)
  const endlessOpacity  = useSharedValue(0)
  const historyOpacity  = useSharedValue(0)
  const bottomOpacity   = useSharedValue(0)

  useEffect(() => {
    titleOpacity.value    = withDelay(80,   withTiming(1, { duration: 500 }))
    subtitleOpacity.value = withDelay(220,  withTiming(1, { duration: 400 }))
    soloOpacity.value     = withDelay(350,  withTiming(1, { duration: 400 }))
    div1Opacity.value     = withDelay(470,  withTiming(1, { duration: 300 }))
    battleOpacity.value   = withDelay(530,  withTiming(1, { duration: 400 }))
    div2Opacity.value     = withDelay(650,  withTiming(1, { duration: 300 }))
    quickOpacity.value    = withDelay(710,  withTiming(1, { duration: 400 }))
    div3Opacity.value     = withDelay(820,  withTiming(1, { duration: 300 }))
    endlessOpacity.value  = withDelay(880,  withTiming(1, { duration: 400 }))
    historyOpacity.value  = withDelay(980,  withTiming(1, { duration: 400 }))
    bottomOpacity.value   = withDelay(1050, withTiming(1, { duration: 400 }))
  }, [])

  const titleStyle    = useAnimatedStyle(() => ({ opacity: titleOpacity.value }))
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }))
  const soloStyle     = useAnimatedStyle(() => ({ opacity: soloOpacity.value, width: '100%' as const }))
  const div1Style     = useAnimatedStyle(() => ({ opacity: div1Opacity.value }))
  const battleStyle   = useAnimatedStyle(() => ({ opacity: battleOpacity.value, width: '100%' as const }))
  const div2Style     = useAnimatedStyle(() => ({ opacity: div2Opacity.value }))
  const quickStyle    = useAnimatedStyle(() => ({ opacity: quickOpacity.value, width: '100%' as const }))
  const div3Style     = useAnimatedStyle(() => ({ opacity: div3Opacity.value }))
  const endlessStyle  = useAnimatedStyle(() => ({ opacity: endlessOpacity.value, width: '100%' as const }))
  const historyStyle  = useAnimatedStyle(() => ({ opacity: historyOpacity.value, width: '100%' as const }))
  const bottomStyle   = useAnimatedStyle(() => ({ opacity: bottomOpacity.value }))

  return (
    <View style={styles.container}>
      {PARTICLES.map((p, i) => <Particle key={i} {...p} delay={i} />)}

      {/* Settings button */}
      <Pressable
        onPress={() => router.push('/settings' as Parameters<typeof router.push>[0])}
        style={{ position: 'absolute', top: insets.top + 12, left: 20, padding: 8 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ fontSize: 22, color: colors.muted }}>⚙</Text>
      </Pressable>

      {/* Coin badge */}
      <View style={{ position: 'absolute', top: insets.top + 12, left: 60 }}>
        <CoinBadge balance={coinBalance} onPress={() => router.push('/shop' as Parameters<typeof router.push>[0])} />
      </View>

      {/* Mute button */}
      <Pressable
        onPress={toggleMute}
        style={{ position: 'absolute', top: insets.top + 12, right: 20, padding: 8 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ fontSize: 22, color: colors.muted }}>{muted ? '🔇' : '🔊'}</Text>
      </Pressable>

      <View style={styles.content}>
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>BRAIN{'\n'}BATTLE</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>Train your brain · Beat your opponent</Text>
        </Animated.View>

        {lastActiveStreak && lastActiveStreak.currentStreak > 0 && (
          <View style={styles.streakRow}>
            <StreakBadge streak={lastActiveStreak.currentStreak} size="md" showLabel />
            {lastActiveStreak.longestStreak > 1 && (
              <Text style={styles.bestStreak}>Best: {lastActiveStreak.longestStreak} days</Text>
            )}
          </View>
        )}

        <View style={styles.buttons}>
          <Animated.View style={soloStyle}>
            <ModeButton
              label="SOLO"
              subtitle="All 7 games · Your brain age"
              color={colors.accent3}
              onPress={() => router.push('/solo/setup')}
            />
          </Animated.View>

          <Animated.View style={[div1Style, styles.dividerWrap]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View style={battleStyle}>
            <ModeButton
              label="FULL BATTLE"
              subtitle="All 7 games · Brain Age · Winner"
              color={colors.accent}
              onPress={() => router.push('/setup')}
            />
          </Animated.View>

          <Animated.View style={[div2Style, styles.dividerWrap]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View style={quickStyle}>
            <ModeButton
              label="QUICK PLAY"
              subtitle="Pick any game · Solo or 2 players"
              color={colors.amber}
              onPress={() => router.push('/quick-play/setup')}
            />
          </Animated.View>

          <Animated.View style={[div3Style, styles.dividerWrap]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View style={endlessStyle}>
            <ModeButton
              label="ENDLESS"
              subtitle="Survive forever · Earn coins · Top the board"
              color={colors.gold}
              onPress={() => router.push('/endless/setup' as Parameters<typeof router.push>[0])}
            />
          </Animated.View>

          <Animated.View style={historyStyle}>
            <Button
              label="History"
              onPress={() => router.push('/history')}
              color={colors.muted}
              size="md"
              fullWidth
            />
          </Animated.View>
        </View>
      </View>

      {/* Bottom links */}
      <Animated.View style={[styles.bottomLinks, bottomStyle, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={() => router.push('/leaderboard' as Parameters<typeof router.push>[0])} hitSlop={8}>
          <Text style={styles.bottomLink}>🏆 Leaderboard</Text>
        </Pressable>
        <Text style={styles.bottomDot}>·</Text>
        <Pressable onPress={() => router.push('/shop' as Parameters<typeof router.push>[0])} hitSlop={8}>
          <Text style={styles.bottomLink}>🛒 Shop</Text>
        </Pressable>
      </Animated.View>

      <FactsTicker bottomInset={insets.bottom} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 56,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: { width: '100%', gap: 12, alignItems: 'center' },
  modeButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 5,
  },
  modeLabel: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  modeSubtitle: { fontSize: 11, color: colors.muted, fontWeight: '500', letterSpacing: 0.3 },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  bestStreak: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  bottomLink: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  bottomDot: { color: colors.border, fontSize: 16 },
})
