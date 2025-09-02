import { Bet } from './free-tier-engine'

/**
 * Calculates the line movement for a given bet.
 * Line Movement = Closing Line - Opening Line
 */
export function calculateLineMovement(
  bet: Bet & { openingLine: number; closingLine: number }
): number {
  const { openingLine, closingLine } = bet

  if (openingLine === undefined || closingLine === undefined) return 0

  return closingLine - openingLine
}
