import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test to understand odds processing for game ouW6XII0uKqRsJazjYBR (the actual Thursday game)
    console.log('Running database diagnostic for game ouW6XII0uKqRsJazjYBR...')

    // 1. Check the game details
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select(
        `
        id,
        home_team,
        away_team,
        status,
        game_time,
        league
      `
      )
      .eq('id', 'ouW6XII0uKqRsJazjYBR')
      .single()

    if (gameError) {
      console.error('Game query error:', gameError)
    }

    // 2. Check all current odds for this game
    const { data: oddsData, error: oddsError } = await supabase
      .from('odds')
      .select(
        `
        oddid,
        marketname,
        bettypeid,
        sideid,
        line,
        bookodds,
        fanduelodds,
        draftkingsodds,
        created_at,
        fetched_at
      `
      )
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')
      .order('created_at', { ascending: false })

    if (oddsError) {
      console.error('Odds query error:', oddsError)
    }

    // 3. Count recent insertions
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { count: recentOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')
      .gt('created_at', oneHourAgo)

    const { count: totalOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')

    const { count: recentOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')
      .gt('created_at', oneHourAgo)

    const { count: totalOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')

    // 4. Check for constraint duplicates
    const { data: duplicateData, error: duplicateError } = await supabase
      .from('odds')
      .select('eventid, oddid, line')
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')

    let duplicates: Array<{ combination: string; count: number }> = []
    if (duplicateData && !duplicateError) {
      const combinations = new Map<string, number>()
      for (const row of duplicateData) {
        const key = `${row.eventid}-${row.oddid}-${row.line}`
        combinations.set(key, (combinations.get(key) || 0) + 1)
      }
      duplicates = Array.from(combinations.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => ({ combination: key, count }))
    }

    // 5. Market type analysis
    const { data: marketData, error: marketError } = await supabase
      .from('odds')
      .select(
        `
        marketname,
        bettypeid,
        oddid,
        line,
        created_at
      `
      )
      .eq('eventid', 'ouW6XII0uKqRsJazjYBR')

    let marketAnalysis = []
    if (marketData && !marketError) {
      const markets = new Map()
      for (const row of marketData) {
        const key = `${row.marketname}-${row.bettypeid}`
        if (!markets.has(key)) {
          markets.set(key, {
            marketname: row.marketname,
            bettypeid: row.bettypeid,
            count: 0,
            unique_odds: new Set(),
            unique_lines: new Set(),
            first_created: row.created_at,
            last_created: row.created_at,
          })
        }
        const market = markets.get(key)
        market.count++
        market.unique_odds.add(row.oddid)
        market.unique_lines.add(row.line)
        if (row.created_at < market.first_created) market.first_created = row.created_at
        if (row.created_at > market.last_created) market.last_created = row.created_at
      }

      marketAnalysis = Array.from(markets.values())
        .map(m => ({
          ...m,
          unique_odds: m.unique_odds.size,
          unique_lines: m.unique_lines.size,
        }))
        .sort((a, b) => b.count - a.count)
    }

    const response = {
      success: true,
      gameData: gameData || 'Game not found',
      gameStatus: gameData
        ? new Date(gameData.game_time) < new Date()
          ? 'Game has started'
          : 'Game has not started'
        : 'Unknown',
      oddsData: {
        total_odds: oddsData?.length || 0,
        sample_odds: oddsData?.slice(0, 5) || [],
        recent_insertions: recentOddsCount || 0,
        total_count: totalOddsCount || 0,
      },
      openOddsData: {
        recent_insertions: recentOpenOddsCount || 0,
        total_count: totalOpenOddsCount || 0,
      },
      duplicates,
      marketAnalysis,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Database diagnostic error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
