// Helper functions for SharpSports data normalization

export function normalizeSide(
  position: string | undefined | null,
  betDescription?: string,
  homeTeam?: string,
  awayTeam?: string
): string | null {
  if (!position) return null

  const lower = position.toLowerCase()

  // Handle standard side values
  if (lower.includes('over')) return 'over'
  if (lower.includes('under')) return 'under'
  if (lower.includes('home')) return 'home'
  if (lower.includes('away')) return 'away'

  // For SharpSports bets, the position might be a team name
  // Try to determine if it's home or away based on team names
  if (homeTeam && awayTeam && betDescription) {
    const homeTeamLower = homeTeam.toLowerCase()
    const awayTeamLower = awayTeam.toLowerCase()

    // Check if position matches one of the team names
    if (lower.includes(homeTeamLower) || homeTeamLower.includes(lower)) {
      return 'home'
    }
    if (lower.includes(awayTeamLower) || awayTeamLower.includes(lower)) {
      return 'away'
    }

    // Parse bet description for team abbreviations or partial matches
    const descriptionLower = betDescription.toLowerCase()

    // Extract team abbreviations from description
    // Format: "Cincinnati Bengals @ Cleveland Browns - Spread - Game Spread - CIN Bengals -2.5"
    const parts = descriptionLower.split(' - ')
    if (parts.length >= 4) {
      const teamPart = parts[3] // Should contain team and line

      // Check if position appears in the team part of description
      if (teamPart && teamPart.includes(lower)) {
        // Determine if it's home or away based on the @ symbol in the description
        const matchupPart = parts[0] // "team1 @ team2"
        if (matchupPart) {
          const [away = '', home = ''] = matchupPart.split(' @ ').map(t => t.trim())

          if (away && teamPart.includes(away.split(' ')[0]?.toLowerCase() || '')) {
            return 'away'
          }
          if (home && teamPart.includes(home.split(' ')[0]?.toLowerCase() || '')) {
            return 'home'
          }
        }
      }
    }
  }

  // For team names or other positions, return null to avoid constraint violations
  // The side column should only contain 'over', 'under', 'home', 'away'
  return null
}

export function computeProfit(bet: any): number {
  if (!bet.status) return 0

  const status = bet.status.toLowerCase()
  const outcome = bet.outcome?.toLowerCase()

  // Handle completed status with outcome
  if (status === 'completed') {
    if (outcome === 'win' || outcome === 'won') {
      return (bet.toWin || 0) / 100 // Convert cents to dollars
    } else if (outcome === 'loss' || outcome === 'lost' || outcome === 'lose') {
      return -((bet.atRisk || 0) / 100) // Convert cents to dollars
    }
    // For completed with push/void/unknown outcome
    return 0
  }

  // Handle direct status values
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
  if (lower.includes('spread') || lower.includes('point spread') || lower.includes('run line'))
    return 'spread'
  if (lower.includes('total') || lower.includes('over/under')) return 'total'
  if (lower.includes('moneyline') || lower.includes('money line')) return 'moneyline'
  if (lower.includes('first half') || lower.includes('1st half')) return 'first_half'
  if (
    lower.includes('quarter') ||
    lower.includes('1st quarter') ||
    lower.includes('2nd quarter') ||
    lower.includes('3rd quarter') ||
    lower.includes('4th quarter')
  )
    return 'quarter'
  if (
    lower.includes('period') ||
    lower.includes('1st period') ||
    lower.includes('2nd period') ||
    lower.includes('3rd period')
  )
    return 'period'
  if (lower.includes('inning') || lower.includes('exact score') || lower.includes('correct score'))
    return 'game_prop'

  // Default to player_prop for other types
  return 'player_prop'
}

export function normalizeBetStatus(
  status: string | undefined | null,
  outcome: string | undefined | null = null
): string {
  if (!status) return 'pending'

  const lower = status.toLowerCase()
  const outcomeLower = outcome?.toLowerCase()
  console.log(`🔄 Normalizing status: "${status}" (outcome: "${outcome}") -> "${lower}"`)

  // If status is "completed", check the outcome to determine win/loss
  if (lower === 'completed') {
    if (outcomeLower === 'win' || outcomeLower === 'won') {
      console.log(`✅ Completed bet with outcome "${outcome}" mapped to: won`)
      return 'won'
    } else if (outcomeLower === 'loss' || outcomeLower === 'lost' || outcomeLower === 'lose') {
      console.log(`❌ Completed bet with outcome "${outcome}" mapped to: lost`)
      return 'lost'
    } else if (outcomeLower === 'push' || outcomeLower === 'void') {
      console.log(`🚫 Completed bet with outcome "${outcome}" mapped to: void`)
      return 'void'
    } else {
      // If completed but no clear outcome, it might be settled but we don't know the result
      console.log(`⚠️ Completed bet with unclear outcome "${outcome}", defaulting to: pending`)
      return 'pending'
    }
  }

  // Map various status formats to our standard format
  switch (lower) {
    case 'won':
    case 'win':
    case 'w':
      console.log(`✅ Status mapped to: won`)
      return 'won'
    case 'lost':
    case 'lose':
    case 'loss':
    case 'l':
      console.log(`❌ Status mapped to: lost`)
      return 'lost'
    case 'pending':
    case 'open':
    case 'active':
      console.log(`⏳ Status mapped to: pending`)
      return 'pending'
    case 'cancelled':
    case 'canceled':
    case 'void':
    case 'push':
      console.log(`🚫 Status mapped to: void`)
      return 'void'
    default:
      console.log(`⚠️ Unknown status "${status}", defaulting to: pending`)
      return 'pending'
  }
}

export function transformSharpSportsBet(bet: any, profileId: string): any {
  const homeTeam = bet.event?.contestantHome?.fullName
  const awayTeam = bet.event?.contestantAway?.fullName
  const betDescription = bet.bookDescription

  // Calculate correct potential payout
  // For SharpSports: toWin is the profit, atRisk is the stake
  // potential_payout should be toWin + atRisk (total return if bet wins)
  const stakeAmount = (bet.atRisk || 0) / 100 // Convert cents to dollars
  const profitAmount = (bet.toWin || 0) / 100 // Convert cents to dollars
  const potentialPayout = stakeAmount + profitAmount // Total return = stake + profit

  return {
    profile_id: profileId,
    external_bet_id: bet.id, // Use the actual bet ID, not betSlip ID
    sport: bet.event?.sport,
    league: bet.event?.league || 'N/A', // Provide default for required field
    bet_type: normalizeBetType(bet.proposition),
    bet_description: betDescription,
    odds: bet.oddsAmerican || 0, // Provide default for required field
    stake: stakeAmount,
    potential_payout: potentialPayout, // Total return if bet wins
    status: normalizeBetStatus(bet.status, bet.outcome), // Pass outcome to help determine win/loss
    placed_at: bet.timePlaced,
    settled_at: bet.dateClosed,
    game_date: bet.event?.startTime || new Date().toISOString(), // Provide default for required field
    home_team: homeTeam,
    away_team: awayTeam,
    side: normalizeSide(bet.position, betDescription, homeTeam, awayTeam),
    line_value: bet.line,
    sportsbook: bet.book?.name,
    bet_source: 'sharpsports',
    profit: computeProfit(bet),
    created_at: new Date().toISOString(),
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
    errors,
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
