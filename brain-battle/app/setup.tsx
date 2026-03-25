import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { colors, playerColors } from '../constants/colors'
import { createOrGetPlayer, createSession } from '../db/queries'
import { useSessionStore } from '../store/sessionStore'
import Button from '../components/ui/Button'

function pickTwoColors(): [string, string] {
  const shuffled = [...playerColors].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

export default function SetupScreen() {
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [loading, setLoading] = useState(false)
  const startSession = useSessionStore((s) => s.startSession)

  // Assign colors once on mount
  const [color1, color2] = useMemo(() => pickTwoColors(), [])

  const bothFilled = name1.trim().length > 0 && name2.trim().length > 0

  const handleStart = async () => {
    const n1 = name1.trim()
    const n2 = name2.trim()
    if (!n1 || !n2) return
    setLoading(true)
    try {
      const p1 = await createOrGetPlayer(n1, color1)
      const p2 = await createOrGetPlayer(n2, color2)
      const session = await createSession(p1.id, p2.id)
      startSession(
        { id: p1.id, name: p1.name, color: color1 },
        { id: p2.id, name: p2.name, color: color2 },
        session.id
      )
      router.push('/game/mental-math')
    } catch (e) {
      Alert.alert('Error', 'Could not start game. Please try again.')
      setLoading(false)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Who's Playing?</Text>

      {/* Player 1 Card */}
      <View style={[styles.card, { borderColor: color1 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.playerLabel}>Player 1</Text>
          <View style={[styles.colorPill, { backgroundColor: color1 }]} />
        </View>
        <TextInput
          value={name1}
          onChangeText={(t) => setName1(t.slice(0, 12))}
          placeholder="Enter name…"
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: color1, color: color1 }]}
          maxLength={12}
          autoCorrect={false}
        />
      </View>

      {/* Player 2 Card */}
      <View style={[styles.card, { borderColor: color2 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.playerLabel}>Player 2</Text>
          <View style={[styles.colorPill, { backgroundColor: color2 }]} />
        </View>
        <TextInput
          value={name2}
          onChangeText={(t) => setName2(t.slice(0, 12))}
          placeholder="Enter name…"
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: color2, color: color2 }]}
          maxLength={12}
          autoCorrect={false}
        />
      </View>

      <Button
        label={loading ? 'Starting…' : 'Start Battle!'}
        onPress={handleStart}
        disabled={!bothFilled || loading}
        color={colors.accent}
        size="lg"
        fullWidth
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    paddingTop: 60,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  colorPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: colors.bg,
  },
})
