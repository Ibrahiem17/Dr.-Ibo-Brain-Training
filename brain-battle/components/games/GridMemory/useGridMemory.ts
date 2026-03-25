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
const LIT_COUNTS = [2, 3, 4, 5, 6, 7]
const TOTAL_ROUNDS = 6
const SHOW_DURATION = 1800

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

export function useGridMemory() {
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

  // Keep roundRef in sync
  useEffect(() => {
    roundRef.current = round
  }, [round])

  const startRound = useCallback((roundNum: number) => {
    const litCount = LIT_COUNTS[roundNum - 1]
    const cells = buildGrid(litCount)
    setGrid(cells)
    setPhase('showing')

    // Switch to recall after show duration
    showTimerRef.current = setTimeout(() => {
      setGrid((prev) => prev.map((c) => ({ ...c, isLit: false, isNeutral: true })))
      setPhase('recall')
    }, SHOW_DURATION)
  }, [])

  // Init
  useEffect(() => {
    gameStartRef.current = performance.now()
    startRound(1)
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submitAnswer = useCallback(
    (answer: number) => {
      if (processingRef.current) return
      processingRef.current = true

      const currentRound = roundRef.current
      const litCount = LIT_COUNTS[currentRound - 1]
      const correct = answer === litCount
      const points = correct ? Math.round(100 / TOTAL_ROUNDS) : 0

      rawPointsRef.current += points
      correctCountRef.current += correct ? 1 : 0
      setRawPoints(rawPointsRef.current)
      setCorrectCount(correctCountRef.current)
      setFeedback(correct ? 'correct' : 'wrong')

      setTimeout(() => {
        processingRef.current = false
        setFeedback(null)

        if (currentRound >= TOTAL_ROUNDS) {
          const score = Math.min(100, rawPointsRef.current)
          const timeMs = performance.now() - gameStartRef.current
          const acc = correctCountRef.current / TOTAL_ROUNDS
          setFinalScore(score)
          setTotalTimeMs(timeMs)
          setIsComplete(true)
          // also expose accuracy via state
          setCorrectCount(correctCountRef.current) // already set
          void acc
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
    litCount: LIT_COUNTS[round - 1],
    score: isComplete ? finalScore : Math.min(100, rawPointsRef.current),
    feedback,
    isComplete,
    totalTimeMs,
    accuracy: correctCount / TOTAL_ROUNDS,
    submitAnswer,
  }
}
