import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated'
import { useSessionStore } from '../store/sessionStore'
import { playSound } from '../utils/sounds'
import { saveBrainAge, finaliseSession, updateStreak } from '../db/queries'
import { useStreakStore } from '../store/streakStore'
import { useCoinStore } from '../store/coinStore'
import { colors } from '../constants/colors'
import Button from '../components/ui/Button'
import ScoreReveal from '../components/ui/ScoreReveal'
import StreakBadge from '../components/ui/StreakBadge'

export default function ResultsScreen() {
  const { player1, player2, sessionId, getPlayerScores, getBrainAge, getWinner, resetSession } =
    useSessionStore()
  const { lastUpdateResult, setLastUpdateResult, setLastActiveStreak, clearUpdateResult } = useStreakStore()
  const earnCoins = useCoinStore((s) => s.earn)

  const savedRef = useRef(false)

  useEffect(() => {
    playSound('results', 1.0)
  }, [])

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
      } catch (_e) {
        // silently ignore save errors — results are still shown to the user
      }
      // Award coins for completing a full battle session
      if (player1?.name) earnCoins(player1.name, 5)
      if (player2?.name) earnCoins(player2.name, 5)
      // Update streak for both players
      if (player1?.name) {
        updateStreak(player1.name)
          .then((result) => {
            setLastUpdateResult(result)
            setLastActiveStreak({
              playerName: player1.name,
              currentStreak: result.currentStreak,
              longestStreak: result.longestStreak,
            })
          })
          .catch(() => {})
      }
      if (player2?.name) {
        updateStreak(player2.name).catch(() => {})
      }
    }
    saveData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => clearUpdateResult()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Streak notification fade-in animation
  const streakOp = useSharedValue(0)
  useEffect(() => {
    streakOp.value = withDelay(1000, withTiming(1, { duration: 400 }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const streakNotifStyle = useAnimatedStyle(() => ({ opacity: streakOp.value }))

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
      {lastUpdateResult?.isNewDay && (
        <Animated.View style={[styles.streakNotif, streakNotifStyle]}>
          {lastUpdateResult.streakBroken ? (
            <>
              <Text style={styles.streakNotifIcon}>💔</Text>
              <Text style={styles.streakNotifText}>Streak reset — start a new one!</Text>
              <StreakBadge streak={1} size="sm" />
            </>
          ) : lastUpdateResult.isNewRecord ? (
            <>
              <Text style={styles.streakNotifIcon}>🏆</Text>
              <Text style={styles.streakNotifText}>New streak record!</Text>
              <StreakBadge streak={lastUpdateResult.currentStreak} size="sm" />
            </>
          ) : (
            <>
              <Text style={styles.streakNotifIcon}>🔥</Text>
              <Text style={styles.streakNotifText}>
                {lastUpdateResult.currentStreak === 1
                  ? 'Streak started! Come back tomorrow!'
                  : `${lastUpdateResult.currentStreak} day streak!`}
              </Text>
              <StreakBadge streak={lastUpdateResult.currentStreak} size="sm" />
            </>
          )}
        </Animated.View>
      )}
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
  streakNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    alignSelf: 'center',
  },
  streakNotifIcon: { fontSize: 18 },
  streakNotifText: { fontSize: 12, color: colors.muted, flex: 1 },
})
