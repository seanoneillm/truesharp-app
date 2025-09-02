import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use service role to check table data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test strategy_leaderboard table
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('strategy_leaderboard')
      .select('*')
      .limit(5)

    // Test strategies table
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .limit(5)

    // Test subscriptions table
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: {
          count: leaderboard?.length || 0,
          error: leaderboardError?.message,
          sample: leaderboard?.[0] || null,
        },
        strategies: {
          count: strategies?.length || 0,
          error: strategiesError?.message,
          sample: strategies?.[0] || null,
        },
        subscriptions: {
          count: subscriptions?.length || 0,
          error: subscriptionsError?.message,
          sample: subscriptions?.[0] || null,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard data test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
