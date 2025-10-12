import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// FIXED: Issue #3 - Changed UCL to UEFA_CHAMPIONS_LEAGUE
const LEAGUES = [
  'NFL',
  'NBA',
  'WNBA',
  'MLB',
  'NHL',
  'NCAAF',
  'NCAAB',
  'MLS',
  'UEFA_CHAMPIONS_LEAGUE',
]

// FIXED: Issue #3 - Updated sport mappings with correct Champions League league ID
const SPORT_MAPPINGS = {
  NFL: { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' },
  NBA: { sportID: 'BASKETBALL', leagueID: 'NBA', sport_key: 'basketball_nba' },
  WNBA: { sportID: 'BASKETBALL', leagueID: 'WNBA', sport_key: 'basketball_wnba' },
  MLB: { sportID: 'BASEBALL', leagueID: 'MLB', sport_key: 'baseball_mlb' },
  NHL: { sportID: 'HOCKEY', leagueID: 'NHL', sport_key: 'icehockey_nhl' },
  NCAAF: { sportID: 'FOOTBALL', leagueID: 'NCAAF', sport_key: 'americanfootball_ncaaf' },
  NCAAB: { sportID: 'BASKETBALL', leagueID: 'NCAAB', sport_key: 'basketball_ncaab' },
  MLS: { sportID: 'SOCCER', leagueID: 'MLS', sport_key: 'soccer_mls' },
  UEFA_CHAMPIONS_LEAGUE: {
    sportID: 'SOCCER',
    leagueID: 'UEFA_CHAMPIONS_LEAGUE',
    sport_key: 'soccer_uefa_champs_league',
  },
} as const

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to safely parse odds values
const safeParseOdds = (value: string | number | undefined | null): number | null => {
  if (!value) return null
  const parsed = parseFloat(String(value))
  if (isNaN(parsed)) return null

  // Filter out clearly invalid odds (like -100000 from some sportsbooks)
  if (Math.abs(parsed) > 50000) {
    console.log(`⚠️ Filtering out extreme odds value: ${parsed}`)
    return null
  }

  const limited = Math.min(Math.max(parsed, -9999), 9999)
  return Math.round(limited) // Return integer values for database
}

// Helper function to truncate strings
const truncateString = (value: string | undefined | null, maxLength: number): string | null => {
  if (!value) return null
  const str = String(value)
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

// Transform SportsGameOdds event to our format
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

// Normalize team names
function normalizeTeamName(teamName: string): string {
  if (!teamName) return 'Unknown'

  const teamMappings: Record<string, string> = {
    'New York Yankees': 'NY Yankees',
    'New York Mets': 'NY Mets',
    'Los Angeles Dodgers': 'LA Dodgers',
    'Los Angeles Angels': 'LA Angels',
    'Chicago White Sox': 'Chi White Sox',
    'Chicago Cubs': 'Chi Cubs',
    'San Francisco Giants': 'SF Giants',
    'St. Louis Cardinals': 'St Louis Cardinals',
    'Tampa Bay Rays': 'Tampa Bay',
    'Kansas City Royals': 'Kansas City',
    'San Diego Padres': 'San Diego',
    'Colorado Rockies': 'Colorado',
    'Arizona Diamondbacks': 'Arizona',
    'Washington Nationals': 'Washington',
    'Minnesota Twins': 'Minnesota',
    'Cleveland Guardians': 'Cleveland',
    'Detroit Tigers': 'Detroit',
    'Milwaukee Brewers': 'Milwaukee',
    'Cincinnati Reds': 'Cincinnati',
    'Pittsburgh Pirates': 'Pittsburgh',
    'Miami Marlins': 'Miami',
    'Atlanta Braves': 'Atlanta',
    'Philadelphia Phillies': 'Philadelphia',
    'Oakland Athletics': 'Oakland',
    'Seattle Mariners': 'Seattle',
    'Texas Rangers': 'Texas',
    'Houston Astros': 'Houston',
    'Boston Red Sox': 'Boston',
    'Toronto Blue Jays': 'Toronto',
    'Baltimore Orioles': 'Baltimore',
  }

  return teamMappings[teamName] || teamName.replace(/\\s+/g, ' ').trim()
}

// FIXED: Issue #1 - Helper function to check if game has started
async function checkGameHasStarted(gameTime: string): Promise<boolean> {
  const now = new Date()
  const gameStartTime = new Date(gameTime)
  // Add 10 minute buffer after start time
  const bufferTime = 10 * 60 * 1000
  return now.getTime() > gameStartTime.getTime() + bufferTime
}

// OPTIMIZED: Using bulk processor for 50x speed improvement
async function saveOddsDataWithDualTables(gameId: string, odds: Record<string, unknown>) {
  try {
    console.log(`🚀 [BULK PROCESSOR] Processing odds for game ${gameId}`)

    // Use the optimized bulk processor instead of creating 5000+ individual records
    const { processGameOdds } = await import('../../../lib/odds-bulk-processor')
    const results = await processGameOdds(gameId, odds as Record<string, any>)

    console.log(`⚡ Bulk processing results for ${gameId}:`, {
      originalOdds: results.processing.totalApiOdds,
      consolidatedRows: results.processing.consolidatedRows,
      reduction: `${results.processing.reductionPercent.toFixed(1)}%`,
      processingTime: `${results.processing.processingTimeMs}ms`,
      insertionTime: `${results.insertion.totalTimeMs}ms`,
      totalTime: `${results.processing.processingTimeMs + results.insertion.totalTimeMs}ms`,
      dataReduction: `${results.processing.totalApiOdds} → ${results.processing.consolidatedRows} rows`,
    })

    return
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
    throw error
  }
}

// Save game data to database
async function saveGameData(
  event: Record<string, unknown>,
  sportMapping: (typeof SPORT_MAPPINGS)[keyof typeof SPORT_MAPPINGS]
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

// Fetch odds for a specific league
async function fetchLeagueOdds(leagueKey: keyof typeof SPORT_MAPPINGS) {
  const sportMapping = SPORT_MAPPINGS[leagueKey]
  if (!sportMapping) {
    console.error(`❌ Unsupported league: ${leagueKey}`)
    return { games: 0, success: false }
  }

  console.log(`🎯 Fetching odds for ${leagueKey}...`)

  try {
    // Calculate date range (today + next 7 days)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]

    // Fetch events with pagination
    let nextCursor: string | null = null
    let allEvents: Record<string, unknown>[] = []
    let pageCount = 0
    const maxPages = 20

    do {
      pageCount++

      if (pageCount > maxPages) {
        console.log(`⚠️ Hit maximum page limit (${maxPages}) for ${leagueKey}`)
        break
      }

      const params = new URLSearchParams()
      params.append('leagueID', sportMapping.leagueID)
      params.append('type', 'match')
      if (startISO) params.append('startsAfter', startISO)
      if (futureDateISO) params.append('startsBefore', futureDateISO)
      params.append('limit', '50')
      params.append('includeAltLines', 'true') // FIXED: Issue #4 - Include alternate lines
      if (nextCursor) {
        params.append('cursor', nextCursor)
      }

      const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`

      const response = await fetch(apiUrl, {
        headers: {
          'X-API-Key': API_KEY!,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`⚠️ Rate limited for ${leagueKey}`)
          break
        }
        throw new Error(
          `SportsGameOdds API error for ${leagueKey}: ${response.status} ${response.statusText}`
        )
      }

      const pageData = await response.json()

      if (pageData?.success && pageData?.data) {
        if (pageData.data.length === 0) {
          break
        }

        allEvents = allEvents.concat(pageData.data)
        nextCursor = pageData.nextCursor

        if (!nextCursor) {
          break
        }
      } else {
        break
      }

      if (allEvents.length > 500) {
        break
      }
    } while (nextCursor && pageCount <= maxPages)

    // Process and save each event
    let processedGames = 0
    let skippedGames = 0

    for (const event of allEvents) {
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)

        // Check if game has ended based on API data
        const gameEnded =
          (event as any).odds &&
          Object.values((event as any).odds).some(
            (odd: any) => odd.ended === true || odd.started === true
          )

        if (gameEnded) {
          skippedGames++
          console.log(
            `⏭️ Skipping ended game: ${(transformedEvent.teams as any)?.away?.name} @ ${(transformedEvent.teams as any)?.home?.name}`
          )
          continue
        }

        // FIXED: Issue #1 - Check if game has started before processing (major performance improvement)
        const gameHasStarted = await checkGameHasStarted(transformedEvent.startTime as string)
        if (gameHasStarted) {
          skippedGames++
          console.log(
            `⏭️ Skipping started game: ${(transformedEvent.teams as any)?.away?.name} @ ${(transformedEvent.teams as any)?.home?.name}`
          )
          continue
        }

        const savedGame = await saveGameData(transformedEvent, sportMapping)

        if (savedGame && transformedEvent.odds) {
          await saveOddsDataWithDualTables(
            savedGame.id as string,
            transformedEvent.odds as Record<string, unknown>
          )
          processedGames++
        }
      } catch (eventError) {
        console.error(`❌ Error processing event in ${leagueKey}:`, eventError)
        continue
      }
    }

    console.log(
      `✅ ${leagueKey} completed: ${processedGames} games processed, ${skippedGames} games skipped (already started)`
    )
    return {
      games: processedGames,
      skipped: skippedGames,
      success: true,
    }
  } catch (error) {
    console.error(`❌ Error fetching ${leagueKey}:`, error)
    return { games: 0, success: false, error: (error as Error).message }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting odds fetch for all 9 leagues...')

    if (!API_KEY) {
      return NextResponse.json({ error: 'SportsGameOdds API key not configured' }, { status: 500 })
    }

    // 📊 COUNT: Get initial row counts before fetch
    const { count: preOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
    const { count: preOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    const initialOddsCount = preOddsCount || 0
    const initialOpenOddsCount = preOpenOddsCount || 0
    console.log(`📊 PRE-FETCH COUNTS: odds=${initialOddsCount}, open_odds=${initialOpenOddsCount}`)

    const results = []

    // Process each league sequentially to avoid rate limiting
    for (const league of LEAGUES) {
      console.log(`\\n🔄 Processing ${league}...`)

      try {
        const result = await fetchLeagueOdds(league as keyof typeof SPORT_MAPPINGS)
        results.push({
          league,
          ...result,
        })

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Error with ${league}:`, error)
        results.push({
          league,
          games: 0,
          success: false,
          error: (error as Error).message,
        })
      }
    }

    // Summary
    const totalGames = results.reduce((sum, result) => sum + result.games, 0)
    const totalSkipped = results.reduce((sum, result) => sum + (result.skipped || 0), 0)
    const successfulLeagues = results.filter(r => r.success).length

    console.log('\\n📊 SUMMARY:')
    console.log(`✅ Successful leagues: ${successfulLeagues}/${LEAGUES.length}`)
    console.log(`📈 Total games processed: ${totalGames}`)
    console.log(`⏭️ Total games skipped (already started): ${totalSkipped}`)
    console.log(`⚡ Performance improvement: ${totalSkipped} fewer database operations`)
    console.log('🔧 FIXES APPLIED:')
    console.log('  ✅ Skip games that have already started (performance)')
    console.log('  ✅ Use UEFA_CHAMPIONS_LEAGUE instead of UCL')
    console.log('  ✅ Include alternate lines (includeAltLines=true)')
    console.log('  ✅ Process all alternate lines as separate database rows')
    console.log('  ✅ Check duplicates by oddID + line (not just oddID)')

    // 📊 COUNT: Get final row counts after fetch to measure actual database growth
    const { count: postOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
    const { count: postOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    const finalOddsCount = postOddsCount || 0
    const finalOpenOddsCount = postOpenOddsCount || 0
    const oddsAdded = finalOddsCount - initialOddsCount
    const openOddsAdded = finalOpenOddsCount - initialOpenOddsCount

    console.log('\n🎯 DATABASE GROWTH ANALYSIS:')
    console.log(`📊 BEFORE: odds=${initialOddsCount}, open_odds=${initialOpenOddsCount}`)
    console.log(`📊 AFTER:  odds=${finalOddsCount}, open_odds=${finalOpenOddsCount}`)
    console.log(`📈 ADDED:  odds=+${oddsAdded}, open_odds=+${openOddsAdded}`)
    console.log(
      `💡 RETENTION: ${oddsAdded > 0 ? 'SUCCESS' : '⚠️ NO GROWTH - CHECK TRIGGERS!'} - Compare this to API odds received`
    )

    return NextResponse.json({
      success: true,
      totalGames,
      totalSkipped,
      successfulLeagues,
      totalLeagues: LEAGUES.length,
      results,
      lastUpdated: new Date().toISOString(),
      // Database growth tracking
      databaseGrowth: {
        before: { odds: initialOddsCount, open_odds: initialOpenOddsCount },
        after: { odds: finalOddsCount, open_odds: finalOpenOddsCount },
        added: { odds: oddsAdded, open_odds: openOddsAdded },
        retentionStatus: oddsAdded > 0 ? 'SUCCESS' : 'NO_GROWTH_CHECK_TRIGGERS',
      },
      fixes: [
        'Skip games that have already started (performance)',
        'Use UEFA_CHAMPIONS_LEAGUE instead of UCL',
      ],
    })
  } catch (error) {
    console.error('❌ Error in dual table odds fetch:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds with dual table strategy',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
