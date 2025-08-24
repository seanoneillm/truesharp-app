import { createClient } from '@/lib/auth/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface Bet {
  status: string
  stake: number
  actual_payout?: number
  placed_at: string
  sport: string
  bet_type?: string
  [key: string]: any
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const sport = searchParams.get('sport')
    const betType = searchParams.get('bet_type')

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // All time
    }
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .gte('placed_at', startDate.toISOString())
      .order('placed_at', { ascending: false })
      .maybeSingle(false)

    const bets = (data ?? []) as Bet[]

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate analytics
    const totalBets = bets.length
    const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))
    const wonBets = bets.filter(bet => bet.status === 'won')
    const lostBets = bets.filter(bet => bet.status === 'lost')
    
    const totalStake = settledBets.reduce((sum, bet) => sum + bet.stake, 0)
    const totalPayout = wonBets.reduce((sum, bet) => sum + (bet.actual_payout || 0), 0)
    const totalLoss = lostBets.reduce((sum, bet) => sum + bet.stake, 0)
    const netProfit = totalPayout - totalStake
    
    const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0
    const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStake / totalBets : 0

    // Sport breakdown
    const sportBreakdown = bets.reduce((acc, bet) => {
      if (!acc[bet.sport]) {
        acc[bet.sport] = { bets: 0, won: 0, stake: 0, payout: 0 }
      }
      acc[bet.sport].bets += 1
      acc[bet.sport].stake += bet.stake
      if (bet.status === 'won') {
        acc[bet.sport].won += 1
        acc[bet.sport].payout += bet.actual_payout || 0
      }
      return acc
    }, {} as Record<string, any>)

    // Convert to array with calculated metrics
    const sportStats = Object.entries(sportBreakdown).map(([sport, stats]) => ({
      sport,
      totalBets: stats.bets,
      winRate: stats.bets > 0 ? (stats.won / stats.bets) * 100 : 0,
      roi: stats.stake > 0 ? ((stats.payout - stats.stake) / stats.stake) * 100 : 0,
      netProfit: stats.payout - stats.stake
    }))

    const analytics = {
      overview: {
        totalBets,
        winRate: Math.round(winRate * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        avgBetSize: Math.round(avgBetSize * 100) / 100,
        totalStake: Math.round(totalStake * 100) / 100
      },
      sportBreakdown: sportStats,
      recentForm: bets.slice(0, 10).map(bet => ({
        date: bet.placed_at,
        result: bet.status,
        sport: bet.sport,
        roi: bet.status === 'won' ? 
          (((bet.actual_payout ?? 0) - bet.stake) / bet.stake) * 100 : 
          bet.status === 'lost' ? -100 : 0
      }))
    }

    return NextResponse.json({ data: analytics })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}