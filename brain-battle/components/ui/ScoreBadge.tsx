import { useState, useEffect } from 'react'
import { Text, View } from 'react-native'
import { useSharedValue, withTiming, useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import { colors } from '../../constants/colors'

interface ScoreBadgeProps {
  score: number
  color?: string
}

function scoreColor(score: number): string {
  if (score < 40) return colors.accent2   // red
  if (score < 70) return colors.amber     // amber
  return colors.accent3                   // green
}

export default function ScoreBadge({ score, color }: ScoreBadgeProps) {
  const [displayed, setDisplayed] = useState(0)
  const animVal = useSharedValue(0)

  useEffect(() => {
    animVal.value = 0
    animVal.value = withTiming(score, { duration: 1200 })
  }, [score])

  useAnimatedReaction(
    () => Math.round(animVal.value),
    (val) => { runOnJS(setDisplayed)(val) }
  )

  const displayedColor = color ?? scoreColor(score)

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 64, fontWeight: '900', color: displayedColor, letterSpacing: -2 }}>
        {displayed}
      </Text>
    </View>
  )
}
