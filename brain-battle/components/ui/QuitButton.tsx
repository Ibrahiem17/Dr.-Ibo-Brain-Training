import { Pressable, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'

interface Props {
  onPress: () => void
}

export default function QuitButton({ onPress }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { top: insets.top + 12 }]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.icon}>✕</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  icon: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '700',
  },
})
