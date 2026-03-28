import { useState, useRef, useCallback, useEffect } from 'react'

export type SymbolCipherPhase = 'memorise' | 'decode' | 'feedback' | 'complete'

export const CIPHER_SYMBOLS = ['★', '♦', '▲', '●'] as const

const BASE_ROUNDS = 4
const BASE_QUESTION_LENGTH = 3
const BASE_MEMORISE_MS = 3000
const FEEDBACK_MS = 700

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

function buildCipher(): Record<string, number> {
  const digits = [1, 2, 3, 4]
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  return Object.fromEntries(CIPHER_SYMBOLS.map((s, i) => [s, digits[i]]))
}

function buildQuestion(cipher: Record<string, number>, length: number): { question: string[]; answer: number[] } {
  const question: string[] = Array.from({ length }, () => CIPHER_SYMBOLS[Math.floor(Math.random() * CIPHER_SYMBOLS.length)])
  const answer = question.map((s) => cipher[s])
  return { question, answer }
}

export function useSymbolCipher(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1
  const TOTAL_ROUNDS = endlessMode ? 3 : BASE_ROUNDS
  const QUESTION_LENGTH = endlessMode ? Math.min(BASE_QUESTION_LENGTH + Math.floor(endlessRound / 2), 6) : BASE_QUESTION_LENGTH
  const MEMORISE_MS = endlessMode ? Math.max(1400, BASE_MEMORISE_MS - endlessRound * 150) : BASE_MEMORISE_MS

  const [phase, setPhase] = useState<SymbolCipherPhase>('memorise')
  const [round, setRound] = useState(1)
  const [cipher, setCipher] = useState<Record<string, number>>(() => buildCipher())
  const [question, setQuestion] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState<number[]>([])
  const [playerAnswer, setPlayerAnswer] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const phaseRef = useRef<SymbolCipherPhase>('memorise')
  const correctAnswerRef = useRef<number[]>([])
  const currentIndexRef = useRef(0)
  const roundRef = useRef(1)
  const correctCountRef = useRef(0)
  const totalAnswersRef = useRef(0)
  const gameStartRef = useRef(0)
  const totalRoundsRef = useRef(TOTAL_ROUNDS)
  const memoriseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  totalRoundsRef.current = TOTAL_ROUNDS

  const startRound = useCallback(
    (roundNum: number, newCipher: Record<string, number>, questionLength: number, memoriseMs: number) => {
      const { question: q, answer: a } = buildQuestion(newCipher, questionLength)
      roundRef.current = roundNum
      correctAnswerRef.current = a
      currentIndexRef.current = 0

      setRound(roundNum)
      setCipher(newCipher)
      setQuestion(q)
      setCorrectAnswer(a)
      setPlayerAnswer([])
      setCurrentIndex(0)
      phaseRef.current = 'memorise'
      setPhase('memorise')

      memoriseTimerRef.current = setTimeout(() => {
        phaseRef.current = 'decode'
        setPhase('decode')
      }, memoriseMs)
    },
    [],
  )

  useEffect(() => {
    gameStartRef.current = performance.now()
    const initialCipher = buildCipher()
    startRound(1, initialCipher, QUESTION_LENGTH, MEMORISE_MS)
    return () => {
      if (memoriseTimerRef.current) clearTimeout(memoriseTimerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submitDigit = useCallback(
    (digit: number) => {
      if (phaseRef.current !== 'decode') return

      const idx = currentIndexRef.current
      const isCorrect = correctAnswerRef.current[idx] === digit
      correctCountRef.current += isCorrect ? 1 : 0
      totalAnswersRef.current += 1
      currentIndexRef.current = idx + 1

      setPlayerAnswer((pa) => [...pa, digit])
      setCurrentIndex(idx + 1)

      if (idx + 1 >= correctAnswerRef.current.length) {
        phaseRef.current = 'feedback'
        setPhase('feedback')

        feedbackTimerRef.current = setTimeout(() => {
          const completedRound = roundRef.current
          if (completedRound >= totalRoundsRef.current) {
            const score =
              totalAnswersRef.current > 0
                ? Math.round((correctCountRef.current / totalAnswersRef.current) * 100)
                : 0
            setFinalScore(score)
            setTotalTimeMs(performance.now() - gameStartRef.current)
            setIsComplete(true)
            phaseRef.current = 'complete'
            setPhase('complete')
          } else {
            // Use current params (QUESTION_LENGTH, MEMORISE_MS may have scaled in endless)
            const nextQLen = endlessMode
              ? Math.min(BASE_QUESTION_LENGTH + Math.floor((params?.endlessRound ?? 1) / 2), 6)
              : BASE_QUESTION_LENGTH
            const nextMemMs = endlessMode
              ? Math.max(1400, BASE_MEMORISE_MS - (params?.endlessRound ?? 1) * 150)
              : BASE_MEMORISE_MS
            startRound(completedRound + 1, buildCipher(), nextQLen, nextMemMs)
          }
        }, FEEDBACK_MS)
      }
    },
    [startRound, endlessMode, params?.endlessRound],
  )

  const liveScore =
    totalAnswersRef.current > 0
      ? Math.round((correctCountRef.current / totalAnswersRef.current) * 100)
      : 0

  return {
    phase,
    round,
    totalRounds: TOTAL_ROUNDS,
    cipher,
    question,
    correctAnswer,
    playerAnswer,
    currentIndex,
    score: isComplete ? finalScore : liveScore,
    isComplete,
    totalTimeMs,
    accuracy: totalAnswersRef.current > 0 ? correctCountRef.current / totalAnswersRef.current : 0,
    submitDigit,
  }
}
