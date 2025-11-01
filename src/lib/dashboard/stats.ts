import { createBrowserClient } from '@/lib/auth/supabase'

export interface DashboardStats {
  totalBets: number
  totalWins: number
  totalLosses: number
  winRate: number
  totalProfit: number
  roi: number
  avgBetSize: number
  todaysBets: number
  activePicks: number
}

export interface BetData {
  id: string
  sport: string
  description: string
  odds: number
  stake: number
  profit?: number
  status: 'pending' | 'won' | 'lost' | 'void'
  placed_at: string
  teams?: {
    home: string
    away: string
  }
}

export async function calculateDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = createBrowserClient()

  try {
    // Fetch all user bets
    const { data: bets, error } = await supabase.from('bets').select('*').eq('user_id', userId)

    if (error) {
      console.error('Error fetching bets for stats:', error)
      return getEmptyStats()
    }

    if (!bets || bets.length === 0) {
      return getEmptyStats()
    }

    // Type assertion for bets array to ensure TypeScript knows the structure
    const typedBets = bets as Array<{
      id: string
      user_id: string
      sport: string
      league: string
      status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
      stake: number
      profit?: number
      placed_at: string
    }>

    // Calculate basic stats
    const totalBets = typedBets.length
    const settledBets = typedBets.filter(bet => bet.status === 'won' || bet.status === 'lost')
    const wonBets = typedBets.filter(bet => bet.status === 'won')
    const lostBets = typedBets.filter(bet => bet.status === 'lost')

    const totalWins = wonBets.length
    const totalLosses = lostBets.length
    const winRate = settledBets.length > 0 ? (totalWins / settledBets.length) * 100 : 0

    // Calculate profit/loss
    const { totalProfit, totalStaked } = typedBets.reduce(
      (acc, bet) => {
        acc.totalStaked += bet.stake || 0

        if (bet.status === 'won' && bet.profit) {
          acc.totalProfit += bet.profit
        } else if (bet.status === 'lost') {
          acc.totalProfit -= bet.stake || 0
        }
        
        return acc
      },
      { totalProfit: 0, totalStaked: 0 }
    )

    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStaked / totalBets : 0

    // Calculate today's bets
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const todaysBets = typedBets.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= startOfDay && betDate < endOfDay
    }).length

    // Count pending bets as active picks
    const activePicks = typedBets.filter(bet => bet.status === 'pending').length

    return {
      totalBets,
      totalWins,
      totalLosses,
      winRate,
      totalProfit,
      roi,
      avgBetSize,
      todaysBets,
      activePicks,
    }
  } catch (error) {
    console.error('Error calculating dashboard stats:', error)
    return getEmptyStats()
  }
}

export async function getTodaysBets(userId: string): Promise<BetData[]> {
  const supabase = createBrowserClient()

  try {
    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .gte('placed_at', startOfDay.toISOString())
      .lt('placed_at', endOfDay.toISOString())
      .order('placed_at', { ascending: false })

    if (error) {
      console.error("Error fetching today's bets:", error)
      return []
    }

    return bets || []
  } catch (error) {
    console.error("Error getting today's bets:", error)
    return []
  }
}

export async function getRecentBets(userId: string, limit: number = 10): Promise<BetData[]> {
  const supabase = createBrowserClient()

  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent bets:', error)
      return []
    }

    return bets || []
  } catch (error) {
    console.error('Error getting recent bets:', error)
    return []
  }
}

function getEmptyStats(): DashboardStats {
  return {
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalProfit: 0,
    roi: 0,
    avgBetSize: 0,
    todaysBets: 0,
    activePicks: 0,
  }
}
