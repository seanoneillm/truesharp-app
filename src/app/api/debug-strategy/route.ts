import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get strategy details
    const { data: strategy, error: strategyError } = await serviceSupabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single()

    if (strategyError) {
      return NextResponse.json(
        { error: 'Strategy not found', details: strategyError.message },
        { status: 404 }
      )
    }

    // Get strategy_bets for this strategy
    const { data: strategyBets, error: strategyBetsError } = await serviceSupabase
      .from('strategy_bets')
      .select(
        `
        *,
        bets:bet_id (
          id,
          sport,
          bet_type,
          status,
          profit,
          stake,
          side,
          is_parlay,
          sportsbook,
          placed_at
        )
      `
      )
      .eq('strategy_id', strategyId)

    // Get strategy_leaderboard entry
    const { data: leaderboard, error: leaderboardError } = await serviceSupabase
      .from('strategy_leaderboard')
      .select('*')
      .eq('strategy_id', strategyId)
      .single()

    // Get user's bets to see what should match
    const { data: userBets, error: userBetsError } = await serviceSupabase
      .from('bets')
      .select('id, sport, bet_type, status, profit, stake, side, is_parlay, sportsbook, placed_at')
      .eq('user_id', strategy.user_id)
      .limit(10)

    return NextResponse.json({
      strategy: strategy,
      strategy_bets: {
        data: strategyBets || [],
        error: strategyBetsError?.message,
        count: strategyBets?.length || 0,
      },
      leaderboard: {
        data: leaderboard || null,
        error: leaderboardError?.message,
      },
      user_bets_sample: {
        data: userBets || [],
        error: userBetsError?.message,
        count: userBets?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error in debug-strategy:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
