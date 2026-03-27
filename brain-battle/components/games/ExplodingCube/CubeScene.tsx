import { useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
  makeMutable,
  type SharedValue,
} from 'react-native-reanimated'
import type { CubeletState, CubePhase } from './useExplodingCube'
import { TARGET_COLOR } from './useExplodingCube'
import { colors } from '../../../constants/colors'

const CUBELET_SIZE = 36
const GAP = 3
const COLS = 9
const ROWS = 3
const CANVAS_HEIGHT = 420
const EXPLOSION_DURATION = 1600

// ─── Scatter helpers ───────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function computeScatterPositions(
  count: number,
  canvasW: number,
): Array<[number, number]> {
  const margin = CUBELET_SIZE
  const usableW = canvasW - margin * 2
  const usableH = CANVAS_HEIGHT - margin * 2

  const numCols = 6
  const numRows = 5
  const zoneW = usableW / numCols
  const zoneH = usableH / numRows

  // Shuffle zone indices
  const zones = Array.from({ length: numCols * numRows }, (_, i) => i)
  for (let i = zones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[zones[i], zones[j]] = [zones[j], zones[i]]
  }

  return Array.from({ length: count }, (_, i) => {
    const zoneIdx = zones[i % zones.length]
    const zCol = zoneIdx % numCols
    const zRow = Math.floor(zoneIdx / numCols)

    const centerX = margin + zCol * zoneW + zoneW / 2
    const centerY = margin + zRow * zoneH + zoneH / 2

    const jX = (Math.random() - 0.5) * zoneW * 0.6
    const jY = (Math.random() - 0.5) * zoneH * 0.6

    return [
      Math.max(margin, Math.min(canvasW - margin, centerX + jX)),
      Math.max(margin, Math.min(CANVAS_HEIGHT - margin, centerY + jY)),
    ] as [number, number]
  })
}

// ─── CubeletView ──────────────────────────────────────────────────────────────

interface CubeletViewProps {
  cubelet: CubeletState
  offsetX: SharedValue<number>
  offsetY: SharedValue<number>
  rotZ: SharedValue<number>
  overlayOpacity: SharedValue<number>
  left: number
  top: number
  phase: CubePhase
  onPress: () => void
}

function CubeletView({
  cubelet, offsetX, offsetY, rotZ, overlayOpacity,
  left, top, phase, onPress,
}: CubeletViewProps) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { rotateZ: `${rotZ.value}rad` },
    ],
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }))

  const isSelected = cubelet.isSelected
  const borderColor = isSelected ? '#4488ff' : colors.border
  const bgColor = isSelected ? 'rgba(68,136,255,0.25)' : 'rgba(255,255,255,0.06)'

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          left,
          top,
          width: CUBELET_SIZE,
          height: CUBELET_SIZE,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: bgColor,
          overflow: 'hidden',
        },
      ]}
    >
      {/* Pink overlay — shown during study, fades during explosion */}
      <Animated.View
        style={[
          overlayStyle,
          StyleSheet.absoluteFill,
          { backgroundColor: TARGET_COLOR, borderRadius: 4, opacity: overlayOpacity },
        ]}
      />
      {/* Tap target — only active during selecting */}
      {phase === 'selecting' && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        />
      )}
    </Animated.View>
  )
}

// ─── CubeScene ────────────────────────────────────────────────────────────────

interface Props {
  cubelets: CubeletState[]
  phase: CubePhase
  onExplosionComplete: () => void
  onSelectCubelet: (id: number) => void
}

export default function CubeScene({ cubelets, phase, onExplosionComplete, onSelectCubelet }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const canvasW = windowWidth - 40  // matches paddingHorizontal: 20 × 2 in parent

  // Per-cubelet SharedValues — created once per mount (key=round from parent)
  const offsetXs = useRef(Array.from({ length: 27 }, () => makeMutable(0))).current
  const offsetYs = useRef(Array.from({ length: 27 }, () => makeMutable(0))).current
  const rotZs = useRef(Array.from({ length: 27 }, () => makeMutable(0))).current
  // Overlay opacity: 1 for targets, 0 for others (shown during study)
  const overlayOpacities = useRef(
    Array.from({ length: 27 }, (_, i) => makeMutable(cubelets[i]?.isTarget ? 1 : 0))
  ).current

  // Per-cubelet random rotation targets — computed once per mount
  const rotTargetsRef = useRef(
    Array.from({ length: 27 }, () => (Math.random() - 0.5) * Math.PI * 2.5)
  ).current

  // Scatter positions computed once when explosion starts
  const scatterPositionsRef = useRef<Array<[number, number]> | null>(null)

  // Grid layout constants
  const gridW = COLS * CUBELET_SIZE + (COLS - 1) * GAP
  const gridH = ROWS * CUBELET_SIZE + (ROWS - 1) * GAP
  const gridOffsetX = (canvasW - gridW) / 2
  const gridOffsetY = (CANVAS_HEIGHT - gridH) / 2

  useEffect(() => {
    if (phase !== 'exploding') return

    // Compute scatter positions once
    if (!scatterPositionsRef.current) {
      scatterPositionsRef.current = computeScatterPositions(27, canvasW)
    }
    const scatter = scatterPositionsRef.current

    // Animate each cubelet from grid center → scatter center
    for (let i = 0; i < 27; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      // Grid center of this cubelet
      const gridCX = gridOffsetX + col * (CUBELET_SIZE + GAP) + CUBELET_SIZE / 2
      const gridCY = gridOffsetY + row * (CUBELET_SIZE + GAP) + CUBELET_SIZE / 2
      // Scatter center
      const [scatterCX, scatterCY] = scatter[i]
      // Offsets
      const targetOffX = scatterCX - gridCX
      const targetOffY = scatterCY - gridCY

      const easing = Easing.out(Easing.cubic)
      offsetXs[i].value = withTiming(targetOffX, { duration: EXPLOSION_DURATION, easing })
      offsetYs[i].value = withTiming(targetOffY, { duration: EXPLOSION_DURATION, easing })
      rotZs[i].value = withTiming(rotTargetsRef[i], { duration: EXPLOSION_DURATION, easing })

      // Pink overlay fades: start at 400ms, complete at 1000ms
      if (cubelets[i]?.isTarget) {
        overlayOpacities[i].value = withDelay(400, withTiming(0, { duration: 600 }))
      }
    }

    // Notify hook when explosion animation is done
    const timer = setTimeout(onExplosionComplete, EXPLOSION_DURATION)
    return () => clearTimeout(timer)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel all animations on unmount
  useEffect(() => () => {
    offsetXs.forEach(v => cancelAnimation(v))
    offsetYs.forEach(v => cancelAnimation(v))
    rotZs.forEach(v => cancelAnimation(v))
    overlayOpacities.forEach(v => cancelAnimation(v))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ width: canvasW, height: CANVAS_HEIGHT }}>
      {cubelets.map((cubelet, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const left = gridOffsetX + col * (CUBELET_SIZE + GAP)
        const top = gridOffsetY + row * (CUBELET_SIZE + GAP)
        return (
          <CubeletView
            key={cubelet.id}
            cubelet={cubelet}
            offsetX={offsetXs[i]}
            offsetY={offsetYs[i]}
            rotZ={rotZs[i]}
            overlayOpacity={overlayOpacities[i]}
            left={left}
            top={top}
            phase={phase}
            onPress={() => onSelectCubelet(cubelet.id)}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({})
