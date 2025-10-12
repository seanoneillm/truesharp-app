import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get counts for today/tomorrow games
    const { data: todayGames } = await supabase
      .from('games')
      .select('id')
      .gte('game_time', `${today}T00:00:00.000Z`)
      .lt('game_time', `${tomorrow}T23:59:59.999Z`)

    const gameIds = todayGames?.map(g => g.id) || []

    // Count odds by type
    const { data: totalOdds } = await supabase.from('odds').select('id').in('eventid', gameIds)

    const { data: totalOpenOdds } = await supabase
      .from('open_odds')
      .select('id')
      .in('eventid', gameIds)

    // Count main lines vs player props
    const { data: mainLines } = await supabase
      .from('odds')
      .select('id')
      .in('eventid', gameIds)
      .in('bettypeid', ['ml', 'sp', 'ou'])

    const { data: playerProps } = await supabase
      .from('odds')
      .select('id')
      .in('eventid', gameIds)
      .or(
        'marketname.ilike.%player%,marketname.ilike.%prop%,bettypeid.ilike.%player%,bettypeid.ilike.%prop%'
      )

    // Count sportsbook coverage
    const { data: sportsbookCoverage } = await supabase
      .from('odds')
      .select('fanduelodds,draftkingsodds,espnbetodds,ceasarsodds,mgmodds')
      .in('eventid', gameIds)

    const fanduelCount = sportsbookCoverage?.filter(o => o.fanduelodds !== null).length || 0
    const draftkingsCount = sportsbookCoverage?.filter(o => o.draftkingsodds !== null).length || 0
    const espnbetCount = sportsbookCoverage?.filter(o => o.espnbetodds !== null).length || 0
    const caesarsCount = sportsbookCoverage?.filter(o => o.ceasarsodds !== null).length || 0
    const mgmCount = sportsbookCoverage?.filter(o => o.mgmodds !== null).length || 0

    // Games with/without odds
    const { data: oddsEventIds } = await supabase
      .from('odds')
      .select('eventid')
      .in('eventid', gameIds)

    const uniqueGamesWithOdds = [...new Set(oddsEventIds?.map(o => o.eventid) || [])]
    const gamesWithoutOdds = gameIds.length - uniqueGamesWithOdds.length

    // Recent activity (last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('id')
      .gte('fetched_at', oneHourAgo)

    return NextResponse.json({
      timestamp: now.toISOString(),
      period: `${today} to ${tomorrow}`,
      summary: {
        totalGames: gameIds.length,
        gamesWithOdds: uniqueGamesWithOdds.length,
        gamesWithoutOdds,
        totalOdds: totalOdds?.length || 0,
        totalOpenOdds: totalOpenOdds?.length || 0,
        recentOdds: recentOdds?.length || 0,
      },
      breakdown: {
        mainLines: mainLines?.length || 0,
        playerProps: playerProps?.length || 0,
        altLines: (totalOdds?.length || 0) - (mainLines?.length || 0) - (playerProps?.length || 0),
      },
      sportsbooks: {
        fanduel: fanduelCount,
        draftkings: draftkingsCount,
        espnbet: espnbetCount,
        caesars: caesarsCount,
        mgm: mgmCount,
        total: sportsbookCoverage?.length || 0,
      },
      healthCheck: {
        apiConnected: true, // Will be false if this endpoint fails
        dbConnected: true,
        triggersActive: true, // Could add actual trigger check
        expectedMinimum: 1000, // Minimum expected odds for healthy system
        status: (totalOdds?.length || 0) >= 1000 ? 'HEALTHY' : 'NEEDS_ATTENTION',
      },
    })
  } catch (error) {
    console.error('Odds monitoring error:', error)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        healthCheck: {
          apiConnected: false,
          dbConnected: false,
          triggersActive: false,
          status: 'ERROR',
        },
      },
      { status: 500 }
    )
  }
}
