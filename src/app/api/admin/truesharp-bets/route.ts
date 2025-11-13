import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function GET() {
  try {
    console.log('🎯 Admin TrueSharp Bets API: Fetching unsettled TrueSharp bets with scores')
    
    const supabase = await createServiceRoleClient()
    
    // Get all pending TrueSharp bets first (without game join)
    const { data: bets, error } = await supabase
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

    // Now fetch scores and game data for each bet
    if (bets && bets.length > 0) {
      console.log('🔍 Fetching scores and game data...')
      
      // Enrich bets with scores from odds table and game data
      const betsWithData = await Promise.all(
        bets.map(async (bet: any) => {
          let score = undefined
          let game = null
          
          // Fetch game data if bet has game_id
          if (bet.game_id) {
            try {
              const { data: gameData, error: gameError } = await supabase
                .from('games')
                .select(`
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
                `)
                .eq('id', bet.game_id)
                .limit(1)
                .single()

              if (!gameError && gameData) {
                game = gameData
              }
            } catch (gameErr) {
              console.log(`⚠️ No game found for bet ${bet.id} (game_id: ${bet.game_id})`)
            }
          }
          
          // Fetch score if bet has both oddid and game_id
          if (bet.oddid && bet.game_id) {
            try {
              const { data: oddsData, error: oddsError } = await supabase
                .from('odds')
                .select('score')
                .eq('oddid', bet.oddid)
                .eq('eventid', bet.game_id)
                .limit(1)
                .single()

              if (!oddsError && oddsData && oddsData.score !== null) {
                score = oddsData.score
              }
            } catch (oddsErr) {
              // Silently handle cases where no matching odds found
              console.log(`⚠️ No odds found for bet ${bet.id} (oddid: ${bet.oddid}, eventid: ${bet.game_id})`)
            }
          }

          return {
            ...bet,
            score, // Add score field to bet
            game   // Add game data to bet
          }
        })
      )

      console.log(`📊 Enriched ${betsWithData.length} bets with score and game data`)

      return NextResponse.json({
        success: true,
        data: betsWithData,
        count: betsWithData.length
      })
    }

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