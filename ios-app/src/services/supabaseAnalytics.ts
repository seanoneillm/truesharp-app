import { API_ENDPOINTS } from '../config/environment'
import { supabase } from '../lib/supabase'

export interface AnalyticsFilters {
  timeframe: 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom'
  sports: string[]
  leagues: string[]
  betTypes: string[]
  sportsbooks: string[]
  results: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
  minOdds: number | null
  maxOdds: number | null
  minStake: number | null
  maxStake: number | null
  minSpread: number | null
  maxSpread: number | null
  minTotal: number | null
  maxTotal: number | null
  startDate: string | null
  endDate: string | null
  basicStartDate: string | null
  isParlay: boolean | null
  side: string | null
  oddsType: string | null
}

export interface BetData {
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
  prop_type?: string | null
  bet_source?: string
  is_parlay?: boolean
  parlay_id?: string
  profit?: number
  user_id: string
}

export interface AnalyticsMetrics {
  totalBets: number
  winRate: number
  roi: number
  totalProfit: number
  avgStake: number
  biggestWin: number
  biggestLoss: number
  expectedValue: number
  avgClv: number
  straightBetsCount: number
  parlayBetsCount: number
  voidBetsCount: number
  streakType: 'win' | 'loss' | 'none'
  currentStreak: number
}

export interface ChartDataPoint {
  date: string
  profit: number
  cumulativeProfit: number
  bets: number
}

export interface SportBreakdown {
  sport: string
  bets: number
  profit: number
  winRate: number
  roi: number
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics
  recentBets: BetData[]
  dailyProfitData: ChartDataPoint[]
  monthlyData: any[]
  sportBreakdown: SportBreakdown[]
  betTypeBreakdown: any[]
  sideBreakdown: any[]
  leagueBreakdown: any[]
  lineMovementData: any[]
  winRateVsExpected: any[]
  monthlyPerformance: any[]
}

export interface Strategy {
  id: string
  name: string
  description: string
  filters?: any // Legacy field for backwards compatibility
  filter_config?: any // New field that matches database schema
  sport?: string // Add sport field from database
  monetized: boolean
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  subscriber_count: number
  performance_roi: number
  performance_win_rate: number
  performance_total_bets: number
  created_at: string
  updated_at: string
  user_id?: string // Add user_id field from database
}

export interface StrategyLeaderboard {
  id: string
  strategy_id: string
  user_id: string
  strategy_name: string
  username: string
  is_verified_seller: boolean
  total_bets: number
  winning_bets: number
  losing_bets: number
  push_bets: number
  roi_percentage: number
  win_rate: number
  overall_rank?: number
  sport_rank?: number
  primary_sport?: string
  strategy_type?: string
  bet_type?: string
  is_eligible: boolean
  minimum_bets_met: boolean
  verification_status: 'unverified' | 'verified' | 'premium'
  is_monetized: boolean
  subscription_price_weekly?: number
  subscription_price_monthly?: number
  subscription_price_yearly?: number
  subscriber_count?: number
  created_at: string
  updated_at: string
  last_calculated_at: string
  start_date?: string
  marketplace_rank_score: number
}

// Helper function to validate numeric values
function isValidNumber(value: any): value is number {
  return value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)
}

// Helper function for case-insensitive sportsbook matching
function normalizeString(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '').trim()
}

// Helper function to normalize league names to handle NCAAB variations
// CRITICAL: This must match exactly with backend normalization in route.ts and strategyValidation.ts
function normalizeLeague(league: string): string {
  const normalized = league.toLowerCase().trim()

  // Treat NCAAB, NCAAM, and NCAAMB as the same league - return NCAAB as canonical
  if (
    normalized === 'ncaab' ||
    normalized === 'ncaam' ||
    normalized === 'ncaamb' ||
    normalized === "ncaa men's basketball" ||
    normalized === "ncaa men's basketball" ||
    normalized === 'college basketball' ||
    normalized === 'ncaa basketball'
  ) {
    return 'NCAAB' // Canonical form - changed from NCAAM to NCAAB for consistency
  }

  // Normalize other common league variations
  if (normalized === 'nfl' || normalized === 'football') return 'NFL'
  if (normalized === 'nba' || normalized === 'basketball') return 'NBA'
  if (normalized === 'wnba' || normalized === 'women\'s basketball' || normalized === 'womens basketball') return 'WNBA'
  if (normalized === 'mlb' || normalized === 'baseball') return 'MLB'
  if (normalized === 'nhl' || normalized === 'hockey') return 'NHL'
  if (normalized === 'ncaaf' || normalized === 'college football') return 'NCAAF'
  if (normalized === 'mls' || normalized === 'soccer') return 'MLS'
  if (normalized === 'ucl' || normalized === 'champions league') return 'UCL'

  // Return original league in uppercase for consistency
  return league.toUpperCase()
}

function matchesSportsbook(
  betSportsbook: string | undefined,
  filterSportsbooks: string[]
): boolean {
  if (!betSportsbook || filterSportsbooks.length === 0) return true

  const normalizedBetSportsbook = normalizeString(betSportsbook)
  const normalizedFilters = filterSportsbooks.map(book => normalizeString(book))

  const matches = normalizedFilters.includes(normalizedBetSportsbook)

  // Debug logging to help troubleshoot
  if (__DEV__ && filterSportsbooks.length > 0) {
  }

  return matches
}

// Parlay-aware filtering function
function applyParlayAwareFiltering(
  bets: BetData[],
  filters: { leagues: string[]; betTypes: string[]; sportsbooks: string[] }
): BetData[] {
  // If no filters are applied, return all bets
  if (
    filters.leagues.length === 0 &&
    filters.betTypes.length === 0 &&
    filters.sportsbooks.length === 0
  ) {
    return bets
  }

  // Group bets by parlay_id to handle parlays correctly
  const parlayGroups = new Map<string | null, BetData[]>()
  const singleBets: BetData[] = []

  bets.forEach(bet => {
    if (bet.parlay_id) {
      if (!parlayGroups.has(bet.parlay_id)) {
        parlayGroups.set(bet.parlay_id, [])
      }
      parlayGroups.get(bet.parlay_id)!.push(bet)
    } else {
      singleBets.push(bet)
    }
  })

  const filteredBets: BetData[] = []

  // Filter single bets normally
  singleBets.forEach(bet => {
    let matches = true

    // Check league filter with normalization to handle NCAAB variations
    if (filters.leagues.length > 0) {
      const betLeague = normalizeLeague(bet.league || bet.sport || '')
      const normalizedFilterLeagues = filters.leagues.map(normalizeLeague)
      matches = matches && normalizedFilterLeagues.includes(betLeague)
    }

    // Check bet type filter
    if (filters.betTypes.length > 0) {
      matches = matches && filters.betTypes.includes(bet.bet_type || '')
    }

    // Check sportsbook filter (case-insensitive)
    if (filters.sportsbooks.length > 0) {
      matches = matches && matchesSportsbook(bet.sportsbook, filters.sportsbooks)
    }

    if (matches) {
      filteredBets.push(bet)
    }
  })

  // Filter parlays: include entire parlay if ANY leg matches the filters
  parlayGroups.forEach((parlayLegs, parlayId) => {
    let parlayMatches = false

    // Check if any leg of the parlay matches the filters
    for (const leg of parlayLegs) {
      let legMatches = true

      // Check league filter for this leg with normalization
      if (filters.leagues.length > 0) {
        const legLeague = normalizeLeague(leg.league || leg.sport || '')
        const normalizedFilterLeagues = filters.leagues.map(normalizeLeague)
        legMatches = legMatches && normalizedFilterLeagues.includes(legLeague)
      }

      // Check bet type filter for this leg
      if (filters.betTypes.length > 0) {
        legMatches = legMatches && filters.betTypes.includes(leg.bet_type || '')
      }

      // Check sportsbook filter for this leg (case-insensitive)
      if (filters.sportsbooks.length > 0) {
        legMatches = legMatches && matchesSportsbook(leg.sportsbook, filters.sportsbooks)
      }

      // If this leg matches, the whole parlay should be included
      if (legMatches) {
        parlayMatches = true
        break
      }
    }

    // If the parlay matches, include ALL legs of the parlay
    if (parlayMatches) {
      filteredBets.push(...parlayLegs)
    }
  })

  if (__DEV__) {
  }
  return filteredBets
}

// Analytics data fetching functions
export const fetchAnalyticsData = async (
  userId: string,
  filters: AnalyticsFilters
): Promise<AnalyticsData> => {
  try {
    if (__DEV__) {
    }
    // Sanitize filters to prevent invalid values
    const sanitizedFilters = {
      ...filters,
      minOdds: isValidNumber(filters.minOdds) ? filters.minOdds : null,
      maxOdds: isValidNumber(filters.maxOdds) ? filters.maxOdds : null,
      minStake: isValidNumber(filters.minStake) ? filters.minStake : null,
      maxStake: isValidNumber(filters.maxStake) ? filters.maxStake : null,
      minSpread: isValidNumber(filters.minSpread) ? filters.minSpread : null,
      maxSpread: isValidNumber(filters.maxSpread) ? filters.maxSpread : null,
      minTotal: isValidNumber(filters.minTotal) ? filters.minTotal : null,
      maxTotal: isValidNumber(filters.maxTotal) ? filters.maxTotal : null,
    }

    if (__DEV__) {
    }
    // Build query based on filters
    let query = supabase.from('bets').select('*').eq('user_id', userId)

    // Apply filters
    if (sanitizedFilters.timeframe !== 'all') {
      if (sanitizedFilters.timeframe === 'custom') {
        // Use custom date range - FIXED: use placed_at to match strategy creation
        if (sanitizedFilters.dateRange.start) {
          query = query.gte('placed_at', sanitizedFilters.dateRange.start)
        }
        if (sanitizedFilters.dateRange.end) {
          query = query.lte('placed_at', sanitizedFilters.dateRange.end)
        }
      } else {
        const days = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          ytd: 365, // Approximate year to date
        }[sanitizedFilters.timeframe]

        if (days) {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)
          query = query.gte('placed_at', startDate.toISOString()) // FIXED: use placed_at to match strategy creation
        }
      }
    }

    // Note: We will apply league and bet_type filters after fetching data to handle parlays correctly
    // For parlays, we want to include the entire parlay if ANY leg matches the filter

    // Keep track of filters that should be applied post-fetch for parlay support
    const postFetchFilters = {
      leagues: sanitizedFilters.leagues,
      betTypes: sanitizedFilters.betTypes,
      sportsbooks: sanitizedFilters.sportsbooks,
    }

    // Only apply these filters at DB level if they're empty (no filtering needed)
    // This ensures we get all parlay legs and can filter properly afterward
    // if (sanitizedFilters.leagues.length > 0) {
    //   query = query.in('league', sanitizedFilters.leagues);
    // }

    // if (sanitizedFilters.betTypes.length > 0) {
    //   query = query.in('bet_type', sanitizedFilters.betTypes);
    // }

    if (sanitizedFilters.results.length > 0) {
      query = query.in('status', sanitizedFilters.results)
    }

    // Note: Sportsbooks filtering moved to post-fetch for case-insensitive matching

    if (sanitizedFilters.isParlay !== null) {
      query = query.eq('is_parlay', sanitizedFilters.isParlay)
    }

    if (sanitizedFilters.side) {
      query = query.eq('side', sanitizedFilters.side)
    }

    if (sanitizedFilters.minOdds !== null) {
      query = query.gte('odds', sanitizedFilters.minOdds)
    }

    if (sanitizedFilters.maxOdds !== null) {
      query = query.lte('odds', sanitizedFilters.maxOdds)
    }

    if (sanitizedFilters.minStake !== null) {
      query = query.gte('stake', sanitizedFilters.minStake)
    }

    if (sanitizedFilters.maxStake !== null) {
      query = query.lte('stake', sanitizedFilters.maxStake)
    }

    // Pro filter: Spread range
    if (sanitizedFilters.minSpread !== null) {
      query = query.gte('line_value', sanitizedFilters.minSpread)
    }

    if (sanitizedFilters.maxSpread !== null) {
      query = query.lte('line_value', sanitizedFilters.maxSpread)
    }

    // Pro filter: Total range (also uses line_value)
    if (sanitizedFilters.minTotal !== null) {
      query = query.gte('line_value', sanitizedFilters.minTotal)
    }

    if (sanitizedFilters.maxTotal !== null) {
      query = query.lte('line_value', sanitizedFilters.maxTotal)
    }

    // Basic start date filter (available to all users) - FIXED: use placed_at to match strategy creation
    if (sanitizedFilters.basicStartDate) {
      query = query.gte('placed_at', sanitizedFilters.basicStartDate)
    }

    // Pro filter: Individual start/end dates - FIXED: use placed_at to match strategy creation  
    if (sanitizedFilters.startDate) {
      query = query.gte('placed_at', sanitizedFilters.startDate)
    }

    if (sanitizedFilters.endDate) {
      query = query.lte('placed_at', sanitizedFilters.endDate)
    }

    // Execute query
    const { data: rawBets, error } = await query.order('placed_at', { ascending: false })

    if (error) {
      console.error('Error fetching bets:', error)
      throw error
    }

    // Debug: Log unique sportsbook values found in database
    if (postFetchFilters.sportsbooks.length > 0 && rawBets) {
      const uniqueSportsbooks = [...new Set(rawBets.map(bet => bet.sportsbook).filter(Boolean))]
      if (__DEV__) {
      }
    }

    // Apply parlay-aware post-fetch filtering
    const bets = applyParlayAwareFiltering(rawBets || [], postFetchFilters)

    // Calculate metrics
    const metrics = calculateMetrics(bets || [])

    // Process chart data
    const chartData = processChartData(bets || [])

    // Calculate breakdowns
    const sportBreakdown = calculateSportBreakdown(bets || [])
    const betTypeBreakdown = calculateBetTypeBreakdown(bets || [])
    const sideBreakdown = calculateSideBreakdown(bets || [])
    const leagueBreakdown = calculateLeagueBreakdown(bets || [])

    return {
      metrics,
      recentBets: bets || [],
      dailyProfitData: chartData,
      monthlyData: [],
      sportBreakdown,
      betTypeBreakdown,
      sideBreakdown,
      leagueBreakdown,
      lineMovementData: [],
      winRateVsExpected: [],
      monthlyPerformance: [],
    }
  } catch (error) {
    console.error('Error in fetchAnalyticsData:', error)
    throw error
  }
}

export const fetchStrategies = async (userId: string): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching strategies:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchStrategies:', error)
    throw error
  }
}

export const fetchUserStrategiesFromLeaderboard = async (
  userId: string
): Promise<StrategyLeaderboard[]> => {
  try {
    if (__DEV__) {
    }

    const { data, error } = await supabase
      .from('strategy_leaderboard')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user strategies from leaderboard:', error)
      throw error
    }

    if (__DEV__) {
    }
    return data || []
  } catch (error) {
    console.error('Error in fetchUserStrategiesFromLeaderboard:', error)
    throw error
  }
}

export interface MarketplaceStrategy extends StrategyLeaderboard {
  profile_picture_url?: string
  display_name?: string
  subscriber_count?: number
}

export interface SellerProfile {
  id: string
  username: string
  display_name?: string
  bio?: string
  profile_picture_url?: string
  verified_seller: boolean
  created_at: string
  updated_at: string
  // Performance metrics
  total_strategies: number
  monetized_strategies: number
  total_subscribers: number
  overall_roi: number
  overall_win_rate: number
  total_bets: number
  best_strategy_roi: number
  // Additional stats
  avg_strategy_performance: number
  longest_winning_streak: number
  revenue_generated?: number
}

// Calculate marketplace ranking score based on performance metrics
const calculateMarketplaceRankScore = (strategy: any): number => {
  // Weights for different components (totaling 100%)
  const weights = {
    roi: 0.4, // 40% - Highest weight for profitability (kept same)
    winRate: 0.1, // 10% - Reduced from 25% (win rate not always indicative of good ROI)
    betVolume: 0.25, // 25% - New component for amount of bets (increased strength)
    longevity: 0.2, // 20% - Increased from 10% (long term record is crucial)
    subscribers: 0.05, // 5% - Market validation (kept same)
  }

  const roi = strategy.roi_percentage || 0
  
  // 1. ROI Score (0-100, normalized) - KEPT SAME
  // ROI above 20% gets max score, negative ROI gets severely penalized
  let roiScore = 0
  if (roi < 0) {
    roiScore = 0 // Negative ROI is very bad - no score
  } else {
    roiScore = Math.min(100, ((roi + 20) * 2.5))
  }

  // 2. Win Rate Score (0-100) - REDUCED IMPORTANCE
  // Direct conversion but with reduced weight
  const winRateScore = (strategy.win_rate || 0) * 100

  // 3. Bet Volume Score (0-100) - NEW ENHANCED COMPONENT
  // Reward high volume of bets, especially when ROI is positive
  let betVolumeScore = 0
  const totalBets = strategy.total_bets || 0
  
  // Base volume score
  if (totalBets >= 1000) betVolumeScore = 100 // 1000+ bets = excellent
  else if (totalBets >= 500) betVolumeScore = 85 // 500+ bets = very good
  else if (totalBets >= 250) betVolumeScore = 70 // 250+ bets = good
  else if (totalBets >= 100) betVolumeScore = 55 // 100+ bets = decent
  else if (totalBets >= 50) betVolumeScore = 40 // 50+ bets = some track record
  else if (totalBets >= 20) betVolumeScore = 25 // 20+ bets = minimal
  else betVolumeScore = totalBets * 1.25 // Linear scaling for < 20 bets
  
  // BOOST bet volume score if ROI is positive
  if (roi > 0) {
    const roiMultiplier = Math.min(1.5, 1 + (roi / 100)) // Up to 50% boost for high ROI
    betVolumeScore = Math.min(100, betVolumeScore * roiMultiplier)
  }

  // 4. Longevity Score (0-100) - INCREASED IMPORTANCE
  // Reward strategies with longer track records more heavily
  let longevityScore = 0
  if (strategy.start_date) {
    const startDate = new Date(strategy.start_date)
    const now = new Date()
    const daysActive = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysActive >= 730)
      longevityScore = 100 // 2+ years = max score
    else if (daysActive >= 365)
      longevityScore = 90 // 1+ year = excellent
    else if (daysActive >= 180)
      longevityScore = 70 // 6+ months = good
    else if (daysActive >= 90)
      longevityScore = 50 // 3+ months = decent
    else if (daysActive >= 30)
      longevityScore = 30 // 1+ month = some credit
    else longevityScore = Math.max(5, daysActive * 1) // Reduced linear scaling for < 30 days
  }

  // 5. Subscriber Score (0-100) - KEPT SAME
  // Reward market validation through subscriber count
  const subscriberCount = strategy.subscriber_count || 0
  let subscriberScore = 0
  if (subscriberCount >= 1000)
    subscriberScore = 100 // 1000+ = max
  else if (subscriberCount >= 500)
    subscriberScore = 85 // 500+ = excellent
  else if (subscriberCount >= 100)
    subscriberScore = 70 // 100+ = good
  else if (subscriberCount >= 25)
    subscriberScore = 50 // 25+ = decent
  else if (subscriberCount >= 5)
    subscriberScore = 30 // 5+ = some validation
  else subscriberScore = subscriberCount * 6 // Linear scaling for < 5

  // SEVERE PENALTY for negative ROI - multiply final score by 0.1
  let finalScore =
    roiScore * weights.roi +
    winRateScore * weights.winRate +
    betVolumeScore * weights.betVolume +
    longevityScore * weights.longevity +
    subscriberScore * weights.subscribers

  // Apply severe penalty for negative ROI
  if (roi < 0) {
    finalScore = finalScore * 0.1 // 90% penalty for negative ROI
  }

  // Subtle penalty for low win rate + high ROI (likely from few lucky parlays/high odds bets)
  const winRate = strategy.win_rate || 0
  if (winRate < 0.3 && roi > 15) {
    // This pattern suggests unsustainable luck rather than skill
    // Apply graduated penalty based on how low the win rate is
    const winRatePenalty = Math.max(0.6, 1 - ((0.3 - winRate) * 2)) // 40% max penalty
    finalScore = finalScore * winRatePenalty
  }

  return Math.round(finalScore * 100) / 100 // Round to 2 decimal places
}

export const fetchMarketplaceLeaderboard = async (
  limit: number = 50
): Promise<MarketplaceStrategy[]> => {
  try {
    if (__DEV__) {
    }

    // First try to get monetized strategies with proper ranking (best first)
    let { data, error } = await supabase
      .from('strategy_leaderboard')
      .select('*')
      .eq('is_monetized', true)
      .gte('total_bets', 5) // Minimum 5 bets to show
      .limit(limit * 2) // Get more data to calculate scores

    if (__DEV__) {
    }

    // If no monetized strategies found, get all strategies with good performance
    if (!error && (!data || data.length === 0)) {
      if (__DEV__) {
      }
      const fallbackQuery = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .gte('total_bets', 5)
        .limit(limit * 2)

      if (__DEV__) {
      }
      data = fallbackQuery.data
      error = fallbackQuery.error
    }

    // If still no results, try with even lower requirements
    if (!error && (!data || data.length === 0)) {
      if (__DEV__) {
      }
      const lowReqQuery = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .gte('total_bets', 1)
        .limit(limit * 2)

      if (__DEV__) {
      }
      data = lowReqQuery.data
      error = lowReqQuery.error
    }

    // Last resort: get ANY strategies regardless of bets or monetization
    if (!error && (!data || data.length === 0)) {
      const allStrategiesQuery = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .order('created_at', { ascending: false }) // Newest first as fallback
        .limit(limit * 2)
      data = allStrategiesQuery.data
      error = allStrategiesQuery.error
    }

    if (error) {
      console.error('Error fetching marketplace leaderboard:', error)
      throw error
    }

    if (__DEV__) {
    }

    // Get unique strategy IDs and user IDs for additional data fetching
    const strategyIds = [...new Set((data || []).map(item => item.strategy_id))]
    const userIds = [...new Set((data || []).map(item => item.user_id))]

    // Fetch additional strategy details including subscriber_count (maintained by triggers)
    const strategyDetails = new Map()
    if (strategyIds.length > 0) {
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, description, start_date, subscriber_count')
        .in('id', strategyIds)

      if (!strategiesError && strategiesData) {
        strategiesData.forEach(strategy => {
          strategyDetails.set(strategy.id, strategy)
        })
      } else {
      }
    }

    // Fetch profile information separately
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, profile_picture_url, display_name')
      .in('id', userIds)

    if (profilesError) {
    }

    // Create a map for quick profile lookup
    const profilesMap = new Map()
    ;(profilesData || []).forEach(profile => {
      profilesMap.set(profile.id, profile)
    })

    // Transform the data and calculate our new ranking scores
    const transformedData: MarketplaceStrategy[] = (data || []).map((item: any) => {
      const profile = profilesMap.get(item.user_id)
      const strategyDetail = strategyDetails.get(item.strategy_id)

      const strategyWithSubscribers = {
        ...item,
        profile_picture_url: profile?.profile_picture_url,
        display_name: profile?.display_name,
        subscriber_count: strategyDetail?.subscriber_count || 0, // Use maintained count from strategies table
      }

      // Calculate new marketplace rank score using our algorithm
      const newRankScore = calculateMarketplaceRankScore(strategyWithSubscribers)

      return {
        ...strategyWithSubscribers,
        marketplace_rank_score: newRankScore, // Override with our calculated score
      }
    })

    // Sort by our new ranking algorithm (highest score first)
    transformedData.sort(
      (a, b) => (b.marketplace_rank_score || 0) - (a.marketplace_rank_score || 0)
    )

    // Take only the requested limit after sorting
    const finalData = transformedData.slice(0, limit)
    return finalData
  } catch (error) {
    console.error('Error in fetchMarketplaceLeaderboard:', error)
    throw error
  }
}

export const fetchSellerProfile = async (username: string): Promise<SellerProfile> => {
  try {
    // First get the user's basic profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw profileError
    }

    if (!profileData) {
      throw new Error('Seller profile not found')
    }

    // Get seller profile data
    const { data: sellerProfileData, error: sellerProfileError } = await supabase
      .from('seller_profiles')
      .select('profile_img, banner_img, bio')
      .eq('user_id', profileData.id)
      .single()

    if (sellerProfileError) {
    }
    // Get all strategies for this seller from the leaderboard
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategy_leaderboard')
      .select('*')
      .eq('user_id', profileData.id)

    if (strategiesError) {
      console.error('Error fetching seller strategies:', strategiesError)
      throw strategiesError
    }

    // Calculate aggregate metrics
    const strategies = strategiesData || []
    const totalStrategies = strategies.length
    const monetizedStrategies = strategies.filter(s => s.is_monetized).length

    // Calculate overall performance metrics
    const totalBets = strategies.reduce((sum, s) => sum + s.total_bets, 0)
    const totalWinningBets = strategies.reduce((sum, s) => sum + s.winning_bets, 0)
    const overallWinRate = totalBets > 0 ? totalWinningBets / totalBets : 0

    // Calculate weighted ROI based on bet volume
    let weightedROI = 0
    if (totalBets > 0) {
      weightedROI = strategies.reduce((sum, s) => {
        const weight = s.total_bets / totalBets
        return sum + s.roi_percentage * weight
      }, 0)
    }

    const bestStrategyROI =
      strategies.length > 0 ? Math.max(...strategies.map(s => s.roi_percentage)) : 0

    // Get total subscriber counts from strategies table (maintained by triggers)
    let totalSubscribers = 0
    if (strategies.length > 0) {
      const { data: strategiesDetailData, error: strategiesDetailError } = await supabase
        .from('strategies')
        .select('id, subscriber_count')
        .in(
          'id',
          strategies.map(s => s.strategy_id)
        )

      if (!strategiesDetailError && strategiesDetailData) {
        totalSubscribers = strategiesDetailData.reduce(
          (sum, strategy) => sum + (strategy.subscriber_count || 0),
          0
        )
      } else {
      }
    }
    return {
      ...profileData,
      profile_img: sellerProfileData?.profile_img || null,
      banner_img: sellerProfileData?.banner_img || null,
      bio: sellerProfileData?.bio || null,
      total_strategies: totalStrategies,
      monetized_strategies: monetizedStrategies,
      total_subscribers: totalSubscribers,
      overall_roi: weightedROI,
      overall_win_rate: overallWinRate,
      total_bets: totalBets,
      best_strategy_roi: bestStrategyROI,
      avg_strategy_performance:
        strategies.length > 0
          ? strategies.reduce((sum, s) => sum + s.roi_percentage, 0) / strategies.length
          : 0,
      longest_winning_streak: 0, // Would need additional calculation
      revenue_generated: undefined, // Would need subscription revenue calculation
    }
  } catch (error) {
    console.error('Error in fetchSellerProfile:', error)
    throw error
  }
}

export const fetchSellerStrategies = async (
  username: string
): Promise<(StrategyLeaderboard & { subscriber_count?: number })[]> => {
  try {
    // First get the user ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (profileError || !profileData) {
      throw new Error('Seller not found')
    }

    // Get all strategies for this seller, ordered by performance
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategy_leaderboard')
      .select('*')
      .eq('user_id', profileData.id)
      .order('marketplace_rank_score', { ascending: false })
      .order('roi_percentage', { ascending: false })
      .order('win_rate', { ascending: false })
      .order('total_bets', { ascending: false })

    if (strategiesError) {
      console.error('Error fetching seller strategies:', strategiesError)
      throw strategiesError
    }

    const strategies = strategiesData || []

    // Get subscriber counts from the strategies table (maintained by triggers)
    const strategyDetails = new Map()
    if (strategies.length > 0) {
      const { data: strategiesDetailData, error: strategiesDetailError } = await supabase
        .from('strategies')
        .select('id, subscriber_count')
        .in(
          'id',
          strategies.map(s => s.strategy_id)
        )

      if (!strategiesDetailError && strategiesDetailData) {
        strategiesDetailData.forEach(strategy => {
          strategyDetails.set(strategy.id, strategy)
        })
      } else {
      }
    }

    // Add subscriber counts to each strategy using maintained counts
    const strategiesWithCounts = strategies.map(strategy => {
      const strategyDetail = strategyDetails.get(strategy.strategy_id)
      return {
        ...strategy,
        subscriber_count: strategyDetail?.subscriber_count || 0,
      }
    })
    return strategiesWithCounts
  } catch (error) {
    console.error('Error in fetchSellerStrategies:', error)
    throw error
  }
}

// Enhanced updateStrategy function for monetization
export const updateStrategy = async (
  strategyId: string,
  updates: {
    name?: string
    description?: string
    monetized?: boolean
    pricing_weekly?: number | null
    pricing_monthly?: number | null
    pricing_yearly?: number | null
  }
): Promise<{ success: boolean; error?: string; details?: string }> => {
  try {
    // Call the web API endpoint for consistent behavior
    const apiUrl = API_ENDPOINTS.strategies
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: strategyId,
        ...updates,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('❌ API error response:', errorData)

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        details: errorData.details,
      }
    }

    const result = await response.json()
    return { success: true }
  } catch (error) {
    console.error('❌ Error in iOS updateStrategy:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export const createStrategy = async (
  userId: string,
  strategy: {
    name: string
    description: string
    filters: AnalyticsFilters
    monetized: boolean
    pricing_weekly?: number
    pricing_monthly?: number
    pricing_yearly?: number
  }
): Promise<Strategy> => {
  try {
    // Validate required fields
    if (!strategy.name || strategy.name.length < 1 || strategy.name.length > 100) {
      throw new Error('Strategy name must be between 1 and 100 characters')
    }

    // Convert iOS filters to web FilterOptions format for validation
    const { convertFiltersToWebFormat, validateStrategyFilters } = await import(
      '../utils/strategyValidation'
    )
    const webFilters = convertFiltersToWebFormat(strategy.filters)
    const validationResult = validateStrategyFilters(webFilters)

    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join('. ')
      console.error('❌ Filter validation failed:', errorMessage)
      throw new Error(`Filter validation failed: ${errorMessage}`)
    }
    // Convert filters to web API format (FilterConfig)
    const filterConfig = {
      betTypes: strategy.filters.betTypes.length > 0 ? strategy.filters.betTypes : ['All'],
      leagues:
        strategy.filters.leagues.length > 0
          ? strategy.filters.leagues.map(normalizeLeague)
          : ['All'],
      statuses: strategy.filters.results.length === 5 ? ['All'] : strategy.filters.results,
      isParlays:
        strategy.filters.isParlay === null ? ['All'] : [strategy.filters.isParlay.toString()],
      sides: strategy.filters.side ? [strategy.filters.side] : ['All'],
      oddsTypes: strategy.filters.oddsType ? [strategy.filters.oddsType] : ['All'],
      timeRange:
        strategy.filters.timeframe === 'all'
          ? 'All time'
          : strategy.filters.timeframe === '7d'
            ? '7 days'
            : strategy.filters.timeframe === '30d'
              ? '30 days'
              : strategy.filters.timeframe === '90d'
                ? '3 months'
                : strategy.filters.timeframe === 'ytd'
                  ? 'This Year'
                  : strategy.filters.timeframe === 'custom'
                    ? 'Custom Range'
                    : 'All time',
      customStartDate: strategy.filters.basicStartDate, // Use basicStartDate instead of startDate
      customEndDate: null, // Remove endDate - not needed for strategies
      sportsbooks: strategy.filters.sportsbooks,
      sports: strategy.filters.sports
        ? strategy.filters.sports.map(normalizeLeague)
        : strategy.filters.leagues.map(normalizeLeague), // Use leagues as sports fallback with normalization
      oddsRange:
        strategy.filters.minOdds !== null || strategy.filters.maxOdds !== null
          ? {
              min: strategy.filters.minOdds || undefined,
              max: strategy.filters.maxOdds || undefined,
            }
          : undefined,
      stakeRange:
        strategy.filters.minStake !== null || strategy.filters.maxStake !== null
          ? {
              min: strategy.filters.minStake || undefined,
              max: strategy.filters.maxStake || undefined,
            }
          : undefined,
      spreadRange:
        strategy.filters.minSpread !== null || strategy.filters.maxSpread !== null
          ? {
              min: strategy.filters.minSpread || undefined,
              max: strategy.filters.maxSpread || undefined,
            }
          : undefined,
      totalRange:
        strategy.filters.minTotal !== null || strategy.filters.maxTotal !== null
          ? {
              min: strategy.filters.minTotal || undefined,
              max: strategy.filters.maxTotal || undefined,
            }
          : undefined,
    }
    // Call the web API endpoint to ensure consistent behavior
    // Uses environment configuration - can be overridden with EXPO_PUBLIC_API_BASE_URL
    const getApiUrl = () => {
      return API_ENDPOINTS.strategies
    }

    const apiUrl = getApiUrl()
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: strategy.name,
        description: strategy.description,
        filter_config: filterConfig,
        monetized: strategy.monetized,
        pricing_weekly: strategy.pricing_weekly,
        pricing_monthly: strategy.pricing_monthly,
        pricing_yearly: strategy.pricing_yearly,
        userId: userId, // Include for fallback authentication
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('❌ API error response:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    // Transform the response to match iOS Strategy interface
    const createdStrategy: Strategy = {
      id: result.strategy.id,
      name: result.strategy.name,
      description: result.strategy.description || '',
      filters: strategy.filters, // Keep original iOS filters
      monetized: result.strategy.monetized || false,
      pricing_weekly: result.strategy.pricing_weekly,
      pricing_monthly: result.strategy.pricing_monthly,
      pricing_yearly: result.strategy.pricing_yearly,
      subscriber_count: 0, // New strategy starts with 0 subscribers
      performance_roi: 0, // Will be calculated by triggers
      performance_win_rate: 0, // Will be calculated by triggers
      performance_total_bets: 0, // Will be calculated by triggers
      created_at: result.strategy.created_at || new Date().toISOString(),
      updated_at: result.strategy.updated_at || new Date().toISOString(),
    }

    return createdStrategy
  } catch (error) {
    console.error('❌ Error in iOS createStrategy:', error)
    throw error
  }
}

export const refreshBets = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // This would integrate with SharpSports API
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Bets refreshed successfully',
    }
  } catch (error) {
    console.error('Error refreshing bets:', error)
    return {
      success: false,
      message: 'Failed to refresh bets',
    }
  }
}

// Helper functions for parlay processing
interface ParlayGroup {
  parlay_id: string
  legs: BetData[]
  stake: number
  potential_payout: number
  status: 'won' | 'lost' | 'pending' | 'void' | 'push'
  profit: number
}

/**
 * Group parlay legs and calculate parlay outcomes based on database profit values
 * Each parlay is counted as 1 bet regardless of how many legs it has
 * UPDATED: Use exact same logic as dashboard to ensure consistent results
 */
const processParlaysAndSingles = (
  bets: BetData[]
): { parlays: ParlayGroup[]; singles: BetData[] } => {
  const parlayGroups = new Map<string, BetData[]>()
  const singles: BetData[] = []

  // Group bets by parlay_id or treat as singles
  bets.forEach(bet => {
    if (bet.parlay_id && bet.is_parlay) {
      if (!parlayGroups.has(bet.parlay_id)) {
        parlayGroups.set(bet.parlay_id, [])
      }
      parlayGroups.get(bet.parlay_id)!.push(bet)
    } else {
      singles.push(bet)
    }
  })

  // Process parlays to determine outcomes - use EXACT same logic as dashboard
  const parlays: ParlayGroup[] = Array.from(parlayGroups.entries()).map(([parlay_id, legs]) => {
    const firstLeg = legs[0]
    
    // For parlays, find legs with non-zero values - sometimes only one leg has accurate data
    const legWithStake = legs.find(leg => (leg.stake || 0) > 0) || firstLeg
    const legWithPayout = legs.find(leg => (leg.potential_payout || 0) > 0) || firstLeg
    const legWithProfit = legs.find(leg => (leg.profit || 0) !== 0) || firstLeg
    
    const stake = legWithStake.stake || 0
    const potential_payout = legWithPayout.potential_payout || 0
    
    
    // For parlays, use the profit field from the database if available
    let profit = 0
    let status: 'won' | 'lost' | 'pending' | 'void' | 'push'
    
    // Check if we have a meaningful profit value from the database (check all legs)
    // Don't trust profit: 0, always recalculate to get actual stake loss
    if (legWithProfit.profit !== null && legWithProfit.profit !== undefined && legWithProfit.profit !== 0) {
      profit = legWithProfit.profit
      // Determine status based on profit value
      if (profit > 0) {
        status = 'won'
      } else if (profit < 0) {
        status = 'lost'
      }
    } else {
      // Fall back to leg-by-leg analysis if no profit field
      const settledLegs = legs.filter(
        leg =>
          leg.status === 'won' ||
          leg.status === 'lost' ||
          leg.status === 'void' ||
          leg.status === 'push'
      )
      const wonLegs = legs.filter(leg => leg.status === 'won')
      const lostLegs = legs.filter(leg => leg.status === 'lost')
      const voidLegs = legs.filter(leg => leg.status === 'void')
      
      // Determine parlay status based on leg results - EXACT dashboard logic
      if (settledLegs.length === legs.length) {
        if (lostLegs.length > 0) {
          status = 'lost'
          profit = -stake
        } else if (voidLegs.length === legs.length) {
          status = 'void'
          profit = 0
        } else if (wonLegs.length === legs.length - voidLegs.length) {
          status = 'won'
          // For wins, check if any leg has actual profit data, otherwise calculate
          if (legWithProfit.profit !== null && legWithProfit.profit !== undefined && legWithProfit.profit !== 0) {
            profit = legWithProfit.profit
          } else {
            profit = potential_payout - stake
          }
        } else {
          status = 'pending'
          profit = 0
        }
      } else {
        status = 'pending'
        profit = 0
      }
      
    }


    return {
      parlay_id,
      legs,
      stake,
      potential_payout,
      status,
      profit,
    }
  })

  return { parlays, singles }
}

// Helper functions for calculations
const calculateMetrics = (bets: BetData[]): AnalyticsMetrics => {
  if (!bets || bets.length === 0) {
    return {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      totalProfit: 0,
      avgStake: 0,
      biggestWin: 0,
      biggestLoss: 0,
      expectedValue: 0,
      avgClv: 0,
      straightBetsCount: 0,
      parlayBetsCount: 0,
      voidBetsCount: 0,
      streakType: 'none',
      currentStreak: 0,
    }
  }

  // Process parlays and singles using the new logic
  const { parlays, singles } = processParlaysAndSingles(bets)

  // Count total bets: each parlay counts as 1 bet + all singles
  const totalBets = parlays.length + singles.length

  // Create unified bet array for calculations (parlays + singles)
  const unifiedBets = [
    ...parlays.map(parlay => ({
      status: parlay.status,
      stake: parlay.stake,
      profit: parlay.profit,
      placed_at: parlay.legs[0]?.game_date || parlay.legs[0]?.placed_at,
      is_parlay: true,
    })),
    ...singles.map(single => ({
      status: single.status,
      stake: single.stake || 0,
      // Use actual profit field from database, fall back to calculation only if null
      profit:
        single.profit !== null && single.profit !== undefined
          ? single.profit
          : single.status === 'won'
            ? (single.potential_payout || 0) - (single.stake || 0)
            : single.status === 'lost'
              ? -(single.stake || 0)
              : 0,
      placed_at: single.placed_at || single.game_date,
      is_parlay: false,
    })),
  ]

  const settledBets = unifiedBets.filter(bet => bet.status === 'won' || bet.status === 'lost')
  const wonBets = settledBets.filter(bet => bet.status === 'won').length
  const winRate = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0

  // Calculate total profit from unified bets
  const totalProfit = unifiedBets.reduce((sum, bet) => sum + bet.profit, 0)

  // Calculate total stake from unified bets
  const totalStake = unifiedBets.reduce((sum, bet) => sum + bet.stake, 0)
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0

  const avgStake = totalBets > 0 ? totalStake / totalBets : 0

  // Calculate biggest win/loss from unified profits
  const profits = unifiedBets.map(bet => bet.profit).filter(p => p !== 0)
  const biggestWin = profits.length > 0 ? Math.max(...profits) : 0
  const biggestLoss = profits.length > 0 ? Math.abs(Math.min(...profits)) : 0

  // Count bet types
  const straightBetsCount = singles.length
  const parlayBetsCount = parlays.length
  const voidBetsCount = bets.filter(
    bet => bet.status === 'void' || bet.status === 'cancelled'
  ).length

  // Calculate current streak using unified bets
  let currentStreak = 0
  let streakType: 'win' | 'loss' | 'none' = 'none'

  const sortedBets = [...settledBets].sort((a, b) => {
    const aDate = new Date(a.placed_at || '').getTime()
    const bDate = new Date(b.placed_at || '').getTime()
    return bDate - aDate
  })

  for (const bet of sortedBets) {
    if (currentStreak === 0) {
      streakType = bet.status === 'won' ? 'win' : 'loss'
      currentStreak = 1
    } else if (
      (streakType === 'win' && bet.status === 'won') ||
      (streakType === 'loss' && bet.status === 'lost')
    ) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    totalBets,
    winRate,
    roi,
    totalProfit,
    avgStake,
    biggestWin,
    biggestLoss,
    expectedValue: 0,
    avgClv: 0,
    straightBetsCount,
    parlayBetsCount,
    voidBetsCount,
    streakType,
    currentStreak,
  }
}

const processChartData = (bets: BetData[]): ChartDataPoint[] => {
  if (!bets || bets.length === 0) return []

  // Process parlays and singles for chart data using actual profit field
  const { parlays, singles } = processParlaysAndSingles(bets)

  // Create unified bet array with proper dates and profits from the database
  const unifiedBets = [
    ...parlays.map(parlay => ({
      date: parlay.legs[0]?.game_date || parlay.legs[0]?.placed_at || '',
      profit: parlay.profit, // Use calculated parlay profit
      status: parlay.status,
    })),
    ...singles.map(single => ({
      date: single.game_date || single.placed_at || '',
      // Use the actual profit field from the database, fall back to calculation only if null
      profit:
        single.profit !== null && single.profit !== undefined
          ? single.profit
          : single.status === 'won'
            ? (single.potential_payout || 0) - (single.stake || 0)
            : single.status === 'lost'
              ? -(single.stake || 0)
              : 0,
      status: single.status,
    })),
  ].filter(bet => bet.date && (bet.status === 'won' || bet.status === 'lost'))

  const sortedBets = unifiedBets.sort((a, b) => {
    const aDate = new Date(a.date).getTime()
    const bDate = new Date(b.date).getTime()
    return aDate - bDate
  })

  const dailyData: { [date: string]: { profit: number; bets: number } } = {}

  sortedBets.forEach(bet => {
    // Handle timezone properly to avoid date offset issues
    const betDateObj = new Date(bet.date)
    const date = betDateObj.getFullYear() + '-' + 
      String(betDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
      String(betDateObj.getDate()).padStart(2, '0')
    if (!dailyData[date]) {
      dailyData[date] = { profit: 0, bets: 0 }
    }

    dailyData[date].profit += bet.profit
    dailyData[date].bets += 1
  })

  let cumulativeProfit = 0
  return Object.entries(dailyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, data]) => {
      cumulativeProfit += data.profit
      return {
        date,
        profit: data.profit,
        cumulativeProfit,
        bets: data.bets,
      }
    })
}

const calculateSportBreakdown = (bets: BetData[]): SportBreakdown[] => {
  if (!bets || bets.length === 0) return []

  // Process parlays and singles to avoid double counting parlay legs
  const { parlays, singles } = processParlaysAndSingles(bets)

  const sportData: {
    [sport: string]: { bets: number; profit: number; wins: number; stake: number }
  } = {}

  // Process single bets
  singles.forEach(bet => {
    const sport = bet.sport || bet.league || 'Unknown'
    if (!sportData[sport]) {
      sportData[sport] = { bets: 0, profit: 0, wins: 0, stake: 0 }
    }

    sportData[sport].bets += 1
    sportData[sport].stake += bet.stake || 0

    // Calculate profit for this bet using database profit field
    if (bet.profit !== null && bet.profit !== undefined) {
      sportData[sport].profit += bet.profit
      if (bet.profit > 0) sportData[sport].wins += 1
    } else {
      // Fall back to calculation if no profit field
      if (bet.status === 'won' && bet.potential_payout) {
        const calculatedProfit = (bet.potential_payout || 0) - (bet.stake || 0)
        sportData[sport].profit += calculatedProfit
        sportData[sport].wins += 1
      } else if (bet.status === 'lost' && bet.stake) {
        sportData[sport].profit -= bet.stake
      }
    }
  })

  // Process parlays - count each parlay as one bet
  parlays.forEach(parlay => {
    // For parlays spanning multiple sports, use a special category
    const parlayLegs = parlay.legs
    const sports = new Set(parlayLegs.map(leg => leg.sport || leg.league || 'Unknown'))
    const sport = sports.size > 1 ? 'Multi-Sport Parlays' : Array.from(sports)[0]

    if (!sportData[sport]) {
      sportData[sport] = { bets: 0, profit: 0, wins: 0, stake: 0 }
    }

    sportData[sport].bets += 1
    
    // Use the stake and profit from legs that have non-zero values
    const legWithStake = parlay.legs.find(leg => (leg.stake || 0) > 0) || parlay.legs[0]
    const legWithProfit = parlay.legs.find(leg => (leg.profit || 0) !== 0) || parlay.legs[0]
    
    sportData[sport].stake += legWithStake.stake || 0
    
    // Use parlay profit (which is already calculated correctly) or leg profit
    const actualProfit = parlay.profit !== 0 ? parlay.profit : (legWithProfit.profit || 0)
    sportData[sport].profit += actualProfit
    if (actualProfit > 0) sportData[sport].wins += 1
  })

  return Object.entries(sportData).map(([sport, data]) => ({
    sport,
    bets: data.bets,
    profit: data.profit,
    winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
    roi: data.stake > 0 ? (data.profit / data.stake) * 100 : 0,
  }))
}

const calculateBetTypeBreakdown = (bets: BetData[]) => {
  if (!bets || bets.length === 0) return []

  // Process parlays and singles to avoid double counting parlay legs
  const { parlays, singles } = processParlaysAndSingles(bets)

  const betTypeData: { [betType: string]: { bets: number; profit: number; wins: number } } = {}

  // Process single bets
  singles.forEach(bet => {
    const betType = bet.bet_type || 'Unknown'
    if (!betTypeData[betType]) {
      betTypeData[betType] = { bets: 0, profit: 0, wins: 0 }
    }
    betTypeData[betType].bets += 1

    // Use database profit field if available
    if (bet.profit !== null && bet.profit !== undefined) {
      betTypeData[betType].profit += bet.profit
      if (bet.profit > 0) betTypeData[betType].wins += 1
    } else {
      // Fall back to calculation
      if (bet.status === 'won' && bet.potential_payout) {
        const calculatedProfit = (bet.potential_payout || 0) - (bet.stake || 0)
        betTypeData[betType].profit += calculatedProfit
        betTypeData[betType].wins += 1
      } else if (bet.status === 'lost' && bet.stake) {
        betTypeData[betType].profit -= bet.stake
      }
    }
  })

  // Process parlays - always categorize as 'Parlay' bet type
  if (parlays.length > 0) {
    const parlayBetType = 'Parlay'
    if (!betTypeData[parlayBetType]) {
      betTypeData[parlayBetType] = { bets: 0, profit: 0, wins: 0 }
    }

    parlays.forEach(parlay => {
      betTypeData[parlayBetType].bets += 1
      
      // Use the calculated profit which already handles non-zero values
      const legWithProfit = parlay.legs.find(leg => (leg.profit || 0) !== 0) || parlay.legs[0]
      const actualProfit = parlay.profit !== 0 ? parlay.profit : (legWithProfit.profit || 0)
      
      betTypeData[parlayBetType].profit += actualProfit
      if (actualProfit > 0) betTypeData[parlayBetType].wins += 1
    })
  }

  return Object.entries(betTypeData).map(([betType, data]) => ({
    betType,
    bets: data.bets,
    profit: data.profit,
    winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
  }))
}

const calculateSideBreakdown = (bets: BetData[]) => {
  if (!bets || bets.length === 0) return []

  // Process parlays and singles to avoid double counting parlay legs
  const { parlays, singles } = processParlaysAndSingles(bets)

  const sideData: { [side: string]: { bets: number; profit: number; wins: number } } = {}

  // Process single bets
  singles.forEach(bet => {
    const side = bet.side || 'Unknown'
    if (!sideData[side]) {
      sideData[side] = { bets: 0, profit: 0, wins: 0 }
    }
    sideData[side].bets += 1

    // Use database profit field if available
    if (bet.profit !== null && bet.profit !== undefined) {
      sideData[side].profit += bet.profit
      if (bet.profit > 0) sideData[side].wins += 1
    } else {
      // Fall back to calculation
      if (bet.status === 'won' && bet.potential_payout) {
        const calculatedProfit = (bet.potential_payout || 0) - (bet.stake || 0)
        sideData[side].profit += calculatedProfit
        sideData[side].wins += 1
      } else if (bet.status === 'lost' && bet.stake) {
        sideData[side].profit -= bet.stake
      }
    }
  })

  // Process parlays - for sides spanning multiple sides, use 'Multi-Side'
  parlays.forEach(parlay => {
    const parlayLegs = parlay.legs
    const sides = new Set(parlayLegs.map(leg => leg.side || 'Unknown'))
    const side = sides.size > 1 ? 'Multi-Side Parlays' : Array.from(sides)[0]

    if (!sideData[side]) {
      sideData[side] = { bets: 0, profit: 0, wins: 0 }
    }

    sideData[side].bets += 1
    
    // Use the calculated profit which already handles non-zero values
    const legWithProfit = parlay.legs.find(leg => (leg.profit || 0) !== 0) || parlay.legs[0]
    const actualProfit = parlay.profit !== 0 ? parlay.profit : (legWithProfit.profit || 0)
    
    sideData[side].profit += actualProfit
    if (actualProfit > 0) sideData[side].wins += 1
  })

  return Object.entries(sideData).map(([side, data]) => ({
    side,
    bets: data.bets,
    profit: data.profit,
    winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
  }))
}

const calculateLeagueBreakdown = (bets: BetData[]) => {
  if (!bets || bets.length === 0) return []

  // Process parlays and singles to avoid double counting parlay legs
  const { parlays, singles } = processParlaysAndSingles(bets)

  const leagueData: { [league: string]: { bets: number; profit: number; wins: number } } = {}

  // Process single bets
  singles.forEach(bet => {
    const league = bet.league || bet.sport || 'Unknown'
    if (!leagueData[league]) {
      leagueData[league] = { bets: 0, profit: 0, wins: 0 }
    }
    leagueData[league].bets += 1

    // Use database profit field if available
    if (bet.profit !== null && bet.profit !== undefined) {
      leagueData[league].profit += bet.profit
      if (bet.profit > 0) leagueData[league].wins += 1
    } else {
      // Fall back to calculation
      if (bet.status === 'won' && bet.potential_payout) {
        const calculatedProfit = (bet.potential_payout || 0) - (bet.stake || 0)
        leagueData[league].profit += calculatedProfit
        leagueData[league].wins += 1
      } else if (bet.status === 'lost' && bet.stake) {
        leagueData[league].profit -= bet.stake
      }
    }
  })

  // Process parlays - for leagues spanning multiple leagues, use 'Multi-League'
  parlays.forEach(parlay => {
    const parlayLegs = parlay.legs
    const leagues = new Set(parlayLegs.map(leg => leg.league || leg.sport || 'Unknown'))
    const league = leagues.size > 1 ? 'Multi-League Parlays' : Array.from(leagues)[0]

    if (!leagueData[league]) {
      leagueData[league] = { bets: 0, profit: 0, wins: 0 }
    }

    leagueData[league].bets += 1
    
    // Use the calculated profit which already handles non-zero values
    const legWithProfit = parlay.legs.find(leg => (leg.profit || 0) !== 0) || parlay.legs[0]
    const actualProfit = parlay.profit !== 0 ? parlay.profit : (legWithProfit.profit || 0)
    
    leagueData[league].profit += actualProfit
    if (actualProfit > 0) leagueData[league].wins += 1
  })

  return Object.entries(leagueData).map(([league, data]) => ({
    league,
    bets: data.bets,
    profit: data.profit,
    winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0,
  }))
}

export interface StrategyBettingMetrics {
  avgBetsPerWeek: number
  firstBetDate: string | null
  totalWeeksActive: number
  mostActivePeriod: string
  recentActivity: 'high' | 'medium' | 'low'
}

export const fetchStrategyBettingMetrics = async (strategyId: string): Promise<StrategyBettingMetrics> => {
  try {
    // Query the strategy_bets table to get all bets for this strategy
    const { data: strategyBets, error } = await supabase
      .from('strategy_bets')
      .select('added_at, created_at')
      .eq('strategy_id', strategyId)
      .order('added_at', { ascending: true })

    if (error) {
      console.error('Error fetching strategy betting metrics:', error)
      throw error
    }

    if (!strategyBets || strategyBets.length === 0) {
      return {
        avgBetsPerWeek: 0,
        firstBetDate: null,
        totalWeeksActive: 0,
        mostActivePeriod: 'No data',
        recentActivity: 'low'
      }
    }

    // Find the first bet date (use added_at if available, otherwise created_at)
    const firstBetDate = strategyBets[0].added_at || strategyBets[0].created_at
    const firstDate = new Date(firstBetDate)
    const now = new Date()

    // Calculate total weeks active
    const totalWeeksActive = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7)))
    
    // Calculate average bets per week
    const avgBetsPerWeek = Math.round((strategyBets.length / totalWeeksActive) * 10) / 10

    // Analyze recent activity (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const recentBets = strategyBets.filter(bet => {
      const betDate = new Date(bet.added_at || bet.created_at)
      return betDate >= thirtyDaysAgo
    })

    // Determine recent activity level based on realistic betting frequency
    // High: 5-10+ bets per day (35-70+ bets per week)
    // Medium: 2-4 bets per day (14-28 bets per week) 
    // Low: Less than 2 bets per day (less than 14 bets per week)
    let recentActivity: 'high' | 'medium' | 'low'
    const recentBetsPerWeek = recentBets.length / 4.3 // approximate weeks in 30 days
    
    if (recentBetsPerWeek >= 35) {
      recentActivity = 'high'   // 5+ bets per day
    } else if (recentBetsPerWeek >= 14) {
      recentActivity = 'medium' // 2-4 bets per day
    } else {
      recentActivity = 'low'    // Less than 2 bets per day
    }

    // Find most active period (month with highest bet count)
    const monthlyBets: { [key: string]: number } = {}
    strategyBets.forEach(bet => {
      const betDate = new Date(bet.added_at || bet.created_at)
      const monthKey = `${betDate.getFullYear()}-${String(betDate.getMonth() + 1).padStart(2, '0')}`
      monthlyBets[monthKey] = (monthlyBets[monthKey] || 0) + 1
    })

    const mostActiveMonth = Object.entries(monthlyBets).reduce((max, [month, count]) => 
      count > max.count ? { month, count } : max, 
      { month: '', count: 0 }
    )

    const mostActivePeriod = mostActiveMonth.month ? 
      new Date(mostActiveMonth.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
      'No data'

    return {
      avgBetsPerWeek,
      firstBetDate,
      totalWeeksActive,
      mostActivePeriod,
      recentActivity
    }
  } catch (error) {
    console.error('Error in fetchStrategyBettingMetrics:', error)
    return {
      avgBetsPerWeek: 0,
      firstBetDate: null,
      totalWeeksActive: 0,
      mostActivePeriod: 'No data',
      recentActivity: 'low'
    }
  }
}
