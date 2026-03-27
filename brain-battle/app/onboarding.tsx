import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay, withSequence,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, playerColors } from '../constants/colors'
import { useProfileStore } from '../store/profileStore'
import { useCoinStore } from '../store/coinStore'
import Button from '../components/ui/Button'

const NAME_REGEX = /^[a-zA-Z0-9 ]+$/
const MAX_NAME = 16

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { createProfile } = useProfileStore()
  const loadCoins = useCoinStore((s) => s.load)

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(playerColors[0])
  const [error, setError] = useState<string | null>(null)

  const trimmed = name.trim()
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_NAME && NAME_REGEX.test(trimmed)

  // ── Animation shared values ───────────────────────────────────────────────
  const logoScale   = useSharedValue(0.8)
  const logoOp      = useSharedValue(0)
  const titleY      = useSharedValue(20)
  const titleOp     = useSharedValue(0)
  const welcomeOp   = useSharedValue(0)
  const inputY      = useSharedValue(20)
  const inputOp     = useSharedValue(0)
  const pickerOp    = useSharedValue(0)
  const btnOp       = useSharedValue(0)

  useEffect(() => {
    logoScale.value = withSpring(1.0, { damping: 14, stiffness: 160 })
    logoOp.value    = withTiming(1, { duration: 400 })

    titleY.value  = withDelay(200, withSpring(0, { damping: 18, stiffness: 180 }))
    titleOp.value = withDelay(200, withTiming(1, { duration: 400 }))

    welcomeOp.value = withDelay(400, withTiming(1, { duration: 350 }))

    inputY.value  = withDelay(600, withSpring(0, { damping: 18, stiffness: 180 }))
    inputOp.value = withDelay(600, withTiming(1, { duration: 350 }))

    pickerOp.value = withDelay(800, withTiming(1, { duration: 350 }))
    btnOp.value    = withDelay(1000, withTiming(1, { duration: 350 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle    = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ scale: logoScale.value }] }))
  const titleStyle   = useAnimatedStyle(() => ({ opacity: titleOp.value, transform: [{ translateY: titleY.value }] }))
  const welcomeStyle = useAnimatedStyle(() => ({ opacity: welcomeOp.value }))
  const inputStyle   = useAnimatedStyle(() => ({ opacity: inputOp.value, transform: [{ translateY: inputY.value }] }))
  const pickerStyle  = useAnimatedStyle(() => ({ opacity: pickerOp.value }))
  const btnStyle     = useAnimatedStyle(() => ({ opacity: btnOp.value }))

  const handleGo = async () => {
    if (!isValid) return
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return }
    setError(null)
    await createProfile(trimmed, selectedColor)
    await loadCoins(trimmed)
    router.replace('/')
  }

  const handleChangeName = (text: string) => {
    const sliced = text.slice(0, MAX_NAME)
    setName(sliced)
    setError(null)
    if (sliced.trim().length > 0 && !NAME_REGEX.test(sliced.trim())) {
      setError('Only letters, numbers and spaces')
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🧠</Text>
          </View>
        </Animated.View>

        {/* App title */}
        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={styles.appTitle}>DR IBO</Text>
          <Text style={styles.appSubtitle}>BRAIN TRAINING</Text>
        </Animated.View>

        <View style={styles.divider} />

        {/* Welcome */}
        <Animated.View style={welcomeStyle}>
          <Text style={[styles.welcomeHeading, { color: colors.accent }]}>WELCOME!</Text>
          <Text style={styles.welcomeSub}>What should we call you?</Text>
        </Animated.View>

        {/* Name input */}
        <Animated.View style={inputStyle}>
          <View style={[styles.inputCard, { borderColor: isValid ? selectedColor : colors.border }]}>
            <TextInput
              value={name}
              onChangeText={handleChangeName}
              placeholder="Enter your name…"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: isValid ? selectedColor : colors.text }]}
              maxLength={MAX_NAME}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputMeta}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.charCounter}>{trimmed.length} / {MAX_NAME}</Text>
            )}
          </View>
        </Animated.View>

        {/* Colour picker */}
        <Animated.View style={pickerStyle}>
          <Text style={styles.sectionLabel}>CHOOSE YOUR COLOUR</Text>
          <View style={styles.colorRow}>
            {playerColors.map((c) => (
              <ColorCircle
                key={c}
                color={c}
                selected={selectedColor === c}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Button */}
        <Animated.View style={btnStyle}>
          <Button
            label="LET'S GO"
            onPress={handleGo}
            disabled={!isValid || trimmed.length < 2}
            color={colors.accent}
            size="lg"
            fullWidth
          />
          <Text style={styles.saveNote}>
            Your name will be saved and never asked again.
          </Text>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function ColorCircle({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(selected ? 1.2 : 1.0)

  useEffect(() => {
    scale.value = withSpring(selected ? 1.2 : 1.0, { damping: 12, stiffness: 200 })
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 300 }),
      withSpring(1.2, { damping: 12, stiffness: 200 }),
    )
    onPress()
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.colorCircle,
          { backgroundColor: color },
          selected && { borderWidth: 3, borderColor: colors.white },
          style,
        ]}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, gap: 24, paddingBottom: 48, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginTop: 16 },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 48 },
  titleWrap: { alignItems: 'center', gap: 2 },
  appTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 42,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    width: '60%',
    backgroundColor: colors.border,
  },
  welcomeHeading: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
  },
  input: {
    fontSize: 24,
    fontWeight: '800',
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  charCounter: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  errorText: { fontSize: 12, color: colors.accent2, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: 14,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  saveNote: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
})
