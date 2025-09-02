/**
 * Calculates the Pearson correlation coefficient between two numeric arrays.
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  const numerator = x.reduce((sum, xi, i) => {
    const yi = y[i]
    if (yi === undefined) return sum
    return sum + (xi - meanX) * (yi - meanY)
  }, 0)
  const denominatorX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0))
  const denominatorY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0))

  const denominator = denominatorX * denominatorY
  return denominator === 0 ? 0 : numerator / denominator
}
