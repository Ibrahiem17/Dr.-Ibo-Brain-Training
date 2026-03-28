import { useState, useRef, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../../constants/colors'
import { useEndlessStore } from '../../../store/endlessStore'
import { useCoinStore } from '../../../store/coinStore'
import MentalMath from '../../../components/games/MentalMath'
import GridMemory from '../../../components/games/GridMemory'
import StroopTest from '../../../components/games/StroopTest'
import NumberSequence from '../../../components/games/NumberSequence'
import FallingBlocks from '../../../components/games/FallingBlocks'
import ExplodingCube from '../../../components/games/ExplodingCube'
import FlagDirection from '../../../components/games/FlagDirection'
import ReactionTap from '../../../components/games/ReactionTap'
import SymbolCipher from '../../../components/games/SymbolCipher'
import QuitButton from '../../../components/ui/QuitButton'
import QuitConfirmDialog from '../../../components/ui/QuitConfirmDialog'
import { useQuitGame } from '../../../hooks/useQuitGame'

type Phase = 'playing' | 'round_won'

export default function EndlessGame() {
  const { gameId, playerName, playerColor, endlessRound, advanceRound } = useEndlessStore()
  const earn = useCoinStore((s) => s.earn)

  const [phase, setPhase] = useState<Phase>('playing')
  const [gameKey, setGameKey] = useState(0)
  const [quitVisible, setQuitVisible] = useState(false)
  const savedRef = useRef(false)

  const { handleConfirmQuit } = useQuitGame('endless')

  const handleGameComplete = useCallback(
    (_score: number, _timeMs: number, accuracy: number) => {
      if (savedRef.current) return
      savedRef.current = true

      const correct = accuracy > 0

      if (correct) {
        // Earn coin for surviving this round
        earn(playerName, 1)
        advanceRound()
        setPhase('round_won')
      } else {
        // Game over — navigate with rounds_survived = endlessRound - 1
        router.replace('/endless/gameover' as Parameters<typeof router.replace>[0])
      }
    },
    [playerName, endlessRound, earn, advanceRound],
  )

  const handleNext = () => {
    savedRef.current = false
    setGameKey((k) => k + 1)
    setPhase('playing')
  }

  // Animations for round_won overlay
  const overlayOp = useSharedValue(0)
  const coinScale = useSharedValue(0.3)

  const showOverlay = phase === 'round_won'
  if (showOverlay && overlayOp.value === 0) {
    overlayOp.value = withTiming(1, { duration: 250 })
    coinScale.value = withDelay(100, withSpring(1.0, { damping: 10, stiffness: 200 }))
  }

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOp.value }))
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinScale.value }] }))

  const GameComponent = GAME_MAP[gameId ?? '']

  if (!GameComponent || !gameId) {
    return (
      <View style={styles.error}>
        <Text style={{ color: colors.muted }}>Unknown game</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Round indicator */}
      <View style={styles.roundBadge}>
        <Text style={styles.roundText}>ROUND {endlessRound}</Text>
      </View>

      {phase === 'playing' && (
        <GameComponent
          key={gameKey}
          onGameComplete={handleGameComplete}
          endlessMode
          endlessRound={endlessRound}
        />
      )}

      {/* Quit button */}
      <QuitButton onPress={() => setQuitVisible(true)} />
      <QuitConfirmDialog
        visible={quitVisible}
        mode="endless"
        onConfirm={handleConfirmQuit}
        onCancel={() => setQuitVisible(false)}
      />

      {/* Between-round overlay */}
      {phase === 'round_won' && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
          <SafeAreaView style={styles.overlayInner}>
            <Text style={[styles.survivedText, { color: playerColor }]}>SURVIVED!</Text>

            <Animated.Text style={[styles.coinEarned, coinStyle]}>+🪙 1</Animated.Text>

            <Text style={styles.nextRoundLabel}>
              ROUND <Text style={{ color: colors.gold }}>{endlessRound}</Text> NEXT
            </Text>

            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>NEXT ROUND →</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  )
}

type GameProps = {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

const GAME_MAP: Record<string, React.ComponentType<GameProps>> = {
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

const styles = StyleSheet.create({
  error: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  roundBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 8,
  },
  roundText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 2,
    backgroundColor: colors.bg + 'cc',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
  },
  overlay: {
    backgroundColor: colors.bg + 'f2',
    zIndex: 50,
  },
  overlayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 32,
  },
  survivedText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
  },
  coinEarned: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.gold,
  },
  nextRoundLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
  },
  nextBtn: {
    marginTop: 8,
    backgroundColor: colors.gold + '22',
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 2,
  },
})
