import { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useSettingsStore } from '../store/settingsStore'
import { colors, playerColors } from '../constants/colors'
import { clearHistory, resetAllData } from '../db/queries'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function ToggleRow({ label, value, onToggle, last }: { label: string; value: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.row, last && styles.rowLast]} onPress={onToggle}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  )
}

function ColorPicker({ label, value, onChange, last }: { label: string; value: string; onChange: (c: string) => void; last?: boolean }) {
  return (
    <View style={[styles.colorRow, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.swatches}>
        {playerColors.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchSelected]}
          />
        ))}
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const {
    muted, toggleMute,
    hapticsEnabled, toggleHaptics,
    player1Color, setPlayer1Color,
    player2Color, setPlayer2Color,
  } = useSettingsStore()

  const [clearingHistory, setClearingHistory] = useState(false)
  const [resettingAll, setResettingAll] = useState(false)

  const confirmClearHistory = async () => {
    try { await clearHistory() } catch { /* ignore */ } finally { setClearingHistory(false) }
  }

  const confirmResetAll = async () => {
    try { await resetAllData() } catch { /* ignore */ } finally { setResettingAll(false) }
  }

  const version = Constants.expoConfig?.version ?? '1.0.0'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="SOUND">
          <ToggleRow label="Sound effects" value={!muted} onToggle={toggleMute} />
          <ToggleRow label="Haptics" value={hapticsEnabled} onToggle={toggleHaptics} last />
        </Section>

        <Section title="DISPLAY">
          <ColorPicker label="Player 1 colour" value={player1Color} onChange={setPlayer1Color} />
          <ColorPicker label="Player 2 colour" value={player2Color} onChange={setPlayer2Color} last />
        </Section>

        <Section title="DATA">
          {clearingHistory ? (
            <View style={[styles.confirmRow]}>
              <Text style={styles.confirmText}>Clear all game history?</Text>
              <View style={styles.confirmBtns}>
                <Pressable style={styles.confirmCancel} onPress={() => setClearingHistory(false)}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmDestroy} onPress={confirmClearHistory}>
                  <Text style={styles.confirmDestroyText}>Clear</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.row} onPress={() => setClearingHistory(true)}>
              <Text style={styles.rowLabel}>Clear history</Text>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          )}

          {resettingAll ? (
            <View style={[styles.confirmRow, styles.rowLast]}>
              <Text style={styles.confirmText}>Reset ALL data including players?</Text>
              <View style={styles.confirmBtns}>
                <Pressable style={styles.confirmCancel} onPress={() => setResettingAll(false)}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmDestroy} onPress={confirmResetAll}>
                  <Text style={styles.confirmDestroyText}>Reset</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={[styles.row, styles.rowLast]} onPress={() => setResettingAll(true)}>
              <Text style={[styles.rowLabel, { color: colors.accent2 }]}>Reset all data</Text>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          )}
        </Section>

        <Section title="ABOUT">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Made by</Text>
            <Text style={styles.rowValue}>Dr. Ibo</Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.muted },
  rowChevron: { fontSize: 20, color: colors.muted, fontWeight: '300' },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackOn: { backgroundColor: colors.accent + '60' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.muted,
  },
  toggleThumbOn: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
  },
  colorRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  swatches: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatch: { width: 30, height: 30, borderRadius: 15, opacity: 0.75 },
  swatchSelected: { opacity: 1, borderWidth: 3, borderColor: colors.text },
  confirmRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  confirmText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancel: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  confirmCancelText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  confirmDestroy: {
    flex: 1,
    backgroundColor: colors.accent2 + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent2,
    paddingVertical: 8,
    alignItems: 'center',
  },
  confirmDestroyText: { fontSize: 13, color: colors.accent2, fontWeight: '600' },
})
