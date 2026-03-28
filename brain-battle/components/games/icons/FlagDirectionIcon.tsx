import React from 'react'
import Svg, { Circle, Line, Polygon } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function FlagDirectionIcon({ size = 64, color = '#34d399' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Head */}
      <Circle cx="32" cy="12" r="6" fill="none" stroke={color} strokeWidth="2" />

      {/* Body */}
      <Line x1="32" y1="18" x2="32" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Left leg */}
      <Line x1="32" y1="38" x2="24" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Right leg */}
      <Line x1="32" y1="38" x2="40" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* Left arm */}
      <Line x1="32" y1="24" x2="20" y2="34" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.5} />

      {/* Right arm — pointing RIGHT */}
      <Line x1="32" y1="24" x2="52" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* Flag at end of right arm */}
      <Polygon points="52,18 52,24 60,21" fill={color} opacity={0.9} />

      {/* UP arrow */}
      <Line x1="32" y1="6" x2="32" y2="2" stroke={color} strokeWidth="1.5" opacity={0.3} strokeLinecap="round" />
      <Polygon points="29,4 32,0 35,4" fill={color} opacity={0.3} />

      {/* DOWN arrow */}
      <Line x1="32" y1="56" x2="32" y2="60" stroke={color} strokeWidth="1.5" opacity={0.3} strokeLinecap="round" />
      <Polygon points="29,58 32,62 35,58" fill={color} opacity={0.3} />

      {/* LEFT arrow */}
      <Line x1="6" y1="32" x2="2" y2="32" stroke={color} strokeWidth="1.5" opacity={0.3} strokeLinecap="round" />
      <Polygon points="4,29 0,32 4,35" fill={color} opacity={0.3} />

      {/* RIGHT arrow (bright) */}
      <Line x1="58" y1="32" x2="62" y2="32" stroke={color} strokeWidth="1.5" opacity={0.8} strokeLinecap="round" />
      <Polygon points="60,29 64,32 60,35" fill={color} opacity={0.8} />
    </Svg>
  )
}
