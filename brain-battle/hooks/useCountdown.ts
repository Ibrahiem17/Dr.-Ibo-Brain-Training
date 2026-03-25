import { useEffect, useRef, useState } from 'react'

export function useCountdown(startFrom: number, onComplete: () => void): number {
  const [count, setCount] = useState(startFrom)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setCount(startFrom)
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(() => onCompleteRef.current(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [startFrom])

  return count
}
