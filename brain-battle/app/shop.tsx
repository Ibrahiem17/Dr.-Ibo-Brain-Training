import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { GAMES, GAME_ICONS } from '../constants/games'
import { useCoinStore } from '../store/coinStore'
import { useShopStore } from '../store/shopStore'
import { useProfileStore } from '../store/profileStore'
import { useToast } from '../hooks/useToast'
import CoinBadge from '../components/ui/CoinBadge'

const SHOP_ITEMS = GAMES.filter((g) => g.locked)

export default function Shop() {
  const balance = useCoinStore((s) => s.balance)
  const { username } = useProfileStore()
  const { owns, buy } = useShopStore()
  const { showToast } = useToast()

  const [confirmItem, setConfirmItem] = useState<(typeof SHOP_ITEMS)[number] | null>(null)
  const [buying, setBuying] = useState(false)

  const handleBuy = async () => {
    if (!confirmItem) return
    setBuying(true)
    const success = await buy(username, confirmItem.id, confirmItem.price)
    setBuying(false)
    setConfirmItem(null)
    if (success) {
      showToast(`${confirmItem.label} unlocked!`)
    } else {
      showToast('Not enough coins')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>SHOP</Text>
        <CoinBadge balance={balance} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionLabel}>UNLOCK NEW GAMES</Text>

        {SHOP_ITEMS.map((item) => {
          const isOwned = owns(item.id)
          const canAfford = balance >= item.price
          const IconComponent = GAME_ICONS[item.id]

          return (
            <View key={item.id} style={[styles.card, { borderColor: isOwned ? item.color : colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: `${item.color}12` }]}>
                <IconComponent size={48} color={item.color} />
              </View>

              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: isOwned ? item.color : colors.text }]}>
                  {item.label}
                </Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <View style={styles.diffDots}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: i < item.difficulty ? item.color : colors.border }]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.cardAction}>
                {isOwned ? (
                  <View style={[styles.ownedBadge, { borderColor: item.color }]}>
                    <Text style={[styles.ownedText, { color: item.color }]}>OWNED</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setConfirmItem(item)}
                    style={[
                      styles.buyBtn,
                      { borderColor: canAfford ? item.color : colors.border },
                      canAfford && { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <Text style={[styles.buyPrice, { color: canAfford ? item.color : colors.muted }]}>
                      🪙 {item.price}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )
        })}

        <Text style={styles.hint}>Earn coins by surviving Endless Mode rounds</Text>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmItem !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Unlock {confirmItem?.label}?</Text>
            <Text style={styles.modalBody}>
              This will cost{' '}
              <Text style={{ color: colors.gold, fontWeight: '900' }}>
                🪙 {confirmItem?.price}
              </Text>{' '}
              coins.{'\n'}Balance after: 🪙 {(balance - (confirmItem?.price ?? 0))}
            </Text>

            <View style={styles.modalBtns}>
              <Pressable onPress={() => setConfirmItem(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBuy}
                disabled={buying}
                style={[styles.confirmBtn, { borderColor: confirmItem?.color ?? colors.gold }]}
              >
                <Text style={[styles.confirmText, { color: confirmItem?.color ?? colors.gold }]}>
                  {buying ? '...' : 'Buy'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  list: { padding: 20, gap: 14, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 2, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  diffDots: { flexDirection: 'row', gap: 4, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  cardAction: { alignItems: 'center' },
  buyBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buyPrice: { fontSize: 13, fontWeight: '800' },
  ownedBadge: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ownedText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    width: '100%',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  modalBody: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '900' },
})
