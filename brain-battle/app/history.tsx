import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { getSessionHistory } from '../db/queries'
import type { SessionWithPlayers } from '../db/queries'
import { colors } from '../constants/colors'

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function SessionRow({ item }: { item: SessionWithPlayers }) {
  const isP1Winner = item.winner_id === item.player1.id
  const isP2Winner = item.winner_id === item.player2.id
  const isTie = !isP1Winner && !isP2Winner && item.winner_id !== null

  return (
    <View style={styles.row}>
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

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionWithPlayers[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getSessionHistory(20)
      setSessions(data)
    } catch (e) {
      console.warn('History load error', e)
    }
  }, [])

  useEffect(() => { load() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SessionRow item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sessions yet.</Text>
            <Text style={styles.emptyHint}>Play a game to see your history here.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  back: { alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  playersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
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
})
