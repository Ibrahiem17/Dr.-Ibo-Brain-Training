import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated'
import { colors } from '../../constants/colors'
import { GAMES } from '../../constants/games'

interface PlayerData {
  name: string
  color: string
  scores: number[]
  brainAge: number
}

interface ScoreRevealProps {
  player1: PlayerData
  player2: PlayerData
  winner: 1 | 2 | 'tie'
}

export default function ScoreReveal({ player1, player2, winner }: ScoreRevealProps) {
  const [displayP1Age, setDisplayP1Age] = useState(99)
  const [displayP2Age, setDisplayP2Age] = useState(99)
  const [showWinner, setShowWinner] = useState(false)

  const p1AgeVal = useSharedValue(99)
  const p2AgeVal = useSharedValue(99)

  useAnimatedReaction(
    () => Math.round(p1AgeVal.value),
    (val) => { runOnJS(setDisplayP1Age)(val) }
  )
  useAnimatedReaction(
    () => Math.round(p2AgeVal.value),
    (val) => { runOnJS(setDisplayP2Age)(val) }
  )

  useEffect(() => {
    const t1 = setTimeout(() => {
      p1AgeVal.value = withTiming(player1.brainAge, { duration: 1500 })
      p2AgeVal.value = withTiming(player2.brainAge, { duration: 1500 })
    }, 1600)
    const t2 = setTimeout(() => setShowWinner(true), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const winnerName = winner === 1 ? player1.name : winner === 2 ? player2.name : null
  const winnerColor = winner === 1 ? player1.color : winner === 2 ? player2.color : colors.amber

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Winner banner */}
      {showWinner && (
        <MotiView
          from={{ translateY: -60, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          style={[styles.winnerBanner, { borderColor: winnerColor }]}
        >
          <Text style={[styles.winnerText, { color: winnerColor }]}>
            {winnerName ? `${winnerName} Wins! 🏆` : "It's a Tie! 🤝"}
          </Text>
        </MotiView>
      )}

      {/* Player name pills */}
      <View style={styles.pillRow}>
        <View style={[styles.pill, { borderColor: player1.color }]}>
          <Text style={[styles.pillText, { color: player1.color }]}>{player1.name}</Text>
        </View>
        <View style={[styles.pill, { borderColor: player2.color }]}>
          <Text style={[styles.pillText, { color: player2.color }]}>{player2.name}</Text>
        </View>
      </View>

      {/* Game score rows — staggered slide-in */}
      {GAMES.map((game, i) => {
        const s1 = player1.scores[i] ?? 0
        const s2 = player2.scores[i] ?? 0
        const p1Wins = s1 > s2
        const p2Wins = s2 > s1
        return (
          <MotiView
            key={game.id}
            from={{ translateX: -40, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, delay: i * 150 }}
            style={styles.gameRow}
          >
            <Text style={styles.gameLabel} numberOfLines={1}>{game.label}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={[styles.scoreCell, p1Wins && styles.winningCell]}>
                <Text style={[styles.scoreNum, { color: player1.color }]}>{s1}</Text>
              </View>
              <View style={[styles.scoreCell, p2Wins && styles.winningCell]}>
                <Text style={[styles.scoreNum, { color: player2.color }]}>{s2}</Text>
              </View>
            </View>
          </MotiView>
        )
      })}

      {/* Brain age section */}
      <View style={styles.brainSection}>
        <Text style={styles.brainLabel}>Brain Age</Text>
        <View style={styles.brainRow}>
          <View style={styles.brainCard}>
            <Text style={[styles.brainName, { color: player1.color }]}>{player1.name}</Text>
            <Text style={[styles.brainAge, { color: player1.color }]}>{displayP1Age}</Text>
          </View>
          <View style={styles.brainCard}>
            <Text style={[styles.brainName, { color: player2.color }]}>{player2.name}</Text>
            <Text style={[styles.brainAge, { color: player2.color }]}>{displayP2Age}</Text>
          </View>
        </View>
        <Text style={styles.brainHint}>Lower = sharper mind</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
    paddingBottom: 40,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    justifyContent: 'center',
  },
  pill: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  scoreCell: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: colors.bg,
  },
  winningCell: {
    backgroundColor: 'rgba(170,255,0,0.12)',
  },
  scoreNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  brainSection: {
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  brainLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brainRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  brainCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brainName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  brainAge: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  brainHint: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  winnerBanner: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
})
