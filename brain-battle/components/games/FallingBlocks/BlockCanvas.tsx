import { useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  useSharedValue,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { Canvas, Rect } from '@shopify/react-native-skia'
import type { Block } from './useFallingBlocks'
import { COLOR_HEX } from './useFallingBlocks'

const BLOCK_W = 60
const BLOCK_H = 60
const MAX_BLOCKS = 12

// Worklet helpers — run on the UI thread
function blockProgress(clockMs: number, delayS: number, speed: number): number {
  'worklet'
  const duration = 2000 / speed
  const elapsed = clockMs - delayS * 1000
  return Math.min(1, Math.max(0, elapsed / duration))
}

function blockY(progress: number, screenH: number): number {
  'worklet'
  return progress * (screenH + BLOCK_H) - BLOCK_H
}

function blockOpacity(progress: number): number {
  'worklet'
  return progress > 0.8 ? Math.max(0, 1 - (progress - 0.8) / 0.2) : 1
}

interface Props {
  blocks: Block[]
  screenHeight: number
  onComplete: () => void
}

export default function BlockCanvas({ blocks, screenHeight, onComplete }: Props) {
  // Total animation duration = latest block finishes
  const totalDuration = useMemo(() => {
    if (blocks.length === 0) return 2000
    return Math.max(...blocks.map(b => b.delay * 1000 + 2000 / b.speed)) + 200
  }, [blocks])

  // Single clock shared value drives all block positions
  const clock = useSharedValue(0)

  useEffect(() => {
    clock.value = withTiming(totalDuration, {
      duration: totalDuration,
      easing: Easing.linear,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Completion: fire once when clock reaches the end
  useAnimatedReaction(
    () => clock.value >= totalDuration,
    (done, wasDone) => {
      if (done && !wasDone) runOnJS(onComplete)()
    },
  ) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 12 fixed derived y values (one per block slot) ──────────────────────────
  // Slots beyond blocks.length stay at y=-BLOCK_H (above canvas, invisible)

  const y0  = useDerivedValue(() => blocks.length >  0 ? blockY(blockProgress(clock.value, blocks[0].delay,  blocks[0].speed),  screenHeight) : -BLOCK_H)
  const y1  = useDerivedValue(() => blocks.length >  1 ? blockY(blockProgress(clock.value, blocks[1].delay,  blocks[1].speed),  screenHeight) : -BLOCK_H)
  const y2  = useDerivedValue(() => blocks.length >  2 ? blockY(blockProgress(clock.value, blocks[2].delay,  blocks[2].speed),  screenHeight) : -BLOCK_H)
  const y3  = useDerivedValue(() => blocks.length >  3 ? blockY(blockProgress(clock.value, blocks[3].delay,  blocks[3].speed),  screenHeight) : -BLOCK_H)
  const y4  = useDerivedValue(() => blocks.length >  4 ? blockY(blockProgress(clock.value, blocks[4].delay,  blocks[4].speed),  screenHeight) : -BLOCK_H)
  const y5  = useDerivedValue(() => blocks.length >  5 ? blockY(blockProgress(clock.value, blocks[5].delay,  blocks[5].speed),  screenHeight) : -BLOCK_H)
  const y6  = useDerivedValue(() => blocks.length >  6 ? blockY(blockProgress(clock.value, blocks[6].delay,  blocks[6].speed),  screenHeight) : -BLOCK_H)
  const y7  = useDerivedValue(() => blocks.length >  7 ? blockY(blockProgress(clock.value, blocks[7].delay,  blocks[7].speed),  screenHeight) : -BLOCK_H)
  const y8  = useDerivedValue(() => blocks.length >  8 ? blockY(blockProgress(clock.value, blocks[8].delay,  blocks[8].speed),  screenHeight) : -BLOCK_H)
  const y9  = useDerivedValue(() => blocks.length >  9 ? blockY(blockProgress(clock.value, blocks[9].delay,  blocks[9].speed),  screenHeight) : -BLOCK_H)
  const y10 = useDerivedValue(() => blocks.length > 10 ? blockY(blockProgress(clock.value, blocks[10].delay, blocks[10].speed), screenHeight) : -BLOCK_H)
  const y11 = useDerivedValue(() => blocks.length > 11 ? blockY(blockProgress(clock.value, blocks[11].delay, blocks[11].speed), screenHeight) : -BLOCK_H)

  const ys = [y0, y1, y2, y3, y4, y5, y6, y7, y8, y9, y10, y11]

  // ── 12 fixed derived opacity values ─────────────────────────────────────────

  const op0  = useDerivedValue(() => blocks.length >  0 ? blockOpacity(blockProgress(clock.value, blocks[0].delay,  blocks[0].speed))  : 0)
  const op1  = useDerivedValue(() => blocks.length >  1 ? blockOpacity(blockProgress(clock.value, blocks[1].delay,  blocks[1].speed))  : 0)
  const op2  = useDerivedValue(() => blocks.length >  2 ? blockOpacity(blockProgress(clock.value, blocks[2].delay,  blocks[2].speed))  : 0)
  const op3  = useDerivedValue(() => blocks.length >  3 ? blockOpacity(blockProgress(clock.value, blocks[3].delay,  blocks[3].speed))  : 0)
  const op4  = useDerivedValue(() => blocks.length >  4 ? blockOpacity(blockProgress(clock.value, blocks[4].delay,  blocks[4].speed))  : 0)
  const op5  = useDerivedValue(() => blocks.length >  5 ? blockOpacity(blockProgress(clock.value, blocks[5].delay,  blocks[5].speed))  : 0)
  const op6  = useDerivedValue(() => blocks.length >  6 ? blockOpacity(blockProgress(clock.value, blocks[6].delay,  blocks[6].speed))  : 0)
  const op7  = useDerivedValue(() => blocks.length >  7 ? blockOpacity(blockProgress(clock.value, blocks[7].delay,  blocks[7].speed))  : 0)
  const op8  = useDerivedValue(() => blocks.length >  8 ? blockOpacity(blockProgress(clock.value, blocks[8].delay,  blocks[8].speed))  : 0)
  const op9  = useDerivedValue(() => blocks.length >  9 ? blockOpacity(blockProgress(clock.value, blocks[9].delay,  blocks[9].speed))  : 0)
  const op10 = useDerivedValue(() => blocks.length > 10 ? blockOpacity(blockProgress(clock.value, blocks[10].delay, blocks[10].speed)) : 0)
  const op11 = useDerivedValue(() => blocks.length > 11 ? blockOpacity(blockProgress(clock.value, blocks[11].delay, blocks[11].speed)) : 0)

  const ops = [op0, op1, op2, op3, op4, op5, op6, op7, op8, op9, op10, op11]

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {blocks[0]  && <Rect x={blocks[0].x}  y={ys[0]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[0].color]}  opacity={ops[0]}  />}
      {blocks[1]  && <Rect x={blocks[1].x}  y={ys[1]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[1].color]}  opacity={ops[1]}  />}
      {blocks[2]  && <Rect x={blocks[2].x}  y={ys[2]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[2].color]}  opacity={ops[2]}  />}
      {blocks[3]  && <Rect x={blocks[3].x}  y={ys[3]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[3].color]}  opacity={ops[3]}  />}
      {blocks[4]  && <Rect x={blocks[4].x}  y={ys[4]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[4].color]}  opacity={ops[4]}  />}
      {blocks[5]  && <Rect x={blocks[5].x}  y={ys[5]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[5].color]}  opacity={ops[5]}  />}
      {blocks[6]  && <Rect x={blocks[6].x}  y={ys[6]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[6].color]}  opacity={ops[6]}  />}
      {blocks[7]  && <Rect x={blocks[7].x}  y={ys[7]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[7].color]}  opacity={ops[7]}  />}
      {blocks[8]  && <Rect x={blocks[8].x}  y={ys[8]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[8].color]}  opacity={ops[8]}  />}
      {blocks[9]  && <Rect x={blocks[9].x}  y={ys[9]}  width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[9].color]}  opacity={ops[9]}  />}
      {blocks[10] && <Rect x={blocks[10].x} y={ys[10]} width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[10].color]} opacity={ops[10]} />}
      {blocks[11] && <Rect x={blocks[11].x} y={ys[11]} width={BLOCK_W} height={BLOCK_H} color={COLOR_HEX[blocks[11].color]} opacity={ops[11]} />}
    </Canvas>
  )
}
