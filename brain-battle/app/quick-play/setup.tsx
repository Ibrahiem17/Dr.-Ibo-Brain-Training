import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { colors } from '../../constants/colors'
import { useSettingsStore } from '../../store/settingsStore'
import { useQuickPlayStore } from '../../store/quickPlayStore'
import { useProfileStore } from '../../store/profileStore'
import Button from '../../components/ui/Button'

export default function QuickPlaySetup() {
  const [isSolo, setIsSolo] = useState(true)

  const setPlayers = useQuickPlayStore((s) => s.setPlayers)
  const selectGame = useQuickPlayStore((s) => s.selectGame)
  const { player1Color, player2Color } = useSettingsStore()
  const { username, color, isProfileLoaded } = useProfileStore()

  const sliderX = useSharedValue(0)
  const [pillWidth, setPillWidth] = useState(0)

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }],
  }))

  const p2MaxHeight = useSharedValue(0)
  const p2Opacity = useSharedValue(0)

  const p2AnimStyle = useAnimatedStyle(() => ({
    maxHeight: p2MaxHeight.value,
    opacity: p2Opacity.value,
    overflow: 'hidden',
  }))

  const handleToggle = (solo: boolean) => {
    setIsSolo(solo)
    if (pillWidth > 0) {
      sliderX.value = withSpring(solo ? 0 : pillWidth, { damping: 20, stiffness: 250 })
    }
    if (solo) {
      p2MaxHeight.value = withSpring(0, { damping: 20 })
      p2Opacity.value = withTiming(0, { duration: 200 })
    } else {
      p2MaxHeight.value = withSpring(72, { damping: 20 })
      p2Opacity.value = withTiming(1, { duration: 250 })
    }
  }

  const onToggleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width / 2
    setPillWidth(w)
    if (!isSolo) sliderX.value = w
  }

  if (!isProfileLoaded) return null

  const handleNext = () => {
    if (!isSolo) {
      const p1 = { id: null, name: 'Player 1', color: player1Color }
      const p2 = { id: null, name: 'Player 2', color: player2Color }
      setPlayers(p1, p2, false)
      selectGame('')
      router.push('/quick-play/select')
      return
    }

    const p1 = { id: null, name: username, color }
    setPlayers(p1, null, true)
    selectGame('')
    router.push('/quick-play/select')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Quick Play</Text>
      <Text style={styles.sub}>Play any single game, solo or with a friend.</Text>

      {/* Mode toggle */}
      <View style={styles.toggleContainer} onLayout={onToggleLayout}>
        <Animated.View style={[styles.toggleSlider, sliderStyle, { width: pillWidth || '50%' }]} />
        <TouchableOpacity style={styles.toggleOption} onPress={() => handleToggle(true)}>
          <Text style={[styles.toggleText, isSolo && styles.toggleTextActive]}>SOLO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleOption} onPress={() => handleToggle(false)}>
          <Text style={[styles.toggleText, !isSolo && styles.toggleTextActive]}>2 PLAYERS</Text>
        </TouchableOpacity>
      </View>

      {/* Solo: profile card */}
      {isSolo && (
        <View style={[styles.profileCard, { borderColor: color }]}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <View>
            <Text style={[styles.profileName, { color }]}>{username}</Text>
            <Text style={styles.profileLabel}>YOUR PROFILE</Text>
          </View>
        </View>
      )}

      {/* 2P: info row (animated) */}
      <Animated.View style={p2AnimStyle}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoDot, { color: player1Color }]}>●</Text>
          <Text style={[styles.infoName, { color: player1Color }]}>Player 1</Text>
          <Text style={styles.infoVs}>vs</Text>
          <Text style={[styles.infoName, { color: player2Color }]}>Player 2</Text>
          <Text style={[styles.infoDot, { color: player2Color }]}>●</Text>
        </View>
      </Animated.View>

      <Button
        label="Choose Game"
        onPress={handleNext}
        color={colors.amber}
        size="lg"
        fullWidth
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    gap: 20,
  },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    height: 44,
  },
  toggleSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: colors.amber + '30',
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 9,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.muted,
  },
  toggleTextActive: {
    color: colors.amber,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoDot: { fontSize: 14 },
  infoName: { fontSize: 16, fontWeight: '700' },
  infoVs: { fontSize: 13, color: colors.muted, fontWeight: '600' },
})
