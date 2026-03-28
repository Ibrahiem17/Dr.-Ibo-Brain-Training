import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
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
import { GAMES, GAME_ICONS } from '../../constants/games'
import { useQuickPlayStore } from '../../store/quickPlayStore'
import { useShopStore } from '../../store/shopStore'

type Game = typeof GAMES[number]

interface GameCardProps {
  game: Game
  selected: boolean
  locked: boolean
  onPress: () => void
}

function GameCard({ game, selected, locked, onPress }: GameCardProps) {
  const scale = useSharedValue(1)
  const IconComponent = GAME_ICONS[game.id]

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePress = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Animated.View style={[animStyle, styles.cardWrapper]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          { borderLeftColor: locked ? colors.border : game.color },
          selected && !locked && {
            borderColor: game.color,
            borderWidth: 2,
            shadowColor: game.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
            elevation: 8,
          },
        ]}
      >
        {/* Icon area */}
        <View style={[styles.iconArea, { backgroundColor: locked ? `${colors.border}18` : `${game.color}10` }]}>
          <IconComponent size={72} color={locked ? colors.muted : game.color} />
        </View>

        {/* Accent line */}
        <View style={[styles.accentLine, { backgroundColor: locked ? colors.border : game.color }]} />

        {/* Info area */}
        <View style={styles.infoArea}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.gameName, { color: locked ? colors.muted : selected ? game.color : colors.text }]}
              numberOfLines={1}
            >
              {game.label.toUpperCase()}
            </Text>
            {locked ? (
              <Text style={styles.lockIcon}>🔒</Text>
            ) : (
              <View style={styles.dots}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i < game.difficulty ? game.color : colors.border },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
          <Text style={styles.desc} numberOfLines={1}>
            {locked ? `🪙 ${game.price} · Unlock in Shop` : game.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function QuickPlaySelect() {
  const { player1, isSolo, selectGame: storeSelectGame } = useQuickPlayStore()
  const { owns } = useShopStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const playBtnTranslate = useSharedValue(80)
  const playBtnOpacity = useSharedValue(0)

  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: playBtnTranslate.value }],
    opacity: playBtnOpacity.value,
  }))

  const handleSelect = (game: Game) => {
    if (game.locked && !owns(game.id)) {
      router.push('/shop')
      return
    }
    if (selectedId !== game.id) {
      setSelectedId(game.id)
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

  const headerSubtitle = isSolo
    ? 'Choose a game'
    : `${player1?.name ?? 'Player 1'}'s turn to choose`

  const data = [...GAMES] as Game[]
  const paddedData: (Game | null)[] = data.length % 2 === 0 ? data : [...data, null]

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
          if (!item) return <View style={styles.cardWrapper} />
          return (
            <GameCard
              game={item}
              selected={selectedId === item.id}
              locked={item.locked && !owns(item.id)}
              onPress={() => handleSelect(item)}
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
            selectedGame && {
              borderColor: selectedGame.color,
              backgroundColor: selectedGame.color + '33',
            },
          ]}
        >
          <Text
            style={[
              styles.playLabel,
              selectedGame && { color: selectedGame.color },
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
    padding: 16,
    gap: 10,
    paddingBottom: 120,
  },
  row: { gap: 10 },
  cardWrapper: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  iconArea: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  accentLine: {
    height: 1.5,
    opacity: 0.6,
  },
  infoArea: {
    padding: 10,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    flex: 1,
  },
  lockIcon: { fontSize: 12 },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  desc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
    fontWeight: '500',
  },
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
