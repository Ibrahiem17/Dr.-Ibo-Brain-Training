import { useState, useCallback, useRef, useEffect } from 'react'

const BASE_TOTAL_ROUNDS = 4
const SETTLE_DELAY = 400

// ms study time per round — round 1 gets extra time
const STUDY_DURATIONS = [3500, 3000, 3000, 2500]

export const TARGET_COLOR = '#ff2d6b'

export interface CubeletState {
  id: number
  isTarget: boolean
  isSelected: boolean
}

export type CubePhase = 'study' | 'exploding' | 'settling' | 'selecting' | 'feedback'

function getTargetCount(round: number, endlessMode: boolean, endlessRound: number): number {
  if (endlessMode) {
    // Scale with endless round, starts at 2, caps at 5
    return Math.min(2 + Math.floor(endlessRound / 3), 5)
  }
  return round <= 2 ? 2 : 3
}

function makeCubelets(round: number, endlessMode = false, endlessRound = 1): CubeletState[] {
  const count = getTargetCount(round, endlessMode, endlessRound)
  const targets = new Set<number>()
  while (targets.size < count) {
    targets.add(Math.floor(Math.random() * 27))
  }
  return Array.from({ length: 27 }, (_, i) => ({
    id: i,
    isTarget: targets.has(i),
    isSelected: false,
  }))
}

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExplodingCube(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1

  const TOTAL_ROUNDS = endlessMode ? 1 : BASE_TOTAL_ROUNDS

  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<CubePhase>('study')
  const [cubelets, setCubelets] = useState<CubeletState[]>(() => makeCubelets(1, endlessMode, endlessRound))
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const rawPointsRef = useRef(0)
  const roundRef = useRef(1)
  const phaseRef = useRef<CubePhase>('study')
  const cubeletsRef = useRef<CubeletState[]>(makeCubelets(1, endlessMode, endlessRound))
  const totalRoundsRef = useRef(TOTAL_ROUNDS)
  totalRoundsRef.current = TOTAL_ROUNDS
  const totalAnswersRef = useRef(0)
  const totalCorrectRef = useRef(0)
  const gameStartRef = useRef(performance.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep cubeletsRef in sync
  useEffect(() => { cubeletsRef.current = cubelets }, [cubelets])

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
  }, [])

  function setPhaseTracked(p: CubePhase): void {
    phaseRef.current = p
    setPhase(p)
  }

  const onStudyEnd = useCallback((): void => {
    setPhaseTracked('exploding')
  }, [])

  const onExplosionComplete = useCallback((): void => {
    setPhaseTracked('settling')
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(() => {
      setPhaseTracked('selecting')
    }, SETTLE_DELAY)
  }, [])

  const selectCubelet = useCallback((id: number): void => {
    if (phaseRef.current !== 'selecting') return
    setCubelets(prev => prev.map(c =>
      c.id === id ? { ...c, isSelected: !c.isSelected } : c
    ))
  }, [])

  const confirmAnswer = useCallback((): void => {
    if (phaseRef.current !== 'selecting') return

    const current = cubeletsRef.current
    const needed = getTargetCount(roundRef.current, endlessMode, endlessRound)
    const selected = current.filter(c => c.isSelected)
    if (selected.length !== needed) return

    const correct = selected.every(c => c.isTarget)
    totalAnswersRef.current += 1
    totalCorrectRef.current += correct ? 1 : 0
    rawPointsRef.current += correct ? Math.round(100 / totalRoundsRef.current) : 0

    setFeedback(correct ? 'correct' : 'wrong')
    setPhaseTracked('feedback')

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null)
      const r = roundRef.current
      if (r >= totalRoundsRef.current) {
        setTotalTimeMs(performance.now() - gameStartRef.current)
        setIsComplete(true)
      } else {
        const next = r + 1
        roundRef.current = next
        setRound(next)
        const fresh = makeCubelets(next, endlessMode, endlessRound)
        cubeletsRef.current = fresh
        setCubelets(fresh)
        setPhaseTracked('study')
      }
    }, 1200)
  }, [endlessMode, endlessRound]) // eslint-disable-line react-hooks/exhaustive-deps

  const targetCount = getTargetCount(round, endlessMode, endlessRound)
  const selectedCount = cubelets.filter(c => c.isSelected).length

  return {
    round,
    totalRounds: totalRoundsRef.current,
    phase,
    cubelets,
    feedback,
    isComplete,
    totalTimeMs,
    score: Math.min(100, rawPointsRef.current),
    accuracy: totalAnswersRef.current > 0 ? totalCorrectRef.current / totalAnswersRef.current : 0,
    studyDuration: STUDY_DURATIONS[round - 1] ?? 3000,
    targetCount,
    selectedCount,
    onStudyEnd,
    onExplosionComplete,
    selectCubelet,
    confirmAnswer,
  }
}
