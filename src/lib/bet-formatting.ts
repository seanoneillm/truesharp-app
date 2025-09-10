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
  stake: number
  potential_payout: number
  status: string
  placed_at: string
  game_date?: string
  sportsbook?: string
  player_name?: string | null
  line_value?: number | null
  side?: string | null
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
  
  // Format stake
  const formattedStake = `$${bet.stake.toFixed(2)}`
  
  // Format game date/time
  const gameDateTime = formatGameDateTime(bet.game_date)
  
  // Format line value
  const lineDisplay = formatLineValue(bet.line_value)
  
  // Format teams
  const teamsDisplay = formatTeamsDisplay(bet.home_team, bet.away_team)

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
    rawBet: bet
  }
}

/**
 * Format sport name to match SharpSports style (capitalize first letter)
 */
function formatSport(sport: string): string {
  const sportMap: { [key: string]: string } = {
    'mlb': 'Baseball',
    'nfl': 'Football', 
    'nba': 'Basketball',
    'nhl': 'Hockey',
    'soccer': 'Soccer',
    'ncaaf': 'College Football',
    'ncaab': 'College Basketball'
  }
  
  return sportMap[sport?.toLowerCase()] || sport?.charAt(0).toUpperCase() + sport?.slice(1).toLowerCase() || 'Unknown'
}

/**
 * Format bet type to match SharpSports style
 */
function formatBetType(betType?: string): string {
  if (!betType) return 'moneyline'
  
  const typeMap: { [key: string]: string } = {
    'moneyline': 'moneyline',
    'spread': 'spread', 
    'point_spread': 'spread',
    'total': 'total',
    'over_under': 'total',
    'prop': 'prop',
    'player_prop': 'prop'
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
  const teams = bet.home_team && bet.away_team ? `${bet.away_team} @ ${bet.home_team}` : ''
  const betType = formatBetType(bet.bet_type)
  
  // For different bet types, format differently
  switch (betType) {
    case 'total': {
      const direction = bet.side?.toLowerCase() === 'over' ? 'Over' : 'Under'
      const line = bet.line_value ? ` ${bet.line_value}` : ''
      if (teams) {
        return `${teams} - Total - Total Runs - ${direction}${line}`
      }
      return `${direction} ${formatOdds(bet.odds)}`
    }
    
    case 'spread': {
      const line = bet.line_value ? ` ${bet.line_value > 0 ? '+' : ''}${bet.line_value}` : ''
      if (teams) {
        const favoriteTeam = bet.side === 'home' ? bet.home_team : bet.away_team
        return `${teams} - Spread - Run Line - ${favoriteTeam}${line}`
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
      return bet.bet_description || `${betType.charAt(0).toUpperCase() + betType.slice(1)} ${formatOdds(bet.odds)}`
  }
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
    hour12: true
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
  if (!bet.side) return ''
  
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