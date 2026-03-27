import { useState, useCallback, useRef, useEffect } from 'react'

const BASE_TOTAL_ROUNDS = 5

export const BLOCK_COLORS = ['RED', 'ORANGE', 'WHITE', 'BLUE', 'YELLOW'] as const
export const COLOR_HEX: Record<string, string> = {
  RED:    '#ff2d6b',
  ORANGE: '#ff9f00',
  WHITE:  '#f0f0f0',
  BLUE:   '#00e5ff',
  YELLOW: '#ffe44d',
}

export interface Block {
  id: number
  x: number       // pixels from left
  color: string   // key from BLOCK_COLORS
  speed: number   // 0.8 to 1.4
  delay: number   // seconds before starting to fall (0 to 1.0)
}

export interface Question {
  text: string
  options: string[]
  answer: string
}

export type FallingPhase = 'falling' | 'questions' | 'complete'
export type FallingFeedback = 'correct' | 'wrong' | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNumericChoices(correct: number): string[] {
  const set = new Set<number>([correct])
  let attempts = 0
  while (set.size < 4 && attempts < 100) {
    attempts++
    const delta = Math.floor(Math.random() * 3) + 1
    const candidate = correct + (Math.random() < 0.5 ? delta : -delta)
    if (candidate >= 0) set.add(candidate)
  }
  let pad = 0
  while (set.size < 4) { if (!set.has(pad)) set.add(pad); pad++ }
  return [...set].sort(() => Math.random() - 0.5).map(String)
}

function generateRoundData(screenWidth: number): {
  blocks: Block[]
  colors: string[]
  counts: Record<string, number>
} {
  // 3-4 random colors, no duplicates
  const numColors = Math.random() < 0.5 ? 3 : 4
  const shuffled = [...BLOCK_COLORS].sort(() => Math.random() - 0.5)
  const colors = shuffled.slice(0, numColors)

  const counts: Record<string, number> = {}
  colors.forEach(c => { counts[c] = 0 })

  // 8-12 blocks
  const blockCount = Math.floor(Math.random() * 5) + 8
  const blocks: Block[] = Array.from({ length: blockCount }, (_, i) => {
    const color = colors[Math.floor(Math.random() * colors.length)]
    counts[color]++
    return {
      id: i,
      x: Math.floor(Math.random() * Math.max(1, screenWidth - 60)),
      color,
      speed: 0.8 + Math.random() * 0.6,   // 0.8 – 1.4
      delay: Math.random() * 1.0,          // 0 – 1.0 s
    }
  })

  return { blocks, colors, counts }
}

function generateQuestions(colors: string[], counts: Record<string, number>): Question[] {
  const pool: Question[] = []

  // Type 1: "How many [COLOR] blocks were there?" — one per color
  colors.forEach(c => {
    pool.push({
      text: `How many ${c} blocks were there?`,
      options: makeNumericChoices(counts[c]),
      answer: String(counts[c]),
    })
  })

  // Type 2: "How many [C1] and [C2] combined?" — for first pair
  if (colors.length >= 2) {
    const [c1, c2] = colors
    pool.push({
      text: `How many ${c1} and ${c2} combined?`,
      options: makeNumericChoices(counts[c1] + counts[c2]),
      answer: String(counts[c1] + counts[c2]),
    })
  }

  // Type 3: "Were there more [C1] or [C2]?" — only if counts differ
  for (let i = 0; i < colors.length - 1; i++) {
    const ca = colors[i], cb = colors[i + 1]
    if (counts[ca] !== counts[cb]) {
      pool.push({
        text: `Were there more ${ca} or ${cb}?`,
        options: [ca, cb],
        answer: counts[ca] > counts[cb] ? ca : cb,
      })
      break
    }
  }

  // Always keep one type-1, then randomly pick 1-2 more
  const type1s = pool.filter(q => q.options.length === 4 && colors.some(c => q.text.includes(`How many ${c} blocks`)))
  const others = pool.filter(q => !type1s.includes(q))

  const shuffledT1 = [...type1s].sort(() => Math.random() - 0.5)
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5)

  const selected: Question[] = []
  if (shuffledT1.length > 0) selected.push(shuffledT1[0])
  const remaining = [...shuffledT1.slice(1), ...shuffledOthers].sort(() => Math.random() - 0.5)
  const numExtra = Math.floor(Math.random() * 2) + 1   // 1 or 2
  selected.push(...remaining.slice(0, numExtra))

  return selected.slice(0, 3)  // cap at 3
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFallingBlocks(screenWidth: number, params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS

  const initData = generateRoundData(screenWidth)
  const initQuestions = generateQuestions(initData.colors, initData.counts)

  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<FallingPhase>('falling')
  const [blocks, setBlocks] = useState<Block[]>(initData.blocks)
  const [questions, setQuestions] = useState<Question[]>(initQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<FallingFeedback>(null)
  const [rawPoints, setRawPoints] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const rawPointsRef = useRef(0)
  const roundRef = useRef(1)
  const feedbackRef = useRef<FallingFeedback>(null)
  const totalAnswersRef = useRef(0)
  const totalCorrectRef = useRef(0)
  const questionsRef = useRef<Question[]>(initQuestions)
  const questionIndexRef = useRef(0)
  const gameStartRef = useRef(performance.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalRoundsRef = useRef(TOTAL_ROUNDS)
  totalRoundsRef.current = TOTAL_ROUNDS

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
  }, [])

  const onFallingComplete = useCallback(() => {
    setPhase('questions')
  }, [])

  const submitAnswer = useCallback((option: string) => {
    if (feedbackRef.current !== null) return

    const q = questionsRef.current[questionIndexRef.current]
    const correct = option === q.answer
    const pointsPerAnswer = Math.round(100 / (totalRoundsRef.current * questionsRef.current.length))
    const points = correct ? pointsPerAnswer : 0

    rawPointsRef.current += points
    totalAnswersRef.current += 1
    totalCorrectRef.current += correct ? 1 : 0
    setRawPoints(rawPointsRef.current)

    const fb: FallingFeedback = correct ? 'correct' : 'wrong'
    feedbackRef.current = fb
    setFeedback(fb)

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      feedbackRef.current = null
      setFeedback(null)

      const nextIdx = questionIndexRef.current + 1

      if (nextIdx >= questionsRef.current.length) {
        // All questions in this round answered
        const r = roundRef.current
        if (r >= totalRoundsRef.current) {
          setTotalTimeMs(performance.now() - gameStartRef.current)
          setIsComplete(true)
          setPhase('complete')
        } else {
          const next = r + 1
          roundRef.current = next
          const data = generateRoundData(screenWidth)
          const qs = generateQuestions(data.colors, data.counts)
          questionsRef.current = qs
          questionIndexRef.current = 0
          setRound(next)
          setBlocks(data.blocks)
          setQuestions(qs)
          setCurrentQuestionIndex(0)
          setPhase('falling')
        }
      } else {
        questionIndexRef.current = nextIdx
        setCurrentQuestionIndex(nextIdx)
      }
    }, 700)
  }, [screenWidth]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    blocks,
    phase,
    round,
    totalRounds: TOTAL_ROUNDS,
    questions,
    currentQuestionIndex,
    feedback,
    score: Math.min(100, rawPointsRef.current),
    isComplete,
    totalTimeMs,
    accuracy: totalAnswersRef.current > 0 ? totalCorrectRef.current / totalAnswersRef.current : 0,
    onFallingComplete,
    submitAnswer,
  }
}
