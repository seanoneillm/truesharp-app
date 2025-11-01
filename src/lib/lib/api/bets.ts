import type { Bet, BetForm } from '@/lib/types'
import { authenticatedRequest, paginatedRequest, supabaseDirect } from './client'

// Database bet type for internal use - will be used later
// interface DbBet {
//   id: string
//   user_id: string
//   sport: string
//   league: string
//   bet_type: 'spread' | 'moneyline' | 'total' | 'prop'
//   description: string
//   odds: number
//   stake: number
//   potential_payout: number
//   actual_payout: number | null
//   status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
//   placed_at: string
//   settled_at: string | null
//   game_date: string
//   teams: { home: string; away: string }
//   is_public: boolean
//   external_bet_id: string
//   sportsbook_id: string
//   created_at: string
// }

// Helper function to wrap Supabase queries for paginatedRequest  
async function wrapSupabaseQuery(query: any, params: any) {
  const { data, error, count } = await query.range(
    (params.page! - 1) * params.limit!,
    params.page! * params.limit! - 1
  )
  
  if (error) throw error
  
  return {
    data: data || [],
    pagination: {
      page: params.page!,
      limit: params.limit!,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / params.limit!),
      hasNext: (count || 0) > params.page! * params.limit!,
      hasPrev: params.page! > 1,
    },
    success: true,
  }
}

// Define BetFilters based on your FilterOptions type
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

// Get user's bets with filtering and pagination
export async function getUserBets(filters: BetFilters = {}, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async userId => {
    let query = supabaseDirect
      .from('bets')
      .select(
        `
        *,
        sportsbook:sportsbook_connections(name, logo)
      `
      )
      .eq('user_id', userId)

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

    if (filters.sportsbooks?.length) {
      query = query.in('sportsbook_id', filters.sportsbooks)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    if (filters.stakes?.min) {
      query = query.gte('stake', filters.stakes.min)
    }

    if (filters.stakes?.max) {
      query = query.lte('stake', filters.stakes.max)
    }

    if (filters.odds?.min) {
      query = query.gte('odds', filters.odds.min)
    }

    if (filters.odds?.max) {
      query = query.lte('odds', filters.odds.max)
    }

    const paginated = await paginatedRequest((params) => wrapSupabaseQuery(query, params), options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get bet by ID
export async function getBetById(betId: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('bets')
      .select(
        `
        *,
        sportsbook:sportsbook_connections(name, logo)
      `
      )
      .eq('id', betId)
      .eq('user_id', userId)
      .single()
  })
}

// Create manual bet entry
export async function createManualBet(betData: BetForm) {
  return authenticatedRequest(async userId => {
    const bet = {
      user_id: userId,
      sport: betData.sport,
      league: betData.league,
      bet_type: betData.betType as 'spread' | 'moneyline' | 'total' | 'prop',
      description: betData.description,
      odds: betData.odds,
      stake: betData.stake,
      potential_payout:
        betData.stake *
        (betData.odds > 0 ? betData.odds / 100 + 1 : 100 / Math.abs(betData.odds) + 1),
      actual_payout: null,
      status: 'pending' as const,
      placed_at: new Date().toISOString(),
      settled_at: null,
      game_date: betData.gameDate.toISOString(),
      teams: betData.teams,
      is_public: betData.isPublic || false,
      external_bet_id: `manual_${Date.now()}`,
      sportsbook_id: 'manual', // For manual entries
    }

    return await supabaseDirect.from('bets').insert(bet).select().single()
  })
}

// Update bet
export async function updateBet(betId: string, updates: Partial<Bet>) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('bets')
      .update(updates)
      .eq('id', betId)
      .eq('user_id', userId)
      .select()
      .single()
  })
}

// Delete bet (only for manual entries)
export async function deleteBet(betId: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('bets')
      .delete()
      .eq('id', betId)
      .eq('user_id', userId)
      .like('external_bet_id', 'manual_%') // Only allow deletion of manual bets
  })
}

// Settle bet (manual result entry)
export async function settleBet(
  betId: string,
  result: 'won' | 'lost' | 'void' | 'cancelled',
  actualPayout?: number
) {
  return authenticatedRequest(async userId => {
    const updates: any = {
      status: result,
      settled_at: new Date().toISOString(),
    }

    if (actualPayout !== undefined) {
      updates.actual_payout = actualPayout
    } else if (result === 'won') {
      // Calculate payout based on odds if not provided
      const { data: bet } = await supabaseDirect
        .from('bets')
        .select('stake, odds')
        .eq('id', betId)
        .eq('user_id', userId)
        .single()

      if (bet) {
        const { stake, odds } = bet
        updates.actual_payout = stake * (odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1)
      }
    } else {
      updates.actual_payout = 0
    }

    return await supabaseDirect
      .from('bets')
      .update(updates)
      .eq('id', betId)
      .eq('user_id', userId)
      .select()
      .single()
  })
}

// Get user's bet summary statistics
export async function getUserBetStats(userId: string, filters: BetFilters = {}) {
  return authenticatedRequest(async () => {
    // This would typically call a database function for complex aggregations
    // For now, we'll do basic client-side calculations
    let query = supabaseDirect
      .from('bets')
      .select('stake, actual_payout, status, sport, bet_type, placed_at')
      .eq('user_id', userId)

    // Apply same filters as getUserBets
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

    // Calculate statistics
    const totalBets = bets.length
    const wonBets = bets.filter((bet: any) => bet.status === 'won').length
    const lostBets = bets.filter((bet: any) => bet.status === 'lost').length
    const settledBets = wonBets + lostBets
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0

    const totalStaked = bets.reduce((sum: number, bet: any) => sum + (bet.stake || 0), 0)
    const totalReturned = bets
      .filter((bet: any) => bet.status === 'won')
      .reduce((sum: number, bet: any) => sum + (bet.actual_payout || 0), 0)

    const profit = totalReturned - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0

    // Average bet size
    const avgBetSize = totalBets > 0 ? totalStaked / totalBets : 0

    // Current streak
    let currentStreak = 0
    let streakType: 'win' | 'loss' | null = null
    const recentBets = bets
      .filter((bet: any) => bet.status === 'won' || bet.status === 'lost')
      .sort((a: any, b: any) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())

    if (recentBets.length > 0 && recentBets[0]) {
      streakType = recentBets[0].status === 'won' ? 'win' : 'loss'
      for (const bet of recentBets) {
        if (
          (streakType === 'win' && bet.status === 'won') ||
          (streakType === 'loss' && bet.status === 'lost')
        ) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Biggest win/loss
    const biggestWin = Math.max(
      ...bets
        .filter((bet: any) => bet.status === 'won')
        .map((bet: any) => (bet.actual_payout || 0) - (bet.stake || 0)),
      0
    )

    const biggestLoss = Math.max(
      ...bets.filter((bet: any) => bet.status === 'lost').map((bet: any) => bet.stake || 0),
      0
    )

    return {
      data: {
        totalBets,
        wonBets,
        lostBets,
        winRate,
        totalStaked,
        totalReturned,
        profit,
        roi,
        avgBetSize,
        currentStreak: {
          count: currentStreak,
          type: streakType,
        },
        biggestWin,
        biggestLoss,
      },
      error: null,
    }
  })
}

// Get public bets for leaderboards (anonymized)
export async function getPublicBets(filters: BetFilters = {}, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async () => {
    let query = supabaseDirect
      .from('bets')
      .select(
        `
        id,
        sport,
        bet_type,
        odds,
        status,
        placed_at,
        stake,
        actual_payout,
        user:profiles(username, display_name, is_verified)
      `
      )
      .eq('is_public', true)

    // Apply filters similar to getUserBets
    if (filters.sports?.length) {
      query = query.in('sport', filters.sports)
    }

    if (filters.betTypes?.length) {
      query = query.in('bet_type', filters.betTypes)
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    const paginated = await paginatedRequest((params) => wrapSupabaseQuery(query, params), options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Sync bets from sportsbook (placeholder for future implementation)
export async function syncBetsFromSportsbook(_sportsbookId: string) {
  return authenticatedRequest(async _userId => {
    // This would integrate with sportsbook APIs
    // For now, return a placeholder response
    return {
      data: {
        synced: 0,
        errors: [],
        lastSync: new Date().toISOString(),
      },
      error: null,
    }
  })
}
