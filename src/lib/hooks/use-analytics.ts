// FILE: src/lib/hooks/use-analytics.ts (Enhanced version)
import {
  fetchEnhancedAnalytics,
  type AnalyticsFilters as EnhancedFilters,
  type MonthlyPerformanceData,
  type PerformanceByLeagueData,
  type ROIOverTimeData,
  type WinRateVsExpectedData,
} from '@/lib/analytics/enhanced-analytics'
import type { User } from '@supabase/auth-helpers-nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

// Support both Supabase User and custom User from useAuth
type CustomUser = {
  id: string
  email: string
  name?: string
}

type SupportedUser = User | CustomUser

// Keep all your existing interfaces exactly the same
export interface Bet {
  id: string
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
  odds: number
  stake: number
  potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
  result?: 'won' | 'lost' | 'void' | 'cancelled'
  placed_at: string
  settled_at?: string
  game_date: string
  created_at?: string
  prop_type?: string
  player_name?: string
  home_team?: string
  away_team?: string
  profit?: number
  sportsbook?: string
  line_value?: number
  bet_source: string
  is_copy_bet: boolean
  game_id?: string
  source_strategy_id?: string
  copied_from_bet_id?: string
  strategy_id?: string
  updated_at?: string
  oddid?: string
  side?: 'over' | 'under' | 'home' | 'away' | null
  odd_source?: string
  parlay_id?: string
  is_parlay: boolean
  // Legacy fields for compatibility
  description?: string
  actual_payout?: number | null
  profit_loss?: number | null
  clv?: number | null
}

export interface AnalyticsFilters {
  sports: string[]
  leagues: string[]
  betTypes: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
  sportsbooks: string[]
  minOdds: number | null
  maxOdds: number | null
  minStake: number | null
  maxStake: number | null
  results: string[]
  timeframe: string
  // New database-specific filters
  isParlay?: boolean | null
  side?: string | null
  oddsType?: string | null
}

export interface SportBreakdown {
  sport: string
  bets: number
  winRate: number
  profit: number
  roi: number
  avgOdds: number
  totalStaked: number
  clv?: number | undefined
}

export interface BetTypeBreakdown {
  betType: string
  bets: number
  winRate: number
  profit: number
  roi: number
  avgOdds: number
}

export interface SideBreakdown {
  side: string
  bets: number
  winRate: number
  profit: number
  roi: number
  avgOdds: number
}

export interface MonthlyData {
  month: string
  bets: number
  profit: number
  winRate: number
  roi: number
  totalStaked: number
}

export interface DailyProfitData {
  date: string
  profit: number
  cumulativeProfit: number
  bets: number
}

export interface AnalyticsMetrics {
  totalBets: number
  winRate: number
  roi: number
  totalProfit: number
  totalStaked: number
  avgOdds: number
  avgStake: number
  biggestWin: number
  biggestLoss: number
  currentStreak: number
  streakType: 'win' | 'loss' | 'none'
  avgClv: number | null
  expectedValue: number
  profitableSports: number
  variance: number
  straightBetsCount?: number
  parlayBetsCount?: number
  voidBetsCount?: number
}

export interface LineMovementData {
  date: string
  clv: number
  odds: number
  lineValue: number
  sport: string
  betType: string
  profit: number
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics
  sportBreakdown: SportBreakdown[]
  betTypeBreakdown: BetTypeBreakdown[]
  sideBreakdown: SideBreakdown[]
  lineMovementData: LineMovementData[]
  monthlyData: MonthlyData[]
  dailyProfitData: DailyProfitData[]
  recentBets: Bet[]
  topPerformingSports: SportBreakdown[]
  // Enhanced analytics data
  roiOverTime: ROIOverTimeData[]
  leagueBreakdown: PerformanceByLeagueData[]
  winRateVsExpected: WinRateVsExpectedData[]
  monthlyPerformance: MonthlyPerformanceData[]
  bets: Bet[] // Raw bets data for the bets table
}

const defaultFilters: AnalyticsFilters = {
  sports: [],
  leagues: [],
  betTypes: [],
  dateRange: { start: null, end: null },
  sportsbooks: [],
  minOdds: null,
  maxOdds: null,
  minStake: null,
  maxStake: null,
  results: ['won', 'lost', 'void', 'pending'], // Include all statuses by default
  timeframe: 'all', // Show all time by default
}

export function useAnalytics(user: SupportedUser | null = null) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters)

  // Use useRef to store the latest filters without causing re-renders
  const latestFiltersRef = useRef<AnalyticsFilters>(defaultFilters)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update the ref whenever filters change
  useEffect(() => {
    latestFiltersRef.current = filters
  }, [filters])

  const fetchAnalytics = useCallback(
    async (forceFetch = false) => {
      console.log('🔍 fetchAnalytics called with user:', user?.id, 'forceFetch:', forceFetch)
      if (!user) {
        console.log('No user provided to fetchAnalytics')
        setLoading(false)
        setAnalyticsData(null)
        setError(null)
        return
      }

      // Clear any pending fetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }

      // Debounce the fetch unless forced
      if (!forceFetch) {
        fetchTimeoutRef.current = setTimeout(() => fetchAnalytics(true), 300) as unknown as NodeJS.Timeout
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('Fetching analytics for user:', user.id)

        const currentFilters = latestFiltersRef.current

        // Convert filters to enhanced analytics format
        const enhancedFilters: EnhancedFilters = {
          ...(currentFilters.sports.length > 0 && { leagues: currentFilters.sports }), // Map sports to leagues for now
          ...(currentFilters.leagues.length > 0 && { leagues: currentFilters.leagues }),
          ...(currentFilters.betTypes.length > 0 && { bet_types: currentFilters.betTypes }),
          ...(currentFilters.sportsbooks.length > 0 && { sportsbooks: currentFilters.sportsbooks }),
          ...(currentFilters.minOdds !== null &&
            currentFilters.minOdds !== undefined && { odds_min: currentFilters.minOdds }),
          ...(currentFilters.maxOdds !== null &&
            currentFilters.maxOdds !== undefined && { odds_max: currentFilters.maxOdds }),
          ...(currentFilters.minStake !== null &&
            currentFilters.minStake !== undefined && { stake_min: currentFilters.minStake }),
          ...(currentFilters.maxStake !== null &&
            currentFilters.maxStake !== undefined && { stake_max: currentFilters.maxStake }),
          ...(currentFilters.dateRange.start && { date_from: currentFilters.dateRange.start }),
          ...(currentFilters.dateRange.end && { date_to: currentFilters.dateRange.end }),
          ...(currentFilters.isParlay !== null &&
            currentFilters.isParlay !== undefined && { is_parlay: currentFilters.isParlay }),
          ...(currentFilters.side && { side: currentFilters.side }),
        }

        // Fetch both old and enhanced analytics data in parallel
        console.log('🔍 About to fetch enhanced analytics for user:', user.id)
        const [legacyResponse, enhancedData] = await Promise.all([
          // Legacy API call
          fetch(
            `/api/analytics?${new URLSearchParams({
              userId: user.id,
              timeframe: currentFilters.timeframe,
              ...(currentFilters.sports.length > 0 && { sport: currentFilters.sports.join(',') }),
              ...(currentFilters.leagues.length > 0 && {
                league: currentFilters.leagues.join(','),
              }),
              ...(currentFilters.betTypes.length > 0 && {
                bet_type: currentFilters.betTypes.join(','),
              }),
              ...(currentFilters.results.length > 0 &&
                currentFilters.results.length < 5 && { status: currentFilters.results.join(',') }),
              ...(currentFilters.isParlay !== null &&
                currentFilters.isParlay !== undefined && {
                  is_parlay: currentFilters.isParlay.toString(),
                }),
              ...(currentFilters.side && { side: currentFilters.side }),
              ...(currentFilters.oddsType && { odds_type: currentFilters.oddsType }),
              ...(currentFilters.minOdds !== null &&
                currentFilters.minOdds !== undefined && {
                  min_odds: currentFilters.minOdds.toString(),
                }),
              ...(currentFilters.maxOdds !== null &&
                currentFilters.maxOdds !== undefined && {
                  max_odds: currentFilters.maxOdds.toString(),
                }),
              ...(currentFilters.minStake !== null &&
                currentFilters.minStake !== undefined && {
                  min_stake: currentFilters.minStake.toString(),
                }),
              ...(currentFilters.maxStake !== null &&
                currentFilters.maxStake !== undefined && {
                  max_stake: currentFilters.maxStake.toString(),
                }),
              ...(currentFilters.dateRange.start && { start_date: currentFilters.dateRange.start }),
              ...(currentFilters.dateRange.end && { end_date: currentFilters.dateRange.end }),
            })}`,
            {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            }
          ),
          // Enhanced analytics functions
          (async () => {
            try {
              console.log('🔍 Calling fetchEnhancedAnalytics with:', user.id, enhancedFilters)
              const result = await fetchEnhancedAnalytics(user.id, enhancedFilters)
              console.log('✅ fetchEnhancedAnalytics completed:', result)
              return result
            } catch (error) {
              console.error('🚨 fetchEnhancedAnalytics failed:', error)
              return {
                roiOverTime: [],
                performanceByLeague: [],
                winRateVsExpected: [],
                monthlyPerformance: [],
              }
            }
          })(),
        ])

        if (!legacyResponse.ok) {
          // Handle authentication errors specifically
          if (legacyResponse.status === 401) {
            console.log('Analytics API returned 401 - authentication failed')
            setAnalyticsData(null)
            setError('Authentication required. Please log in again.')
            setLoading(false)
            return
          }
          throw new Error(`API error: ${legacyResponse.status}`)
        }

        const legacyResult = await legacyResponse.json()

        if (legacyResult.error) {
          throw new Error(legacyResult.error)
        }

        console.log('Successfully fetched legacy analytics:', legacyResult.data)
        console.log('Successfully fetched enhanced analytics:', enhancedData)

        // Combine legacy and enhanced data
        const data: AnalyticsData = {
          metrics: legacyResult.data.metrics,
          sportBreakdown: legacyResult.data.sportBreakdown || [],
          betTypeBreakdown: legacyResult.data.betTypeBreakdown || [],
          sideBreakdown: legacyResult.data.sideBreakdown || [],
          lineMovementData: legacyResult.data.lineMovementData || [],
          monthlyData: legacyResult.data.monthlyData || [],
          dailyProfitData: legacyResult.data.dailyProfitData || [],
          recentBets: legacyResult.data.recentBets || [],
          topPerformingSports: legacyResult.data.topPerformingSports || [],
          // Enhanced analytics data
          roiOverTime: enhancedData.roiOverTime || [],
          leagueBreakdown: enhancedData.performanceByLeague || [],
          winRateVsExpected: enhancedData.winRateVsExpected || [],
          monthlyPerformance: enhancedData.monthlyPerformance || [],
          bets: legacyResult.data.recentBets || [],
        }

        setAnalyticsData(data)
      } catch (err) {
        console.error('Error in fetchAnalytics:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  // Initial fetch only when user changes
  useEffect(() => {
    fetchAnalytics(true)
  }, [user?.id, fetchAnalytics])

  // Fetch when filters change (debounced)
  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [filters, user, fetchAnalytics])

  // Create empty data if no analytics data available
  const emptyData: AnalyticsData = {
    metrics: {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      totalProfit: 0,
      totalStaked: 0,
      avgOdds: 0,
      avgStake: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      streakType: 'none',
      avgClv: null,
      expectedValue: 0,
      profitableSports: 0,
      variance: 0,
      straightBetsCount: 0,
      parlayBetsCount: 0,
      voidBetsCount: 0,
    },
    sportBreakdown: [],
    betTypeBreakdown: [],
    sideBreakdown: [],
    lineMovementData: [],
    monthlyData: [],
    dailyProfitData: [],
    recentBets: [],
    topPerformingSports: [],
    // Enhanced analytics empty data
    roiOverTime: [],
    leagueBreakdown: [],
    winRateVsExpected: [],
    monthlyPerformance: [],
    bets: [],
  }

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return {
    analyticsData: analyticsData || emptyData,
    isLoading: loading,
    error,
    filters,
    updateFilters,
    totalBets: analyticsData?.metrics.totalBets || 0,
    filteredBetsCount: analyticsData?.metrics.totalBets || 0,
  }
}
