import { useState, useRef, useCallback } from 'react'
import { View, BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSessionStore } from '../../store/sessionStore'
import { saveGameScore } from '../../db/queries'
import { GAMES } from '../../constants/games'
import { colors } from '../../constants/colors'
import CountdownOverlay from '../../components/ui/CountdownOverlay'
import StroopTest from '../../components/games/StroopTest'
import { useToast } from '../../hooks/useToast'
import { useQuitGame } from '../../hooks/useQuitGame'
import QuitButton from '../../components/ui/QuitButton'
import QuitConfirmDialog from '../../components/ui/QuitConfirmDialog'

export default function StroopTestScreen() {
  const [countdownDone, setCountdownDone] = useState(false)
  const [showQuit, setShowQuit] = useState(false)
  const hasNavigated = useRef(false)
  const { currentPlayer, currentGameIndex, player1, player2, submitScore, sessionId } =
    useSessionStore()
  const { showToast } = useToast()
  const { handleConfirmQuit } = useQuitGame('battle')

  const currentPlayerData = currentPlayer === 1 ? player1 : player2
  const gameInfo = GAMES[currentGameIndex]

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const onGameComplete = async (score: number, timeMs: number, accuracy: number): Promise<void> => {
    if (hasNavigated.current) return
    hasNavigated.current = true

    const playerId = currentPlayer === 1 ? player1!.id : player2!.id
    try {
      await saveGameScore(sessionId!, playerId, gameInfo.id, score, Math.round(timeMs), accuracy)
    } catch {
      showToast("Couldn't save score. Please try again.")
    }
    submitScore(currentPlayer, currentGameIndex, { score, timeMs, accuracy })
    if (currentPlayer === 1) {
      router.replace('/handoff')
    } else {
      if (currentGameIndex >= 6) {
        router.replace('/results')
      } else {
        router.replace('/handoff')
      }
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {!countdownDone ? (
        <CountdownOverlay
          gameName={gameInfo.label}
          gameIcon={gameInfo.icon}
          playerName={currentPlayerData?.name ?? ''}
          playerColor={currentPlayerData?.color ?? colors.accent}
          onComplete={() => setCountdownDone(true)}
        />
      ) : (
        <StroopTest onGameComplete={onGameComplete} />
      )}
      <QuitButton onPress={() => setShowQuit(true)} />
      <QuitConfirmDialog
        visible={showQuit}
        mode="battle"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuit(false)}
      />
    </View>
  )
}
