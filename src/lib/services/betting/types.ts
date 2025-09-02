// Types for betting system
export interface Bet {
  id: string
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  marketType: string // This maps to oddid in database
  selection: string
  odds: number // American odds
  line?: number
  sportsbook: string
  description: string
}

export interface DatabaseBet {
  id?: string
  user_id: string
  external_bet_id?: string
  sport: string
  league: string
  bet_type:
    | 'spread'
    | 'moneyline'
    | 'total'
    | 'player_prop'
    | 'game_prop'
    | 'first_half'
    | 'quarter'
    | 'period'
    | 'parlay'
  bet_description: string
  odds: number // American odds as integer
  stake: number
  potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
  placed_at: string // ISO timestamp
  settled_at?: string
  game_date: string // ISO timestamp
  prop_type?: string
  player_name?: string
  home_team: string
  away_team: string
  profit?: number
  sportsbook: string
  line_value?: number
  bet_source: string
  is_copy_bet: boolean
  game_id: string
  source_strategy_id?: string
  copied_from_bet_id?: string
  strategy_id?: string
  oddid: string
  side?: 'over' | 'under' | 'home' | 'away'
  odd_source?: string
  parlay_id?: string
  is_parlay: boolean
}

export interface ParlayStatus {
  parlayId: string
  status: 'pending' | 'won' | 'lost' | 'void'
  totalLegs: number
  wonLegs: number
  lostLegs: number
  pendingLegs: number
  voidLegs: number
  totalStake: number
  potentialPayout: number
}

export interface BetSubmissionResult {
  success: boolean
  error?: string
  betId?: string
  parlayId?: string
  message?: string
}
