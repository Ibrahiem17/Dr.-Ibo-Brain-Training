import { useState } from 'react'
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../../store/sessionStore'
import { saveGameScore } from '../../db/queries'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import CountdownOverlay from '../../components/ui/CountdownOverlay'
import Button from '../../components/ui/Button'

export default function NumberSequenceScreen() {
  const [countdownDone, setCountdownDone] = useState(false)
  const { currentPlayer, currentGameIndex, player1, player2, submitScore, sessionId } =
    useSessionStore()

  const currentPlayerData = currentPlayer === 1 ? player1 : player2
  const gameInfo = GAMES[currentGameIndex]

  const onGameComplete = async (score: number, timeMs: number, accuracy: number) => {
    const playerId = currentPlayer === 1 ? player1!.id : player2!.id
    await saveGameScore(sessionId!, playerId, gameInfo.id, score, Math.round(timeMs), accuracy)
    submitScore(currentPlayer, currentGameIndex, { score, timeMs, accuracy })
    if (currentPlayer === 1) {
      router.push('/handoff')
    } else {
      if (currentGameIndex >= 6) {
        router.push('/results')
      } else {
        router.push('/handoff')
      }
    }
  }

  if (!countdownDone) {
    return (
      <CountdownOverlay
        gameName={gameInfo.label}
        gameIcon={gameInfo.icon}
        playerName={currentPlayerData?.name ?? ''}
        playerColor={currentPlayerData?.color ?? colors.accent}
        onComplete={() => setCountdownDone(true)}
      />
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>{gameInfo.label}</Text>
      <Button label="Finish Game (dev)" onPress={() => onGameComplete(75, 5000, 0.8)} color={colors.accent} />
    </View>
  )
}
