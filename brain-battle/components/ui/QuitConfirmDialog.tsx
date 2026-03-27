import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { colors } from '../../constants/colors'
import type { GameMode } from '../../hooks/useQuitGame'

const MODE_MESSAGES: Record<GameMode, string> = {
  battle: 'Your current battle progress will be lost.',
  solo: 'Your current solo session progress will be lost.',
  quickplay: 'Your current quick-play game will be lost.',
  endless: 'Your endless run will end. Coins already earned are kept.',
}

interface Props {
  visible: boolean
  mode: GameMode
  onConfirm: () => void
  onCancel: () => void
}

export default function QuitConfirmDialog({ visible, mode, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Exit to Menu?</Text>
          <Text style={styles.message}>{MODE_MESSAGES[mode]}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>KEEP PLAYING</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>EXIT TO MENU</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent2 + '20',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent2,
    letterSpacing: 1,
  },
})
