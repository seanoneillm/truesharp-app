import { Bet, BetFilter } from './base-filter-engine'

export function filterByBetType(betType: string): BetFilter {
  return (bet: Bet) => bet.betType === betType
}

export function filterByPropType(propType: string): BetFilter {
  return (bet: Bet) => bet.propType === propType
}
