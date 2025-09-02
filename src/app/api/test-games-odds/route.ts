import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Check what games exist and what odds exist for those games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, home_team, away_team, sport_key')
      .limit(5)

    if (gamesError) {
      console.error('Games error:', gamesError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    let oddsResults = []
    if (games && games.length > 0) {
      // Check odds for first game
      const firstGame = games[0]
      const { data: odds, error: oddsError } = await supabase
        .from('odds')
        .select('eventid, oddid, marketname, bookodds')
        .eq('eventid', firstGame.id)
        .limit(10)

      if (!oddsError && odds) {
        oddsResults = odds
      }
    }

    return NextResponse.json({
      games: games || [],
      sampleOdds: oddsResults,
      totalGames: games?.length || 0,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
