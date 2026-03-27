import { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSoloStore } from '../../store/soloStore'
import { colors } from '../../constants/colors'
import CountdownOverlay from '../../components/ui/CountdownOverlay'
import { useState } from 'react'
import { View } from 'react-native'
import { useQuitGame } from '../../hooks/useQuitGame'
import QuitButton from '../../components/ui/QuitButton'
import QuitConfirmDialog from '../../components/ui/QuitConfirmDialog'

export default function SoloCountdown() {
  const { player, getCurrentGame } = useSoloStore()
  const game = getCurrentGame()
  const [showQuit, setShowQuit] = useState(false)
  const { handleConfirmQuit } = useQuitGame('solo')

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  if (!game) {
    router.replace('/solo/setup')
    return null
  }

  const handleComplete = () => {
    router.replace(`/solo/game/${game.id}` as Parameters<typeof router.replace>[0])
  }

  return (
    <View style={{ flex: 1 }}>
      <CountdownOverlay
        gameName={game.label}
        gameIcon={game.icon}
        playerName={player?.name ?? 'Player'}
        playerColor={player?.color ?? colors.accent3}
        onComplete={handleComplete}
      />
      <QuitButton onPress={() => setShowQuit(true)} />
      <QuitConfirmDialog
        visible={showQuit}
        mode="solo"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuit(false)}
      />
    </View>
  )
}
