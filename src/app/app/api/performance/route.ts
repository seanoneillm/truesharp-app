import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/performance - Get user performance metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const sports = searchParams.get('sports')?.split(',') || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    // If no filters, get cached performance
    if (!sports.length && !startDate && !endDate) {
      const { data: cachedPerf, error: cacheError } = await supabase
        .from('user_performance_cache')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (cachedPerf && !cacheError) {
        return NextResponse.json({
          data: {
            totalBets: cachedPerf.total_bets,
            winRate: cachedPerf.win_rate,
            roi: cachedPerf.roi,
            profit: cachedPerf.profit,
            avgBetSize: cachedPerf.avg_bet_size,
            variance: cachedPerf.variance,
            streaks: {
              current: {
                type: cachedPerf.current_streak_type || 'win',
                count: cachedPerf.current_streak_count,
              },
              longest: {
                type: 'win',
                count: cachedPerf.longest_win_streak,
              },
            },
          },
        })
      }
    }
    // Calculate filtered performance
    let query = supabase.from('bets').select('*').eq('user_id', user.id)
    if (sports.length > 0 && !sports.includes('all')) {
      query = query.in('sport', sports)
    }
    if (startDate) {
      query = query.gte('placed_at', startDate)
    }
    if (endDate) {
      query = query.lte('placed_at', endDate)
    }
    const { data: bets, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Calculate metrics
    const settledBets = bets?.filter(bet => ['won', 'lost'].includes(bet.status)) || []
    const wins = settledBets.filter(bet => bet.status === 'won')
    const totalBets = bets?.length || 0
    const winRate = settledBets.length > 0 ? (wins.length / settledBets.length) * 100 : 0
    const totalStaked = bets?.reduce((sum, bet) => sum + parseFloat(bet.stake), 0) || 0
    const totalPayout = bets?.reduce((sum, bet) => sum + parseFloat(bet.actual_payout || 0), 0) || 0
    const profit = totalPayout - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStaked / totalBets : 0
    return NextResponse.json({
      data: {
        totalBets,
        winRate: Number(winRate.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        avgBetSize: Number(avgBetSize.toFixed(2)),
        variance: 0,
        streaks: {
          current: { type: 'win', count: 0 },
          longest: { type: 'win', count: 0 },
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
