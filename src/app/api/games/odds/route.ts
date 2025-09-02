import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { gameIds } = await request.json()

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: 'gameIds array is required' }, { status: 400 })
    }

    // Query odds for the specified games
    const { data: odds, error } = await supabase
      .from('odds')
      .select(
        `
        id,
        eventid,
        sportsbook,
        marketname,
        oddid,
        playerid,
        line,
        bookodds,
        closebookodds,
        fanduelodds,
        draftkingsodds,
        espnbetodds,
        ceasarsodds,
        mgmodds,
        fanaticsodds
      `
      )
      .in('eventid', gameIds)
      .not('oddid', 'like', '%yn%') // Exclude yes/no markets

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 500 })
    }

    return NextResponse.json(odds || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
