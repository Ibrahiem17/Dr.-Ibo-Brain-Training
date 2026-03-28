import { useState, useRef, useCallback, useEffect } from 'react'

export type ReactionPhase = 'waiting' | 'ready' | 'result' | 'complete'

const BASE_ROUNDS = 5
const MIN_DELAY_MS = 800
const MAX_DELAY_MS = 2500
const FEEDBACK_MS = 900

interface Params {
  endlessMode?: boolean
  endlessRound?: number
}

export function useReactionTap(params?: Params) {
  const endlessMode = params?.endlessMode ?? false
  const endlessRound = params?.endlessRound ?? 1
  const TOTAL_ROUNDS = endlessMode ? 3 : BASE_ROUNDS

  const [phase, setPhase] = useState<ReactionPhase>('waiting')
  const [round, setRound] = useState(1)
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null)
  const [isEarlyTap, setIsEarlyTap] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const phaseRef = useRef<ReactionPhase>('waiting')
  const roundScoresRef = useRef<number[]>([])
  const earlyTapCountRef = useRef(0)
  const gameStartRef = useRef(0)
  const tapStartRef = useRef(0)
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalRoundsRef = useRef(TOTAL_ROUNDS)
  totalRoundsRef.current = TOTAL_ROUNDS

  const scheduleReady = useCallback(() => {
    const minDelay = endlessMode ? Math.max(400, MIN_DELAY_MS - endlessRound * 40) : MIN_DELAY_MS
    const maxDelay = endlessMode ? Math.max(1000, MAX_DELAY_MS - endlessRound * 60) : MAX_DELAY_MS
    const delay = minDelay + Math.random() * (maxDelay - minDelay)
    readyTimerRef.current = setTimeout(() => {
      tapStartRef.current = performance.now()
      phaseRef.current = 'ready'
      setPhase('ready')
    }, delay)
  }, [endlessMode, endlessRound])

  const afterFeedback = useCallback(() => {
    const tr = totalRoundsRef.current
    if (roundScoresRef.current.length >= tr) {
      const total = roundScoresRef.current.reduce((s, p) => s + p, 0)
      const score = Math.round(total / tr)
      setFinalScore(score)
      setTotalTimeMs(performance.now() - gameStartRef.current)
      setIsComplete(true)
      phaseRef.current = 'complete'
      setPhase('complete')
    } else {
      const nextRound = roundScoresRef.current.length + 1
      setRound(nextRound)
      setIsEarlyTap(false)
      setLastReactionMs(null)
      phaseRef.current = 'waiting'
      setPhase('waiting')
      scheduleReady()
    }
  }, [scheduleReady])

  useEffect(() => {
    gameStartRef.current = performance.now()
    scheduleReady()
    return () => {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = useCallback(() => {
    const p = phaseRef.current
    if (p === 'result' || p === 'complete') return

    if (p === 'waiting') {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current)
      earlyTapCountRef.current += 1
      roundScoresRef.current.push(0)
      setIsEarlyTap(true)
      setLastReactionMs(null)
      phaseRef.current = 'result'
      setPhase('result')
      feedbackTimerRef.current = setTimeout(afterFeedback, FEEDBACK_MS)
    } else if (p === 'ready') {
      const reactionMs = Math.round(performance.now() - tapStartRef.current)
      const clamped = Math.min(reactionMs, 1200)
      // 100 pts at ≤200ms, 0 pts at ≥1000ms, linear
      const roundScore = Math.max(0, Math.round(((1000 - clamped) / 800) * 100))
      roundScoresRef.current.push(roundScore)
      setIsEarlyTap(false)
      setLastReactionMs(reactionMs)
      phaseRef.current = 'result'
      setPhase('result')
      feedbackTimerRef.current = setTimeout(afterFeedback, FEEDBACK_MS)
    }
  }, [afterFeedback])

  const currentAvg =
    roundScoresRef.current.length > 0
      ? Math.round(roundScoresRef.current.reduce((s, p) => s + p, 0) / roundScoresRef.current.length)
      : 0

  return {
    phase,
    round,
    totalRounds: TOTAL_ROUNDS,
    lastReactionMs,
    isEarlyTap,
    score: isComplete ? finalScore : currentAvg,
    isComplete,
    totalTimeMs,
    accuracy: (TOTAL_ROUNDS - earlyTapCountRef.current) / TOTAL_ROUNDS,
    handleTap,
  }
}
