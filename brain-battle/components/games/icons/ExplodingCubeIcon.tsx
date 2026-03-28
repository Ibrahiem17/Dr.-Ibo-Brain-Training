import React from 'react'
import Svg, { Rect, Line, Circle } from 'react-native-svg'

interface Props { size?: number; color?: string }

export default function ExplodingCubeIcon({ size = 64, color = '#f97316' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Central 2x2 cube */}
      <Rect x="18" y="18" width="12" height="12" rx="1" fill={color} opacity={1} />
      <Rect x="32" y="18" width="12" height="12" rx="1" fill="#ffffff" opacity={0.15} stroke={color} strokeWidth="0.8" />
      <Rect x="18" y="32" width="12" height="12" rx="1" fill="#ffffff" opacity={0.15} stroke={color} strokeWidth="0.8" />
      <Rect x="32" y="32" width="12" height="12" rx="1" fill={color} opacity={1} />

      {/* Explosion lines */}
      <Line x1="32" y1="20" x2="10" y2="6"  stroke={color} strokeWidth="1" opacity={0.5} strokeLinecap="round" />
      <Line x1="44" y1="24" x2="58" y2="10" stroke={color} strokeWidth="1" opacity={0.5} strokeLinecap="round" />
      <Line x1="20" y1="38" x2="6"  y2="54" stroke={color} strokeWidth="1" opacity={0.5} strokeLinecap="round" />
      <Line x1="44" y1="40" x2="58" y2="56" stroke={color} strokeWidth="1" opacity={0.5} strokeLinecap="round" />

      {/* Flying cubelets */}
      <Rect x="4"  y="2"  width="8" height="8" rx="1" fill={color}   opacity={0.9} />
      <Rect x="52" y="4"  width="8" height="8" rx="1" fill="#ffffff" opacity={0.2} stroke={color} strokeWidth="0.8" />
      <Rect x="2"  y="50" width="8" height="8" rx="1" fill="#ffffff" opacity={0.2} stroke={color} strokeWidth="0.8" />
      <Rect x="52" y="50" width="8" height="8" rx="1" fill={color}   opacity={0.9} />

      {/* Centre glow */}
      <Circle cx="32" cy="32" r="3" fill={color} opacity={0.3} />
    </Svg>
  )
}
