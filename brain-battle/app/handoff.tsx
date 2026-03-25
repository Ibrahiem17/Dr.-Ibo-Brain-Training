import { View } from 'react-native'
import { router } from 'expo-router'
import { useSessionStore } from '../store/sessionStore'
import { GAMES } from '../constants/games'
import { colors } from '../constants/colors'
import HandoffScreen from '../components/ui/HandoffScreen'

export default function HandoffRoute() {
  const { currentPlayer, currentGameIndex, player1, player2, advanceAfterHandoff } =
    useSessionStore()

  const playerData = currentPlayer === 2 ? player2 : player1
  const name = playerData?.name ?? 'Player'
  const color = playerData?.color ?? colors.accent

  const onReady = () => {
    advanceAfterHandoff()
    const gameId = GAMES[currentGameIndex].id
    router.push(`/game/${gameId}` as Parameters<typeof router.push>[0])
  }

  return (
    <View style={{ flex: 1 }}>
      <HandoffScreen playerName={name} playerColor={color} onReady={onReady} />
    </View>
  )
}
