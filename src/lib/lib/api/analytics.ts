import type { PerformanceMetrics } from '@/lib/types'
import { authenticatedRequest, supabaseDirect as supabase } from './client'

// Define BetFilters interface for analytics
interface BetFilters {
  sports?: string[]
  betTypes?: string[]
  status?: string[]
  sportsbooks?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  stakes?: {
    min?: number
    max?: number
  }
  odds?: {
    min?: number
    max?: number
  }
}

// Additional analytics data interface
// (Removed unused AnalyticsData interface)

// Get comprehensive performance metrics
export async function getPerformanceMetrics(filters: BetFilters = {}) {
  return authenticatedRequest(async userId => {
    let query = supabase.from('bets').select('*').eq('user_id', userId)

    // Apply filters
    if (filters.sports?.length) {
      query = query.in('sport', filters.sports)
    }

    if (filters.betTypes?.length) {
      query = query.in('bet_type', filters.betTypes)
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    const { data: bets, error } = await query

    if (error) {
      return { data: null, error }
    }

    // Calculate comprehensive metrics
    const metrics = calculatePerformanceMetrics(bets)

    return { data: metrics, error: null }
  })
}

// Calculate performance metrics from bet data
function calculatePerformanceMetrics(bets: any[]): PerformanceMetrics {
  const totalBets = bets.length
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))
  const wonBets = bets.filter(bet => bet.status === 'won')

  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0

  const totalStaked = bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
  const totalReturned = wonBets.reduce((sum, bet) => sum + (bet.actual_payout || 0), 0)
  const profit = totalReturned - totalStaked
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0

  const avgBetSize = totalBets > 0 ? totalStaked / totalBets : 0

  // Calculate variance
  const returns = settledBets.map(bet => {
    if (bet.status === 'won') {
      return ((bet.actual_payout || 0) - bet.stake) / bet.stake
    } else {
      return -1 // Lost 100% of stake
    }
  })

  const avgReturn =
    returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0
  const variance =
    returns.length > 0
      ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
      : 0

  // Calculate streaks
  const streaks = calculateStreaks(settledBets)

  return {
    totalBets,
    winRate,
    roi,
    profit,
    avgBetSize,
    variance,
    streaks,
  }
}

// Calculate win/loss streaks
function calculateStreaks(bets: any[]) {
  const sortedBets = bets.sort(
    (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
  )

  let currentStreakCount = 0
  let currentStreakType: 'win' | 'loss' = 'win'
  let longestWinStreak = 0
  let longestLossStreak = 0

  if (sortedBets.length > 0) {
    currentStreakType = sortedBets[0].status === 'won' ? 'win' : 'loss'

    // Calculate current streak
    for (const bet of sortedBets) {
      if (
        (currentStreakType === 'win' && bet.status === 'won') ||
        (currentStreakType === 'loss' && bet.status === 'lost')
      ) {
        currentStreakCount++
      } else {
        break
      }
    }

    // Calculate longest streaks
    let tempWinStreak = 0
    let tempLossStreak = 0

    for (const bet of sortedBets) {
      if (bet.status === 'won') {
        tempWinStreak++
        longestLossStreak = Math.max(longestLossStreak, tempLossStreak)
        tempLossStreak = 0
      } else {
        tempLossStreak++
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak)
        tempWinStreak = 0
      }
    }

    longestWinStreak = Math.max(longestWinStreak, tempWinStreak)
    longestLossStreak = Math.max(longestLossStreak, tempLossStreak)
  } else {
    // If there are no bets, set type to 'win' and count to 0 to satisfy type
    currentStreakType = 'win'
    currentStreakCount = 0
  }

  // Determine which streak is longer and set the type accordingly
  let longest: { type: 'win' | 'loss'; count: number }
  if (longestWinStreak >= longestLossStreak) {
    longest = { type: 'win', count: longestWinStreak }
  } else {
    longest = { type: 'loss', count: longestLossStreak }
  }

  return {
    current: { type: currentStreakType, count: currentStreakCount },
    longest,
  }
}

// Get sport-specific performance breakdown
export async function getSportBreakdown(filters: BetFilters = {}) {
  return authenticatedRequest(async userId => {
    let query = supabase
      .from('bets')
      .select('sport, stake, actual_payout, status, placed_at')
      .eq('user_id', userId)

    // Apply date filters
    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    const { data: bets, error } = await query

    if (error) {
      return { data: null, error }
    }

    // Group by sport and calculate metrics
    const sportGroups = bets.reduce(
      (groups: Record<string, any[]>, bet: any) => {
        const sport = bet.sport || 'Unknown'
        if (!groups[sport]) {
          groups[sport] = []
        }
        groups[sport].push(bet)
        return groups
      },
      {} as Record<string, any[]>
    )

    const breakdown = Object.entries(sportGroups).map(([sport, sportBets]) => {
      const metrics = calculatePerformanceMetrics(sportBets as any[])
      return {
        sport,
        ...metrics,
      }
    })

    return { data: breakdown, error: null }
  })
}

// Get bet type performance breakdown
export async function getBetTypeBreakdown(filters: BetFilters = {}) {
  return authenticatedRequest(async userId => {
    let query = supabase
      .from('bets')
      .select('bet_type, stake, actual_payout, status, placed_at')
      .eq('user_id', userId)

    // Apply filters
    if (filters.sports?.length) {
      query = query.in('sport', filters.sports)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    const { data: bets, error } = await query

    if (error) {
      return { data: null, error }
    }

    // Group by bet type and calculate metrics
    const betTypeGroups = bets.reduce(
      (groups: Record<string, any[]>, bet: any) => {
        const betType = bet.bet_type || 'Unknown'
        if (!groups[betType]) {
          groups[betType] = []
        }
        groups[betType].push(bet)
        return groups
      },
      {} as Record<string, any[]>
    )

    const breakdown = Object.entries(betTypeGroups).map(([betType, typeBets]) => {
      const metrics = calculatePerformanceMetrics(typeBets as any[])
      return {
        betType,
        ...metrics,
      }
    })

    return { data: breakdown, error: null }
  })
}

// Get profit over time data for charts
export async function getProfitOverTime(
  filters: BetFilters = {},
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  return authenticatedRequest(async userId => {
    let query = supabase
      .from('bets')
      .select('stake, actual_payout, status, placed_at, settled_at')
      .eq('user_id', userId)
      .in('status', ['won', 'lost'])

    // Apply filters
    if (filters.sports?.length) {
      query = query.in('sport', filters.sports)
    }

    if (filters.betTypes?.length) {
      query = query.in('bet_type', filters.betTypes)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    const { data: bets, error } = await query.order('placed_at', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    // Calculate cumulative profit over time
    let cumulativeProfit = 0
    const profitData = []

    // Group bets by interval
    const groupedBets = groupBetsByInterval(bets, interval)

    for (const [date, dateBets] of Object.entries(groupedBets)) {
      const betsArray = dateBets as any[]
      const dayProfit = betsArray.reduce((sum, bet) => {
        const betProfit = bet.status === 'won' ? (bet.actual_payout || 0) - bet.stake : -bet.stake
        return sum + betProfit
      }, 0)

      cumulativeProfit += dayProfit

      profitData.push({
        date,
        profit: dayProfit,
        cumulativeProfit,
        bets: betsArray.length,
      })
    }

    return { data: profitData, error: null }
  })
}

// Group bets by time interval
function groupBetsByInterval(bets: any[], interval: 'daily' | 'weekly' | 'monthly') {
  return bets.reduce(
    (groups, bet) => {
      const date = new Date(bet.placed_at)
      let key: string

      switch (interval) {
        case 'daily':
          key = date.toISOString().split('T')[0] ?? ''
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0] ?? ''
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0] ?? ''
      }

      if (!groups[key]) {
        groups[key] = []
      }
      ;(groups[key] ?? []).push(bet)
      return groups
    },
    {} as Record<string, any[]>
  )
}

// Get advanced analytics (Pro feature)
export async function getAdvancedAnalytics(filters: BetFilters = {}) {
  return authenticatedRequest(async userId => {
    // Check if user has Pro subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('plan_type', 'pro')
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return {
        data: null,
        error: 'Pro subscription required for advanced analytics',
      }
    }

    // Get comprehensive bet data
    let query = supabase.from('bets').select('*').eq('user_id', userId)

    // Apply filters
    if (filters.sports?.length) {
      query = query.in('sport', filters.sports)
    }

    if (filters.betTypes?.length) {
      query = query.in('bet_type', filters.betTypes)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    const { data: bets, error } = await query

    if (error) {
      return { data: null, error }
    }

    // Calculate advanced metrics
    const analytics = {
      performance: calculatePerformanceMetrics(bets),
      sportBreakdown: calculateSportBreakdown(bets),
      betTypeBreakdown: calculateBetTypeBreakdown(bets),
      profitDistribution: calculateProfitDistribution(bets),
      timeAnalysis: calculateTimeAnalysis(bets),
      streakAnalysis: calculateStreakAnalysis(bets),
      riskMetrics: calculateRiskMetrics(bets),
    }

    return { data: analytics, error: null }
  })
}

// Helper functions for advanced analytics
function calculateSportBreakdown(bets: any[]) {
  const sportGroups = bets.reduce(
    (groups, bet) => {
      const sport = bet.sport || 'Unknown'
      if (!groups[sport]) groups[sport] = []
      groups[sport].push(bet)
      return groups
    },
    {} as Record<string, any[]>
  )

  return Object.entries(sportGroups).map(([sport, sportBets]) => ({
    sport,
    ...calculatePerformanceMetrics(sportBets as any[]),
  }))
}

function calculateBetTypeBreakdown(bets: any[]) {
  const betTypeGroups = bets.reduce(
    (groups, bet) => {
      const betType = bet.bet_type || 'Unknown'
      if (!groups[betType]) groups[betType] = []
      groups[betType].push(bet)
      return groups
    },
    {} as Record<string, any[]>
  )

  return Object.entries(betTypeGroups).map(([betType, typeBets]) => ({
    betType,
    ...calculatePerformanceMetrics(typeBets as any[]),
  }))
}

function calculateProfitDistribution(bets: any[]) {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))
  const profits = settledBets.map(bet => {
    return bet.status === 'won' ? (bet.actual_payout || 0) - bet.stake : -bet.stake
  })

  const sorted = profits.sort((a, b) => a - b)
  const length = sorted.length

  return {
    min: length > 0 ? sorted[0] : 0,
    max: length > 0 ? sorted[length - 1] : 0,
    median: length > 0 ? sorted[Math.floor(length / 2)] : 0,
    q1: length > 0 ? sorted[Math.floor(length * 0.25)] : 0,
    q3: length > 0 ? sorted[Math.floor(length * 0.75)] : 0,
  }
}

function calculateTimeAnalysis(bets: any[]) {
  const dayOfWeek = new Array(7).fill(0).map(() => ({ bets: 0, profit: 0 }))
  const hourOfDay = new Array(24).fill(0).map(() => ({ bets: 0, profit: 0 }))

  bets.forEach(bet => {
    const date = new Date(bet.placed_at)
    const day = date.getDay()
    const hour = date.getHours()
    const profit =
      bet.status === 'won'
        ? (bet.actual_payout || 0) - bet.stake
        : bet.status === 'lost'
          ? -bet.stake
          : 0

    if (dayOfWeek[day]) {
      dayOfWeek[day].bets++
      dayOfWeek[day].profit += profit
    }

    if (hourOfDay[hour]) {
      hourOfDay[hour].bets++
      hourOfDay[hour].profit += profit
    }
  })

  return { dayOfWeek, hourOfDay }
}

function calculateStreakAnalysis(bets: any[]) {
  const settledBets = bets
    .filter(bet => ['won', 'lost'].includes(bet.status))
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

  const streaks: { type: boolean | null; count: number; startDate: any; endDate: any }[] = []
  let currentStreak: { type: boolean | null; count: number; startDate: any; endDate: any } = {
    type: null,
    count: 0,
    startDate: null,
    endDate: null,
  }

  settledBets.forEach(bet => {
    const isWin = bet.status === 'won'

    if (currentStreak.type === null || currentStreak.type === isWin) {
      if (currentStreak.type === null) {
        currentStreak.startDate = bet.placed_at
      }
      currentStreak.type = isWin
      currentStreak.count++
      currentStreak.endDate = bet.placed_at
    } else {
      streaks.push({ ...currentStreak })
      currentStreak = {
        type: isWin,
        count: 1,
        startDate: bet.placed_at,
        endDate: bet.placed_at,
      }
    }
  })

  if (currentStreak.count > 0) {
    streaks.push(currentStreak)
  }

  return streaks
}

function calculateRiskMetrics(bets: any[]) {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))
  const stakes = settledBets.map(bet => bet.stake)
  const returns = settledBets.map(bet => {
    return bet.status === 'won' ? (bet.actual_payout || 0) - bet.stake : -bet.stake
  })

  const avgStake =
    stakes.length > 0 ? stakes.reduce((sum, stake) => sum + stake, 0) / stakes.length : 0
  // const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0 // unused
  // const stakeVariance = stakes.length > 0 ?
  //   stakes.reduce((sum, stake) => sum + Math.pow(stake - avgStake, 2), 0) / stakes.length : 0 // unused
  const returnVariance =
    returns.length > 0
      ? returns.reduce(
          (sum, ret) =>
            sum +
            Math.pow(
              ret - (returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0),
              2
            ),
          0
        ) / returns.length
      : 0

  return {
    avgStake,
    // avgReturn, // removed unused
    // stakeVariance, // removed unused
    returnVariance,
    standardDeviation: Math.sqrt(returnVariance),
    sharpeRatio:
      returnVariance > 0
        ? (returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0) /
          Math.sqrt(returnVariance)
        : 0,
  }
}
