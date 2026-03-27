import { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSessionStore } from '../store/sessionStore'
import { GAMES } from '../constants/games'
import { colors } from '../constants/colors'
import HandoffScreen from '../components/ui/HandoffScreen'
import { useQuitGame } from '../hooks/useQuitGame'

export default function HandoffRoute() {
  const { currentPlayer, currentGameIndex, player1, player2, advanceAfterHandoff } =
    useSessionStore()
  const { handleConfirmQuit } = useQuitGame('battle')

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const playerData = currentPlayer === 2 ? player2 : player1
  const name = playerData?.name ?? 'Player'
  const color = playerData?.color ?? colors.accent

  const onReady = () => {
    advanceAfterHandoff()
    const gameId = GAMES[currentGameIndex].id
    router.replace(`/game/${gameId}` as Parameters<typeof router.replace>[0])
  }

  return (
    <View style={{ flex: 1 }}>
      <HandoffScreen playerName={name} playerColor={color} onReady={onReady} />
      <Pressable onPress={handleConfirmQuit} style={styles.quitLink}>
        <Text style={styles.quitLinkText}>Quit to Home</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  quitLink: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    padding: 8,
  },
  quitLinkText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
