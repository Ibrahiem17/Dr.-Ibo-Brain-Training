import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useSettingsStore } from '../store/settingsStore'
import { useProfileStore } from '../store/profileStore'
import { useCoinStore } from '../store/coinStore'
import { useStreakStore } from '../store/streakStore'
import { colors, playerColors } from '../constants/colors'
import { clearHistory, resetAllData, createOrGetPlayer, getGamesPlayedCount } from '../db/queries'
import { useToast } from '../hooks/useToast'

const NAME_REGEX = /^[a-zA-Z0-9 ]+$/
const MAX_NAME = 16

// ─── Shared sub-components ────────────────────────────────────────────────────

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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { muted, toggleMute, hapticsEnabled, toggleHaptics } = useSettingsStore()
  const { username, color, isProfileLoaded, changeUsername, changeColor, clearProfile } = useProfileStore()
  const coinBalance = useCoinStore((s) => s.balance)
  const bestStreak = useStreakStore((s) => s.lastActiveStreak?.longestStreak ?? 0)
  const { showToast } = useToast()

  // Username edit state
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  // Colour picker open state
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  // Stats
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null)

  // Data management state
  const [clearingHistory, setClearingHistory] = useState(false)
  const [resettingAll, setResettingAll] = useState(false)

  const savedRef = useRef(false)

  useEffect(() => {
    if (!username || savedRef.current) return
    savedRef.current = true
    getGamesPlayedCount(username).then(setGamesPlayed).catch(() => {})
  }, [username])

  if (!isProfileLoaded) return null

  const handleStartEditName = () => {
    setDraftName(username)
    setNameError(null)
    setEditingName(true)
  }

  const handleConfirmName = async () => {
    const trimmed = draftName.trim()
    if (!trimmed) { setNameError('Name cannot be empty.'); return }
    if (trimmed.length < 2) { setNameError('At least 2 characters.'); return }
    if (trimmed.length > MAX_NAME) { setNameError(`Max ${MAX_NAME} characters.`); return }
    if (!NAME_REGEX.test(trimmed)) { setNameError('Only letters, numbers and spaces.'); return }
    if (trimmed === username) { setEditingName(false); return }

    // Check for collision
    try {
      const existing = await createOrGetPlayer(trimmed, color)
      // If the player exists and has a different name than current, it's a collision
      if (existing.name !== username) {
        setNameError('That name is already taken.')
        return
      }
    } catch {
      // createOrGetPlayer either created or found — if found with same name it's fine
    }

    await changeUsername(trimmed)
    setEditingName(false)
    showToast('Username updated')
  }

  const handleColorChange = async (c: string) => {
    await changeColor(c)
    setColorPickerOpen(false)
  }

  const confirmClearHistory = async () => {
    try { await clearHistory() } catch { /* ignore */ } finally { setClearingHistory(false) }
  }

  const confirmResetAll = async () => {
    try {
      await resetAllData()
      await clearProfile()
    } catch { /* ignore */ } finally {
      setResettingAll(false)
      router.replace('/onboarding' as Parameters<typeof router.replace>[0])
    }
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

        {/* ── PROFILE section ────────────────────────────────────────────── */}
        <Section title="PROFILE">
          {/* Profile card */}
          <View style={[styles.profileCard, styles.rowLast]}>
            <View style={[styles.profileDot, { backgroundColor: color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileCardName, { color }]}>{username}</Text>
              <Text style={styles.profileCardSub}>One profile per device</Text>
            </View>
          </View>

          {/* Username row */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Username</Text>
            {editingName ? (
              <View style={styles.inlineEditRow}>
                <TextInput
                  value={draftName}
                  onChangeText={(t) => { setDraftName(t.slice(0, MAX_NAME)); setNameError(null) }}
                  style={styles.inlineInput}
                  maxLength={MAX_NAME}
                  autoCorrect={false}
                  autoCapitalize="words"
                  autoFocus
                />
                <Pressable onPress={handleConfirmName} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>✓</Text>
                </Pressable>
                <Pressable onPress={() => { setEditingName(false); setNameError(null) }} style={styles.cancelInlineBtn}>
                  <Text style={styles.cancelInlineBtnText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleStartEditName} style={styles.editRow}>
                <Text style={[styles.rowValue, { color }]}>{username}</Text>
                <Text style={styles.editIcon}>✎</Text>
              </Pressable>
            )}
          </View>
          {nameError ? (
            <View style={styles.nameErrorRow}>
              <Text style={styles.nameErrorText}>{nameError}</Text>
            </View>
          ) : null}

          {/* Colour row */}
          <View style={[styles.row, !colorPickerOpen && styles.rowLast]}>
            <Text style={styles.rowLabel}>Your colour</Text>
            <Pressable onPress={() => setColorPickerOpen((v) => !v)} style={styles.colorPreviewRow}>
              <View style={[styles.colorPreviewDot, { backgroundColor: color }]} />
              <Text style={styles.rowChevron}>{colorPickerOpen ? '∧' : '›'}</Text>
            </Pressable>
          </View>
          {colorPickerOpen && (
            <View style={[styles.colorPickerRow, styles.rowLast]}>
              {playerColors.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleColorChange(c)}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
                />
              ))}
            </View>
          )}
        </Section>

        {/* ── STATS section ──────────────────────────────────────────────── */}
        <Section title="STATS">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>🪙 Total coins</Text>
            <Text style={styles.rowValue}>{coinBalance}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>🔥 Best streak</Text>
            <Text style={styles.rowValue}>{bestStreak} days</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>🧠 Games played</Text>
            <Text style={styles.rowValue}>{gamesPlayed ?? '…'}</Text>
          </View>
        </Section>

        {/* ── SOUND section ──────────────────────────────────────────────── */}
        <Section title="SOUND">
          <ToggleRow label="Sound effects" value={!muted} onToggle={toggleMute} />
          <ToggleRow label="Haptics" value={hapticsEnabled} onToggle={toggleHaptics} last />
        </Section>

        {/* ── DATA section ───────────────────────────────────────────────── */}
        <Section title="DATA">
          {clearingHistory ? (
            <View style={styles.confirmRow}>
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
              <Text style={styles.confirmText}>Reset ALL data including your profile?</Text>
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

        {/* ── ABOUT section ──────────────────────────────────────────────── */}
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
  // Profile card (inside section body)
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileDot: { width: 36, height: 36, borderRadius: 18 },
  profileCardName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  profileCardSub: { fontSize: 11, color: colors.muted, marginTop: 2, letterSpacing: 0.5 },
  // Rows
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
  // Inline edit
  inlineEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  inlineInput: {
    flex: 1,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: colors.bg,
  },
  confirmBtn: {
    backgroundColor: colors.accent + '30',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  confirmBtnText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  cancelInlineBtn: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelInlineBtnText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editIcon: { fontSize: 16, color: colors.muted },
  nameErrorRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameErrorText: { fontSize: 12, color: colors.accent2, fontWeight: '600' },
  // Color picker
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorPreviewDot: { width: 22, height: 22, borderRadius: 11 },
  colorPickerRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  swatch: { width: 32, height: 32, borderRadius: 16, opacity: 0.8 },
  swatchSelected: { opacity: 1, borderWidth: 3, borderColor: colors.white },
  // Toggle
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
  // Data management confirm rows
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
