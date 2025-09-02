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

    // Calculate basic stats
    const totalBets = bets.length
    const settledBets = bets.filter(bet => bet.status === 'won' || bet.status === 'lost')
    const wonBets = bets.filter(bet => bet.status === 'won')
    const lostBets = bets.filter(bet => bet.status === 'lost')

    const totalWins = wonBets.length
    const totalLosses = lostBets.length
    const winRate = settledBets.length > 0 ? (totalWins / settledBets.length) * 100 : 0

    // Calculate profit/loss
    let totalProfit = 0
    let totalStaked = 0

    bets.forEach(bet => {
      totalStaked += bet.stake

      if (bet.status === 'won' && bet.profit) {
        totalProfit += bet.profit
      } else if (bet.status === 'lost') {
        totalProfit -= bet.stake
      }
    })

    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStaked / totalBets : 0

    // Calculate today's bets
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const todaysBets = bets.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= startOfDay && betDate < endOfDay
    }).length

    // Count pending bets as active picks
    const activePicks = bets.filter(bet => bet.status === 'pending').length

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
