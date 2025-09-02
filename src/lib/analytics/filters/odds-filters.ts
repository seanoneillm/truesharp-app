import { Bet, BetFilter } from './base-filter-engine'

export function filterByOddsRange(min: number, max: number): BetFilter {
  return (bet: Bet) => bet.odds >= min && bet.odds <= max
}

export function filterByCLV(minCLV: number): BetFilter {
  return (bet: Bet) => (bet.clv ?? 0) >= minCLV
}
