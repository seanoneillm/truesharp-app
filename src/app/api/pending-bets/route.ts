import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current time with a small buffer to account for games starting soon
    const currentTime = new Date()
    currentTime.setMinutes(currentTime.getMinutes() + 5) // 5 minute buffer

    const { data: pendingBets, error } = await supabase
      .from('bets')
      .select(
        'id, sport, league, bet_type, bet_description, odds, stake, potential_payout, game_date, home_team, away_team, player_name, prop_type, line_value, side, sportsbook, placed_at'
      )
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('game_date', currentTime.toISOString())
      .order('game_date', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: pendingBets || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
