import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// All 9 leagues to fetch
const LEAGUES = ['NFL', 'NBA', 'WNBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UCL']

// SportsGameOdds API sport mappings
const SPORT_MAPPINGS = {
  NFL: { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' },
  NBA: { sportID: 'BASKETBALL', leagueID: 'NBA', sport_key: 'basketball_nba' },
  WNBA: { sportID: 'BASKETBALL', leagueID: 'WNBA', sport_key: 'basketball_wnba' },
  MLB: { sportID: 'BASEBALL', leagueID: 'MLB', sport_key: 'baseball_mlb' },
  NHL: { sportID: 'HOCKEY', leagueID: 'NHL', sport_key: 'icehockey_nhl' },
  NCAAF: { sportID: 'FOOTBALL', leagueID: 'NCAAF', sport_key: 'americanfootball_ncaaf' },
  NCAAB: { sportID: 'BASKETBALL', leagueID: 'NCAAB', sport_key: 'basketball_ncaab' },
  MLS: { sportID: 'SOCCER', leagueID: 'MLS', sport_key: 'soccer_mls' },
  UCL: { sportID: 'SOCCER', leagueID: 'UCL', sport_key: 'soccer_uefa_champs_league' },
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to safely parse odds values
const safeParseOdds = (value) => {
  if (!value) return null
  const parsed = parseFloat(String(value))
  if (isNaN(parsed)) return null
  const limited = Math.min(Math.max(parsed, -9999.99), 9999.99)
  return Math.round(limited * 100) / 100
}

// Helper function to truncate strings
const truncateString = (value, maxLength) => {
  if (!value) return null
  const str = String(value)
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

// Transform SportsGameOdds event to our format
function transformSportsGameOddsEvent(event) {
  console.log('🔄 Transforming event:', event.eventID, 'for teams:', event.teams)

  const status = event.status || {}
  const teams = event.teams || {}
  const homeTeam = teams.home || {}
  const awayTeam = teams.away || {}
  const homeNames = homeTeam.names || {}
  const awayNames = awayTeam.names || {}

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
function normalizeTeamName(teamName) {
  if (!teamName) return 'Unknown'

  const teamMappings = {
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

// Save odds data with dual table strategy
async function saveOddsDataWithDualTables(gameId, odds) {
  try {
    const oddsRecords = []

    // Check if game has started
    const { data: gameData } = await supabase
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single()
    
    const gameHasStarted = gameData?.status === 'started' || gameData?.status === 'live' || gameData?.status === 'final'

    // Process each odd entry
    for (const [, oddData] of Object.entries(odds)) {
      const odd = oddData

      const marketName = odd.marketName || 'unknown'
      const betType = odd.betTypeID || 'unknown'
      const oddId = odd.oddID || null

      let oddsRecord = {
        eventid: gameId,
        sportsbook: 'SportsGameOdds',
        marketname: truncateString(marketName, 50),
        bettypeid: truncateString(betType, 50),
        sideid: truncateString(odd.sideID, 50),
        oddid: oddId,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      // Map bet types
      if (betType === 'ml') {
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds),
          line: null,
        }
      } else if (betType === 'sp') {
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds),
          line: (odd.bookSpread || odd.fairSpread) || null,
        }
      } else if (betType === 'ou') {
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds),
          line: (odd.bookOverUnder || odd.fairOverUnder) || null,
        }
      } else {
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds),
          line: (odd.bookSpread || odd.fairSpread || odd.bookOverUnder || odd.fairOverUnder) || null,
        }
      }

      // Process sportsbook data from byBookmaker field
      const byBookmaker = odd.byBookmaker || {}
      
      // Map supported sportsbooks
      if (byBookmaker.fanduel) {
        oddsRecord.fanduelodds = safeParseOdds(byBookmaker.fanduel.odds)
        oddsRecord.fanduellink = byBookmaker.fanduel.deeplink || null
      }

      if (byBookmaker.draftkings) {
        oddsRecord.draftkingsodds = safeParseOdds(byBookmaker.draftkings.odds)
        oddsRecord.draftkingslink = byBookmaker.draftkings.deeplink || null
      }

      if (byBookmaker.caesars) {
        oddsRecord.ceasarsodds = safeParseOdds(byBookmaker.caesars.odds)
        oddsRecord.ceasarslink = byBookmaker.caesars.deeplink || null
      }

      if (byBookmaker.betmgm) {
        oddsRecord.mgmodds = safeParseOdds(byBookmaker.betmgm.odds)
        oddsRecord.mgmlink = byBookmaker.betmgm.deeplink || null
      }

      if (byBookmaker.espnbet) {
        oddsRecord.espnbetodds = safeParseOdds(byBookmaker.espnbet.odds)
        oddsRecord.espnbetlink = byBookmaker.espnbet.deeplink || null
      }

      if (byBookmaker.fanatics) {
        oddsRecord.fanaticsodds = safeParseOdds(byBookmaker.fanatics.odds)
        oddsRecord.fanaticslink = byBookmaker.fanatics.deeplink || null
      }

      if (byBookmaker.bovada) {
        oddsRecord.bovadaodds = safeParseOdds(byBookmaker.bovada.odds)
        oddsRecord.bovadalink = byBookmaker.bovada.deeplink || null
      }

      oddsRecords.push(oddsRecord)
    }

    if (oddsRecords.length > 0) {
      // Check existing odds in open_odds table
      const existingOddsCheck = await supabase
        .from('open_odds')
        .select('oddid')
        .eq('eventid', gameId)
        .in('oddid', oddsRecords.map(r => r.oddid).filter(Boolean))

      const existingOddIds = new Set(existingOddsCheck.data?.map(r => r.oddid) || [])

      // Process each record
      for (const record of oddsRecords) {
        const recordWithTimestamp = {
          ...record,
          updated_at: new Date().toISOString(),
        }

        // If first time seeing this oddid, insert into open_odds
        if (!existingOddIds.has(record.oddid)) {
          const { error: openOddsError } = await supabase
            .from('open_odds')
            .insert(recordWithTimestamp)
            .onConflict(['eventid', 'oddid'])
            .ignore()

          if (openOddsError) {
            console.error('❌ Error inserting into open_odds:', openOddsError)
          } else {
            console.log(`📊 Saved opening odds for ${record.eventid}:${record.oddid}`)
          }
        }

        // Always upsert into odds table unless game has started
        if (!gameHasStarted) {
          const { error: oddsError } = await supabase
            .from('odds')
            .upsert(recordWithTimestamp, {
              onConflict: 'eventid,oddid',
              ignoreDuplicates: false
            })

          if (oddsError) {
            console.error('❌ Error upserting into odds:', oddsError)
          }
        } else {
          console.log(`⚠️ Game ${gameId} has started, skipping odds update for ${record.oddid}`)
        }
      }

      // Log sample record
      if (oddsRecords.length > 0) {
        const sampleRecord = oddsRecords[0]
        console.log('📋 Sample odds record:', {
          eventid: sampleRecord.eventid,
          oddid: sampleRecord.oddid,
          marketname: sampleRecord.marketname,
          fanduelodds: sampleRecord.fanduelodds,
          draftkingsodds: sampleRecord.draftkingsodds,
          bovadaodds: sampleRecord.bovadaodds,
          gameHasStarted,
        })
      }

      console.log(`✅ Processed ${oddsRecords.length} odds records for game ${gameId}`)
    }
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
  }
}

// Save game data to database
async function saveGameData(event, sportMapping) {
  try {
    const teams = event.teams
    const homeTeam = teams?.home
    const awayTeam = teams?.away

    const gameData = {
      id: event.eventID,
      sport: sportMapping.leagueID,
      league: sportMapping.leagueID,
      home_team: normalizeTeamName(homeTeam?.name),
      away_team: normalizeTeamName(awayTeam?.name),
      home_team_name: homeTeam?.name || '',
      away_team_name: awayTeam?.name || '',
      game_time: event.startTime ? new Date(event.startTime).toISOString() : new Date().toISOString(),
      status: event.status || 'scheduled',
      home_score: homeTeam?.score || null,
      away_score: awayTeam?.score || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('🔄 Saving game data:', gameData.id, gameData.home_team_name, 'vs', gameData.away_team_name)

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

    console.log('✅ Saved game:', savedGame.id)
    return savedGame
  } catch (error) {
    console.error('❌ Error in saveGameData:', error)
    return null
  }
}

// Fetch odds for a specific league
async function fetchLeagueOdds(leagueKey) {
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
    let nextCursor = null
    let allEvents = []
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
      params.append('startsAfter', startISO)
      params.append('startsBefore', futureDateISO)
      params.append('limit', '50')
      if (nextCursor) {
        params.append('cursor', nextCursor)
      }

      const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
      console.log(`🌐 Making API request for ${leagueKey} (page ${pageCount})`)

      const response = await fetch(apiUrl, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`⚠️ Rate limited for ${leagueKey}`)
          break
        }
        throw new Error(`SportsGameOdds API error for ${leagueKey}: ${response.status} ${response.statusText}`)
      }

      const pageData = await response.json()
      console.log(`📊 ${leagueKey} API page response:`, pageData?.data?.length || 0, 'games')

      if (pageData?.success && pageData?.data) {
        if (pageData.data.length === 0) {
          console.log(`⚠️ ${leagueKey} returned empty data, stopping pagination`)
          break
        }
        
        allEvents = allEvents.concat(pageData.data)
        nextCursor = pageData.nextCursor
        
        if (!nextCursor) {
          console.log(`✅ ${leagueKey} pagination complete`)
          break
        }
      } else {
        console.log(`⚠️ ${leagueKey} API response invalid`)
        break
      }

      if (allEvents.length > 500) {
        console.log(`⚠️ ${leagueKey} hit safety limit of 500 events`)
        break
      }
    } while (nextCursor && pageCount <= maxPages)

    console.log(`📊 ${leagueKey} total events fetched:`, allEvents.length)

    // Process and save each event
    let processedGames = 0
    for (const event of allEvents) {
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)
        const savedGame = await saveGameData(transformedEvent, sportMapping)
        
        if (savedGame && transformedEvent.odds) {
          await saveOddsDataWithDualTables(savedGame.id, transformedEvent.odds)
          processedGames++
        }
      } catch (eventError) {
        console.error(`❌ Error processing event in ${leagueKey}:`, eventError)
        continue
      }
    }

    console.log(`✅ ${leagueKey} completed: ${processedGames} games processed`)
    return { games: processedGames, success: true }

  } catch (error) {
    console.error(`❌ Error fetching ${leagueKey}:`, error)
    return { games: 0, success: false, error: error.message }
  }
}

// Main function to fetch odds for all leagues
async function fetchOddsAllLeagues() {
  console.log('🚀 Starting odds fetch for all 9 leagues...')
  
  if (!API_KEY) {
    console.error('❌ SportsGameOdds API key not configured')
    return
  }

  const results = []

  // Process each league sequentially to avoid rate limiting
  for (const league of LEAGUES) {
    console.log(`\\n🔄 Processing ${league}...`)
    
    try {
      const result = await fetchLeagueOdds(league)
      results.push({
        league,
        ...result
      })

      // Add delay between requests
      console.log('💤 Waiting 2 seconds before next league...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`❌ Error with ${league}:`, error)
      results.push({
        league,
        games: 0,
        success: false,
        error: error.message
      })
    }
  }

  // Summary
  const totalGames = results.reduce((sum, result) => sum + result.games, 0)
  const successfulLeagues = results.filter(r => r.success).length
  
  console.log('\\n📊 SUMMARY:')
  console.log(`✅ Successful leagues: ${successfulLeagues}/${LEAGUES.length}`)
  console.log(`📈 Total games processed: ${totalGames}`)
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.league}: ${result.games} games${result.error ? ` (${result.error})` : ''}`)
  })

  return results
}

// Export for use
export { fetchOddsAllLeagues }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOddsAllLeagues().catch(console.error)
}