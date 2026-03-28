import React from 'react'
import Svg, { Rect, Line } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function FallingBlocksIcon({ size = 64, color = '#c084fc' }: Props) {
  const blocks = [
    { x: 6,  y: 8,  w: 14, h: 12, fill: '#ff4444', opacity: 1.0 },
    { x: 24, y: 22, w: 14, h: 12, fill: '#ff9f00', opacity: 1.0 },
    { x: 44, y: 6,  w: 14, h: 12, fill: '#e8e8f4', opacity: 0.9 },
    { x: 6,  y: 36, w: 14, h: 12, fill: '#4488ff', opacity: 1.0 },
    { x: 24, y: 44, w: 14, h: 12, fill: '#ff4444', opacity: 0.7 },
    { x: 44, y: 30, w: 14, h: 12, fill: '#ff9f00', opacity: 1.0 },
  ]

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Motion lines above top blocks */}
      {blocks.slice(0, 3).map((b, i) => (
        <Line
          key={`line-${i}`}
          x1={b.x + b.w / 2} y1={b.y - 4}
          x2={b.x + b.w / 2} y2={b.y - 10}
          stroke={b.fill} strokeWidth="1.5" opacity={0.3} strokeLinecap="round"
        />
      ))}

      {blocks.map((b, i) => (
        <Rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={b.fill} opacity={b.opacity} />
      ))}

      {/* Ground line */}
      <Line x1="4" y1="60" x2="60" y2="60" stroke={color} strokeWidth="1.5" opacity={0.4} strokeLinecap="round" />

      {/* Dashed question line */}
      <Line x1="28" y1="58" x2="36" y2="58" stroke={color} strokeWidth="1" opacity={0.5} strokeDasharray="2,2" />
    </Svg>
  )
}
