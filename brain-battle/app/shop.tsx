import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { useCoinStore } from '../store/coinStore'
import CoinBadge from '../components/ui/CoinBadge'

export default function Shop() {
  const balance = useCoinStore((s) => s.balance)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>SHOP</Text>
        <CoinBadge balance={balance} />
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Coming Soon</Text>
        <Text style={styles.emptyHint}>
          Spend your coins on themes, power-ups and more.{'\n'}Keep playing to stock up!
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backBtn: {},
  backText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22 },
})
