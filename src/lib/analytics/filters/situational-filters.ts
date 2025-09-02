import { Bet, BetFilter } from './base-filter-engine'

export function filterByHomeAway(homeAway: 'home' | 'away'): BetFilter {
  return (bet: Bet) => bet.homeAway === homeAway
}

export function filterByOpponent(opponent: string): BetFilter {
  return (bet: Bet) => bet.opponent === opponent
}
