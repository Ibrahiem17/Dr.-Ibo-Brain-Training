import { useState, useEffect, useRef, useCallback } from 'react'

export interface GridCell {
  id: number
  color: string
  isLit: boolean
  isNeutral: boolean
}

export type GridMemoryFeedback = 'correct' | 'wrong' | null
export type GridMemoryPhase = 'showing' | 'recall'

const BALL_COLORS = ['#ff2d6b', '#00e5ff', '#aaff00', '#ff9f00', '#c084fc']
const LIT_COUNTS = [3, 4, 5, 6]
const BASE_TOTAL_ROUNDS = 4
const SHOW_DURATION = 1800

function getEndlessLitCount(endlessRound: number): number {
  // Starts at 2, increases every 2 rounds, caps at 8
  return Math.min(2 + Math.floor(endlessRound / 2), 8)
}

function buildGrid(litCount: number): GridCell[] {
  const cells: GridCell[] = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
    isLit: false,
    isNeutral: false,
  }))

  // Fisher-Yates shuffle to pick lit indices
  const indices = Array.from({ length: 16 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const litSet = new Set(indices.slice(0, litCount))
  cells.forEach((c) => {
    c.isLit = litSet.has(c.id)
  })

  return cells
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

export function useGridMemory(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1

  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS

  const getLitCount = (roundNum: number): number =>
    endlessMode ? getEndlessLitCount(endlessRound) : (LIT_COUNTS[roundNum - 1] ?? 7)

  const [grid, setGrid] = useState<GridCell[]>([])
  const [phase, setPhase] = useState<GridMemoryPhase>('showing')
  const [round, setRound] = useState(1)
  const [rawPoints, setRawPoints] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<GridMemoryFeedback>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const roundRef = useRef(1)
  const rawPointsRef = useRef(0)
  const correctCountRef = useRef(0)
  const processingRef = useRef(false)
  const gameStartRef = useRef(0)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const litCountRef = useRef(getLitCount(1))
  const totalRoundsRef = useRef(TOTAL_ROUNDS)

  totalRoundsRef.current = TOTAL_ROUNDS

  // Keep roundRef in sync
  useEffect(() => {
    roundRef.current = round
  }, [round])

  const startRound = useCallback((roundNum: number) => {
    const litCount = getLitCount(roundNum)
    litCountRef.current = litCount
    const cells = buildGrid(litCount)
    setGrid(cells)
    setPhase('showing')

    // Switch to recall after show duration
    showTimerRef.current = setTimeout(() => {
      setGrid((prev) => prev.map((c) => ({ ...c, isLit: false, isNeutral: true })))
      setPhase('recall')
    }, SHOW_DURATION)
  }, [endlessMode, endlessRound]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init
  useEffect(() => {
    gameStartRef.current = performance.now()
    startRound(1)
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submitAnswer = useCallback(
    (answer: number) => {
      if (processingRef.current) return
      processingRef.current = true

      const currentRound = roundRef.current
      const litCount = litCountRef.current
      const tr = totalRoundsRef.current
      const correct = answer === litCount
      const points = correct ? Math.round(100 / tr) : 0

      rawPointsRef.current += points
      correctCountRef.current += correct ? 1 : 0
      setRawPoints(rawPointsRef.current)
      setCorrectCount(correctCountRef.current)
      setFeedback(correct ? 'correct' : 'wrong')

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = setTimeout(() => {
        processingRef.current = false
        setFeedback(null)

        if (currentRound >= tr) {
          const score = Math.min(100, rawPointsRef.current)
          const timeMs = performance.now() - gameStartRef.current
          setFinalScore(score)
          setTotalTimeMs(timeMs)
          setIsComplete(true)
        } else {
          const nextRound = currentRound + 1
          roundRef.current = nextRound
          setRound(nextRound)
          startRound(nextRound)
        }
      }, 800)
    },
    [startRound],
  )

  return {
    grid,
    phase,
    round,
    totalRounds: TOTAL_ROUNDS,
    litCount: getLitCount(round),
    score: isComplete ? finalScore : Math.min(100, rawPointsRef.current),
    feedback,
    isComplete,
    totalTimeMs,
    accuracy: correctCount / TOTAL_ROUNDS,
    submitAnswer,
  }
}
