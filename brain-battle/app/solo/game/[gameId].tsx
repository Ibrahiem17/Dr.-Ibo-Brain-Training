import { useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, BackHandler } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSoloStore } from '../../../store/soloStore'
import { colors } from '../../../constants/colors'

import MentalMath from '../../../components/games/MentalMath'
import GridMemory from '../../../components/games/GridMemory'
import StroopTest from '../../../components/games/StroopTest'
import NumberSequence from '../../../components/games/NumberSequence'
import FallingBlocks from '../../../components/games/FallingBlocks'
import ExplodingCube from '../../../components/games/ExplodingCube'
import FlagDirection from '../../../components/games/FlagDirection'
import { useQuitGame } from '../../../hooks/useQuitGame'
import QuitButton from '../../../components/ui/QuitButton'
import QuitConfirmDialog from '../../../components/ui/QuitConfirmDialog'

type OnComplete = (score: number, timeMs: number, accuracy: number) => void

const gameComponents: Record<string, React.ComponentType<{ onGameComplete: OnComplete }>> = {
  'mental-math':     MentalMath,
  'grid-memory':     GridMemory,
  'stroop-test':     StroopTest,
  'number-sequence': NumberSequence,
  'falling-blocks':  FallingBlocks,
  'exploding-cube':  ExplodingCube,
  'flag-direction':  FlagDirection,
}

export default function SoloGame() {
  const hasNavigated = useRef(false)
  const [showQuit, setShowQuit] = useState(false)
  const { handleConfirmQuit } = useQuitGame('solo')
  const {
    currentGameIndex,
    getCurrentGame,
    submitGameResult,
    goToNextGame,
    completeSession,
  } = useSoloStore()

  const currentGame = getCurrentGame()

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const handleComplete = (score: number, timeMs: number, accuracy: number): void => {
    if (hasNavigated.current || !currentGame) return
    hasNavigated.current = true

    submitGameResult({ gameId: currentGame.id, score, timeMs, accuracy })

    if (currentGameIndex < 6) {
      goToNextGame()
      router.replace('/solo/between')
    } else {
      completeSession()
      router.replace('/solo/results')
    }
  }

  if (!currentGame) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Loading game…</Text>
      </View>
    )
  }

  const GameComponent = gameComponents[currentGame.id]
  if (!GameComponent) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Unknown game: {currentGame.id}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <GameComponent onGameComplete={handleComplete} />
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

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { color: colors.muted, fontSize: 16 },
})
