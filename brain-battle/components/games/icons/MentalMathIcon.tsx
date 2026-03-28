import React from 'react'
import Svg, { Text as SvgText, Line, Circle } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function MentalMathIcon({ size = 64, color = '#00e5ff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Background subtle grid dots */}
      <Circle cx="8"  cy="8"  r="1.5" fill={color} opacity={0.2} />
      <Circle cx="32" cy="8"  r="1.5" fill={color} opacity={0.2} />
      <Circle cx="56" cy="8"  r="1.5" fill={color} opacity={0.2} />
      <Circle cx="8"  cy="56" r="1.5" fill={color} opacity={0.2} />
      <Circle cx="56" cy="56" r="1.5" fill={color} opacity={0.2} />

      {/* "23" on left */}
      <SvgText x="4" y="36" fontSize="18" fontWeight="bold" fill={color} opacity={0.85}>23</SvgText>

      {/* "×" in centre */}
      <SvgText x="26" y="38" fontSize="22" fontWeight="bold" fill={color} opacity={1}>×</SvgText>

      {/* "7" on right */}
      <SvgText x="46" y="36" fontSize="18" fontWeight="bold" fill={color} opacity={0.85}>7</SvgText>

      {/* Underline / answer bar */}
      <Line x1="4" y1="42" x2="60" y2="42" stroke={color} strokeWidth="1.5" opacity={0.5} />

      {/* "?" answer placeholder */}
      <SvgText x="26" y="56" fontSize="14" fontWeight="bold" fill={color} opacity={0.6}>?</SvgText>

      {/* Speed lines top right */}
      <Line x1="50" y1="10" x2="62" y2="10" stroke={color} strokeWidth="2" opacity={0.4} strokeLinecap="round" />
      <Line x1="54" y1="16" x2="62" y2="16" stroke={color} strokeWidth="1.5" opacity={0.3} strokeLinecap="round" />
    </Svg>
  )
}
