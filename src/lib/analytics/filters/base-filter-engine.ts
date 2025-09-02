export interface Bet {
  date: string
  league: string
  sport: string
  team: string
  player?: string
  opponent?: string
  homeAway?: 'home' | 'away'
  propType?: string
  betType?: string
  odds: number
  result: 'won' | 'lost' | 'void' | 'pending'
  stake: number
  payout: number
  clv?: number
  openingLines?: {
    spread?: number
    total?: number
    moneyline?: number
  }
  closingLines?: {
    spread?: number
    total?: number
    moneyline?: number
  }
}

export type BetFilter = (bet: Bet) => boolean

export function applyFilters(bets: Bet[], filters: BetFilter[]): Bet[] {
  return bets.filter(bet => filters.every(filter => filter(bet)))
}
