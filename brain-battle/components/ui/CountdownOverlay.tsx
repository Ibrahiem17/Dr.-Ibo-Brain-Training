import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { colors } from '../../constants/colors'

interface CountdownOverlayProps {
  gameName: string
  gameIcon: string
  playerName: string
  playerColor: string
  onComplete: () => void
}

const STEPS = ['3', '2', '1', 'GO!']

export default function CountdownOverlay({
  gameName,
  gameIcon,
  playerName,
  playerColor,
  onComplete,
}: CountdownOverlayProps) {
  const [step, setStep] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3000),
      setTimeout(() => onCompleteRef.current(), 3700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <View style={styles.container}>
      {/* Game header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{gameIcon}</Text>
        <Text style={styles.gameName}>{gameName}</Text>
      </View>

      {/* Player turn */}
      <Text style={[styles.playerTurn, { color: playerColor }]}>
        {playerName}'s turn
      </Text>

      {/* Countdown digit — re-mounts each step to trigger animation */}
      <MotiView
        key={step}
        from={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: step < STEPS.length ? 1 : 0 }}
        exit={{ scale: 1.4, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        style={styles.countWrap}
      >
        <Text style={[styles.countText, step === 3 && { color: colors.accent3 }]}>
          {STEPS[step]}
        </Text>
      </MotiView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  header: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 40,
    color: colors.accent,
    fontWeight: '900',
  },
  gameName: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playerTurn: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  countWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 96,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -4,
  },
})
