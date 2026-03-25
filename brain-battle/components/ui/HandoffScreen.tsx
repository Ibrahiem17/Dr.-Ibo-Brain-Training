import { View, Text, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { colors } from '../../constants/colors'
import Button from './Button'

interface HandoffScreenProps {
  playerName: string
  playerColor: string
  onReady: () => void
}

export default function HandoffScreen({ playerName, playerColor, onReady }: HandoffScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Subtle color tint overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: playerColor, opacity: 0.05 }]} />

      <MotiView
        from={{ translateY: 60, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 100 }}
        style={styles.content}
      >
        <Text style={styles.passText}>Pass the phone to</Text>
        <Text style={[styles.playerName, { color: playerColor }]}>{playerName}</Text>

        <View style={styles.divider} />

        <Button label="I'm Ready" onPress={onReady} color={playerColor} size="lg" />
      </MotiView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  passText: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  playerName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: 80,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
})
