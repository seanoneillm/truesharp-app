// Helper functions for SharpSports data normalization

export function normalizeSide(position: string | undefined | null): string | null {
  if (!position) return null
  
  const lower = position.toLowerCase()
  
  if (lower.includes('over')) return 'over'
  if (lower.includes('under')) return 'under'
  if (lower.includes('home')) return 'home'
  if (lower.includes('away')) return 'away'
  
  // For team names or other positions, return null to avoid constraint violations
  // The side column should only contain 'over', 'under', 'home', 'away'
  return null
}

export function computeProfit(bet: any): number {
  if (!bet.status) return 0
  
  const status = bet.status.toLowerCase()
  
  if (status === 'won') {
    return (bet.toWin || 0) / 100 // Convert cents to dollars
  }
  
  if (status === 'lost') {
    return -((bet.atRisk || 0) / 100) // Convert cents to dollars
  }
  
  // For pending, cancelled, void, etc.
  return 0
}

export function normalizeBetType(proposition: string | undefined | null): string {
  if (!proposition) return 'player_prop'
  
  const lower = proposition.toLowerCase()
  
  // Map to allowed bet types: 'spread', 'moneyline', 'total', 'player_prop', 'game_prop', 'first_half', 'quarter', 'period', 'parlay'
  if (lower.includes('spread') || lower.includes('point spread') || lower.includes('run line')) return 'spread'
  if (lower.includes('total') || lower.includes('over/under')) return 'total'
  if (lower.includes('moneyline') || lower.includes('money line')) return 'moneyline'
  if (lower.includes('first half') || lower.includes('1st half')) return 'first_half'
  if (lower.includes('quarter') || lower.includes('1st quarter') || lower.includes('2nd quarter') || lower.includes('3rd quarter') || lower.includes('4th quarter')) return 'quarter'
  if (lower.includes('period') || lower.includes('1st period') || lower.includes('2nd period') || lower.includes('3rd period')) return 'period'
  if (lower.includes('inning') || lower.includes('exact score') || lower.includes('correct score')) return 'game_prop'
  
  // Default to player_prop for other types
  return 'player_prop'
}

export function normalizeBetStatus(status: string | undefined | null): string {
  if (!status) return 'pending'
  
  const lower = status.toLowerCase()
  
  // Map various status formats to our standard format
  switch (lower) {
    case 'won':
    case 'win':
    case 'w':
      return 'won'
    case 'lost':
    case 'lose':
    case 'loss':
    case 'l':
      return 'lost'
    case 'pending':
    case 'open':
    case 'active':
      return 'pending'
    case 'cancelled':
    case 'canceled':
    case 'void':
    case 'push':
      return 'void'
    default:
      return 'pending'
  }
}

export function transformSharpSportsBet(bet: any, profileId: string): any {
  return {
    profile_id: profileId,
    external_bet_id: bet.betSlip?.id || bet.id,
    sport: bet.event?.sport,
    league: bet.event?.league || 'N/A', // Provide default for required field
    bet_type: normalizeBetType(bet.proposition),
    bet_description: bet.bookDescription,
    odds: bet.oddsAmerican || 0, // Provide default for required field
    stake: (bet.atRisk || 0) / 100, // Convert cents to dollars
    potential_payout: ((bet.toWin || 0) + (bet.atRisk || 0)) / 100, // Convert cents to dollars
    status: normalizeBetStatus(bet.status),
    placed_at: bet.timePlaced,
    settled_at: bet.dateClosed,
    game_date: bet.event?.startTime,
    home_team: bet.event?.contestantHome?.fullName,
    away_team: bet.event?.contestantAway?.fullName,
    side: normalizeSide(bet.position),
    line_value: bet.line,
    sportsbook: bet.book?.name,
    bet_source: 'sharpsports',
    profit: computeProfit(bet),
    created_at: new Date().toISOString()
  }
}

export function validateBetData(bet: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!bet.external_bet_id) {
    errors.push('Missing external_bet_id')
  }
  
  if (!bet.profile_id) {
    errors.push('Missing profile_id')
  }
  
  if (!bet.stake || bet.stake <= 0) {
    errors.push('Invalid stake amount')
  }
  
  if (!bet.placed_at) {
    errors.push('Missing placed_at timestamp')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export interface SharpSportsAccount {
  id: string
  bettor: string
  book: {
    id: string
    name: string
    abbr?: string
  }
  bookRegion: {
    name: string
    abbr?: string
  }
  verified: boolean
  access: boolean
  paused: boolean
  balance: number
  timeCreated: string
}

export interface SharpSportsBet {
  id: string
  betSlip?: {
    id: string
  }
  event?: {
    sport: string
    league: string
    startTime: string
    contestantHome?: {
      fullName: string
    }
    contestantAway?: {
      fullName: string
    }
  }
  proposition: string
  bookDescription: string
  oddsAmerican: number
  atRisk: number
  toWin: number
  status: string
  timePlaced: string
  dateClosed?: string
  position?: string
  line?: number
  book?: {
    name: string
  }
}