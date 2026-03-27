import { useState, useEffect, useRef, useCallback } from 'react'
import { normaliseScore } from '../../../utils/scoring'
import { shuffle } from '../../../utils/random'

const STROOP_COLORS = [
  { name: 'RED',    hex: '#ff2d6b' },
  { name: 'BLUE',   hex: '#00e5ff' },
  { name: 'GREEN',  hex: '#aaff00' },
  { name: 'ORANGE', hex: '#ff9f00' },
  { name: 'PURPLE', hex: '#c084fc' },
]

const BASE_TOTAL_ROUNDS = 10
const BASE_ROUND_DURATION = 4 // seconds

export type StroopFeedback = 'correct' | 'wrong' | null

export interface StroopRound {
  word: string
  inkColor: string
  correctAnswer: string
  options: string[]
}

function makeRound(): StroopRound {
  // Pick word and ink such that they never match
  let wordEntry = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
  let inkEntry = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
  while (inkEntry.name === wordEntry.name) {
    inkEntry = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)]
  }

  // Options: correct ink name + 3 others, no duplicates
  const correctAnswer = inkEntry.name
  const others = STROOP_COLORS.filter((c) => c.name !== correctAnswer)
    .map((c) => c.name)
  const shuffledOthers = shuffle(others).slice(0, 3)
  const options = shuffle([correctAnswer, ...shuffledOthers])

  return {
    word: wordEntry.name,
    inkColor: inkEntry.hex,
    correctAnswer,
    options,
  }
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

export function useStroopTest(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1

  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS
  // In endless mode, reduce timer as rounds increase (min 2s)
  const ROUND_DURATION = endlessMode
    ? Math.max(2, BASE_ROUND_DURATION - Math.floor(endlessRound / 6))
    : BASE_ROUND_DURATION

  const [round, setRound] = useState(1)
  const [currentRound, setCurrentRound] = useState<StroopRound>(() => makeRound())
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION)
  const [rawPoints, setRawPoints] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<StroopFeedback>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  // Mutable refs — always current in callbacks
  const roundRef = useRef(1)
  const feedbackRef = useRef<StroopFeedback>(null)
  const rawPointsRef = useRef(0)
  const correctCountRef = useRef(0)
  const processingRef = useRef(false)
  const roundStartRef = useRef(performance.now())
  const gameStartRef = useRef(performance.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundDurationRef = useRef(ROUND_DURATION)
  const totalRoundsRef = useRef(TOTAL_ROUNDS)

  roundDurationRef.current = ROUND_DURATION
  totalRoundsRef.current = TOTAL_ROUNDS

  // Keep roundRef in sync
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { feedbackRef.current = feedback }, [feedback])

  const startNewRound = useCallback(() => {
    setCurrentRound(makeRound())
    setTimeLeft(roundDurationRef.current)
    roundStartRef.current = performance.now()
  }, [])

  // Init
  useEffect(() => {
    gameStartRef.current = performance.now()
    roundStartRef.current = performance.now()
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoundEnd = useCallback(
    (correct: boolean, tLeft: number) => {
      const rd = roundDurationRef.current
      const tr = totalRoundsRef.current
      const points = correct ? Math.round((tLeft / rd) * 60) + 40 : 0
      rawPointsRef.current += points
      correctCountRef.current += correct ? 1 : 0
      setRawPoints(rawPointsRef.current)
      setCorrectCount(correctCountRef.current)

      const fb: StroopFeedback = correct ? 'correct' : 'wrong'
      feedbackRef.current = fb
      setFeedback(fb)

      const capturedRound = roundRef.current

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = setTimeout(() => {
        processingRef.current = false

        if (capturedRound >= tr) {
          const score = normaliseScore(rawPointsRef.current, tr * 100)
          const timeMs = performance.now() - gameStartRef.current
          setFinalScore(score)
          setTotalTimeMs(timeMs)
          setIsComplete(true)
        } else {
          const nextRound = capturedRound + 1
          roundRef.current = nextRound
          setRound(nextRound)
          feedbackRef.current = null
          setFeedback(null)
          startNewRound()
        }
      }, 800)
    },
    [startNewRound],
  )

  const selectAnswer = useCallback(
    (colorName: string) => {
      if (processingRef.current || feedbackRef.current !== null) return
      processingRef.current = true

      const elapsed = (performance.now() - roundStartRef.current) / 1000
      const tLeft = Math.max(0, roundDurationRef.current - elapsed)
      setTimeLeft(tLeft)

      const correct = colorName === currentRound.correctAnswer
      handleRoundEnd(correct, tLeft)
    },
    [currentRound.correctAnswer, handleRoundEnd],
  )

  const timerExpired = useCallback(() => {
    if (processingRef.current || feedbackRef.current !== null) return
    processingRef.current = true
    setTimeLeft(0)
    handleRoundEnd(false, 0)
  }, [handleRoundEnd])

  const displayScore = isComplete
    ? finalScore
    : normaliseScore(rawPointsRef.current, TOTAL_ROUNDS * 100)

  return {
    word: currentRound.word,
    inkColor: currentRound.inkColor,
    correctAnswer: currentRound.correctAnswer,
    options: currentRound.options,
    round,
    totalRounds: TOTAL_ROUNDS,
    roundDuration: ROUND_DURATION,
    timeLeft,
    score: displayScore,
    feedback,
    isComplete,
    totalTimeMs,
    accuracy: correctCount / TOTAL_ROUNDS,
    selectAnswer,
    timerExpired,
  }
}
