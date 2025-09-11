import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Debug endpoint to check users and data
export async function GET() {
  try {
    // Create service role client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get sample users
    const { data: users, error: usersError } = await serviceSupabase
      .from('bets')
      .select('user_id')
      .limit(5)

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError },
        { status: 500 }
      )
    }

    // Get sample strategies
    const { data: strategies, error: strategiesError } = await serviceSupabase
      .from('strategies')
      .select('user_id, id, name')
      .limit(5)

    if (strategiesError) {
      return NextResponse.json(
        { error: 'Failed to fetch strategies', details: strategiesError },
        { status: 500 }
      )
    }

    // Check strategy_leaderboard for constraint violations
    const { data: leaderboard, error: leaderboardError } = await serviceSupabase
      .from('strategy_leaderboard')
      .select('strategy_id, total_bets, winning_bets, losing_bets, push_bets')
      .limit(10)

    if (leaderboardError) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: leaderboardError },
        { status: 500 }
      )
    }

    // Check for constraint violations
    const violations =
      leaderboard?.filter(row => {
        const calculatedTotal =
          (row.winning_bets || 0) + (row.losing_bets || 0) + (row.push_bets || 0)
        return calculatedTotal !== row.total_bets
      }) || []

    return NextResponse.json({
      users: users?.map(u => u.user_id).filter((v, i, a) => a.indexOf(v) === i) || [],
      strategies: strategies || [],
      leaderboard: leaderboard || [],
      violations: violations,
      violationCount: violations.length,
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
