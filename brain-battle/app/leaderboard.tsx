import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { GAMES } from '../constants/games'
import { getLeaderboard, type LeaderboardEntry } from '../db/queries'

const GAME_COLORS: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

export default function Leaderboard() {
  const { gameId: initialGameId } = useLocalSearchParams<{ gameId?: string }>()
  const [selectedGameId, setSelectedGameId] = useState(initialGameId ?? GAMES[0].id)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getLeaderboard(selectedGameId, 10)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [selectedGameId])

  const gc = GAME_COLORS[selectedGameId] ?? colors.accent

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>LEADERBOARD</Text>
        <Text style={styles.subtitle}>Endless Mode · Top 10</Text>
      </View>

      {/* Game tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {GAMES.map((game) => {
          const active = game.id === selectedGameId
          const tabColor = GAME_COLORS[game.id] ?? colors.accent
          return (
            <Pressable
              key={game.id}
              onPress={() => setSelectedGameId(game.id)}
              style={[
                styles.tab,
                { borderColor: active ? tabColor : colors.border },
                active && { backgroundColor: tabColor + '18' },
              ]}
            >
              <Text style={[styles.tabIcon, { color: tabColor }]}>{game.icon}</Text>
              <Text style={[styles.tabLabel, { color: active ? tabColor : colors.muted }]}>
                {game.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Entries */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={gc} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{GAMES.find((g) => g.id === selectedGameId)?.icon}</Text>
            <Text style={styles.emptyText}>No scores yet</Text>
            <Text style={styles.emptyHint}>Play Endless Mode to get on the board!</Text>
          </View>
        ) : (
          entries.map((entry, i) => (
            <View
              key={i}
              style={[
                styles.row,
                i === 0 && { borderColor: colors.gold, backgroundColor: colors.gold + '10' },
              ]}
            >
              <Text style={[styles.rank, i < 3 && { color: colors.gold }]}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </Text>
              <Text style={styles.name} numberOfLines={1}>{entry.playerName}</Text>
              <View style={styles.scoreWrap}>
                <Text style={[styles.score, { color: gc }]}>{entry.roundsSurvived}</Text>
                <Text style={styles.scoreLabel}>rounds</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', gap: 4, padding: 20, paddingBottom: 12 },
  backText: { color: colors.muted, fontSize: 14, fontWeight: '600', alignSelf: 'flex-start' },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: colors.muted },
  tabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  tabIcon: { fontSize: 16, fontWeight: '900' },
  tabLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { alignItems: 'center', gap: 8, paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rank: { fontSize: 18, fontWeight: '800', color: colors.muted, width: 34 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  scoreWrap: { alignItems: 'flex-end' },
  score: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  scoreLabel: { fontSize: 10, color: colors.muted, letterSpacing: 1 },
})
