import { useCallback } from 'react'
import { View, Text, StyleSheet, BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { MotiView } from 'moti'
import { useQuickPlayStore } from '../../store/quickPlayStore'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import Button from '../../components/ui/Button'

export default function QuickPlayHandoff() {
  const { player2, selectedGameId, advanceFromHandoff } = useQuickPlayStore()

  const game = GAMES.find((g) => g.id === selectedGameId) ?? GAMES[0]
  const name = player2?.name ?? 'Player 2'
  const color = player2?.color ?? colors.accent

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const handleReady = () => {
    advanceFromHandoff()
    router.replace('/quick-play/countdown')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.05 }]} />

      <MotiView
        from={{ translateY: 60, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 100 }}
        style={styles.content}
      >
        <Text style={styles.passText}>Pass the phone to</Text>
        <Text style={[styles.playerName, { color }]}>{name}</Text>

        <View style={styles.gameReminder}>
          <Text style={styles.reminderLabel}>YOU'RE PLAYING</Text>
          <Text style={styles.reminderGame}>{game.icon}  {game.label}</Text>
        </View>

        <View style={styles.divider} />

        <Button label="I'm Ready" onPress={handleReady} color={color} size="lg" />
      </MotiView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  passText: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  playerName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  gameReminder: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  reminderLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 2,
  },
  reminderGame: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    width: 80,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
})
