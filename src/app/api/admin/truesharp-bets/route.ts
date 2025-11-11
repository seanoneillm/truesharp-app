import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function GET() {
  try {
    console.log('🎯 Admin TrueSharp Bets API: Fetching unsettled TrueSharp bets')
    
    const supabase = await createServiceRoleClient()
    
    // First try to get bets with game information
    let { data: bets, error } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        game_id,
        sport,
        league,
        bet_type,
        bet_description,
        odds,
        oddid,
        stake,
        potential_payout,
        status,
        placed_at,
        updated_at,
        home_team,
        away_team,
        player_name,
        line_value,
        side,
        profit,
        game:games(
          id,
          sport,
          home_team,
          away_team,
          home_team_name,
          away_team_name,
          game_time,
          status,
          home_score,
          away_score,
          league
        )
      `)
      .eq('sportsbook', 'TrueSharp')
      .eq('status', 'pending')
      .order('placed_at', { ascending: false })

    // If the join fails, fallback to simple query without game info
    if (error) {
      console.log('⚠️ Game join failed, falling back to simple query:', error.message)
      const result = await supabase
        .from('bets')
        .select(`
          id,
          user_id,
          game_id,
          sport,
          league,
          bet_type,
          bet_description,
          odds,
          oddid,
          stake,
          potential_payout,
          status,
          placed_at,
          updated_at,
          home_team,
          away_team,
          player_name,
          line_value,
          side,
          profit
        `)
        .eq('sportsbook', 'TrueSharp')
        .eq('status', 'pending')
        .order('placed_at', { ascending: false })
      
      bets = result.data
      error = result.error
    }
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error occurred',
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${bets?.length || 0} unsettled TrueSharp bets`)

    return NextResponse.json({
      success: true,
      data: bets || [],
      count: bets?.length || 0
    })

  } catch (error) {
    console.error('❌ Unexpected error in TrueSharp bets API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}