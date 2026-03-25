import { useState, useEffect, useRef, useCallback } from 'react'
import { randFrom } from '../../../utils/random'
import { normaliseScore } from '../../../utils/scoring'

type Operator = '+' | '-' | 'x'
export type MentalMathFeedback = 'correct' | 'wrong' | null

const TOTAL_ROUNDS = 8
const ROUND_DURATION = 6 // seconds

function makeQuestion(): { text: string; answer: number } {
  const op = randFrom<Operator>(['+', '-', 'x'])
  let a: number
  let b: number
  let answer: number
  let text: string

  if (op === '+') {
    a = Math.floor(Math.random() * 46) + 5  // 5-50
    b = Math.floor(Math.random() * 46) + 5  // 5-50
    answer = a + b
    text = `${a} + ${b} = ?`
  } else if (op === '-') {
    a = Math.floor(Math.random() * 51) + 10  // 10-60
    b = Math.floor(Math.random() * (a - 1)) + 1  // 1 to a-1
    answer = a - b
    text = `${a} − ${b} = ?`
  } else {
    a = Math.floor(Math.random() * 11) + 2  // 2-12
    b = Math.floor(Math.random() * 11) + 2  // 2-12
    answer = a * b
    text = `${a} × ${b} = ?`
  }

  return { text, answer }
}

export function useMentalMath() {
  const [question, setQuestion] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [round, setRound] = useState(1)
  const [rawPoints, setRawPoints] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<MentalMathFeedback>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  // Mutable refs — always current, safe to read inside callbacks
  const roundRef = useRef(1)
  const feedbackRef = useRef<MentalMathFeedback>(null)
  const rawPointsRef = useRef(0)
  const correctCountRef = useRef(0)
  const processingRef = useRef(false)
  const roundStartRef = useRef(0)
  const gameStartRef = useRef(0)
  const correctAnswerRef = useRef(0)

  const startNewQuestion = useCallback(() => {
    const { text, answer } = makeQuestion()
    setQuestion(text)
    setCorrectAnswer(answer)
    correctAnswerRef.current = answer
    roundStartRef.current = performance.now()
  }, [])

  // Init
  useEffect(() => {
    gameStartRef.current = performance.now()
    startNewQuestion()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoundEnd = useCallback(
    (correct: boolean, tLeft: number) => {
      const points = correct ? Math.round((tLeft / ROUND_DURATION) * 80) + 20 : 0
      rawPointsRef.current += points
      correctCountRef.current += correct ? 1 : 0
      setRawPoints(rawPointsRef.current)
      setCorrectCount(correctCountRef.current)

      const fb: MentalMathFeedback = correct ? 'correct' : 'wrong'
      feedbackRef.current = fb
      setFeedback(fb)

      const capturedRound = roundRef.current

      setTimeout(() => {
        processingRef.current = false

        if (capturedRound >= TOTAL_ROUNDS) {
          const score = normaliseScore(rawPointsRef.current, TOTAL_ROUNDS * 100)
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
          startNewQuestion()
        }
      }, 800)
    },
    [startNewQuestion],
  )

  const submitAnswer = useCallback(
    (value: string) => {
      if (processingRef.current || feedbackRef.current !== null) return
      processingRef.current = true

      const elapsed = (performance.now() - roundStartRef.current) / 1000
      const tLeft = Math.max(0, ROUND_DURATION - elapsed)
      const num = parseInt(value, 10)
      const correct = !isNaN(num) && num === correctAnswerRef.current
      handleRoundEnd(correct, tLeft)
    },
    [handleRoundEnd],
  )

  const timerExpired = useCallback(() => {
    if (processingRef.current || feedbackRef.current !== null) return
    processingRef.current = true
    handleRoundEnd(false, 0)
  }, [handleRoundEnd])

  // Keep roundRef in sync
  useEffect(() => {
    roundRef.current = round
  }, [round])

  // Keep feedbackRef in sync (for reads outside callbacks)
  useEffect(() => {
    feedbackRef.current = feedback
  }, [feedback])

  const displayScore = isComplete
    ? finalScore
    : normaliseScore(rawPointsRef.current, TOTAL_ROUNDS * 100)

  return {
    question,
    correctAnswer,
    round,
    totalRounds: TOTAL_ROUNDS,
    score: displayScore,
    feedback,
    isComplete,
    totalTimeMs,
    accuracy: correctCount / TOTAL_ROUNDS,
    submitAnswer,
    timerExpired,
  }
}
