import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all strategies with their basic info
    const { data: strategies, error: strategiesError } = await serviceSupabase
      .from('strategies')
      .select('id, name, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get all strategy_bets relationships
    const { data: strategyBets, error: strategyBetsError } = await serviceSupabase
      .from('strategy_bets')
      .select('strategy_id, bet_id')
      .limit(20)
    
    // Get all strategy_leaderboard entries
    const { data: leaderboard, error: leaderboardError } = await serviceSupabase
      .from('strategy_leaderboard')
      .select('strategy_id, strategy_name, total_bets')
      .limit(10)
    
    return NextResponse.json({
      strategies: {
        data: strategies || [],
        error: strategiesError?.message,
        count: strategies?.length || 0
      },
      strategy_bets: {
        data: strategyBets || [],
        error: strategyBetsError?.message,
        count: strategyBets?.length || 0
      },
      leaderboard: {
        data: leaderboard || [],
        error: leaderboardError?.message,
        count: leaderboard?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Error in list-strategies:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
