import React from 'react'
import Svg, { Text as SvgText, Rect, Line } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function StroopTestIcon({ size = 64, color = '#aaff00' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Word "RED" written in blue — the Stroop conflict */}
      <SvgText
        x="32" y="28"
        fontSize="20" fontWeight="bold"
        fill="#4488ff"
        textAnchor="middle"
        opacity={0.95}
      >RED</SvgText>

      {/* Strikethrough */}
      <Line x1="10" y1="20" x2="54" y2="20" stroke="#ff2d6b" strokeWidth="1.5" opacity={0.6} />

      {/* Divider */}
      <Line x1="12" y1="36" x2="52" y2="36" stroke={color} strokeWidth="0.8" opacity={0.3} />

      {/* Four colour squares */}
      <Rect x="8"  y="42" width="10" height="10" rx="2" fill="#ff2d6b" opacity={0.9} />
      <Rect x="22" y="42" width="10" height="10" rx="2" fill="#4488ff" opacity={0.9} />
      <Rect x="36" y="42" width="10" height="10" rx="2" fill={color}   opacity={0.9} />
      <Rect x="50" y="42" width="10" height="10" rx="2" fill="#ff9f00" opacity={0.9} />

      {/* Arrow pointing to blue square */}
      <Line x1="27" y1="38" x2="27" y2="41" stroke={color} strokeWidth="1.5" opacity={0.7} strokeLinecap="round" />
    </Svg>
  )
}
