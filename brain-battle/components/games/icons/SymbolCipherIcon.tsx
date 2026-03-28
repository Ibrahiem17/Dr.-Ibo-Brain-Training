import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg'

interface Props {
  size?: number
  color?: string
}

export default function SymbolCipherIcon({ size = 64, color = '#818cf8' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Row 1: ★ → 3 */}
      <Rect x="4" y="6" width="22" height="16" rx="4" fill={color} opacity="0.12" />
      <SvgText x="15" y="18" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">★</SvgText>
      <Line x1="28" y1="14" x2="36" y2="14" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <Rect x="38" y="6" width="22" height="16" rx="4" fill={color} opacity="0.18" />
      <SvgText x="49" y="18" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">3</SvgText>

      {/* Row 2: ♦ → 1 */}
      <Rect x="4" y="26" width="22" height="16" rx="4" fill={color} opacity="0.12" />
      <SvgText x="15" y="38" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">♦</SvgText>
      <Line x1="28" y1="34" x2="36" y2="34" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <Rect x="38" y="26" width="22" height="16" rx="4" fill={color} opacity="0.18" />
      <SvgText x="49" y="38" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">1</SvgText>

      {/* Row 3: ▲ → 4 */}
      <Rect x="4" y="46" width="22" height="16" rx="4" fill={color} opacity="0.12" />
      <SvgText x="15" y="58" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">▲</SvgText>
      <Line x1="28" y1="54" x2="36" y2="54" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <Rect x="38" y="46" width="22" height="16" rx="4" fill={color} opacity="0.18" />
      <SvgText x="49" y="58" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">4</SvgText>
    </Svg>
  )
}
