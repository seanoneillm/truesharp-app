import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Check what games exist and their dates
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, home_team, away_team, game_time, league')
      .eq('league', 'MLB')
      .order('game_time', { ascending: false })
      .limit(10)

    if (gamesError) {
      console.error('Games error:', gamesError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    return NextResponse.json({
      games: games || [],
      totalGames: games?.length || 0,
      sampleDates:
        games?.map(g => ({
          id: g.id,
          date: g.game_time?.split('T')[0],
          time: g.game_time,
          teams: `${g.away_team} @ ${g.home_team}`,
        })) || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
