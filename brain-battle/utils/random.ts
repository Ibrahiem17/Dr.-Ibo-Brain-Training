export const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const randFrom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
