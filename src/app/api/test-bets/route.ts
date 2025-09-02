import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get a sample of bets for this user
    const { data: bets, error } = await serviceSupabase
      .from('bets')
      .select('id, sport, bet_type, status, profit, stake, side, is_parlay, sportsbook')
      .eq('user_id', userId)
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique values for analysis
    const sports = [...new Set(bets?.map(b => b.sport) || [])]
    const betTypes = [...new Set(bets?.map(b => b.bet_type) || [])]
    const statuses = [...new Set(bets?.map(b => b.status) || [])]
    const sportsbooks = [...new Set(bets?.map(b => b.sportsbook) || [])]

    return NextResponse.json({
      total_bets: bets?.length || 0,
      sample_bets: bets || [],
      unique_sports: sports,
      unique_bet_types: betTypes,
      unique_statuses: statuses,
      unique_sportsbooks: sportsbooks,
    })
  } catch (error) {
    console.error('Error in test-bets:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
