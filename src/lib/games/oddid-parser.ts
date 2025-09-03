export interface ParsedOddID {
  marketType: string
  displayName: string
  identifier: string
  isPlayerProp: boolean
  period: string
  betType: string
  side: string
  category: 'main_lines' | 'hitters' | 'pitchers' | 'team_props' | 'game_props'
}

const MARKET_DISPLAY_NAMES: Record<string, string> = {
  // Hitting stats
  batting_hits: 'Hits',
  batting_homeRuns: 'Home Runs',
  batting_RBI: 'RBIs',
  batting_totalBases: 'Total Bases',
  batting_singles: 'Singles',
  batting_doubles: 'Doubles',
  batting_triples: 'Triples',
  batting_stolenBases: 'Stolen Bases',
  batting_strikeouts: 'Strikeouts',
  batting_basesOnBalls: 'Walks',
  batting_runs: 'Runs',
  'batting_hits+runs+rbi': 'Hits + Runs + RBIs',

  // Pitching stats
  pitching_strikeouts: 'Strikeouts',
  pitching_hits: 'Hits Allowed',
  pitching_earnedRuns: 'Earned Runs',
  pitching_basesOnBalls: 'Walks Allowed',
  pitching_homeRuns: 'Home Runs Allowed',
  pitching_homeRunsAllowed: 'Home Runs Allowed',
  pitching_pitchesThrown: 'Pitches Thrown',
  pitching_outs: 'Outs Recorded',
  pitching_inningsPitched: 'Innings Pitched',
  pitching_wins: 'Wins',
  pitching_losses: 'Losses',
  pitching_saves: 'Saves',

  // Main lines
  points: 'Total Runs',
  moneyline: 'Moneyline',
  spread: 'Run Line',

  // Other
  fantasyScore: 'Fantasy Score',

  // Team props
  team_runs: 'Team Runs',
  team_hits: 'Team Hits',
  team_errors: 'Team Errors',
}

const HITTING_MARKETS = [
  'batting_hits',
  'batting_homeRuns',
  'batting_RBI',
  'batting_totalBases',
  'batting_singles',
  'batting_doubles',
  'batting_triples',
  'batting_stolenBases',
  'batting_strikeouts',
  'batting_basesOnBalls',
  'batting_hits+runs+rbi',
]

const PITCHING_MARKETS = [
  'pitching_strikeouts',
  'pitching_hits',
  'pitching_earnedRuns',
  'pitching_basesOnBalls',
  'pitching_homeRunsAllowed',
  'pitching_pitchesThrown',
  'pitching_outs',
]

export function parseOddID(oddID: string): ParsedOddID | null {
  if (!oddID) return null

  // Skip yes/no markets
  if (oddID.includes('-yn-')) {
    return null
  }

  // Parse oddID format: {marketType}-{identifier}-{period}-{betType}-{side}
  const parts = oddID.split('-')
  if (parts.length < 5) return null

  const marketType = parts[0]
  const identifier = parts[1]
  const period = parts[2]
  const betType = parts[3]
  const side = parts[4]

  // Get display name
  const displayName = marketType ? (MARKET_DISPLAY_NAMES[marketType] || marketType.replace('_', ' ')) : 'Unknown'

  // Determine if this is a player prop (identifier is not 'home', 'away', 'all')
  const isPlayerProp = identifier ? !['home', 'away', 'all'].includes(identifier) : false

  // Determine category
  let category: ParsedOddID['category']

  if (marketType === 'points' && !isPlayerProp && period === 'game') {
    // Main lines: moneyline, run line, total (full game only)
    if (betType === 'ml') {
      category = 'main_lines'
    } else if (betType === 'sp') {
      category = 'main_lines'
    } else if (betType === 'ou') {
      category = 'main_lines'
    } else {
      category = 'game_props'
    }
  } else if (isPlayerProp) {
    // Player props - categorize by hitting vs pitching
    if (marketType && HITTING_MARKETS.includes(marketType)) {
      category = 'hitters'
    } else if (marketType && PITCHING_MARKETS.includes(marketType)) {
      category = 'pitchers'
    } else if (marketType === 'points' || marketType === 'fantasyScore') {
      // Player runs or fantasy score - usually hitting
      category = 'hitters'
    } else {
      category = 'hitters' // Default to hitters for unknown player props
    }
  } else if (!isPlayerProp && (identifier === 'home' || identifier === 'away')) {
    category = 'team_props'
  } else {
    category = 'game_props'
  }

  return {
    marketType: marketType || 'unknown',
    displayName,
    identifier: identifier || 'unknown',
    isPlayerProp,
    period: period || 'unknown',
    betType: betType || 'unknown',
    side: side || 'unknown',
    category,
  }
}

export function getMarketDisplayName(marketType: string): string {
  return MARKET_DISPLAY_NAMES[marketType] || marketType.replace('_', ' ')
}

export function isMainLineMarket(oddID: string): boolean {
  const parsed = parseOddID(oddID)
  return parsed?.category === 'main_lines'
}

export function isPlayerPropMarket(oddID: string): boolean {
  const parsed = parseOddID(oddID)
  return parsed?.isPlayerProp === true
}

export function getPlayerPropsCategory(oddID: string): 'hitters' | 'pitchers' | null {
  const parsed = parseOddID(oddID)
  if (!parsed?.isPlayerProp) return null

  return parsed.category === 'hitters'
    ? 'hitters'
    : parsed.category === 'pitchers'
      ? 'pitchers'
      : null
}

/**
 * Check if an oddID represents a yes/no market (should be excluded)
 */
export function isYesNoMarket(oddID: string): boolean {
  return oddID.includes('-yn-')
}

/**
 * Check if an oddID represents an over/under market
 */
export function isOverUnderMarket(oddID: string): boolean {
  return oddID.includes('-ou-') && (oddID.endsWith('-over') || oddID.endsWith('-under'))
}

/**
 * Get the opposite side for an over/under market
 */
export function getOppositeSide(side: string): string {
  switch (side.toLowerCase()) {
    case 'over':
      return 'under'
    case 'under':
      return 'over'
    case 'home':
      return 'away'
    case 'away':
      return 'home'
    default:
      return side
  }
}

/**
 * Extract player ID from oddID if it's a player prop
 */
export function extractPlayerID(oddID: string): string | null {
  const parsed = parseOddID(oddID)
  if (!parsed || !parsed.isPlayerProp) {
    return null
  }
  return parsed.identifier
}

/**
 * Group oddIDs by their base market (without side)
 * Example: ['batting_hits-12345-game-ou-over', 'batting_hits-12345-game-ou-under']
 * -> 'batting_hits-12345-game-ou'
 */
export function getBaseMarketID(oddID: string): string {
  const parts = oddID.split('-')
  if (parts.length >= 4) {
    return parts.slice(0, 4).join('-')
  }
  return oddID
}

/**
 * Validate oddID format
 */
export function isValidOddID(oddID: string): boolean {
  return parseOddID(oddID) !== null
}
