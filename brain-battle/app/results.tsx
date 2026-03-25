import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../store/sessionStore'
import { saveBrainAge, finaliseSession } from '../db/queries'
import { colors } from '../constants/colors'
import Button from '../components/ui/Button'
import ScoreReveal from '../components/ui/ScoreReveal'

export default function ResultsScreen() {
  const { player1, player2, sessionId, getPlayerScores, getBrainAge, getWinner, resetSession } =
    useSessionStore()

  const savedRef = useRef(false)

  const p1Scores = getPlayerScores(1)
  const p2Scores = getPlayerScores(2)
  const p1BrainAge = getBrainAge(1)
  const p2BrainAge = getBrainAge(2)
  const winner = getWinner()

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const saveData = async () => {
      if (!player1 || !player2 || !sessionId) return
      try {
        await saveBrainAge(player1.id, sessionId, p1BrainAge, p1Scores.reduce((a, b) => a + b, 0))
        await saveBrainAge(player2.id, sessionId, p2BrainAge, p2Scores.reduce((a, b) => a + b, 0))
        const winnerId =
          winner === 1 ? player1.id : winner === 2 ? player2.id : player1.id
        await finaliseSession(sessionId, winnerId)
      } catch (e) {
        console.warn('Results save error', e)
      }
    }
    saveData()
  }, [])

  if (!player1 || !player2) {
    return (
      <View style={styles.fallback}>
        <Text style={{ color: colors.text }}>Loading results…</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScoreReveal
        player1={{ name: player1.name, color: player1.color, scores: p1Scores, brainAge: p1BrainAge }}
        player2={{ name: player2.name, color: player2.color, scores: p2Scores, brainAge: p2BrainAge }}
        winner={winner}
      />
      <View style={styles.bottomBar}>
        <Button
          label="Play Again"
          onPress={() => { resetSession(); router.replace('/setup') }}
          color={colors.accent}
          size="md"
        />
        <Button
          label="Home"
          onPress={() => { resetSession(); router.replace('/') }}
          color={colors.muted}
          size="md"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
