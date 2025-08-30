// Enhanced Analytics API functions for TrueSharp
// Connects to the Postgres analytics functions

import { createClient } from '@/lib/supabase'

export interface AnalyticsFilters {
  leagues?: string[]
  bet_types?: string[]
  sportsbooks?: string[]
  player_names?: string[]
  odds_min?: number
  odds_max?: number
  stake_min?: number
  stake_max?: number
  date_from?: string
  date_to?: string
  is_parlay?: boolean
  prop_type?: string
  side?: string
}

export interface ROIOverTimeData {
  day: string
  net_profit: number
  stake: number
  roi_pct: number
  bets: number
}

export interface PerformanceByLeagueData {
  league: string
  bets: number
  stake: number
  net_profit: number
  roi_pct: number
}

export interface WinRateVsExpectedData {
  bucket_label: string
  bucket_start_pct: number
  bucket_end_pct: number
  bets: number
  expected_pct: number
  actual_pct: number
}

export interface MonthlyPerformanceData {
  month: string
  bets: number
  stake: number
  net_profit: number
  roi_pct: number
}

/**
 * Fetch ROI over time data using the analytics.roi_over_time RPC
 */
export async function fetchROIOverTime(
  userId: string,
  filters: AnalyticsFilters = {},
  timezone: string = 'UTC',
  fromDate?: string,
  toDate?: string
): Promise<ROIOverTimeData[]> {
  const supabase = createClient()
  
  try {
    console.log('🔍 Calling analytics.roi_over_time for user:', userId)
    const { data, error } = await supabase.rpc('analytics_roi_over_time', {
      p_user: userId,
      p_filters: JSON.stringify(filters),
      p_tz: timezone,
      p_from: fromDate,
      p_to: toDate
    })

    if (error) {
      console.warn('Analytics function roi_over_time not available:', error.message, error)
      return []
    }

    console.log('✅ ROI over time data received:', data?.length || 0, 'records')
    return data || []
  } catch (error) {
    console.warn('Error calling roi_over_time (function may not exist):', error)
    return []
  }
}

/**
 * Fetch performance by league data using the analytics.performance_by_league RPC
 */
export async function fetchPerformanceByLeague(
  userId: string,
  filters: AnalyticsFilters = {},
  timezone: string = 'UTC',
  fromDate?: string,
  toDate?: string
): Promise<PerformanceByLeagueData[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('analytics_performance_by_league', {
      p_user: userId,
      p_filters: JSON.stringify(filters),
      p_tz: timezone,
      p_from: fromDate,
      p_to: toDate
    })

    if (error) {
      console.warn('Analytics function performance_by_league not available:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Error calling performance_by_league (function may not exist):', error)
    return []
  }
}

/**
 * Fetch win rate vs expected data using the analytics.winrate_vs_expected RPC
 */
export async function fetchWinRateVsExpected(
  userId: string,
  filters: AnalyticsFilters = {},
  bins: number = 10,
  minBets: number = 5
): Promise<WinRateVsExpectedData[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('analytics_winrate_vs_expected', {
      p_user: userId,
      p_filters: JSON.stringify(filters),
      p_bins: bins,
      p_min_bets: minBets
    })

    if (error) {
      console.warn('Analytics function winrate_vs_expected not available:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Error calling winrate_vs_expected (function may not exist):', error)
    return []
  }
}

/**
 * Fetch monthly performance data using the analytics.monthly_performance RPC
 */
export async function fetchMonthlyPerformance(
  userId: string,
  filters: AnalyticsFilters = {},
  timezone: string = 'UTC',
  toDate?: string
): Promise<MonthlyPerformanceData[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('analytics_monthly_performance', {
      p_user: userId,
      p_filters: JSON.stringify(filters),
      p_tz: timezone,
      p_to: toDate
    })

    if (error) {
      console.warn('Analytics function monthly_performance not available:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Error calling monthly_performance (function may not exist):', error)
    return []
  }
}

/**
 * Fetch generic series data using the analytics.fetch_series RPC
 */
export async function fetchSeriesData(
  userId: string,
  filters: AnalyticsFilters = {},
  xDim: string = 'date:day',
  yMetric: string = 'roi',
  bucket: Record<string, any> = {},
  opts: Record<string, any> = {}
): Promise<any[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('analytics_fetch_series', {
      p_user: userId,
      p_filters: JSON.stringify(filters),
      p_x_dim: xDim,
      p_y_metric: yMetric,
      p_bucket: JSON.stringify(bucket),
      p_opts: JSON.stringify(opts)
    })

    if (error) {
      console.warn('Analytics function fetch_series not available:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Error calling fetch_series (function may not exist):', error)
    return []
  }
}

/**
 * Fetch all enhanced analytics data in one call
 */
export async function fetchEnhancedAnalytics(
  userId: string,
  filters: AnalyticsFilters = {},
  timezone: string = 'UTC'
): Promise<{
  roiOverTime: ROIOverTimeData[]
  performanceByLeague: PerformanceByLeagueData[]
  winRateVsExpected: WinRateVsExpectedData[]
  monthlyPerformance: MonthlyPerformanceData[]
}> {
  console.log('🔍 Fetching enhanced analytics for user:', userId, 'with filters:', filters)
  
  // Test basic RPC connectivity first
  try {
    const supabase = createClient()
    const { data: testData, error: testError } = await supabase.rpc('analytics_test_connection')
    if (testError) {
      console.error('🚨 RPC connectivity test failed:', testError)
    } else {
      console.log('✅ RPC connectivity test passed:', testData)
    }
  } catch (error) {
    console.error('🚨 RPC connectivity test exception:', error)
  }
  
  const [
    roiOverTime,
    performanceByLeague,
    winRateVsExpected,
    monthlyPerformance
  ] = await Promise.all([
    fetchROIOverTime(userId, filters, timezone),
    fetchPerformanceByLeague(userId, filters, timezone),
    fetchWinRateVsExpected(userId, filters),
    fetchMonthlyPerformance(userId, filters, timezone)
  ])

  console.log('📊 Enhanced analytics results:', {
    roiOverTime: roiOverTime.length,
    performanceByLeague: performanceByLeague.length,
    winRateVsExpected: winRateVsExpected.length,
    monthlyPerformance: monthlyPerformance.length
  })

  return {
    roiOverTime,
    performanceByLeague,
    winRateVsExpected,
    monthlyPerformance
  }
}

/**
 * Refresh materialized views (requires appropriate permissions)
 */
export async function refreshAnalyticsViews(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.rpc('refresh_all_views')
    
    if (error) {
      console.warn('Analytics function refresh_all_views not available:', error.message)
      return false
    }
    
    return true
  } catch (error) {
    console.warn('Error calling refresh_all_views (function may not exist):', error)
    return false
  }
}

/**
 * Helper function to convert American odds to implied probability
 */
export function americanToProb(odds: number): number {
  if (!odds) return 0
  if (odds > 0) {
    return 100 / (odds + 100)
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100)
  }
}

/**
 * Helper function to format currency
 */
export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00'
  }
  return `$${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
}

/**
 * Helper function to get color based on ROI performance
 */
export function getROIColor(roi: number): string {
  if (roi >= 5) return 'text-green-600'
  if (roi <= -5) return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Helper function to get background color based on ROI performance
 */
export function getROIBackgroundColor(roi: number): string {
  if (roi >= 5) return 'bg-green-500'
  if (roi <= -5) return 'bg-red-500'
  return 'bg-gray-400'
}

/**
 * Cache key generator for analytics data
 */
export function generateCacheKey(
  userId: string,
  functionName: string,
  filters: AnalyticsFilters,
  additionalParams?: Record<string, any>
): string {
  const filtersHash = btoa(JSON.stringify(filters)).slice(0, 8)
  const paramsHash = additionalParams ? btoa(JSON.stringify(additionalParams)).slice(0, 8) : ''
  return `analytics_${userId}_${functionName}_${filtersHash}_${paramsHash}`
}

/**
 * Default filter presets
 */
export const FILTER_PRESETS = {
  last_7_days: {
    date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    date_to: new Date().toISOString()
  },
  last_30_days: {
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    date_to: new Date().toISOString()
  },
  this_month: {
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    date_to: new Date().toISOString()
  },
  last_90_days: {
    date_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    date_to: new Date().toISOString()
  },
  year_to_date: {
    date_from: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    date_to: new Date().toISOString()
  }
}