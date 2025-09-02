import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Check what strategies exist
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, user_id, name, is_monetized')
      .limit(10)

    // Check what profiles exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, is_verified_seller')
      .limit(10)

    // Check current leaderboard entries
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('strategy_leaderboard')
      .select('id, strategy_name, username, total_bets, is_eligible')
      .limit(10)

    return NextResponse.json({
      strategies: {
        data: strategies || [],
        error: strategiesError?.message,
        count: strategies?.length || 0,
      },
      profiles: {
        data: profiles || [],
        error: profilesError?.message,
        count: profiles?.length || 0,
      },
      leaderboard: {
        data: leaderboard || [],
        error: leaderboardError?.message,
        count: leaderboard?.length || 0,
      },
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
