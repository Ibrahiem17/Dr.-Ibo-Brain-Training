import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'

interface Props {
  balance: number
  onPress?: () => void
}

export default function CoinBadge({ balance, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.badge}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.icon}>🪙</Text>
      <Text style={styles.amount}>{balance}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold + '60',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  icon: {
    fontSize: 14,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
})
