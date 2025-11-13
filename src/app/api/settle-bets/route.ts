import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/*
 * FETCH SCORES API
 * 
 * This function mirrors the fetch-odds process but focuses only on score updates:
 * 1. Fetches completed games from last 1-2 days using the same API endpoints
 * 2. Extracts scores from the API response and updates existing odds table rows
 * 3. Updates games table with team scores
 * 
 * Note: Bet settlement is handled manually via separate process
 */

const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// Same sport mappings as fetch-odds
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

const LEAGUES = Object.keys(SPORT_MAPPINGS) as (keyof typeof SPORT_MAPPINGS)[]

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const serviceSupabase = await createServiceRoleClient()

    console.log('📊 Starting score fetching process')
    console.log(`⏰ Started at: ${new Date().toISOString()}`)

    if (!API_KEY) {
      return NextResponse.json({ error: 'SportsGameOdds API key not configured' }, { status: 500 })
    }

    // Process last 1-2 days for completed games
    const results = []
    let totalGamesFetched = 0
    let totalCompletedGames = 0
    let totalScoresUpdated = 0

    // Fetch completed games from each league
    for (const league of LEAGUES) {
      console.log(`🔄 Processing ${league} completed games...`)

      try {
        const result = await fetchCompletedGamesForLeague(league, serviceSupabase)
        results.push({
          league,
          ...result,
        })

        totalGamesFetched += result.gamesFetched || 0
        totalCompletedGames += result.completedGames || 0
        totalScoresUpdated += result.scoresUpdated || 0

        // Reduced delay for score updates (less intensive than full odds fetch)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`❌ Error with ${league}:`, error)
        results.push({
          league,
          success: false,
          error: (error as Error).message,
        })
      }
    }

    const totalTime = Date.now() - startTime
    const successfulLeagues = results.filter(r => r.success).length
    
    const summary = {
      success: true,
      totalGamesFetched,
      totalCompletedGames,
      totalScoresUpdated,
      successfulLeagues,
      totalLeagues: LEAGUES.length,
      results,
      message: `Fetched ${totalGamesFetched} games, processed ${totalCompletedGames} completed games, updated ${totalScoresUpdated} odds records with scores`,
      processingTimeMs: totalTime,
      processingTimeSeconds: Math.round(totalTime / 1000),
    }

    console.log('🏁 Score fetching completed:', summary)
    console.log(`⏰ Total processing time: ${Math.round(totalTime / 1000)}s`)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('❌ Error in score fetching:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Transform SportsGameOdds event to our format (same as fetch-odds)
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

// Normalize team names (same as fetch-odds)
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

// Update games table with team scores (same as fetch-odds)
async function updateGameScores(supabase: any, gameId: string, homeScore: number, awayScore: number) {
  try {
    console.log(`🏟️ Updating game ${gameId} scores: Home ${homeScore} - ${awayScore} Away`)
    
    const { error } = await supabase
      .from('games')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'final',
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (error) {
      console.error(`❌ Error updating game scores for ${gameId}:`, error)
    } else {
      console.log(`✅ Updated game ${gameId} scores successfully`)
    }
  } catch (error) {
    console.error(`❌ Error in updateGameScores:`, error)
  }
}

// Save game data to database (adapted from fetch-odds)
async function saveCompletedGameData(
  event: Record<string, unknown>,
  sportMapping: (typeof SPORT_MAPPINGS)[keyof typeof SPORT_MAPPINGS],
  supabase: any
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
      status: 'final', // Force to final since we're only processing completed games
      home_score: (homeTeam?.score as number) || null,
      away_score: (awayTeam?.score as number) || null,
      updated_at: new Date().toISOString(),
    }

    // Only update if game exists (don't create new games)
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('id', gameData.id)
      .single()

    if (!existingGame) {
      console.log(`⚠️ Game ${gameData.id} not found in database, skipping`)
      return null
    }

    const { data: savedGame, error: gameError } = await supabase
      .from('games')
      .update(gameData)
      .eq('id', gameData.id)
      .select()
      .single()

    if (gameError) {
      console.error('❌ Error updating completed game:', gameError)
      return null
    }

    return savedGame
  } catch (error) {
    console.error('❌ Error in saveCompletedGameData:', error)
    return null
  }
}

// Fetch completed games for a specific league and update scores
async function fetchCompletedGamesForLeague(leagueKey: keyof typeof SPORT_MAPPINGS, supabase: any) {
  const sportMapping = SPORT_MAPPINGS[leagueKey]
  if (!sportMapping) {
    console.error(`❌ Unsupported league: ${leagueKey}`)
    return { success: false, gamesFetched: 0, completedGames: 0, scoresUpdated: 0 }
  }

  console.log(`🎯 Fetching completed games for ${leagueKey}...`)

  try {
    // Calculate date range (last 3 days to catch completed games)
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const startISO = threeDaysAgo.toISOString().split('T')[0]
    const endISO = now.toISOString().split('T')[0]

    // Fetch events with pagination
    let nextCursor: string | null = null
    let allEvents: Record<string, unknown>[] = []
    let pageCount = 0
    const maxPages = 10

    do {
      pageCount++

      if (pageCount > maxPages) {
        console.log(`⚠️ Hit maximum page limit (${maxPages}) for ${leagueKey}`)
        break
      }

      const params = new URLSearchParams()
      params.append('leagueID', sportMapping.leagueID)
      params.append('type', 'match')
      params.append('startsAfter', startISO)
      params.append('startsBefore', endISO)
      params.append('limit', '50')
      params.append('includeAltLines', 'true')
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

      if (allEvents.length > 200) {
        break
      }
    } while (nextCursor && pageCount <= maxPages)

    // Filter for STRICTLY completed games only - more restrictive than fetch-odds
    const completedEvents = allEvents.filter((event: any) => {
      // Must have final status
      const hasFinishedStatus = 
        event.status?.displayShort === 'F' ||
        event.status?.displayShort === 'Final' ||
        event.status?.displayShort === 'FT' ||
        event.status?.displayShort === 'finished' ||
        event.status?.displayShort === 'completed'

      // Must have scores in the API response (proves game actually finished)
      const hasScoresInOdds = event.odds && 
        Object.values(event.odds).some(
          (odd: any) => odd.score !== undefined && odd.score !== null && !isNaN(parseFloat(odd.score))
        )

      // Must be in the past (not future/live games)
      const gameTime = event.status?.startsAt || event.startsAt
      const isPastGame = !gameTime || new Date(gameTime) < new Date()

      const isStrictlyCompleted = hasFinishedStatus && hasScoresInOdds && isPastGame

      if (!isStrictlyCompleted) {
        console.log(`⏭️ Skipping non-completed game: Status=${event.status?.displayShort}, HasScores=${hasScoresInOdds}, InPast=${isPastGame}`)
      }

      return isStrictlyCompleted
    })

    console.log(`🏁 Found ${completedEvents.length} completed games out of ${allEvents.length} ${leagueKey} games`)

    // Process each completed game
    let completedGames = 0
    let scoresUpdated = 0

    for (const event of completedEvents) {
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)

        // Update game data if it exists
        const savedGame = await saveCompletedGameData(transformedEvent, sportMapping, supabase)

        if (savedGame && transformedEvent.odds) {
          // Use the bulk processor to update scores
          const { processCompletedGameScores } = await import('../../../lib/odds-bulk-processor')
          const result = await processCompletedGameScores(
            savedGame.id as string,
            transformedEvent.odds as Record<string, any>
          )
          
          scoresUpdated += result.scoresUpdated
          completedGames++
          
          console.log(`✅ Updated ${result.scoresUpdated} scores for completed game: ${(transformedEvent.teams as any)?.away?.name} @ ${(transformedEvent.teams as any)?.home?.name}`)
        }
      } catch (eventError) {
        console.error(`❌ Error processing completed event in ${leagueKey}:`, eventError)
        continue
      }
    }

    console.log(`✅ ${leagueKey} completed: ${completedGames} games processed, ${scoresUpdated} scores updated`)
    
    return {
      success: true,
      gamesFetched: allEvents.length,
      completedGames,
      scoresUpdated,
    }
  } catch (error) {
    console.error(`❌ Error fetching completed games for ${leagueKey}:`, error)
    return { 
      success: false, 
      gamesFetched: 0, 
      completedGames: 0, 
      scoresUpdated: 0, 
      error: (error as Error).message 
    }
  }
}

