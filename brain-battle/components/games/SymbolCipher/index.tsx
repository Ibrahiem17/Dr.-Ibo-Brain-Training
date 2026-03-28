import { useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../../constants/colors'
import { useSymbolCipher, CIPHER_SYMBOLS } from './useSymbolCipher'

const GAME_COLOR = '#818cf8'

type Props = {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
  endlessMode?: boolean
  endlessRound?: number
}

export default function SymbolCipher({ onGameComplete, endlessMode, endlessRound }: Props) {
  const { phase, round, totalRounds, cipher, question, correctAnswer, playerAnswer, currentIndex, score, isComplete, totalTimeMs, accuracy, submitDigit } =
    useSymbolCipher({ endlessMode, endlessRound })

  const calledRef = useRef(false)
  useEffect(() => {
    if (isComplete && !calledRef.current) {
      calledRef.current = true
      onGameComplete(score, totalTimeMs, accuracy)
    }
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDecoding = phase === 'decode'
  const cipherOpacity = isDecoding ? 0.07 : 1

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundLabel}>
          ROUND {round} / {totalRounds}
        </Text>
        <Text style={styles.gameTitle}>SYMBOL CIPHER</Text>
      </View>

      {/* Phase label */}
      <View style={styles.phaseRow}>
        {phase === 'memorise' && <Text style={styles.phaseLabel}>MEMORISE THE CIPHER</Text>}
        {phase === 'decode' && <Text style={[styles.phaseLabel, { color: GAME_COLOR }]}>DECODE FROM MEMORY</Text>}
        {phase === 'feedback' && <Text style={[styles.phaseLabel, { color: colors.muted }]}>ROUND COMPLETE</Text>}
      </View>

      {/* Cipher table */}
      <View style={[styles.cipherGrid, { opacity: cipherOpacity }]}>
        {CIPHER_SYMBOLS.map((sym) => (
          <View key={sym} style={styles.cipherCell}>
            <Text style={styles.cipherSym}>{sym}</Text>
            <Text style={styles.cipherEquals}>=</Text>
            <Text style={[styles.cipherDigit, { color: GAME_COLOR }]}>{cipher[sym]}</Text>
          </View>
        ))}
      </View>

      {/* Question */}
      {(phase === 'decode' || phase === 'feedback') && (
        <View style={styles.questionWrap}>
          <View style={styles.questionRow}>
            {question.map((sym, i) => {
              const answered = i < playerAnswer.length
              const isCurrent = i === currentIndex && phase === 'decode'
              const isCorrect = answered && playerAnswer[i] === correctAnswer[i]
              return (
                <View
                  key={i}
                  style={[
                    styles.qCell,
                    isCurrent && { borderColor: GAME_COLOR },
                    answered && { borderColor: isCorrect ? '#34d399' : colors.accent2 },
                  ]}
                >
                  <Text style={styles.qSym}>{sym}</Text>
                  <Text
                    style={[
                      styles.qAnswer,
                      { color: answered ? (isCorrect ? '#34d399' : colors.accent2) : colors.muted },
                    ]}
                  >
                    {answered ? playerAnswer[i] : '?'}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Number pad */}
      {phase === 'decode' && (
        <View style={styles.numPad}>
          {[1, 2, 3, 4].map((d) => (
            <Pressable key={d} onPress={() => submitDigit(d)} style={styles.numBtn}>
              <Text style={[styles.numLabel, { color: GAME_COLOR }]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {phase === 'memorise' && (
        <Text style={styles.hint}>The cipher will hide — remember it before you decode!</Text>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 8,
    gap: 4,
  },
  roundLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 2 },
  gameTitle: { fontSize: 20, fontWeight: '900', color: GAME_COLOR, letterSpacing: 2 },
  phaseRow: { alignItems: 'center', paddingVertical: 10 },
  phaseLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 2 },
  cipherGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cipherCell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
    flex: 1,
  },
  cipherSym: { fontSize: 26, color: colors.text },
  cipherEquals: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  cipherDigit: { fontSize: 22, fontWeight: '900' },
  questionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  questionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  qCell: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    minWidth: 56,
  },
  qSym: { fontSize: 24, color: colors.text },
  qAnswer: { fontSize: 18, fontWeight: '900' },
  numPad: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  numBtn: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: GAME_COLOR,
    borderRadius: 14,
    backgroundColor: `${GAME_COLOR}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numLabel: { fontSize: 26, fontWeight: '900' },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
    fontWeight: '500',
    lineHeight: 20,
  },
})
