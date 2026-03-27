import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, playerColors } from '../../constants/colors'
import { GAMES } from '../../constants/games'
import { useEndlessStore } from '../../store/endlessStore'
import { getLastKnownPlayer, setLastKnownPlayer } from '../../hooks/useLastKnownPlayer'
import Button from '../../components/ui/Button'

const GAME_COLORS: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

export default function EndlessSetup() {
  const last = getLastKnownPlayer()
  const [playerName, setPlayerName] = useState(last.name)
  const [playerColor, setPlayerColor] = useState(last.color)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const setup = useEndlessStore((s) => s.setup)

  const canStart = playerName.trim().length > 0 && selectedGameId !== null

  const handleStart = () => {
    if (!canStart || !selectedGameId) return
    const name = playerName.trim()
    setLastKnownPlayer(name, playerColor)
    setup(selectedGameId, name, playerColor)
    router.push('/endless/countdown' as Parameters<typeof router.push>[0])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>ENDLESS MODE</Text>
          <Text style={styles.subtitle}>Survive as many rounds as you can</Text>
        </View>

        {/* Player name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Enter your name"
            placeholderTextColor={colors.muted}
            maxLength={20}
            autoCorrect={false}
          />
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR COLOUR</Text>
          <View style={styles.colorRow}>
            {playerColors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setPlayerColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  playerColor === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Game picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PICK A GAME</Text>
          <View style={styles.gameGrid}>
            {GAMES.map((game) => {
              const gc = GAME_COLORS[game.id] ?? colors.accent
              const selected = selectedGameId === game.id
              return (
                <Pressable
                  key={game.id}
                  onPress={() => setSelectedGameId(game.id)}
                  style={[
                    styles.gameCard,
                    { borderColor: selected ? gc : colors.border },
                    selected && { backgroundColor: gc + '18' },
                  ]}
                >
                  <Text style={[styles.gameIcon, { color: gc }]}>{game.icon}</Text>
                  <Text style={[styles.gameLabel, { color: selected ? gc : colors.text }]}>
                    {game.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Start */}
        <View style={styles.startWrap}>
          <Button
            label="START ENDLESS"
            onPress={handleStart}
            disabled={!canStart}
            color={colors.gold}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, gap: 28, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: colors.gold, letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.white },
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gameCard: {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  gameIcon: { fontSize: 28, fontWeight: '900' },
  gameLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  startWrap: { marginTop: 8 },
})
