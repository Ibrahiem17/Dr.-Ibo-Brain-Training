import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { GAMES, GAME_ICONS } from '../../constants/games'
import { useEndlessStore } from '../../store/endlessStore'
import { useProfileStore } from '../../store/profileStore'
import { useCoinStore } from '../../store/coinStore'
import { useShopStore } from '../../store/shopStore'
import Button from '../../components/ui/Button'

export default function EndlessSetup() {
  const { username, color, isProfileLoaded } = useProfileStore()
  const coinBalance = useCoinStore((s) => s.balance)
  const { owns } = useShopStore()
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const setup = useEndlessStore((s) => s.setup)

  if (!isProfileLoaded) return null

  const canStart = selectedGameId !== null

  const handleStart = () => {
    if (!canStart || !selectedGameId) return
    setup(selectedGameId, username, color)
    router.push('/endless/countdown' as Parameters<typeof router.push>[0])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>ENDLESS MODE</Text>
          <Text style={styles.subtitle}>Survive as many rounds as you can</Text>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { borderColor: color }]}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color }]}>{username}</Text>
            <Text style={styles.profileLabel}>YOUR PROFILE</Text>
          </View>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>🪙 {coinBalance}</Text>
          </View>
        </View>

        {/* Game picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PICK A GAME</Text>
          <View style={styles.gameGrid}>
            {GAMES.map((game) => {
              const selected = selectedGameId === game.id
              const isLocked = game.locked && !owns(game.id)
              const IconComponent = GAME_ICONS[game.id]
              return (
                <Pressable
                  key={game.id}
                  onPress={() => {
                    if (isLocked) { router.push('/shop'); return }
                    setSelectedGameId(game.id)
                  }}
                  style={[
                    styles.gameCard,
                    { borderColor: selected ? game.color : colors.border },
                    selected && { backgroundColor: `${game.color}18` },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: isLocked ? `${colors.border}18` : `${game.color}12` }]}>
                    <IconComponent size={40} color={isLocked ? colors.muted : game.color} />
                  </View>
                  <Text style={[styles.gameLabel, { color: isLocked ? colors.muted : selected ? game.color : colors.text }]}>
                    {game.label}
                  </Text>
                  {isLocked && <Text style={styles.lockBadge}>🔒</Text>}
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Start */}
        <View style={styles.startWrap}>
          <Button
            label="START ENDLESS"
            onPress={handleStart}
            disabled={!canStart}
            color={colors.gold}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, gap: 28, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: colors.gold, letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
  },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  profileName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  profileLabel: { fontSize: 10, color: colors.muted, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  coinBadge: {
    backgroundColor: colors.gold + '22',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  coinText: { fontSize: 14, fontWeight: '800', color: colors.gold },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 2 },
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gameCard: {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  startWrap: { marginTop: 8 },
  lockBadge: { fontSize: 11, position: 'absolute', top: 6, right: 6 },
})
