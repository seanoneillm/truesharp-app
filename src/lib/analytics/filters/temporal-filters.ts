import { Bet, BetFilter } from './base-filter-engine'

export function filterByDateRange(start: Date, end: Date): BetFilter {
  return (bet: Bet) => {
    const betDate = new Date(bet.date)
    return betDate >= start && betDate <= end
  }
}
