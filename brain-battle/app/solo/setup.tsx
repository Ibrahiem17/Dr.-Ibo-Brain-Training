import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { colors, playerColors } from '../../constants/colors'
import { useSoloStore } from '../../store/soloStore'
import { getPlayerPersonalBest } from '../../db/queries'
import Button from '../../components/ui/Button'

export default function SoloSetup() {
  const { setPlayer, setPersonalBest } = useSoloStore()

  const [name, setName]           = useState('')
  const [colorIndex, setColorIndex] = useState(() => Math.floor(Math.random() * playerColors.length))
  const [localBest, setLocalBest] = useState<number | null | undefined>(undefined) // undefined = loading
  const [error, setError]         = useState<string | null>(null)

  const color = playerColors[colorIndex]

  // Look up personal best as the player types
  useEffect(() => {
    const trimmed = name.trim()
    if (trimmed.length < 2) { setLocalBest(undefined); return }
    let cancelled = false
    getPlayerPersonalBest(trimmed)
      .then((best) => { if (!cancelled) setLocalBest(best) })
      .catch(() => { if (!cancelled) setLocalBest(null) })
    return () => { cancelled = true }
  }, [name])

  const handleCycleColor = () => {
    setColorIndex((i) => (i + 1) % playerColors.length)
  }

  const handleGo = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Enter your name.'); return }
    if (trimmed.length > 12) { setError('Name max 12 characters.'); return }
    setError(null)
    setPlayer({ id: null, name: trimmed, color })
    setPersonalBest(localBest ?? null)
    router.push('/solo/pregame')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent3 }]}>SOLO MODE</Text>
      <Text style={styles.sub}>Train your brain. Beat your best.</Text>

      <View style={[styles.inputCard, { borderColor: color }]}>
        <TextInput
          value={name}
          onChangeText={(t) => { setName(t.slice(0, 12)); setError(null) }}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color }]}
          maxLength={12}
          autoCorrect={false}
          autoFocus
        />
      </View>

      {/* Color selector */}
      <View style={styles.colorRow}>
        <TouchableOpacity onPress={handleCycleColor} style={[styles.colorCircle, { backgroundColor: color, borderColor: color }]} />
        <Text style={styles.colorLabel}>Your colour — tap to change</Text>
      </View>

      {/* Personal best display */}
      {name.trim().length >= 2 && (
        <View style={styles.bestBox}>
          {localBest === undefined ? (
            <Text style={styles.bestText}>Looking up history…</Text>
          ) : localBest !== null ? (
            <Text style={styles.bestText}>
              Your best brain age: <Text style={[styles.bestNum, { color: colors.accent3 }]}>{localBest}</Text>
            </Text>
          ) : (
            <Text style={styles.bestText}>No previous scores</Text>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        label="LET'S GO"
        onPress={handleGo}
        disabled={!name.trim()}
        color={colors.accent3}
        size="lg"
        fullWidth
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 20 },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: 3 },
  sub: { fontSize: 14, color: colors.muted, fontWeight: '500', marginBottom: 4 },
  inputCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
  },
  input: {
    fontSize: 26,
    fontWeight: '800',
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  colorLabel: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  bestBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bestText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  bestNum: { fontWeight: '900' },
  errorText: { color: colors.accent2, fontSize: 13, fontWeight: '600', textAlign: 'center' },
})
