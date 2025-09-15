/**
 * Utility functions for formatting bets to match SharpSports display style
 */

interface BetData {
  id: string
  sport: string
  league?: string
  home_team?: string
  away_team?: string
  bet_type?: string
  bet_description: string
  odds: string | number
  stake?: number
  potential_payout?: number
  status: string
  placed_at?: string
  game_date?: string
  sportsbook?: string
  player_name?: string | null
  line_value?: number | null
  side?: string | null
  bet_source?: string
}

/**
 * Format a bet to match SharpSports display style
 */
export function formatBetForDisplay(bet: BetData) {
  // Extract key information
  const sport = formatSport(bet.sport)
  const betType = formatBetType(bet.bet_type)
  const sportsbook = bet.sportsbook || 'TrueSharp'
  const status = formatStatus(bet.status)

  // Create the main description following SharpSports format
  const mainDescription = createMainDescription(bet)

  // Format odds
  const formattedOdds = formatOdds(bet.odds)

  // Format stake (optional for parlay legs)
  const formattedStake = bet.stake ? `$${bet.stake.toFixed(2)}` : ''

  // Format game date/time
  const gameDateTime = formatGameDateTime(bet.game_date)

  // Format line value
  const lineDisplay = formatLineValue(bet.line_value)

  // Format teams
  const teamsDisplay = formatTeamsDisplay(bet.home_team, bet.away_team)

  // Calculate potential profit (optional for parlay legs)
  const potentialProfit = bet.potential_payout && bet.stake ? bet.potential_payout - bet.stake : 0

  return {
    sport,
    betType,
    sportsbook,
    status,
    mainDescription,
    odds: formattedOdds,
    stake: formattedStake,
    gameDateTime,
    lineDisplay,
    teamsDisplay,
    potentialProfit,
    rawBet: bet,
  }
}

/**
 * Format sport name to match SharpSports style (capitalize first letter)
 */
function formatSport(sport: string): string {
  const sportMap: { [key: string]: string } = {
    mlb: 'Baseball',
    nfl: 'Football',
    nba: 'Basketball',
    nhl: 'Hockey',
    soccer: 'Soccer',
    ncaaf: 'College Football',
    ncaab: 'College Basketball',
  }

  return (
    sportMap[sport?.toLowerCase()] ||
    sport?.charAt(0).toUpperCase() + sport?.slice(1).toLowerCase() ||
    'Unknown'
  )
}

/**
 * Format bet type to match SharpSports style
 */
function formatBetType(betType?: string): string {
  if (!betType) return 'moneyline'

  const typeMap: { [key: string]: string } = {
    moneyline: 'moneyline',
    spread: 'spread',
    point_spread: 'spread',
    total: 'total',
    over_under: 'total',
    prop: 'prop',
    player_prop: 'prop',
  }

  return typeMap[betType.toLowerCase()] || betType.toLowerCase()
}

/**
 * Format status to match SharpSports style
 */
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

/**
 * Create main description following SharpSports format
 * Examples:
 * - "Detroit Tigers @ New York Yankees - Total - Total Runs - Under 8.5"
 * - "Colorado Rockies @ Los Angeles Dodgers - Spread - Run Line - LA Dodgers -1.5"
 * - "Los Angeles Dodgers -139" (for moneyline)
 * - "Under -115" (for totals)
 */
function createMainDescription(bet: BetData): string {
  // For SharpSports bets (which have bet_source), prefer to use the existing bet_description
  // but still parse it to extract the correct side information
  if (bet.bet_description && isSharpSportsBet(bet)) {
    return parseAndCorrectSharpSportsDescription(bet)
  }

  const teams = bet.home_team && bet.away_team ? `${bet.away_team} @ ${bet.home_team}` : ''
  const betType = formatBetType(bet.bet_type)

  // For different bet types, format differently
  switch (betType) {
    case 'total': {
      const direction = bet.side?.toLowerCase() === 'over' ? 'Over' : 'Under'
      const line = bet.line_value ? ` ${bet.line_value}` : ''
      if (teams) {
        // Sport-specific total terminology
        const totalType = bet.sport?.toLowerCase() === 'baseball' ? 'Total Runs' : 'Total Points'
        return `${teams} - Total - ${totalType} - ${direction}${line}`
      }
      return `${direction} ${formatOdds(bet.odds)}`
    }

    case 'spread': {
      const line = bet.line_value ? ` ${bet.line_value > 0 ? '+' : ''}${bet.line_value}` : ''
      if (teams) {
        const favoriteTeam = bet.side === 'home' ? bet.home_team : bet.away_team
        // Sport-specific spread terminology
        let spreadType = 'Point Spread'
        const sport = bet.sport?.toLowerCase()
        if (sport === 'baseball') {
          spreadType = 'Run Line'
        } else if (sport === 'hockey') {
          spreadType = 'Puck Line'
        }
        return `${teams} - Spread - ${spreadType} - ${favoriteTeam}${line}`
      }
      return bet.bet_description || `Spread${line}`
    }

    case 'moneyline': {
      if (teams) {
        const selectedTeam = bet.side === 'home' ? bet.home_team : bet.away_team
        return `${teams} - Moneyline - ${selectedTeam} ${formatOdds(bet.odds)}`
      }
      const teamName = bet.side === 'home' ? bet.home_team : bet.away_team
      return `${teamName || 'Team'} ${formatOdds(bet.odds)}`
    }

    default:
      return (
        bet.bet_description ||
        `${betType.charAt(0).toUpperCase() + betType.slice(1)} ${formatOdds(bet.odds)}`
      )
  }
}

/**
 * Check if this is a SharpSports bet by looking for bet_source field or characteristic patterns
 */
function isSharpSportsBet(bet: BetData): boolean {
  // Check for bet_source field (if available in the interface)
  if (bet.bet_source === 'sharpsports') {
    return true
  }
  
  // Fallback: Check for characteristic SharpSports patterns in bet_description
  const description = bet.bet_description?.toLowerCase() || ''
  
  // SharpSports descriptions typically follow the format:
  // "Team1 @ Team2 - BetType - SubType - Details"
  return description.includes(' @ ') && description.includes(' - ') && 
         (description.includes(' - spread - ') || 
          description.includes(' - moneyline') || 
          description.includes(' - total - '))
}

/**
 * Parse SharpSports bet description and correct the side/team information
 * Example: "Cincinnati Bengals @ Cleveland Browns - Spread - Game Spread - CIN Bengals -2.5"
 */
function parseAndCorrectSharpSportsDescription(bet: BetData): string {
  const description = bet.bet_description || ''
  
  // For moneyline and spread bets, we need to extract the correct team from the description
  if (bet.bet_type === 'moneyline' || bet.bet_type === 'spread') {
    const parts = description.split(' - ')
    
    if (parts.length >= 4) {
      const matchupPart = parts[0] || '' // "Team1 @ Team2"
      const betTypePart = parts[1] || '' // "Spread" or "Moneyline"
      const subTypePart = parts[2] || '' // "Game Spread" or similar
      const detailsPart = parts[3] || '' // "CIN Bengals -2.5" or team selection
      
      // Extract teams from matchup
      const matchupSplit = matchupPart.split(' @ ')
      if (matchupSplit.length !== 2) {
        return description
      }
      
      const [awayTeam = '', homeTeam = ''] = matchupSplit.map(t => t.trim())
      
      // For spread and moneyline, the details part contains the selected team
      // Extract the team abbreviation or name from the details
      let selectedTeam = ''
      
      if (bet.bet_type === 'spread') {
        // For spread: "CIN Bengals -2.5" - extract the team before the line
        const match = detailsPart.match(/^([A-Z]{2,4}|[^-+\d]+?)\s*[-+]?\d/)
        if (match && match[1]) {
          selectedTeam = match[1].trim()
        }
      } else if (bet.bet_type === 'moneyline') {
        // For moneyline, the team should be in the details part
        // Look for team abbreviations or names
        if (awayTeam && detailsPart.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0] || '')) {
          selectedTeam = awayTeam
        } else if (homeTeam && detailsPart.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0] || '')) {
          selectedTeam = homeTeam
        }
      }
      
      // If we found a team, use it; otherwise fall back to the original description
      if (selectedTeam) {
        // Determine if it's home or away team
        const isAwayTeam = awayTeam && (
          selectedTeam.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0] || '') ||
          awayTeam.toLowerCase().includes(selectedTeam.toLowerCase())
        )
        
        const displayTeam = isAwayTeam ? awayTeam : homeTeam
        
        if (bet.bet_type === 'spread') {
          return `${matchupPart} - ${betTypePart} - ${subTypePart} - ${displayTeam} ${bet.line_value ? (bet.line_value > 0 ? '+' : '') + bet.line_value : ''}`
        } else {
          return `${matchupPart} - ${betTypePart} - ${displayTeam} ${formatOdds(bet.odds)}`
        }
      }
    }
  }
  
  // For other bet types or if parsing fails, return the original description
  return description
}

/**
 * Format odds with proper + sign
 */
function formatOdds(odds: string | number): string {
  const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds
  return numericOdds > 0 ? `+${numericOdds}` : `${numericOdds}`
}

/**
 * Format game date and time
 */
function formatGameDateTime(gameDate?: string): string {
  if (!gameDate) return ''

  const date = new Date(gameDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format line value for display
 */
function formatLineValue(lineValue?: number | null): string {
  if (lineValue === undefined || lineValue === null) return ''
  return lineValue > 0 ? `+${lineValue}` : `${lineValue}`
}

/**
 * Format teams display
 */
function formatTeamsDisplay(homeTeam?: string, awayTeam?: string): string {
  if (!homeTeam || !awayTeam) return ''
  return `${awayTeam} @ ${homeTeam}`
}

/**
 * Get display side text (over/under, home/away, etc.)
 */
export function getDisplaySide(bet: BetData): string {
  if (!bet.side) {
    // For SharpSports bets without a proper side, try to extract from description
    if (isSharpSportsBet(bet) && bet.bet_description) {
      return extractSideFromSharpSportsDescription(bet)
    }
    return ''
  }

  const betType = formatBetType(bet.bet_type)

  switch (betType) {
    case 'total':
      return bet.side.toLowerCase() === 'over' ? 'over' : 'under'
    case 'spread':
    case 'moneyline':
      return bet.side.toLowerCase() === 'home' ? 'home' : 'away'
    default:
      return bet.side.toLowerCase()
  }
}

/**
 * Extract side information from SharpSports bet description
 */
function extractSideFromSharpSportsDescription(bet: BetData): string {
  const description = bet.bet_description || ''
  const parts = description.split(' - ')
  
  if (parts.length >= 4) {
    const matchupPart = parts[0] || '' // "Team1 @ Team2"
    const detailsPart = parts[3] || '' // Contains team selection or total direction
    
    if (bet.bet_type === 'total') {
      // For totals, check for Over/Under in details
      if (detailsPart.toLowerCase().includes('over')) return 'over'
      if (detailsPart.toLowerCase().includes('under')) return 'under'
    } else if (bet.bet_type === 'spread' || bet.bet_type === 'moneyline') {
      // For spreads/moneylines, determine home/away based on team in details
      const matchupSplit = matchupPart.split(' @ ')
      if (matchupSplit.length === 2) {
        const [awayTeam = '', homeTeam = ''] = matchupSplit.map(t => t.trim())
        
        if (awayTeam && detailsPart.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0] || '')) {
          return 'away'
        }
        if (homeTeam && detailsPart.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0] || '')) {
          return 'home'
        }
      }
    }
  }
  
  return ''
}
