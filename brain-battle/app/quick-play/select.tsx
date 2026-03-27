import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '../../constants/colors'
import { GAMES } from '../../constants/games'
import { useQuickPlayStore } from '../../store/quickPlayStore'

const { width: W } = Dimensions.get('window')
const PADDING = 16
const GAP = 12
const CARD_WIDTH = (W - PADDING * 2 - GAP) / 2

const GAME_META: Record<string, { color: string; description: string; difficulty: number }> = {
  'mental-math':     { color: colors.accent,  description: 'Solve fast',          difficulty: 2 },
  'grid-memory':     { color: colors.accent2, description: 'Count the lit balls',  difficulty: 2 },
  'stroop-test':     { color: colors.accent3, description: 'Name the ink colour',  difficulty: 1 },
  'number-sequence': { color: colors.amber,   description: 'Repeat the digits',    difficulty: 3 },
  'falling-blocks':  { color: '#c084fc',      description: 'Watch & count',        difficulty: 3 },
  'exploding-cube':  { color: '#f97316',      description: 'Find the pieces',      difficulty: 3 },
  'flag-direction':  { color: '#34d399',      description: 'Copy the sequence',    difficulty: 2 },
}

interface GameCardProps {
  gameId: string
  label: string
  icon: string
  selected: boolean
  onPress: () => void
}

function GameCard({ gameId, label, icon, selected, onPress }: GameCardProps) {
  const meta = GAME_META[gameId] ?? { color: colors.accent, description: '', difficulty: 1 }
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePress = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          { borderLeftColor: meta.color, borderLeftWidth: 3 },
          selected && {
            borderColor: meta.color,
            borderWidth: 2,
            backgroundColor: meta.color + '14',
          },
        ]}
      >
        <Text style={[styles.cardIcon, { color: meta.color }]}>{icon}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDesc}>{meta.description}</Text>

        <View style={styles.difficultyRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i < meta.difficulty ? meta.color : colors.border },
              ]}
            />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function QuickPlaySelect() {
  const { player1, isSolo, selectGame: storeSelectGame } = useQuickPlayStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const playBtnTranslate = useSharedValue(80)
  const playBtnOpacity = useSharedValue(0)

  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: playBtnTranslate.value }],
    opacity: playBtnOpacity.value,
  }))

  const handleSelect = (gameId: string) => {
    if (selectedId !== gameId) {
      setSelectedId(gameId)
      playBtnTranslate.value = withSpring(0, { damping: 18, stiffness: 200 })
      playBtnOpacity.value = withTiming(1, { duration: 250 })
    }
  }

  const handlePlay = () => {
    if (!selectedId) return
    storeSelectGame(selectedId)
    router.push('/quick-play/countdown')
  }

  const selectedGame = GAMES.find((g) => g.id === selectedId)
  const selectedMeta = selectedId ? GAME_META[selectedId] : null

  const headerSubtitle = isSolo
    ? 'Choose a game'
    : `${player1?.name ?? 'Player 1'}'s turn to choose`

  const data = [...GAMES] as { id: string; label: string; icon: string }[]
  // Pad to even number so grid looks balanced
  const paddedData: (typeof data[0] | null)[] =
    data.length % 2 === 0 ? data : [...data, null]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>CHOOSE YOUR GAME</Text>
          <Text style={styles.headerSub}>{headerSubtitle}</Text>
        </View>
      </View>

      <FlatList
        data={paddedData}
        keyExtractor={(_, i) => String(i)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          if (!item) {
            return <View style={{ width: CARD_WIDTH }} />
          }
          return (
            <GameCard
              gameId={item.id}
              label={item.label}
              icon={item.icon}
              selected={selectedId === item.id}
              onPress={() => handleSelect(item.id)}
            />
          )
        }}
      />

      {/* Play button — slides up when a game is selected */}
      <Animated.View style={[styles.playBar, playBtnStyle]}>
        <Pressable
          onPress={handlePlay}
          style={[
            styles.playButton,
            selectedMeta && {
              borderColor: selectedMeta.color,
              backgroundColor: selectedMeta.color + '33',
            },
          ]}
        >
          <Text
            style={[
              styles.playLabel,
              selectedMeta && { color: selectedMeta.color },
            ]}
          >
            PLAY {selectedGame?.label.toUpperCase() ?? ''}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: 4 },
  backText: { color: colors.muted, fontSize: 22, fontWeight: '700' },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 1.5,
  },
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  grid: {
    padding: PADDING,
    gap: GAP,
    paddingBottom: 120,
  },
  row: { gap: GAP },
  card: {
    width: CARD_WIDTH,
    height: 160,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  cardIcon: { fontSize: 48, fontWeight: '900', lineHeight: 56 },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  playBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playButton: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.accent,
  },
})
