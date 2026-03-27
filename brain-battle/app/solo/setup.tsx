import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { colors } from '../../constants/colors'
import { useSoloStore } from '../../store/soloStore'
import { useProfileStore } from '../../store/profileStore'
import { getPlayerPersonalBest } from '../../db/queries'
import Button from '../../components/ui/Button'

export default function SoloSetup() {
  const { setPlayer, setPersonalBest } = useSoloStore()
  const { username, color, isProfileLoaded } = useProfileStore()
  const [localBest, setLocalBest] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    getPlayerPersonalBest(username)
      .then((best) => { if (!cancelled) setLocalBest(best) })
      .catch(() => { if (!cancelled) setLocalBest(null) })
    return () => { cancelled = true }
  }, [username])

  if (!isProfileLoaded) return null

  const handleGo = () => {
    setPlayer({ id: null, name: username, color })
    setPersonalBest(localBest ?? null)
    router.push('/solo/pregame')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent3 }]}>SOLO MODE</Text>
      <Text style={styles.sub}>Train your brain. Beat your best.</Text>

      {/* Profile card */}
      <View style={[styles.profileCard, { borderColor: color }]}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <View>
          <Text style={[styles.profileName, { color }]}>{username}</Text>
          <Text style={styles.profileLabel}>YOUR PROFILE</Text>
        </View>
      </View>

      {/* Personal best */}
      <View style={styles.bestBox}>
        {localBest === undefined ? (
          <Text style={styles.bestText}>Looking up history…</Text>
        ) : localBest !== null ? (
          <Text style={styles.bestText}>
            Your best brain age: <Text style={[styles.bestNum, { color: colors.accent3 }]}>{localBest}</Text>
          </Text>
        ) : (
          <Text style={styles.bestText}>No previous scores — this will be your first!</Text>
        )}
      </View>

      <Button
        label="LET'S GO"
        onPress={handleGo}
        color={colors.accent3}
        size="lg"
        fullWidth
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 20 },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: 3 },
  sub: { fontSize: 14, color: colors.muted, fontWeight: '500', marginBottom: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  bestBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bestText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  bestNum: { fontWeight: '900' },
})
