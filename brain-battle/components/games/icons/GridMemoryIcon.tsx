import React from 'react'
import Svg, { Circle, Rect } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function GridMemoryIcon({ size = 64, color = '#ff2d6b' }: Props) {
  const cellSize = 16
  const gap = 4
  const startX = 6
  const startY = 6

  const litCells = new Set(['0-0', '1-2', '2-1'])

  const cells: React.ReactNode[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const key = `${row}-${col}`
      const isLit = litCells.has(key)
      const cx = startX + col * (cellSize + gap) + cellSize / 2
      const cy = startY + row * (cellSize + gap) + cellSize / 2

      cells.push(
        <Circle
          key={key}
          cx={cx}
          cy={cy}
          r={cellSize / 2 - 1}
          fill={color}
          opacity={isLit ? 1 : 0.15}
        />
      )

      if (isLit) {
        cells.push(
          <Circle
            key={`${key}-glow`}
            cx={cx}
            cy={cy}
            r={cellSize / 2 + 2}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={0.4}
          />
        )
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="4" y="4" width="56" height="56" rx="6" fill="none" stroke={color} strokeWidth="1" opacity={0.2} />
      {cells}
      <Circle cx="26" cy="58" r="2" fill={color} opacity={0.5} />
      <Circle cx="32" cy="58" r="2" fill={color} opacity={0.5} />
      <Circle cx="38" cy="58" r="2" fill={color} opacity={0.5} />
    </Svg>
  )
}
