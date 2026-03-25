import { useEffect, useRef, useState } from 'react'

export function useGameTimer(): {
  timeMs: number
  start: () => void
  stop: () => void
  reset: () => void
} {
  const [timeMs, setTimeMs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)

  const start = () => {
    if (intervalRef.current) return
    startTimeRef.current = performance.now()
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        setTimeMs(accumulatedRef.current + (performance.now() - startTimeRef.current))
      }
    }, 100)
  }

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (startTimeRef.current !== null) {
      accumulatedRef.current += performance.now() - startTimeRef.current
      startTimeRef.current = null
    }
  }

  const reset = () => {
    stop()
    accumulatedRef.current = 0
    setTimeMs(0)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { timeMs, start, stop, reset }
}
