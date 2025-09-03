// Custom Charts Analytics API functions for TrueSharp
// Dynamically builds Supabase queries based on user chart configuration

import { createClient } from '@/lib/supabase'
import type { ChartConfig, CustomChartData } from '@/lib/types/custom-charts'

/**
 * Fetch custom chart data based on user configuration
 */
export async function fetchCustomChartData(
  userId: string,
  config: ChartConfig
): Promise<CustomChartData[]> {
  const supabase = createClient()

  try {
    console.log('🔍 Fetching custom chart data for config:', config)

    // Build the base query
    let query = supabase.from('bets').select('*').eq('user_id', userId)

    // Apply filters
    if (config.filters.leagues && config.filters.leagues.length > 0) {
      query = query.in('league', config.filters.leagues)
    }

    if (config.filters.status && config.filters.status.length > 0) {
      query = query.in('status', config.filters.status)
    }

    if (config.filters.bet_types && config.filters.bet_types.length > 0) {
      query = query.in('bet_type', config.filters.bet_types)
    }

    if (config.filters.sportsbooks && config.filters.sportsbooks.length > 0) {
      query = query.in('sportsbook', config.filters.sportsbooks)
    }

    if (config.filters.date_range?.start) {
      query = query.gte('placed_at', config.filters.date_range.start.toISOString())
    }

    if (config.filters.date_range?.end) {
      query = query.lte('placed_at', config.filters.date_range.end.toISOString())
    }

    const { data: rawData, error } = await query

    if (error) {
      console.error('❌ Error fetching custom chart data:', error)
      return []
    }

    if (!rawData || rawData.length === 0) {
      console.log('📊 No data found for custom chart')
      return []
    }

    // Process data based on chart configuration
    const processedData = processChartData(rawData, config)
    console.log('✅ Custom chart data processed:', processedData.length, 'records')

    return processedData
  } catch (error) {
    console.error('🚨 Error in fetchCustomChartData:', error)
    return []
  }
}

/**
 * Process raw bet data based on chart configuration
 */
function processChartData(rawData: any[], config: ChartConfig): CustomChartData[] {
  const { xAxis, yAxis } = config

  // Group data by X-axis
  const grouped = groupDataByXAxis(rawData, xAxis)

  // Calculate Y-axis values for each group
  const processed = Object.entries(grouped).map(([key, bets]) => {
    const result: CustomChartData = {
      [xAxis]: formatXAxisValue(key, xAxis),
      raw_value: key, // Keep original value for sorting
    }

    // Calculate Y-axis value
    switch (yAxis) {
      case 'count':
        result[yAxis] = bets.length
        break

      case 'profit':
        result[yAxis] = calculateTotalProfit(bets)
        break

      case 'stake':
        result[yAxis] = calculateTotalStake(bets)
        break

      case 'win_rate':
        result[yAxis] = calculateWinRate(bets)
        break

      case 'roi':
        result[yAxis] = calculateROI(bets)
        break

      default:
        result[yAxis] = 0
    }

    return result
  })

  // Sort data appropriately
  return sortChartData(processed, xAxis)
}

/**
 * Group data by X-axis field
 */
function groupDataByXAxis(data: any[], xAxis: string): Record<string, any[]> {
  return data.reduce(
    (acc, bet) => {
      let key: string

      switch (xAxis) {
        case 'placed_at':
          // Group by date (YYYY-MM-DD)
          key = bet.placed_at
            ? (new Date(bet.placed_at).toISOString().split('T')[0] ?? 'Unknown')
            : 'Unknown'
          break

        case 'league':
          key = bet.league ?? 'Unknown'
          break

        case 'bet_type':
          key = bet.bet_type || 'Unknown'
          break

        case 'sportsbook':
          key = bet.sportsbook || 'Unknown'
          break

        default:
          key = 'Unknown'
      }

      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(bet)

      return acc
    },
    {} as Record<string, any[]>
  )
}

/**
 * Format X-axis value for display
 */
function formatXAxisValue(value: string, xAxis: string): string {
  switch (xAxis) {
    case 'placed_at':
      // Format date for display
      const date = new Date(value)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      })

    case 'bet_type':
      // Capitalize bet type
      return value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    default:
      return value
  }
}

/**
 * Sort chart data appropriately
 */
function sortChartData(data: CustomChartData[], xAxis: string): CustomChartData[] {
  switch (xAxis) {
    case 'placed_at':
      // Sort by date
      return data.sort((a, b) => new Date(a.raw_value).getTime() - new Date(b.raw_value).getTime())

    case 'league':
    case 'bet_type':
    case 'sportsbook':
      // Sort alphabetically
      return data.sort((a, b) => a[xAxis].localeCompare(b[xAxis]))

    default:
      return data
  }
}

/**
 * Calculate total profit from bets
 */
function calculateTotalProfit(bets: any[]): number {
  return bets.reduce((total, bet) => {
    // Use profit_loss first, then profit, then fallback calculation
    if (bet.profit_loss !== null && bet.profit_loss !== undefined) {
      return total + bet.profit_loss
    }

    if (bet.profit !== null && bet.profit !== undefined) {
      return total + bet.profit
    }

    // Fallback calculation based on status
    const status = bet.status || bet.result
    switch (status) {
      case 'won':
        return total + (bet.potential_payout - bet.stake)
      case 'lost':
        return total - bet.stake
      default:
        return total
    }
  }, 0)
}

/**
 * Calculate total stake from bets
 */
function calculateTotalStake(bets: any[]): number {
  return bets.reduce((total, bet) => total + (bet.stake || 0), 0)
}

/**
 * Calculate win rate from bets
 */
function calculateWinRate(bets: any[]): number {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status || bet.result))
  if (settledBets.length === 0) return 0

  const wonBets = settledBets.filter(bet => (bet.status || bet.result) === 'won').length
  return (wonBets / settledBets.length) * 100
}

/**
 * Calculate ROI from bets
 */
function calculateROI(bets: any[]): number {
  const totalStake = calculateTotalStake(bets)
  const totalProfit = calculateTotalProfit(bets)

  if (totalStake === 0) return 0
  return (totalProfit / totalStake) * 100
}

/**
 * Get available filter options from user's bets
 */
export async function getFilterOptions(userId: string): Promise<{
  leagues: string[]
  betTypes: string[]
  sportsbooks: string[]
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('bets')
      .select('league, bet_type, sportsbook')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error fetching filter options:', error)
      return { leagues: [], betTypes: [], sportsbooks: [] }
    }

    const leagues = [...new Set(data?.map(bet => bet.league).filter(Boolean))] as string[]
    const betTypes = [...new Set(data?.map(bet => bet.bet_type).filter(Boolean))] as string[]
    const sportsbooks = [...new Set(data?.map(bet => bet.sportsbook).filter(Boolean))] as string[]

    return {
      leagues: leagues.sort(),
      betTypes: betTypes.sort(),
      sportsbooks: sportsbooks.sort(),
    }
  } catch (error) {
    console.error('🚨 Error in getFilterOptions:', error)
    return { leagues: [], betTypes: [], sportsbooks: [] }
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
 * Helper function to format percentage
 */
export function formatPercentage(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%'
  }
  return `${value.toFixed(1)}%`
}

/**
 * Get color based on value type and amount
 */
export function getValueColor(
  value: number,
  type: 'profit' | 'roi' | 'win_rate' | 'count' | 'stake'
): string {
  switch (type) {
    case 'profit':
    case 'roi':
      if (value > 5) return '#059669' // green-600
      if (value < -5) return '#dc2626' // red-600
      return '#64748b' // slate-600

    case 'win_rate':
      if (value > 60) return '#059669'
      if (value < 40) return '#dc2626'
      return '#64748b'

    default:
      return '#3b82f6' // blue-600
  }
}
