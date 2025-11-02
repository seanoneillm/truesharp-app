import { AnalyticsFilters } from '../services/supabaseAnalytics'

// Helper function to normalize league names to handle NCAAB variations
function normalizeLeague(league: string): string {
  const normalized = league.toLowerCase().trim()

  // Treat NCAAB, NCAAM, and NCAAMB as the same league
  if (
    normalized === 'ncaam' ||
    normalized === 'ncaamb' ||
    normalized === "ncaa men's basketball" ||
    normalized === 'college basketball' ||
    normalized === 'ncaa basketball'
  ) {
    return 'NCAAB'
  }

  // Return original league in uppercase for consistency
  return league.toUpperCase()
}

export interface StrategyValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface FilterOptions {
  betTypes?: string[]
  leagues?: string[]
  statuses?: string[]
  isParlays?: string[]
  sides?: string[]
  oddsTypes?: string[]
  timeRange?: string
  customStartDate?: string
  customEndDate?: string
  sportsbooks?: string[]
  sports?: string[]
  oddsRange?: { min?: number; max?: number }
  stakeRange?: { min?: number; max?: number }
  lineValueRange?: { min?: number; max?: number }
  spreadRange?: { min?: number; max?: number }
  totalRange?: { min?: number; max?: number }
}

// Convert iOS AnalyticsFilters to web FilterOptions format
export function convertFiltersToWebFormat(filters: AnalyticsFilters): FilterOptions {
  // Normalize leagues to handle NCAAB/NCAAM/NCAAMB variations
  const normalizedLeagues =
    filters.leagues.length > 0 ? filters.leagues.map(normalizeLeague) : ['All']

  return {
    betTypes: filters.betTypes.length > 0 ? filters.betTypes : ['All'],
    leagues: normalizedLeagues,
    statuses: filters.results.length === 5 ? ['All'] : filters.results, // Default has 5 statuses
    isParlays: filters.isParlay === null ? ['All'] : [filters.isParlay.toString()],
    sides: filters.side ? [filters.side] : ['All'],
    oddsTypes: filters.oddsType ? [filters.oddsType] : ['All'],
    timeRange:
      filters.timeframe === 'all'
        ? 'All time'
        : filters.timeframe === '7d'
          ? '7 days'
          : filters.timeframe === '30d'
            ? '30 days'
            : filters.timeframe === '90d'
              ? '3 months'
              : filters.timeframe === 'ytd'
                ? 'This Year'
                : filters.timeframe === 'custom'
                  ? 'Custom Range'
                  : 'All time',
    customStartDate: filters.startDate || undefined,
    customEndDate: filters.endDate || undefined,
    sportsbooks:
      filters.sportsbooks && filters.sportsbooks.length > 0 ? filters.sportsbooks : ['All'],
    sports: filters.sports && filters.sports.length > 0 ? filters.sports : ['All'],
    oddsRange:
      filters.minOdds !== null || filters.maxOdds !== null
        ? { min: filters.minOdds || 0, max: filters.maxOdds || 0 }
        : undefined,
    stakeRange:
      filters.minStake !== null || filters.maxStake !== null
        ? { min: filters.minStake || 0, max: filters.maxStake || 0 }
        : undefined,
    spreadRange:
      filters.minSpread !== null || filters.maxSpread !== null
        ? { min: filters.minSpread || 0, max: filters.maxSpread || 0 }
        : undefined,
    totalRange:
      filters.minTotal !== null || filters.maxTotal !== null
        ? { min: filters.minTotal || 0, max: filters.maxTotal || 0 }
        : undefined,
  }
}

export function validateStrategyFilters(filters: FilterOptions): StrategyValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Rule 1: Bet status filter must be set to "all"
  if (filters.statuses && !filters.statuses.includes('All') && filters.statuses.length > 0) {
    errors.push('Bet status must be set to "All" to ensure fair strategy representation')
  }

  // Rule 2: Odds/spread/total/stake ranges must be cleared
  if (
    filters.oddsRange &&
    (filters.oddsRange.min !== undefined || filters.oddsRange.max !== undefined)
  ) {
    if (filters.oddsRange.min !== 0 || filters.oddsRange.max !== 0) {
      errors.push('Odds ranges must be cleared for strategy creation')
    }
  }

  if (
    filters.stakeRange &&
    (filters.stakeRange.min !== undefined || filters.stakeRange.max !== undefined)
  ) {
    if (filters.stakeRange.min !== 0 || filters.stakeRange.max !== 0) {
      errors.push('Stake ranges must be cleared for strategy creation')
    }
  }

  if (
    filters.spreadRange &&
    (filters.spreadRange.min !== undefined || filters.spreadRange.max !== undefined)
  ) {
    if (filters.spreadRange.min !== 0 || filters.spreadRange.max !== 0) {
      errors.push('Spread ranges must be cleared for strategy creation')
    }
  }

  if (
    filters.totalRange &&
    (filters.totalRange.min !== undefined || filters.totalRange.max !== undefined)
  ) {
    if (filters.totalRange.min !== 0 || filters.totalRange.max !== 0) {
      errors.push('Total ranges must be cleared for strategy creation')
    }
  }

  // Rule 3: Leagues filter: "All" OR exactly 1 specific league only (not both)
  const leagues = filters.leagues || []
  const hasAllLeagues = leagues.includes('All')
  const specificLeagues = leagues.filter(l => l !== 'All')

  if (!hasAllLeagues && specificLeagues.length !== 1) {
    errors.push('Strategy must either include all leagues or exactly one specific league')
  }

  if (hasAllLeagues && specificLeagues.length > 0) {
    errors.push('Strategy cannot have both "All" and specific leagues selected')
  }

  // Rule 4: Bet types filter: "All" OR exactly 1 specific bet type only (not multiple)
  const betTypes = filters.betTypes || []
  const hasAllBetTypes = betTypes.includes('All')
  const specificBetTypes = betTypes.filter(bt => bt !== 'All')

  if (!hasAllBetTypes && specificBetTypes.length !== 1) {
    errors.push('Strategy must either include all bet types or exactly one specific bet type')
  }

  if (hasAllBetTypes && specificBetTypes.length > 0) {
    errors.push('Strategy cannot have both "All" and specific bet types selected')
  }

  // Warnings for better strategy performance
  if (filters.betTypes && !filters.betTypes.includes('All') && filters.betTypes.length > 3) {
    warnings.push('Including many bet types may dilute strategy focus')
  }

  if (filters.sportsbooks && filters.sportsbooks.length > 5) {
    warnings.push('Including many sportsbooks may reduce strategy consistency')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export function getFilterValidationMessage(filters: FilterOptions): string {
  const validation = validateStrategyFilters(filters)

  if (validation.isValid) {
    return 'Filters are valid for strategy creation'
  }

  return validation.errors.join('. ')
}

export function canCreateStrategy(filters: FilterOptions): boolean {
  return validateStrategyFilters(filters).isValid
}

export function getRequiredFilterChanges(filters: FilterOptions): Partial<FilterOptions> {
  const changes: Partial<FilterOptions> = {}

  // Fix status filter
  if (filters.statuses && !filters.statuses.includes('All') && filters.statuses.length > 0) {
    changes.statuses = ['All']
  }

  // Clear ranges by setting them to empty/default values
  if (filters.oddsRange && (filters.oddsRange.min !== 0 || filters.oddsRange.max !== 0)) {
    changes.oddsRange = { min: 0, max: 0 }
  }

  if (filters.stakeRange && (filters.stakeRange.min !== 0 || filters.stakeRange.max !== 0)) {
    changes.stakeRange = { min: 0, max: 0 }
  }

  if (filters.spreadRange && (filters.spreadRange.min !== 0 || filters.spreadRange.max !== 0)) {
    changes.spreadRange = { min: 0, max: 0 }
  }

  if (filters.totalRange && (filters.totalRange.min !== 0 || filters.totalRange.max !== 0)) {
    changes.totalRange = { min: 0, max: 0 }
  }

  // Fix leagues filter - require either "All" or exactly one specific league
  const leagues = filters.leagues || []
  const hasAllLeagues = leagues.includes('All')
  const specificLeagues = leagues.filter(l => l !== 'All')

  if (!hasAllLeagues && specificLeagues.length !== 1) {
    if (specificLeagues.length === 0) {
      // Default to "All" if no specific leagues
      changes.leagues = ['All']
    } else {
      // Keep only the first specific league
      changes.leagues = [specificLeagues[0]!]
    }
  } else if (hasAllLeagues && specificLeagues.length > 0) {
    // If both "All" and specific leagues are selected, default to "All" only
    changes.leagues = ['All']
  }

  // Fix bet types filter - require either "All" or exactly one specific bet type
  const betTypes = filters.betTypes || []
  const hasAllBetTypes = betTypes.includes('All')
  const specificBetTypes = betTypes.filter(bt => bt !== 'All')

  if (!hasAllBetTypes && specificBetTypes.length !== 1) {
    if (specificBetTypes.length === 0) {
      // Default to "All" if no specific bet types
      changes.betTypes = ['All']
    } else {
      // Keep only the first specific bet type
      changes.betTypes = [specificBetTypes[0]!]
    }
  } else if (hasAllBetTypes && specificBetTypes.length > 0) {
    // If both "All" and specific bet types are selected, default to "All" only
    changes.betTypes = ['All']
  }

  return changes
}

// Convert FilterOptions changes back to AnalyticsFilters format
export function applyFilterChangesToAnalyticsFilters(
  originalFilters: AnalyticsFilters,
  changes: Partial<FilterOptions>
): AnalyticsFilters {
  const updatedFilters = { ...originalFilters }

  if (changes.statuses) {
    if (changes.statuses.includes('All')) {
      updatedFilters.results = ['won', 'lost', 'pending', 'void', 'cancelled']
    } else {
      updatedFilters.results = changes.statuses
    }
  }

  if (changes.leagues) {
    if (changes.leagues.includes('All')) {
      updatedFilters.leagues = []
    } else {
      updatedFilters.leagues = changes.leagues
    }
  }

  if (changes.betTypes) {
    if (changes.betTypes.includes('All')) {
      updatedFilters.betTypes = []
    } else {
      updatedFilters.betTypes = changes.betTypes
    }
  }

  if (changes.oddsRange) {
    updatedFilters.minOdds = changes.oddsRange.min || null
    updatedFilters.maxOdds = changes.oddsRange.max || null
  }

  if (changes.stakeRange) {
    updatedFilters.minStake = changes.stakeRange.min || null
    updatedFilters.maxStake = changes.stakeRange.max || null
  }

  if (changes.spreadRange) {
    updatedFilters.minSpread = changes.spreadRange.min || null
    updatedFilters.maxSpread = changes.spreadRange.max || null
  }

  if (changes.totalRange) {
    updatedFilters.minTotal = changes.totalRange.min || null
    updatedFilters.maxTotal = changes.totalRange.max || null
  }

  return updatedFilters
}

// Interface for bet data
export interface BetData {
  id: string
  sport: string
  bet_type: string
  side?: string
  is_parlay: boolean
  sportsbook: string
  odds: number
  stake: number
  line_value?: number
  status: string
  created_at: string
}

// Interface for strategy data with filters
export interface StrategyData {
  id: string
  name: string
  sport?: string
  filter_config: FilterOptions
  user_id: string
}

// Validate if a parlay's legs are all compatible with a strategy's filters
export function validateParlayAgainstStrategy(
  parlayLegs: BetData[],
  strategy: StrategyData
): boolean {
  if (!parlayLegs || parlayLegs.length === 0) {
    return false
  }

  // For parlays, ALL legs must match the strategy filters
  return parlayLegs.every(leg => validateBetAgainstStrategy(leg, strategy))
}

// Validate if a bet is compatible with a strategy's filters
export function validateBetAgainstStrategy(bet: BetData, strategy: StrategyData): boolean {
  const filters = strategy.filter_config

  // If no filters are configured at all, accept all bets
  if (!filters || Object.keys(filters).length === 0) {
    return true
  }

  // Check if this is effectively a "no filters" strategy (all set to 'All' with no ranges)
  const hasActiveFilters =
    (filters.betTypes && filters.betTypes.length > 0 && !filters.betTypes.includes('All')) ||
    (filters.leagues && filters.leagues.length > 0 && !filters.leagues.includes('All')) ||
    (filters.sports && filters.sports.length > 0 && !filters.sports.includes('All')) ||
    (filters.sides && filters.sides.length > 0 && !filters.sides.includes('All')) ||
    (filters.isParlays && filters.isParlays.length > 0 && !filters.isParlays.includes('All')) ||
    (filters.sportsbooks &&
      filters.sportsbooks.length > 0 &&
      !filters.sportsbooks.includes('All')) ||
    (filters.oddsRange &&
      typeof filters.oddsRange === 'object' &&
      ((filters.oddsRange.min !== undefined &&
        filters.oddsRange.min !== null &&
        filters.oddsRange.min !== 0) ||
        (filters.oddsRange.max !== undefined &&
          filters.oddsRange.max !== null &&
          filters.oddsRange.max !== 0))) ||
    (filters.stakeRange &&
      typeof filters.stakeRange === 'object' &&
      ((filters.stakeRange.min !== undefined &&
        filters.stakeRange.min !== null &&
        filters.stakeRange.min !== 0) ||
        (filters.stakeRange.max !== undefined &&
          filters.stakeRange.max !== null &&
          filters.stakeRange.max !== 0))) ||
    (filters.lineValueRange &&
      typeof filters.lineValueRange === 'object' &&
      ((filters.lineValueRange.min !== undefined &&
        filters.lineValueRange.min !== null &&
        filters.lineValueRange.min !== 0) ||
        (filters.lineValueRange.max !== undefined &&
          filters.lineValueRange.max !== null &&
          filters.lineValueRange.max !== 0))) ||
    (filters.spreadRange &&
      typeof filters.spreadRange === 'object' &&
      ((filters.spreadRange.min !== undefined &&
        filters.spreadRange.min !== null &&
        filters.spreadRange.min !== 0) ||
        (filters.spreadRange.max !== undefined &&
          filters.spreadRange.max !== null &&
          filters.spreadRange.max !== 0))) ||
    (filters.totalRange &&
      typeof filters.totalRange === 'object' &&
      ((filters.totalRange.min !== undefined &&
        filters.totalRange.min !== null &&
        filters.totalRange.min !== 0) ||
        (filters.totalRange.max !== undefined &&
          filters.totalRange.max !== null &&
          filters.totalRange.max !== 0))) ||
    (strategy.sport && strategy.sport !== 'All') // Include strategy.sport as an active filter

  // If no active filters, accept all bets
  if (!hasActiveFilters) {
    return true
  }

  // Check sport/league compatibility using both strategy.sport and filter_config.leagues
  // Use strategy.sport as primary source, fallback to filter_config.leagues
  const strategySport = strategy.sport
  const strategyLeagues = filters.leagues

  // If strategy has a specific sport set, check against it
  if (strategySport && strategySport !== 'All') {
    const sportVariations = getSportVariations(strategySport)
    if (!sportVariations.includes(bet.sport)) {
      return false
    }
  }

  // Also check leagues filter from filter_config if it exists and has specific leagues
  if (strategyLeagues && strategyLeagues.length > 0 && !strategyLeagues.includes('All')) {
    const allowedSports = strategyLeagues.flatMap(league => getSportVariations(league))
    if (!allowedSports.includes(bet.sport)) {
      return false
    }
  }

  // Check sports filter from filter_config (for broader sport filtering)
  if (filters.sports && filters.sports.length > 0 && !filters.sports.includes('All')) {
    const allowedSports = filters.sports.flatMap(sport => getSportVariations(sport))
    if (!allowedSports.includes(bet.sport)) {
      return false
    }
  }

  // Check bet type filter
  if (filters.betTypes && !filters.betTypes.includes('All') && filters.betTypes.length > 0) {
    // Check if the bet type matches ANY of the allowed bet types
    const matchesAnyBetType = filters.betTypes.some(allowedBetType => {
      const betTypeVariations = getBetTypeVariations(allowedBetType)
      return betTypeVariations.includes(bet.bet_type)
    })

    if (!matchesAnyBetType) {
      return false
    }
  }

  // Check parlay filter - this is critical for strategy compatibility
  if (filters.isParlays && filters.isParlays.length > 0 && !filters.isParlays.includes('All')) {
    // Convert string to boolean for comparison
    const strategyAllowsParlays = filters.isParlays.includes('true')
    const strategyAllowsStraights = filters.isParlays.includes('false')

    // If strategy only allows parlays and bet is not a parlay, reject
    if (strategyAllowsParlays && !strategyAllowsStraights && !bet.is_parlay) {
      return false
    }

    // If strategy only allows straight bets and bet is a parlay, reject
    if (strategyAllowsStraights && !strategyAllowsParlays && bet.is_parlay) {
      return false
    }
  }

  // Check sides filter
  if (filters.sides && !filters.sides.includes('All') && filters.sides.length > 0 && bet.side) {
    const allowedSides = filters.sides.map(s => s.toLowerCase())
    if (!allowedSides.includes(bet.side.toLowerCase())) {
      return false
    }
  }

  // Check sportsbook filter
  if (
    filters.sportsbooks &&
    filters.sportsbooks.length > 0 &&
    !filters.sportsbooks.includes('All')
  ) {
    const sportsbookVariations = getSportsbookVariations(filters.sportsbooks)
    if (!sportsbookVariations.includes(bet.sportsbook)) {
      return false
    }
  }

  // Check odds range
  if (filters.oddsRange && typeof filters.oddsRange === 'object') {
    if (
      filters.oddsRange.min !== undefined &&
      filters.oddsRange.min !== null &&
      filters.oddsRange.min !== 0 &&
      bet.odds < filters.oddsRange.min
    )
      return false
    if (
      filters.oddsRange.max !== undefined &&
      filters.oddsRange.max !== null &&
      filters.oddsRange.max !== 0 &&
      bet.odds > filters.oddsRange.max
    )
      return false
  }

  // Check stake range
  if (filters.stakeRange && typeof filters.stakeRange === 'object') {
    if (
      filters.stakeRange.min !== undefined &&
      filters.stakeRange.min !== null &&
      filters.stakeRange.min !== 0 &&
      bet.stake < filters.stakeRange.min
    )
      return false
    if (
      filters.stakeRange.max !== undefined &&
      filters.stakeRange.max !== null &&
      filters.stakeRange.max !== 0 &&
      bet.stake > filters.stakeRange.max
    )
      return false
  }

  // Check line value range
  if (
    filters.lineValueRange &&
    typeof filters.lineValueRange === 'object' &&
    bet.line_value !== undefined &&
    bet.line_value !== null
  ) {
    if (
      filters.lineValueRange.min !== undefined &&
      filters.lineValueRange.min !== null &&
      filters.lineValueRange.min !== 0 &&
      bet.line_value < filters.lineValueRange.min
    )
      return false
    if (
      filters.lineValueRange.max !== undefined &&
      filters.lineValueRange.max !== null &&
      filters.lineValueRange.max !== 0 &&
      bet.line_value > filters.lineValueRange.max
    )
      return false
  }

  return true
}

function getSportVariations(sport: string): string[] {
  const variations = []

  if (sport === 'NFL') {
    variations.push('NFL', 'nfl', 'football', 'Football', 'American Football')
  } else if (sport === 'NBA') {
    variations.push('NBA', 'nba', 'basketball', 'Basketball')
  } else if (sport === 'MLB') {
    variations.push('MLB', 'mlb', 'baseball', 'Baseball')
  } else if (sport === 'NHL') {
    variations.push('NHL', 'nhl', 'hockey', 'Hockey', 'Ice Hockey')
  } else if (sport === 'NCAAF') {
    variations.push(
      'NCAAF',
      'ncaaf',
      'football',
      'Football',
      'College Football',
      'college football',
      'NCAA Football',
      'ncaa football'
    )
  } else if (sport === 'NCAAB' || sport === 'NCAAM' || sport === 'NCAAMB') {
    // NCAAB, NCAAM, and NCAAMB should all be treated as the same league
    variations.push(
      'NCAAB',
      'NCAAM',
      'NCAAMB',
      'ncaab',
      'ncaam',
      'ncaamb',
      'basketball',
      'Basketball',
      'College Basketball',
      'college basketball',
      'NCAA Basketball',
      'ncaa basketball',
      "NCAA Men's Basketball",
      "ncaa men's basketball"
    )
  } else if (sport === 'MLS') {
    variations.push('MLS', 'mls', 'Soccer', 'soccer', 'Football', 'football')
  } else if (sport === 'UCL') {
    variations.push(
      'UCL',
      'ucl',
      'Champions League',
      'champions league',
      'UEFA Champions League',
      'uefa champions league',
      'Soccer',
      'soccer'
    )
  } else {
    variations.push(sport, sport.toLowerCase(), sport.toUpperCase())
  }

  return variations
}

function getBetTypeVariations(betType: string): string[] {
  const variations = []
  const lowerBetType = betType.toLowerCase()

  if (lowerBetType === 'moneyline') {
    variations.push('moneyline', 'ml', 'money_line')
  } else if (lowerBetType === 'spread') {
    variations.push('spread', 'point_spread', 'ps')
  } else if (lowerBetType === 'total') {
    variations.push('total', 'over_under', 'ou', 'totals')
  } else {
    variations.push(betType, betType.toLowerCase(), betType.toUpperCase())
  }

  return variations
}

function getSportsbookVariations(sportsbooks: string[]): string[] {
  const variations: string[] = []

  sportsbooks.forEach(sportsbook => {
    variations.push(sportsbook)
    variations.push(sportsbook.toLowerCase())
    variations.push(sportsbook.toUpperCase())

    // Add common variations
    if (sportsbook.toLowerCase() === 'draftkings') {
      variations.push('DraftKings', 'DK', 'dk')
    } else if (sportsbook.toLowerCase() === 'fanduel') {
      variations.push('FanDuel', 'FD', 'fd')
    } else if (sportsbook.toLowerCase() === 'caesars') {
      variations.push('Caesars', 'CZR', 'czr')
    }
  })

  return variations
}
