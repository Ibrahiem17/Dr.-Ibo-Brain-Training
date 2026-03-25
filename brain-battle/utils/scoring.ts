export function normaliseScore(rawPoints: number, maxPoints: number): number {
  return Math.min(100, Math.round((rawPoints / maxPoints) * 100))
}

export function calcBrainAge(scores: number[]): number {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  if (avg >= 90) return 20
  if (avg >= 75) return 25
  if (avg >= 60) return 30
  if (avg >= 45) return 40
  if (avg >= 30) return 50
  return 65
}

export function timeBonus(timeUsedMs: number, timeLimitMs: number): number {
  const ratio = Math.min(1, timeUsedMs / timeLimitMs)
  return Math.max(0.2, 1 - ratio * 0.8)
}
