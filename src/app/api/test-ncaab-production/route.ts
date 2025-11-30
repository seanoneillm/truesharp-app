import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const NCAAB_MAPPING = {
  sportID: 'BASKETBALL',
  leagueID: 'NCAAB',
  sport_key: 'basketball_ncaab'
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Same functions from production code
function transformSportsGameOddsEvent(event: Record<string, unknown>): Record<string, unknown> {
  const status = (event.status as Record<string, unknown>) || {}
  const teams = (event.teams as Record<string, unknown>) || {}
  const homeTeam = (teams.home as Record<string, unknown>) || {}
  const awayTeam = (teams.away as Record<string, unknown>) || {}
  const homeNames = (homeTeam.names as Record<string, unknown>) || {}
  const awayNames = (awayTeam.names as Record<string, unknown>) || {}

  return {
    eventID: event.eventID,
    sportID: event.sportID,
    leagueID: event.leagueID,
    status: status.displayShort || 'scheduled',
    teams: {
      home: {
        teamID: homeTeam.teamID,
        name: homeNames.long || homeTeam.name || 'Unknown Home Team',
        shortName: homeNames.short || homeNames.medium,
        score: homeTeam.score,
      },
      away: {
        teamID: awayTeam.teamID,
        name: awayNames.long || awayTeam.name || 'Unknown Away Team',
        shortName: awayNames.short || awayNames.medium,
        score: awayTeam.score,
      },
    },
    startTime: status.startsAt || new Date().toISOString(),
    odds: event.odds || {},
  }
}

function normalizeTeamName(teamName: string): string {
  if (!teamName) return 'Unknown'
  return teamName.replace(/\\s+/g, ' ').trim()
}

async function checkGameHasStarted(gameTime: string): Promise<boolean> {
  const now = new Date()
  const gameStartTime = new Date(gameTime)
  const bufferTime = 10 * 60 * 1000
  return now.getTime() > gameStartTime.getTime() + bufferTime
}

async function saveGameData(
  event: Record<string, unknown>,
  sportMapping: typeof NCAAB_MAPPING
) {
  try {
    const teams = event.teams as Record<string, unknown>
    const homeTeam = teams?.home as Record<string, unknown>
    const awayTeam = teams?.away as Record<string, unknown>

    const gameData = {
      id: event.eventID as string,
      sport: sportMapping.leagueID,
      league: sportMapping.leagueID,
      home_team: normalizeTeamName(homeTeam?.name as string),
      away_team: normalizeTeamName(awayTeam?.name as string),
      home_team_name: (homeTeam?.name as string) || '',
      away_team_name: (awayTeam?.name as string) || '',
      game_time: event.startTime
        ? new Date(event.startTime as string).toISOString()
        : new Date().toISOString(),
      status: (event.status as string) || 'scheduled',
      home_score: (homeTeam?.score as number) || null,
      away_score: (awayTeam?.score as number) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: savedGame, error: gameError } = await supabase
      .from('games')
      .upsert(gameData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (gameError) {
      console.error('❌ Error saving game:', gameError)
      return null
    }

    return savedGame
  } catch (error) {
    console.error('❌ Error in saveGameData:', error)
    return null
  }
}

async function saveOddsDataWithDualTables(gameId: string, odds: Record<string, unknown>) {
  try {
    console.log(`🚀 [BULK PROCESSOR] Processing odds for game ${gameId}`)
    const { processGameOdds } = await import('../../../lib/odds-bulk-processor')
    const results = await processGameOdds(gameId, odds as Record<string, any>)

    console.log(`⚡ Bulk processing results for ${gameId}:`, {
      originalOdds: results.processing.totalApiOdds,
      consolidatedRows: results.processing.consolidatedRows,
      reduction: `${results.processing.reductionPercent.toFixed(1)}%`,
      processingTime: `${results.processing.processingTimeMs}ms`,
      insertionTime: `${results.insertion.totalTimeMs}ms`,
    })

    return results
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🏀 ========== TESTING PRODUCTION NCAAB PROCESSING ==========')
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Get initial database counts
    const { count: preGamesCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('league', 'NCAAB')

    const { count: preOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 PRE-TEST COUNTS: games=${preGamesCount || 0}, odds=${preOddsCount || 0}`)

    // Fetch NCAAB events (limit to first 50 for testing)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]

    console.log(`📅 Fetching NCAAB events from ${startISO} to ${futureDateISO}`)

    const params = new URLSearchParams()
    params.append('leagueID', NCAAB_MAPPING.leagueID)
    params.append('type', 'match')
    params.append('startsAfter', startISO)
    params.append('startsBefore', futureDateISO)
    params.append('limit', '50') // Limit for testing
    params.append('includeAltLines', 'true')

    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const pageData = await response.json()
    console.log(`📊 API response: ${pageData?.data?.length || 0} events`)

    if (!pageData?.success || !pageData?.data) {
      return NextResponse.json({ error: 'No data from API' }, { status: 500 })
    }

    const allEvents = pageData.data
    let processedGames = 0
    let skippedGames = 0
    let deletedNoOdds = 0
    let totalOddsProcessed = 0

    // Process each event with the FIXED logic
    for (const event of allEvents) {
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)

        console.log(`\n🎯 Processing: ${(transformedEvent.teams as any)?.away?.name} @ ${(transformedEvent.teams as any)?.home?.name}`)

        // Check if game has started
        const gameHasStarted = await checkGameHasStarted(transformedEvent.startTime as string)
        if (gameHasStarted) {
          skippedGames++
          console.log(`⏭️ SKIPPED: Game has started`)
          continue
        }

        // CRITICAL FIX: Check for inline odds
        const hasInlineOdds = transformedEvent.odds && Object.keys(transformedEvent.odds as Record<string, unknown>).length > 0
        
        if (!hasInlineOdds) {
          deletedNoOdds++
          console.log(`🗑️ DELETED: No inline odds available`)
          continue
        }

        console.log(`✅ PROCESSING: Has ${Object.keys(transformedEvent.odds as Record<string, unknown>).length} odds`)

        // Save game to database
        const savedGame = await saveGameData(transformedEvent, NCAAB_MAPPING)

        if (savedGame && transformedEvent.odds) {
          // Save odds using bulk processor
          const results = await saveOddsDataWithDualTables(
            savedGame.id as string,
            transformedEvent.odds as Record<string, unknown>
          )
          
          processedGames++
          totalOddsProcessed += results.processing.totalApiOdds
          console.log(`✅ SUCCESS: Saved game and ${results.insertion.oddsInserted} odds`)
        }

      } catch (eventError) {
        console.error(`❌ Error processing event:`, eventError)
        continue
      }
    }

    // Get final database counts
    const { count: postGamesCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('league', 'NCAAB')

    const { count: postOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const gamesAdded = (postGamesCount || 0) - (preGamesCount || 0)
    const oddsAdded = (postOddsCount || 0) - (preOddsCount || 0)

    console.log('\n🏀 ========== PRODUCTION NCAAB TEST RESULTS ==========')
    console.log(`📊 Events fetched: ${allEvents.length}`)
    console.log(`✅ Games processed: ${processedGames}`)
    console.log(`⏭️ Games skipped (started): ${skippedGames}`)
    console.log(`🗑️ Games deleted (no odds): ${deletedNoOdds}`)
    console.log(`📈 Processing efficiency: ${((processedGames / allEvents.length) * 100).toFixed(1)}%`)
    console.log(`🎯 Games added to database: ${gamesAdded}`)
    console.log(`🎯 Odds added to database: ${oddsAdded}`)
    console.log(`📊 Total odds processed: ${totalOddsProcessed}`)
    console.log(`✅ DATABASE SUCCESS: ${oddsAdded > 0 ? 'NCAAB odds are now being saved!' : 'No odds were saved - check logs'}`)

    return NextResponse.json({
      success: true,
      summary: {
        eventsFetched: allEvents.length,
        gamesProcessed: processedGames,
        gamesSkipped: skippedGames,
        deletedNoOdds: deletedNoOdds,
        processingEfficiency: ((processedGames / allEvents.length) * 100),
        gamesAdded,
        oddsAdded,
        totalOddsProcessed
      },
      databaseGrowth: {
        before: { games: preGamesCount || 0, odds: preOddsCount || 0 },
        after: { games: postGamesCount || 0, odds: postOddsCount || 0 },
        added: { games: gamesAdded, odds: oddsAdded }
      },
      status: oddsAdded > 0 ? 'FIXED - NCAAB odds now working!' : 'Still no odds - check configuration',
      testCompleted: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Production test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}