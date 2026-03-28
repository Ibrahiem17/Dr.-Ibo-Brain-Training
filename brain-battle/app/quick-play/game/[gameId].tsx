import { useState, useRef, useCallback } from 'react'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { View, Text, StyleSheet, BackHandler } from 'react-native'
import { useQuickPlayStore } from '../../../store/quickPlayStore'
import { colors } from '../../../constants/colors'

import MentalMath from '../../../components/games/MentalMath'
import GridMemory from '../../../components/games/GridMemory'
import StroopTest from '../../../components/games/StroopTest'
import NumberSequence from '../../../components/games/NumberSequence'
import FallingBlocks from '../../../components/games/FallingBlocks'
import ExplodingCube from '../../../components/games/ExplodingCube'
import FlagDirection from '../../../components/games/FlagDirection'
import ReactionTap from '../../../components/games/ReactionTap'
import SymbolCipher from '../../../components/games/SymbolCipher'
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
  'reaction-tap':    ReactionTap,
  'symbol-cipher':   SymbolCipher,
}

export default function QuickPlayGame() {
  const hasNavigated = useRef(false)
  const [showQuit, setShowQuit] = useState(false)
  const { handleConfirmQuit } = useQuitGame('quickplay')
  const { gameId } = useLocalSearchParams<{ gameId: string }>()
  const { isSolo, currentPlayer, submitResult, advanceToHandoff } = useQuickPlayStore()

  const GameComponent = gameComponents[gameId ?? '']

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
      return () => sub.remove()
    }, []),
  )

  const handleComplete = (score: number, timeMs: number, accuracy: number): void => {
    if (hasNavigated.current) return
    hasNavigated.current = true

    submitResult(currentPlayer, score, timeMs, accuracy)

    if (isSolo || currentPlayer === 2) {
      router.replace('/quick-play/results')
    } else {
      advanceToHandoff()
      router.replace('/quick-play/handoff')
    }
  }

  if (!GameComponent) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Unknown game: {gameId}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <GameComponent onGameComplete={handleComplete} />
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

const styles = StyleSheet.create({
  error: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: colors.accent2, fontSize: 16 },
})
