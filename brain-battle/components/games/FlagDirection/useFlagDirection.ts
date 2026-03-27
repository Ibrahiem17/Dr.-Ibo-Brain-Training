import { useState, useCallback, useRef, useEffect } from 'react'

const BASE_TOTAL_ROUNDS = 5
const SHOW_DURATION = 1100  // ms each direction is visible
const PAUSE_BETWEEN = 200   // ms blank gap between directions

// Sequence lengths per round: 2, 3, 3, 4, 4
const SEQUENCE_LENGTHS = [2, 3, 3, 4, 4]

export const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const
export type Direction = typeof DIRECTIONS[number]
export type FlagPhase = 'showing' | 'inputting' | 'feedback'

// Arm angle (degrees): 0 = points right, 90 = points down, 270 = points up, 180 = points left
export const DIRECTION_ANGLES: Record<Direction, number> = {
  RIGHT: 0,
  DOWN:  90,
  LEFT:  180,
  UP:    270,
}

export const DIRECTION_DISPLAY: Record<Direction, { label: string; arrow: string }> = {
  UP:    { label: 'UP',    arrow: '↑' },
  DOWN:  { label: 'DOWN',  arrow: '↓' },
  LEFT:  { label: 'LEFT',  arrow: '←' },
  RIGHT: { label: 'RIGHT', arrow: '→' },
}

function makeSequence(round: number, endlessMode: boolean, endlessRound: number): Direction[] {
  let length: number
  if (endlessMode) {
    // In endless mode, sequence grows with endlessRound, caps at 8
    length = Math.min(2 + Math.floor(endlessRound / 2), 8)
  } else {
    length = SEQUENCE_LENGTHS[round - 1] ?? 4
  }
  return Array.from({ length }, () => DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)])
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFlagDirection(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1

  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS

  const initSeq = makeSequence(1, endlessMode, endlessRound)

  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<FlagPhase>('showing')
  const [sequence, setSequence] = useState<Direction[]>(initSeq)
  const [displayDirection, setDisplayDirection] = useState<Direction | null>(null)
  const [playerInput, setPlayerInput] = useState<Direction[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const rawPointsRef = useRef(0)
  const roundRef = useRef(1)
  const sequenceRef = useRef<Direction[]>(initSeq)
  const phaseRef = useRef<FlagPhase>('showing')
  const playerInputRef = useRef<Direction[]>([])
  const totalAnswersRef = useRef(0)
  const totalCorrectRef = useRef(0)
  const gameStartRef = useRef(performance.now())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalRoundsRef = useRef(TOTAL_ROUNDS)

  totalRoundsRef.current = TOTAL_ROUNDS

  function clearTimers(): void {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
  }

  function setPhaseTracked(p: FlagPhase): void {
    phaseRef.current = p
    setPhase(p)
  }

  const startShowing = useCallback((seq: Direction[]): void => {
    clearTimers()
    playerInputRef.current = []
    setPlayerInput([])
    setDisplayDirection(null)
    setPhaseTracked('showing')

    seq.forEach((dir, i) => {
      const showAt = i * (SHOW_DURATION + PAUSE_BETWEEN)
      const hideAt = showAt + SHOW_DURATION
      timersRef.current.push(
        setTimeout(() => setDisplayDirection(dir), showAt),
        setTimeout(() => setDisplayDirection(null), hideAt),
      )
    })

    const inputAt = seq.length * (SHOW_DURATION + PAUSE_BETWEEN) + 500
    timersRef.current.push(
      setTimeout(() => setPhaseTracked('inputting'), inputAt),
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Kick off first round on mount
  useEffect(() => {
    startShowing(sequenceRef.current)
    return clearTimers
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tapDirection = useCallback((dir: Direction): void => {
    if (phaseRef.current !== 'inputting') return

    const next = [...playerInputRef.current, dir]
    playerInputRef.current = next
    setPlayerInput(next)

    if (next.length < sequenceRef.current.length) return

    const tr = totalRoundsRef.current
    phaseRef.current = 'feedback'
    const correct = next.every((d, i) => d === sequenceRef.current[i])
    totalAnswersRef.current += 1
    totalCorrectRef.current += correct ? 1 : 0
    rawPointsRef.current += correct ? Math.round(100 / tr) : 0

    setFeedback(correct ? 'correct' : 'wrong')
    setPhaseTracked('feedback')

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null)
      const r = roundRef.current
      if (r >= tr) {
        setTotalTimeMs(performance.now() - gameStartRef.current)
        setIsComplete(true)
      } else {
        const nextRound = r + 1
        roundRef.current = nextRound
        setRound(nextRound)
        const seq = makeSequence(nextRound, endlessMode, endlessRound)
        sequenceRef.current = seq
        setSequence(seq)
        startShowing(seq)
      }
    }, 1200)
  }, [startShowing, endlessMode, endlessRound]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    round,
    totalRounds: TOTAL_ROUNDS,
    phase,
    sequence,
    displayDirection,
    playerInput,
    feedback,
    isComplete,
    totalTimeMs,
    score: Math.min(100, rawPointsRef.current),
    accuracy: totalAnswersRef.current > 0 ? totalCorrectRef.current / totalAnswersRef.current : 0,
    tapDirection,
  }
}
