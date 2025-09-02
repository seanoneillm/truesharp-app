// FILE: src/lib/hooks/use-analytics.ts (Final fixed version)
import { createBrowserClient } from '@/lib/auth/supabase'
import type { User } from '@supabase/auth-helpers-nextjs'
import { useEffect, useMemo, useState } from 'react'

// Keep all your existing interfaces exactly the same
export interface Bet {
  id: string
  user_id: string
  sport: string
  league: string
  bet_type: 'spread' | 'moneyline' | 'total' | 'prop' | 'futures' | 'parlay'
  description: string
  odds: number
  stake: number
  potential_payout: number
  actual_payout: number | null
  profit_loss: number | null
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
  placed_at: string
  game_date: string
  sportsbook: string
  clv: number | null
  created_at: string
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
  profitableSports: number
  variance: number
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics
  sportBreakdown: SportBreakdown[]
  betTypeBreakdown: BetTypeBreakdown[]
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
  timeframe: '30d',
}

export function useAnalytics(user: User | null = null, isPro: boolean = false) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters)

  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchBets() {
      if (!user) {
        console.log('No user provided to fetchBets')
        setLoading(false)
        setBets([])
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('Fetching bets for user:', user.id)

        // Test authentication first
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          throw new Error('Authentication failed')
        }

        console.log('Authentication confirmed for user:', currentUser.id)

        // Fetch bets with proper Supabase syntax
        const { data, error: fetchError } = await supabase
          .from('bets')
          .select(
            `
            id,
            user_id,
            sport,
            league,
            bet_type,
            description,
            odds,
            stake,
            potential_payout,
            actual_payout,
            profit_loss,
            status,
            placed_at,
            game_date,
            sportsbook,
            clv,
            created_at
          `
          )
          .eq('user_id', user.id)
          .order('placed_at', { ascending: false })

        if (fetchError) {
          console.error('Fetch error details:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code,
          })
          throw new Error(`Database error: ${fetchError.message}`)
        }

        console.log('Successfully fetched', data?.length || 0, 'bets')

        // Log a sample bet to check data structure
        if (data && data.length > 0) {
          console.log('Sample bet data:', data[0])
        }

        setBets(data || [])
      } catch (err) {
        console.error('Error in fetchBets:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBets()
  }, [user?.id, supabase])

  // Apply filters to bets
  const filteredBets = useMemo(() => {
    if (!bets.length) return []

    let filtered = bets

    // Apply timeframe filter
    if (filters.timeframe && filters.timeframe !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filters.timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          if (!isPro) return []
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'ytd':
          if (!isPro) return []
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(bet => new Date(bet.placed_at) >= startDate)
    }

    // Apply other filters
    return filtered.filter(bet => {
      if (filters.sports.length > 0 && !filters.sports.includes(bet.sport)) {
        return false
      }

      if (filters.betTypes.length > 0 && !filters.betTypes.includes(bet.bet_type)) {
        return false
      }

      if (filters.dateRange.start && new Date(bet.placed_at) < new Date(filters.dateRange.start)) {
        return false
      }
      if (filters.dateRange.end && new Date(bet.placed_at) > new Date(filters.dateRange.end)) {
        return false
      }

      if (filters.sportsbooks.length > 0 && !filters.sportsbooks.includes(bet.sportsbook)) {
        return false
      }

      if (filters.minOdds !== null && bet.odds < filters.minOdds) {
        return false
      }
      if (filters.maxOdds !== null && bet.odds > filters.maxOdds) {
        return false
      }

      if (filters.minStake !== null && bet.stake < filters.minStake) {
        return false
      }
      if (filters.maxStake !== null && bet.stake > filters.maxStake) {
        return false
      }

      if (filters.results.length > 0 && !filters.results.includes(bet.status)) {
        return false
      }

      return true
    })
  }, [bets, filters, isPro])

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    console.log('Calculating analytics for', filteredBets.length, 'filtered bets')

    if (!filteredBets.length) {
      return {
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
          profitableSports: 0,
          variance: 0,
        },
        sportBreakdown: [],
        betTypeBreakdown: [],
        monthlyData: [],
        dailyProfitData: [],
        recentBets: [],
        topPerformingSports: [],
      }
    }

    const settledBets = filteredBets.filter(bet => bet.status === 'won' || bet.status === 'lost')
    const wonBets = settledBets.filter(bet => bet.status === 'won')

    console.log('Settled bets:', settledBets.length, 'Won bets:', wonBets.length)

    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0)
    const totalProfit = settledBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0)

    const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

    const avgOdds =
      settledBets.length > 0
        ? settledBets.reduce((sum, bet) => sum + bet.odds, 0) / settledBets.length
        : 0
    const avgStake = settledBets.length > 0 ? totalStaked / settledBets.length : 0

    // Calculate biggest win/loss
    const profits = settledBets.map(bet => bet.profit_loss || 0)
    const biggestWin = Math.max(...profits, 0)
    const biggestLoss = Math.abs(Math.min(...profits, 0))

    // Calculate current streak
    let currentStreak = 0
    let streakType: 'win' | 'loss' | 'none' = 'none'

    if (settledBets.length > 0) {
      const sortedBets = [...settledBets].sort(
        (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
      )
      const latestResult = sortedBets[0]?.status
      if (latestResult) {
        streakType = latestResult === 'won' ? 'win' : 'loss'

        for (const bet of sortedBets) {
          if (bet.status === latestResult) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // Calculate average CLV
    const avgClv =
      isPro && settledBets.length > 0
        ? settledBets
            .filter(bet => bet.clv !== null)
            .reduce((sum, bet) => sum + (bet.clv || 0), 0) /
            settledBets.filter(bet => bet.clv !== null).length || null
        : null

    // Calculate variance
    const avgProfit = settledBets.length > 0 ? totalProfit / settledBets.length : 0
    const variance =
      settledBets.length > 0
        ? settledBets.reduce(
            (sum, bet) => sum + Math.pow((bet.profit_loss || 0) - avgProfit, 2),
            0
          ) / settledBets.length
        : 0

    // Sport breakdown
    const sportStats = new Map<
      string,
      {
        bets: Bet[]
        profit: number
        staked: number
      }
    >()

    settledBets.forEach(bet => {
      if (!sportStats.has(bet.sport)) {
        sportStats.set(bet.sport, { bets: [], profit: 0, staked: 0 })
      }
      const stats = sportStats.get(bet.sport)!
      stats.bets.push(bet)
      stats.profit += bet.profit_loss || 0
      stats.staked += bet.stake
    })

    const sportBreakdown: SportBreakdown[] = Array.from(sportStats.entries())
      .map(([sport, stats]) => {
        const wonCount = stats.bets.filter(bet => bet.status === 'won').length
        const winRate = stats.bets.length > 0 ? (wonCount / stats.bets.length) * 100 : 0
        const roi = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0
        const avgOdds =
          stats.bets.length > 0
            ? stats.bets.reduce((sum, bet) => sum + bet.odds, 0) / stats.bets.length
            : 0

        return {
          sport,
          bets: stats.bets.length,
          winRate,
          profit: stats.profit,
          roi,
          avgOdds,
          totalStaked: stats.staked,
          clv: isPro
            ? stats.bets
                .filter(bet => bet.clv !== null)
                .reduce((sum, bet) => sum + (bet.clv || 0), 0) /
                stats.bets.filter(bet => bet.clv !== null).length || undefined
            : undefined,
        }
      })
      .sort((a, b) => b.profit - a.profit)

    // Create simple daily profit data
    const dailyStats = new Map<string, number>()
    settledBets.forEach(bet => {
      const date = bet.placed_at?.split('T')[0] // Get just the date part
      if (date) {
        dailyStats.set(date, (dailyStats.get(date) || 0) + (bet.profit_loss || 0))
      }
    })

    let cumulativeProfit = 0
    const dailyProfitData: DailyProfitData[] = Array.from(dailyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, profit]) => {
        cumulativeProfit += profit
        const dayBets = settledBets.filter(bet => bet.placed_at.startsWith(date)).length
        return {
          date,
          profit,
          cumulativeProfit,
          bets: dayBets,
        }
      })

    console.log('Analytics calculated:', { totalStaked, totalProfit, winRate, roi })

    return {
      metrics: {
        totalBets: filteredBets.length,
        winRate,
        roi,
        totalProfit,
        totalStaked,
        avgOdds,
        avgStake,
        biggestWin,
        biggestLoss,
        currentStreak,
        streakType,
        avgClv,
        profitableSports: sportBreakdown.filter(sport => sport.profit > 0).length,
        variance,
      },
      sportBreakdown,
      betTypeBreakdown: [],
      monthlyData: [],
      dailyProfitData,
      recentBets: filteredBets.slice(0, isPro ? 50 : 10),
      topPerformingSports: sportBreakdown
        .filter(sport => sport.bets >= 5)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, isPro ? 10 : 3),
    }
  }, [filteredBets, isPro])

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return {
    analyticsData,
    isLoading: loading,
    error,
    filters,
    updateFilters,
    totalBets: bets.length,
    filteredBetsCount: filteredBets.length,
  }
}
