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
    switch (yAxis as any) {
      case 'wins_count':
        result[yAxis] = bets.filter(bet => (bet.status || bet.result) === 'won').length
        break

      case 'losses_count':
        result[yAxis] = bets.filter(bet => (bet.status || bet.result) === 'lost').length
        break

      case 'win_rate':
        result[yAxis] = calculateWinRate(bets)
        break

      case 'profit':
        result[yAxis] = calculateTotalProfit(bets)
        break

      case 'roi':
        result[yAxis] = calculateROI(bets)
        break

      case 'total_staked':
        result[yAxis] = calculateTotalStake(bets)
        break

      case 'average_stake':
        result[yAxis] = calculateAverageStake(bets)
        break

      case 'average_odds':
        result[yAxis] = calculateAverageOdds(bets)
        break

      case 'median_odds':
        result[yAxis] = calculateMedianOdds(bets)
        break

      case 'void_count':
        result[yAxis] = bets.filter(bet => ['void', 'cancelled'].includes(bet.status || bet.result)).length
        break

      case 'longshot_hit_rate':
        result[yAxis] = calculateLongshotHitRate(bets)
        break

      case 'chalk_hit_rate':
        result[yAxis] = calculateChalkHitRate(bets)
        break

      case 'max_win':
        result[yAxis] = calculateMaxWin(bets)
        break

      case 'max_loss':
        result[yAxis] = calculateMaxLoss(bets)
        break

      case 'profit_variance':
        result[yAxis] = calculateProfitVariance(bets)
        break

      // Legacy support
      case 'count':
        result[yAxis] = bets.length
        break

      case 'stake':
        result[yAxis] = calculateTotalStake(bets)
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
        case 'sport':
          key = bet.sport || 'Unknown'
          break

        case 'league':
          key = bet.league || 'Unknown'
          break

        case 'sportsbook':
          key = bet.sportsbook || 'Unknown'
          break

        case 'bet_type':
          key = bet.bet_type || 'Unknown'
          break

        case 'side':
          key = bet.side || 'Unknown'
          break

        case 'prop_type':
          key = bet.prop_type || 'Unknown'
          break

        case 'player_name':
          key = bet.player_name || 'Unknown'
          break

        case 'home_team':
          key = bet.home_team || 'Unknown'
          break

        case 'away_team':
          key = bet.away_team || 'Unknown'
          break

        case 'game_date':
          // Group by game date (YYYY-MM-DD)
          key = bet.game_date
            ? (new Date(bet.game_date).toISOString().split('T')[0] ?? 'Unknown')
            : 'Unknown'
          break

        case 'placed_at_day_of_week':
          // Group by day of week (0=Sunday, 6=Saturday)
          if (bet.placed_at) {
            const dayOfWeek = new Date(bet.placed_at).getDay()
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            key = days[dayOfWeek] || 'Unknown'
          } else {
            key = 'Unknown'
          }
          break

        case 'placed_at_time_of_day':
          // Group by hour of day (0-23)
          if (bet.placed_at) {
            const hour = new Date(bet.placed_at).getHours()
            if (hour >= 6 && hour < 12) key = 'Morning (6AM-12PM)'
            else if (hour >= 12 && hour < 18) key = 'Afternoon (12PM-6PM)'
            else if (hour >= 18 && hour < 22) key = 'Evening (6PM-10PM)'
            else key = 'Late Night (10PM-6AM)'
          } else {
            key = 'Unknown'
          }
          break

        case 'stake_size_bucket':
          // Group by stake size buckets
          const stake = bet.stake || 0
          if (stake <= 25) key = 'Small (≤$25)'
          else if (stake <= 100) key = 'Medium ($25-$100)'
          else key = 'Large (>$100)'
          break

        case 'odds_range_bucket':
          // Group by odds ranges
          const odds = bet.odds || 0
          if (odds <= -150) key = 'Chalk (≤-150)'
          else if (odds >= -149 && odds <= 149) key = 'Even Money (-149 to +149)'
          else if (odds >= 150) key = 'Longshots (≥+150)'
          else key = 'Unknown'
          break

        case 'bet_source':
          // Group by manual vs copy bet
          key = bet.is_copy_bet || bet.bet_source === 'copy' ? 'Copy Bet' : 'Manual Bet'
          break

        case 'parlay_vs_straight':
          // Group by parlay vs straight bet
          key = bet.is_parlay || bet.bet_type === 'parlay' ? 'Parlay' : 'Straight'
          break

        // Legacy support
        case 'placed_at':
          // Group by date (YYYY-MM-DD)
          key = bet.placed_at
            ? (new Date(bet.placed_at).toISOString().split('T')[0] ?? 'Unknown')
            : 'Unknown'
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
 * Calculate average stake from bets
 */
function calculateAverageStake(bets: any[]): number {
  if (bets.length === 0) return 0
  const totalStake = calculateTotalStake(bets)
  return totalStake / bets.length
}

/**
 * Calculate average odds from bets
 */
function calculateAverageOdds(bets: any[]): number {
  if (bets.length === 0) return 0
  const validOdds = bets.filter(bet => bet.odds != null).map(bet => bet.odds)
  if (validOdds.length === 0) return 0
  return validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length
}

/**
 * Calculate median odds from bets
 */
function calculateMedianOdds(bets: any[]): number {
  const validOdds = bets.filter(bet => bet.odds != null).map(bet => bet.odds).sort((a, b) => a - b)
  if (validOdds.length === 0) return 0
  
  const mid = Math.floor(validOdds.length / 2)
  return validOdds.length % 2 === 0 
    ? (validOdds[mid - 1] + validOdds[mid]) / 2 
    : validOdds[mid]
}

/**
 * Calculate longshot hit rate (odds >= +200)
 */
function calculateLongshotHitRate(bets: any[]): number {
  const longshotBets = bets.filter(bet => bet.odds >= 200)
  if (longshotBets.length === 0) return 0
  
  const settledLongshots = longshotBets.filter(bet => ['won', 'lost'].includes(bet.status || bet.result))
  if (settledLongshots.length === 0) return 0
  
  const wonLongshots = settledLongshots.filter(bet => (bet.status || bet.result) === 'won').length
  return (wonLongshots / settledLongshots.length) * 100
}

/**
 * Calculate chalk hit rate (odds <= -150)
 */
function calculateChalkHitRate(bets: any[]): number {
  const chalkBets = bets.filter(bet => bet.odds <= -150)
  if (chalkBets.length === 0) return 0
  
  const settledChalk = chalkBets.filter(bet => ['won', 'lost'].includes(bet.status || bet.result))
  if (settledChalk.length === 0) return 0
  
  const wonChalk = settledChalk.filter(bet => (bet.status || bet.result) === 'won').length
  return (wonChalk / settledChalk.length) * 100
}

/**
 * Calculate maximum single bet win
 */
function calculateMaxWin(bets: any[]): number {
  const winningBets = bets.filter(bet => (bet.status || bet.result) === 'won')
  if (winningBets.length === 0) return 0
  
  return Math.max(...winningBets.map(bet => {
    if (bet.profit !== null && bet.profit !== undefined) return bet.profit
    return bet.potential_payout - bet.stake
  }))
}

/**
 * Calculate maximum single bet loss
 */
function calculateMaxLoss(bets: any[]): number {
  const losingBets = bets.filter(bet => (bet.status || bet.result) === 'lost')
  if (losingBets.length === 0) return 0
  
  return Math.max(...losingBets.map(bet => bet.stake || 0))
}

/**
 * Calculate profit variance (volatility measure)
 */
function calculateProfitVariance(bets: any[]): number {
  if (bets.length === 0) return 0
  
  const profits = bets.map(bet => {
    if (bet.profit !== null && bet.profit !== undefined) return bet.profit
    
    const status = bet.status || bet.result
    switch (status) {
      case 'won':
        return bet.potential_payout - bet.stake
      case 'lost':
        return -bet.stake
      default:
        return 0
    }
  })
  
  const mean = profits.reduce((sum, profit) => sum + profit, 0) / profits.length
  const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - mean, 2), 0) / profits.length
  
  return Math.sqrt(variance) // Return standard deviation
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
