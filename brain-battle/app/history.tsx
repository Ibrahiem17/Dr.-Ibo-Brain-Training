import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { getSessionHistory, getQuickPlayHistory, getSoloHistory } from '../db/queries'
import type { SessionWithPlayers, QuickPlayHistoryItem, SoloHistoryItem } from '../db/queries'
import { GAMES } from '../constants/games'
import { colors } from '../constants/colors'

type FilterTab = 'all' | 'battle' | 'quick' | 'solo'

const GAME_COLOR: Record<string, string> = {
  'mental-math':     colors.accent,
  'grid-memory':     colors.accent2,
  'stroop-test':     colors.accent3,
  'number-sequence': colors.amber,
  'falling-blocks':  '#c084fc',
  'exploding-cube':  '#f97316',
  'flag-direction':  '#34d399',
}

function brainAgeColor(age: number): string {
  if (age <= 25) return colors.accent3
  if (age <= 35) return colors.accent
  if (age <= 45) return colors.amber
  return colors.accent2
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return isoString }
}

// ─── Mini bar chart for solo sessions ─────────────────────────────────────────

function MiniBarChart({ gameScores }: { gameScores: { gameId: string; score: number }[] }) {
  const BAR_H = 28
  return (
    <View style={barStyles.container}>
      {GAMES.map((g) => {
        const entry = gameScores.find((gs) => gs.gameId === g.id)
        const score = entry?.score ?? 0
        const height = Math.max(3, Math.round((score / 100) * BAR_H))
        const gc = GAME_COLOR[g.id] ?? colors.accent
        return (
          <View key={g.id} style={[barStyles.barWrap, { height: BAR_H }]}>
            <View style={[barStyles.bar, { height, backgroundColor: gc }]} />
          </View>
        )
      })}
    </View>
  )
}

const barStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barWrap: { width: 14, justifyContent: 'flex-end' },
  bar: { width: 14, borderRadius: 3 },
})

// ─── Row components ────────────────────────────────────────────────────────────

function SessionRow({ item }: { item: SessionWithPlayers }) {
  const isP1Winner = item.winner_id === item.player1.id
  const isP2Winner = item.winner_id === item.player2.id
  const isTie = !isP1Winner && !isP2Winner && item.winner_id !== null

  return (
    <View style={styles.row}>
      <View style={styles.rowBadge}>
        <Text style={styles.rowBadgeText}>BATTLE</Text>
      </View>
      <View style={styles.rowTop}>
        <View style={styles.playersWrap}>
          <Text style={styles.playerName}>{item.player1.name}</Text>
          {isP1Winner && <Text style={styles.crown}>👑</Text>}
          <Text style={styles.vs}>vs</Text>
          <Text style={styles.playerName}>{item.player2.name}</Text>
          {isP2Winner && <Text style={styles.crown}>👑</Text>}
          {isTie && <Text style={styles.tie}>🤝 Tie</Text>}
        </View>
        <Text style={styles.date}>{formatDate(item.played_at)}</Text>
      </View>
      {(item.player1BrainAge !== null || item.player2BrainAge !== null) && (
        <View style={styles.ages}>
          <Text style={styles.ageText}>
            Brain ages: {item.player1.name} <Text style={styles.ageNum}>{item.player1BrainAge ?? '—'}</Text>
            {'  '}
            {item.player2.name} <Text style={styles.ageNum}>{item.player2BrainAge ?? '—'}</Text>
          </Text>
        </View>
      )}
    </View>
  )
}

function QuickPlayRow({ item }: { item: QuickPlayHistoryItem }) {
  const game = GAMES.find((g) => g.id === item.game_id)
  return (
    <View style={styles.row}>
      <View style={[styles.rowBadge, { backgroundColor: colors.amber + '22', borderColor: colors.amber }]}>
        <Text style={[styles.rowBadgeText, { color: colors.amber }]}>QUICK PLAY</Text>
      </View>
      <View style={styles.rowTop}>
        <View style={styles.playersWrap}>
          {game && <Text style={styles.gameIcon}>{game.icon}</Text>}
          <Text style={styles.playerName}>{item.player.name}</Text>
          <Text style={styles.vs}>·</Text>
          <Text style={[styles.playerName, { color: colors.accent }]}>{item.score}</Text>
          <Text style={styles.vs}>pts</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.played_at)}</Text>
      </View>
      {game && <Text style={styles.ageText}>{game.label}</Text>}
    </View>
  )
}

function SoloRow({ item }: { item: SoloHistoryItem }) {
  const [expanded, setExpanded] = useState(false)
  const ageColor = brainAgeColor(item.brainAge)

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((e) => !e)}
      style={styles.row}
    >
      <View style={[styles.rowBadge, { backgroundColor: colors.accent3 + '20', borderColor: colors.accent3 }]}>
        <Text style={[styles.rowBadgeText, { color: colors.accent3 }]}>SOLO</Text>
      </View>

      <View style={styles.soloTop}>
        <View style={styles.playersWrap}>
          <View style={[styles.soloColorDot, { backgroundColor: item.player.avatar_color }]} />
          <Text style={styles.playerName}>{item.player.name}</Text>
        </View>
        <View style={styles.soloRight}>
          <Text style={[styles.soloBrainAge, { color: ageColor }]}>{item.brainAge}</Text>
          <Text style={styles.soloBaLabel}>Brain Age</Text>
        </View>
      </View>

      <View style={styles.soloBottom}>
        <MiniBarChart gameScores={item.gameScores} />
        <Text style={styles.date}>{formatDate(item.recordedAt)}</Text>
      </View>

      {expanded && (
        <View style={styles.soloExpanded}>
          {GAMES.map((g) => {
            const entry = item.gameScores.find((gs) => gs.gameId === g.id)
            const gc = GAME_COLOR[g.id] ?? colors.accent
            return (
              <View key={g.id} style={styles.soloExpandRow}>
                <Text style={[styles.soloExpandIcon, { color: gc }]}>{g.icon}</Text>
                <Text style={styles.soloExpandName}>{g.label}</Text>
                <Text style={[styles.soloExpandScore, { color: gc }]}>{entry?.score ?? '—'}</Text>
              </View>
            )
          })}
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [filter, setFilter]       = useState<FilterTab>('all')
  const [sessions, setSessions]   = useState<SessionWithPlayers[]>([])
  const [quickItems, setQuick]    = useState<QuickPlayHistoryItem[]>([])
  const [soloItems, setSolo]      = useState<SoloHistoryItem[]>([])
  const [refreshing, setRefresh]  = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, q, so] = await Promise.all([
        getSessionHistory(30),
        getQuickPlayHistory(30),
        getSoloHistory(30),
      ])
      setSessions(s)
      setQuick(q)
      setSolo(so)
    } catch (e) { console.warn('History load error', e) }
  }, [])

  useEffect(() => { load() }, [])

  const onRefresh = async () => {
    setRefresh(true)
    await load()
    setRefresh(false)
  }

  type ListItem =
    | { kind: 'battle'; data: SessionWithPlayers; date: string }
    | { kind: 'quick';  data: QuickPlayHistoryItem; date: string }
    | { kind: 'solo';   data: SoloHistoryItem; date: string }

  const combined: ListItem[] = []
  if (filter !== 'quick' && filter !== 'solo')
    sessions.forEach((s) => combined.push({ kind: 'battle', data: s, date: s.played_at }))
  if (filter !== 'battle' && filter !== 'solo')
    quickItems.forEach((q) => combined.push({ kind: 'quick', data: q, date: q.played_at }))
  if (filter !== 'battle' && filter !== 'quick')
    soloItems.forEach((so) => combined.push({ kind: 'solo', data: so, date: so.recordedAt }))

  combined.sort((a, b) => b.date.localeCompare(a.date))

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',    label: 'ALL' },
    { key: 'battle', label: 'BATTLE' },
    { key: 'quick',  label: 'QUICK' },
    { key: 'solo',   label: 'SOLO' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setFilter(t.key)}
              style={[styles.tab, filter === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={combined}
        keyExtractor={(item, i) => `${item.kind}-${i}`}
        renderItem={({ item }) => {
          if (item.kind === 'battle') return <SessionRow item={item.data} />
          if (item.kind === 'quick')  return <QuickPlayRow item={item.data} />
          return <SoloRow item={item.data} />
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No history yet.</Text>
            <Text style={styles.emptyHint}>Play a game to see it here.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8,
  },
  back: { alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  tabActive: { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1 },
  tabTextActive: { color: colors.accent },
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  rowBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: colors.accent + '55',
    backgroundColor: colors.accent + '11', marginBottom: 4,
  },
  rowBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: colors.accent },
  rowTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 4,
  },
  playersWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  playerName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  gameIcon: { fontSize: 16 },
  vs: { color: colors.muted, fontSize: 12 },
  crown: { fontSize: 14 },
  tie: { color: colors.amber, fontSize: 12, fontWeight: '600' },
  date: { color: colors.muted, fontSize: 11, flexShrink: 0 },
  ages: { marginTop: 2 },
  ageText: { color: colors.muted, fontSize: 12 },
  ageNum: { color: colors.accent, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyHint: { color: colors.muted, fontSize: 14 },
  // Solo-specific
  soloTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  soloColorDot: { width: 12, height: 12, borderRadius: 6 },
  soloRight: { alignItems: 'flex-end' },
  soloBrainAge: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  soloBaLabel: { fontSize: 9, color: colors.muted, fontWeight: '700', letterSpacing: 1.5 },
  soloBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 },
  soloExpanded: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8, gap: 6 },
  soloExpandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  soloExpandIcon: { fontSize: 14, width: 20, textAlign: 'center', fontWeight: '700' },
  soloExpandName: { flex: 1, fontSize: 12, color: colors.muted, fontWeight: '500' },
  soloExpandScore: { fontSize: 14, fontWeight: '800' },
})
