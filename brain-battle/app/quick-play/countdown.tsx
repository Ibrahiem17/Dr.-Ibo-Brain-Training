import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useQuickPlayStore } from '../../store/quickPlayStore'
import { GAMES } from '../../constants/games'
import CountdownOverlay from '../../components/ui/CountdownOverlay'
import { colors } from '../../constants/colors'
import { useState } from 'react'
import { View } from 'react-native'
import { useQuitGame } from '../../hooks/useQuitGame'
import QuitButton from '../../components/ui/QuitButton'
import QuitConfirmDialog from '../../components/ui/QuitConfirmDialog'

export default function QuickPlayCountdown() {
  const { selectedGameId, currentPlayer, player1, player2, isSolo } = useQuickPlayStore()

  const game = GAMES.find((g) => g.id === selectedGameId) ?? GAMES[0]
  const playerData = currentPlayer === 1 ? player1 : player2
  const playerName = playerData?.name ?? 'Player'
  const playerColor = playerData?.color ?? colors.accent
  const [showQuit, setShowQuit] = useState(false)
  const { handleConfirmQuit } = useQuitGame('quickplay')

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const handleComplete = () => {
    router.replace(`/quick-play/game/${game.id}` as Parameters<typeof router.replace>[0])
  }

  return (
    <View style={{ flex: 1 }}>
      <CountdownOverlay
        gameName={game.label}
        gameIcon={game.icon}
        playerName={playerName}
        playerColor={playerColor}
        onComplete={handleComplete}
      />
      <QuitButton onPress={() => setShowQuit(true)} />
      <QuitConfirmDialog
        visible={showQuit}
        mode="quickplay"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuit(false)}
      />
    </View>
  )
}
