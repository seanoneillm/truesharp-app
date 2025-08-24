// FILE: src/lib/hooks/use-analytics.ts (Final fixed version)
import type { User } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useRef, useCallback } from 'react'

// Keep all your existing interfaces exactly the same
export interface Bet {
  id: string
  user_id: string
  external_bet_id?: string
  sport: string
  league: string
  bet_type: 'spread' | 'moneyline' | 'total' | 'player_prop' | 'game_prop' | 'first_half' | 'quarter' | 'period' | 'parlay'
  bet_description: string
  odds: number
  stake: number
  potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
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
}

const defaultFilters: AnalyticsFilters = {
  sports: [],
  betTypes: [],
  dateRange: { start: null, end: null },
  sportsbooks: [],
  minOdds: null,
  maxOdds: null,
  minStake: null,
  maxStake: null,
  results: ['won', 'lost'],
  timeframe: '30d'
}

export function useAnalytics(user: User | null = null, isPro: boolean = false) {
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

  const fetchAnalytics = useCallback(async (forceFetch = false) => {
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
      fetchTimeoutRef.current = setTimeout(() => fetchAnalytics(true), 300)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching analytics for user:', user.id)

      const currentFilters = latestFiltersRef.current

      // Build query parameters - include userId like bet submission
      const params = new URLSearchParams({
        userId: user.id,
        timeframe: currentFilters.timeframe,
        ...(currentFilters.sports.length > 0 && { sport: currentFilters.sports.join(',') }),
        ...(currentFilters.betTypes.length > 0 && { bet_type: currentFilters.betTypes.join(',') }),
        ...(currentFilters.results.length > 0 && currentFilters.results.length < 5 && { status: currentFilters.results.join(',') }),
        ...(currentFilters.isParlay !== null && currentFilters.isParlay !== undefined && { is_parlay: currentFilters.isParlay.toString() }),
        ...(currentFilters.side && { side: currentFilters.side }),
        ...(currentFilters.oddsType && { odds_type: currentFilters.oddsType }),
        ...(currentFilters.minOdds !== null && currentFilters.minOdds !== undefined && { min_odds: currentFilters.minOdds.toString() }),
        ...(currentFilters.maxOdds !== null && currentFilters.maxOdds !== undefined && { max_odds: currentFilters.maxOdds.toString() }),
        ...(currentFilters.minStake !== null && currentFilters.minStake !== undefined && { min_stake: currentFilters.minStake.toString() }),
        ...(currentFilters.maxStake !== null && currentFilters.maxStake !== undefined && { max_stake: currentFilters.maxStake.toString() }),
        ...(currentFilters.dateRange.start && { start_date: currentFilters.dateRange.start }),
        ...(currentFilters.dateRange.end && { end_date: currentFilters.dateRange.end })
      })

      console.log('Making analytics API call with userId parameter:', user.id)
      const response = await fetch(`/api/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.log('Analytics API returned 401 - authentication failed')
          // Clear any invalid session data
          setAnalyticsData(null)
          setError('Authentication required. Please log in again.')
          setLoading(false)
          return
        }
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      console.log('Successfully fetched analytics:', result.data)
      
      // Transform API response to match our interface
      const data: AnalyticsData = {
        metrics: result.data.metrics,
        sportBreakdown: result.data.sportBreakdown || [],
        betTypeBreakdown: result.data.betTypeBreakdown || [],
        sideBreakdown: result.data.sideBreakdown || [],
        lineMovementData: result.data.lineMovementData || [],
        monthlyData: result.data.monthlyData || [],
        dailyProfitData: result.data.dailyProfitData || [],
        recentBets: result.data.recentBets || [],
        topPerformingSports: result.data.topPerformingSports || []
      }
      
      setAnalyticsData(data)
    } catch (err) {
      console.error('Error in fetchAnalytics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

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
      voidBetsCount: 0
    },
    sportBreakdown: [],
    betTypeBreakdown: [],
    sideBreakdown: [],
    lineMovementData: [],
    monthlyData: [],
    dailyProfitData: [],
    recentBets: [],
    topPerformingSports: []
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
    filteredBetsCount: analyticsData?.metrics.totalBets || 0
  }
}