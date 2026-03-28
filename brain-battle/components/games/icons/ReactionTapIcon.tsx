import Svg, { Circle, Path, Line } from 'react-native-svg'

interface Props {
  size?: number
  color?: string
}

export default function ReactionTapIcon({ size = 64, color = '#f43f5e' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Background glow */}
      <Circle cx="32" cy="32" r="28" fill={color} opacity="0.1" />

      {/* Lightning bolt */}
      <Path
        d="M37 6 L22 30 L31 30 L27 58 L42 34 L33 34 Z"
        fill={color}
        opacity="0.95"
      />

      {/* Speed lines left */}
      <Line x1="3" y1="19" x2="15" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <Line x1="3" y1="32" x2="11" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <Line x1="3" y1="45" x2="15" y2="45" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </Svg>
  )
}
