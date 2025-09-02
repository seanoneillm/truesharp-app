import { Bet, BetFilter } from './base-filter-engine'

export function filterByResult(result: 'won' | 'lost' | 'void' | 'pending'): BetFilter {
  return (bet: Bet) => bet.result === result
}

export function filterByMinStake(minStake: number): BetFilter {
  return (bet: Bet) => bet.stake >= minStake
}
