import React from 'react'
import Svg, { Rect, Text as SvgText, Circle } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function NumberSequenceIcon({ size = 64, color = '#ff9f00' }: Props) {
  const digits = ['3', '7', '1', '4']
  const cardW = 11
  const cardH = 14
  const startX = 4
  const y = 10

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {digits.map((d, i) => {
        const x = startX + i * (cardW + 3)
        const isCurrent = i === 2
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y}
              width={cardW} height={cardH}
              rx="2"
              fill={isCurrent ? color : 'transparent'}
              stroke={color}
              strokeWidth={isCurrent ? 0 : 0.8}
              opacity={isCurrent ? 1 : 0.35}
            />
            <SvgText
              x={x + cardW / 2}
              y={y + cardH / 2 + 4}
              fontSize="10"
              fontWeight="bold"
              fill={isCurrent ? '#000000' : color}
              textAnchor="middle"
              opacity={isCurrent ? 1 : 0.5}
            >{d}</SvgText>
          </React.Fragment>
        )
      })}

      {/* Large flashing digit */}
      <SvgText x="32" y="46" fontSize="32" fontWeight="bold" fill={color} textAnchor="middle" opacity={1}>1</SvgText>

      {/* Blink cursor */}
      <Rect x="22" y="50" width="20" height="2.5" rx="1" fill={color} opacity={0.6} />

      {/* Number pad dots */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <Circle key={i} cx={14 + (i % 3) * 18} cy={58} r="2.5" fill={color} opacity={0.25} />
      ))}
    </Svg>
  )
}
