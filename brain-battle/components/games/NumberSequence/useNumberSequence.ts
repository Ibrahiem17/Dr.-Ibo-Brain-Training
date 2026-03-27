import { useState, useEffect, useRef, useCallback } from 'react'

const BASE_TOTAL_ROUNDS = 6

export type NumberSequencePhase = 'showing' | 'input'
export type NumberSequenceFeedback = 'correct' | 'wrong' | null

// Sequence length = round + 2  →  3,4,5,6,7,8 (normal mode)
function seqLengthNormal(r: number) {
  return r + 2
}

function makeSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

export function useNumberSequence(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1

  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS

  // In endless mode, sequence length scales with the endless round
  const getSeqLength = (r: number): number =>
    endlessMode
      ? Math.min(3 + Math.floor(endlessRound / 3), 10)
      : seqLengthNormal(r)

  const [round, setRound] = useState(1)
  const [sequence, setSequence] = useState<number[]>([])
  const [sequenceLength, setSequenceLength] = useState(getSeqLength(1))
  const [currentDisplayDigit, setCurrentDisplayDigit] = useState<number | null>(null)
  const [phase, setPhase] = useState<NumberSequencePhase>('showing')
  const [enteredDigits, setEnteredDigits] = useState<number[]>([])
  const [slots, setSlots] = useState<(number | null)[]>([])
  const [rawPoints, setRawPoints] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<NumberSequenceFeedback>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  // Mutable refs
  const roundRef = useRef(1)
  const feedbackRef = useRef<NumberSequenceFeedback>(null)
  const rawPointsRef = useRef(0)
  const correctCountRef = useRef(0)
  const processingRef = useRef(false)
  const gameStartRef = useRef(0)
  const showTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sequenceRef = useRef<number[]>([])
  const enteredRef = useRef<number[]>([])
  const totalRoundsRef = useRef(TOTAL_ROUNDS)

  totalRoundsRef.current = TOTAL_ROUNDS

  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { feedbackRef.current = feedback }, [feedback])

  const clearShowTimers = () => {
    showTimersRef.current.forEach(clearTimeout)
    showTimersRef.current = []
  }

  const handleRoundEnd = useCallback((correct: boolean) => {
    const tr = totalRoundsRef.current
    const points = correct ? Math.round(100 / tr) : 0
    rawPointsRef.current += points
    correctCountRef.current += correct ? 1 : 0
    setRawPoints(rawPointsRef.current)
    setCorrectCount(correctCountRef.current)

    const fb: NumberSequenceFeedback = correct ? 'correct' : 'wrong'
    feedbackRef.current = fb
    setFeedback(fb)

    const capturedRound = roundRef.current

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      processingRef.current = false
      setFeedback(null)
      feedbackRef.current = null

      if (capturedRound >= tr) {
        const score = Math.min(100, rawPointsRef.current)
        const timeMs = performance.now() - gameStartRef.current
        setFinalScore(score)
        setTotalTimeMs(timeMs)
        setIsComplete(true)
      } else {
        const nextRound = capturedRound + 1
        roundRef.current = nextRound
        setRound(nextRound)
        startRound(nextRound)
      }
    }, 800)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startRound = useCallback((r: number) => {
    const len = getSeqLength(r)
    const seq = makeSequence(len)
    sequenceRef.current = seq
    enteredRef.current = []
    setSequenceLength(len)
    setSequence(seq)
    setEnteredDigits([])
    setSlots(Array(len).fill(null))
    setPhase('showing')
    setCurrentDisplayDigit(null)
    processingRef.current = false

    clearShowTimers()

    const timers: ReturnType<typeof setTimeout>[] = []

    // Each digit: 600ms visible, 200ms gap  → stride = 800ms
    seq.forEach((digit, i) => {
      const showAt = i * 800
      const hideAt = showAt + 600

      timers.push(setTimeout(() => setCurrentDisplayDigit(digit), showAt))
      timers.push(setTimeout(() => setCurrentDisplayDigit(null), hideAt))
    })

    // After last digit hidden + 400ms pause → switch to input
    const inputAt = seq.length * 800 + 400
    timers.push(
      setTimeout(() => {
        setPhase('input')
        setCurrentDisplayDigit(null)
      }, inputAt),
    )

    showTimersRef.current = timers
  }, [endlessMode, endlessRound]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init
  useEffect(() => {
    gameStartRef.current = performance.now()
    startRound(1)
    return () => {
      clearShowTimers()
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pressDigit = useCallback(
    (digit: number) => {
      if (phase !== 'input' || feedbackRef.current !== null || processingRef.current) return

      const prev = enteredRef.current
      const next = [...prev, digit]
      enteredRef.current = next

      setEnteredDigits(next)
      setSlots((s) => {
        const updated = [...s]
        updated[prev.length] = digit
        return updated
      })

      if (next.length === getSeqLength(roundRef.current)) {
        processingRef.current = true
        const correct = sequenceRef.current.every((d, i) => d === next[i])
        handleRoundEnd(correct)
      }
    },
    [phase, handleRoundEnd], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return {
    currentDisplayDigit,
    sequenceLength,
    sequence,
    enteredDigits,
    slots,
    phase,
    round,
    totalRounds: TOTAL_ROUNDS,
    score: isComplete ? finalScore : Math.min(100, rawPointsRef.current),
    feedback,
    isComplete,
    totalTimeMs,
    accuracy: correctCount / TOTAL_ROUNDS,
    pressDigit,
  }
}
