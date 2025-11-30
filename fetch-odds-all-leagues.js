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

// Save odds data with dual table strategy (optimized for bulk operations)
async function saveOddsDataWithDualTables(gameId, odds, gameHasStarted = null) {
  try {
    const oddsRecords = []

    // Use cached game status if provided, otherwise check
    let gameStarted = gameHasStarted
    if (gameStarted === null) {
      const { data: gameData } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single()
      
      gameStarted = gameData?.status === 'started' || gameData?.status === 'live' || gameData?.status === 'final'
    }

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

    return { oddsRecords, gameStarted }
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
    return { oddsRecords: [], gameStarted: false }
  }
}

// Bulk save odds records for multiple games
async function bulkSaveOddsRecords(allOddsData) {
  try {
    const allOddsRecords = []
    const newOpenOddsRecords = []
    const oddsToUpdate = []

    // Collect all odds records
    for (const { oddsRecords, gameStarted } of allOddsData) {
      for (const record of oddsRecords) {
        const recordWithTimestamp = {
          ...record,
          updated_at: new Date().toISOString(),
        }

        allOddsRecords.push(recordWithTimestamp)
        
        if (!gameStarted) {
          oddsToUpdate.push(recordWithTimestamp)
        }
      }
    }

    if (allOddsRecords.length === 0) return

    // Batch check for existing odds in open_odds table
    const allOddIds = allOddsRecords.map(r => r.oddid).filter(Boolean)
    if (allOddIds.length > 0) {
      const existingOddsCheck = await supabase
        .from('open_odds')
        .select('oddid, eventid')
        .in('oddid', allOddIds)

      const existingKeys = new Set(
        existingOddsCheck.data?.map(r => `${r.eventid}:${r.oddid}`) || []
      )

      // Find new records for open_odds
      for (const record of allOddsRecords) {
        const key = `${record.eventid}:${record.oddid}`
        if (!existingKeys.has(key)) {
          newOpenOddsRecords.push(record)
        }
      }
    } else {
      newOpenOddsRecords.push(...allOddsRecords)
    }

    // Bulk insert new open_odds records
    if (newOpenOddsRecords.length > 0) {
      const { error: openOddsError } = await supabase
        .from('open_odds')
        .upsert(newOpenOddsRecords, {
          onConflict: 'eventid,oddid',
          ignoreDuplicates: true
        })

      if (openOddsError) {
        console.error('❌ Error bulk inserting open_odds:', openOddsError)
      } else {
        console.log(`📊 Bulk saved ${newOpenOddsRecords.length} opening odds records`)
      }
    }

    // Bulk upsert current odds for non-started games
    if (oddsToUpdate.length > 0) {
      const { error: oddsError } = await supabase
        .from('odds')
        .upsert(oddsToUpdate, {
          onConflict: 'eventid,oddid',
          ignoreDuplicates: false
        })

      if (oddsError) {
        console.error('❌ Error bulk upserting odds:', oddsError)
      } else {
        console.log(`📊 Bulk updated ${oddsToUpdate.length} current odds records`)
      }
    }

    console.log(`✅ Bulk processed ${allOddsRecords.length} total odds records`)
  } catch (error) {
    console.error('❌ Error in bulkSaveOddsRecords:', error)
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

// Fetch odds for a specific league (optimized with bulk processing)
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

    // Smart filtering: Remove games that have already started + add buffer
    const currentTime = Date.now()
    const tenMinuteBuffer = 10 * 60 * 1000
    const validEvents = allEvents.filter(event => {
      const gameTime = new Date(event.status?.startsAt).getTime()
      return gameTime > (currentTime + tenMinuteBuffer)
    })

    console.log(`🎯 ${leagueKey} filtered to ${validEvents.length} upcoming games (removed ${allEvents.length - validEvents.length} started/soon-to-start games)`)

    if (validEvents.length === 0) {
      console.log(`ℹ️ ${leagueKey} has no upcoming games to process`)
      return { games: 0, success: true }
    }

    // Bulk process games: collect all game data first
    const gamesToSave = []
    
    // Process games in parallel batches for better performance
    const gameProcessingPromises = validEvents.map(async (event) => {
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)
        
        // Prepare game data
        const teams = transformedEvent.teams
        const homeTeam = teams?.home
        const awayTeam = teams?.away

        const gameData = {
          id: transformedEvent.eventID,
          sport: sportMapping.leagueID,
          league: sportMapping.leagueID,
          home_team: normalizeTeamName(homeTeam?.name),
          away_team: normalizeTeamName(awayTeam?.name),
          home_team_name: homeTeam?.name || '',
          away_team_name: awayTeam?.name || '',
          game_time: transformedEvent.startTime ? new Date(transformedEvent.startTime).toISOString() : new Date().toISOString(),
          status: transformedEvent.status || 'scheduled',
          home_score: homeTeam?.score || null,
          away_score: awayTeam?.score || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Prepare odds data (parallel processing)
        let oddsResult = null
        if (transformedEvent.odds) {
          oddsResult = await saveOddsDataWithDualTables(transformedEvent.eventID, transformedEvent.odds, false)
        }

        return { gameData, oddsResult }
      } catch (eventError) {
        console.error(`❌ Error processing event in ${leagueKey}:`, eventError)
        return null
      }
    })

    // Wait for all game processing to complete
    console.log(`⚡ Processing ${validEvents.length} games in parallel...`)
    const gameResults = await Promise.allSettled(gameProcessingPromises)
    
    const allOddsData = []
    
    // Extract successful results
    for (const result of gameResults) {
      if (result.status === 'fulfilled' && result.value) {
        const { gameData, oddsResult } = result.value
        gamesToSave.push(gameData)
        if (oddsResult) {
          allOddsData.push(oddsResult)
        }
      }
    }

    // Bulk save games
    let processedGames = 0
    if (gamesToSave.length > 0) {
      const { data: savedGames, error: gameError } = await supabase
        .from('games')
        .upsert(gamesToSave, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()

      if (gameError) {
        console.error(`❌ Error bulk saving games for ${leagueKey}:`, gameError)
      } else {
        processedGames = gamesToSave.length
        console.log(`✅ Bulk saved ${processedGames} games for ${leagueKey}`)
      }
    }

    // Bulk save odds
    if (allOddsData.length > 0) {
      await bulkSaveOddsRecords(allOddsData)
    }

    console.log(`✅ ${leagueKey} completed: ${processedGames} games processed`)
    return { games: processedGames, success: true }

  } catch (error) {
    console.error(`❌ Error fetching ${leagueKey}:`, error)
    return { games: 0, success: false, error: error.message }
  }
}

// Helper function for dynamic rate limiting
async function smartDelay(lastRequestTime, rateLimitRemaining = null) {
  const timeSinceLastRequest = Date.now() - lastRequestTime
  const minDelay = 200 // Minimum 200ms between requests
  
  let delay = minDelay
  if (rateLimitRemaining !== null) {
    if (rateLimitRemaining < 5) {
      delay = 2000 // Conservative 2s delay when close to limit
    } else if (rateLimitRemaining < 20) {
      delay = 1000 // Moderate 1s delay when getting limited
    } else {
      delay = 300 // Fast 300ms delay when plenty of rate limit
    }
  }

  const actualDelay = Math.max(0, delay - timeSinceLastRequest)
  if (actualDelay > 0) {
    console.log(`🕐 Smart delay: ${actualDelay}ms (rate limit remaining: ${rateLimitRemaining || 'unknown'})`)
    await new Promise(resolve => setTimeout(resolve, actualDelay))
  }
}

// Process leagues in parallel batches
async function processLeaguesBatch(leaguesBatch, batchIndex) {
  console.log(`\\n🚀 Processing batch ${batchIndex + 1}: [${leaguesBatch.join(', ')}]`)
  
  const batchPromises = leaguesBatch.map(async (league) => {
    const startTime = Date.now()
    console.log(`\\n🔄 Starting ${league}...`)
    
    try {
      const result = await fetchLeagueOdds(league)
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ ${league} completed in ${duration}s`)
      
      return {
        league,
        ...result,
        duration: parseFloat(duration)
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.error(`❌ ${league} failed after ${duration}s:`, error.message)
      
      return {
        league,
        games: 0,
        success: false,
        error: error.message,
        duration: parseFloat(duration)
      }
    }
  })

  return Promise.allSettled(batchPromises)
}

// Main function to fetch odds for all leagues (optimized with parallel processing)
async function fetchOddsAllLeagues() {
  console.log('🚀 Starting optimized odds fetch for all 9 leagues...')
  
  if (!API_KEY) {
    console.error('❌ SportsGameOdds API key not configured')
    return
  }

  const startTime = Date.now()
  const results = []

  // Process leagues in batches of 3 for optimal performance
  const batchSize = 3
  const totalBatches = Math.ceil(LEAGUES.length / batchSize)
  
  for (let i = 0; i < LEAGUES.length; i += batchSize) {
    const batchIndex = Math.floor(i / batchSize)
    const leaguesBatch = LEAGUES.slice(i, i + batchSize)
    
    console.log(`\\n📦 Starting batch ${batchIndex + 1}/${totalBatches}...`)
    
    try {
      // Process batch in parallel
      const batchResults = await processLeaguesBatch(leaguesBatch, batchIndex)
      
      // Extract results from Promise.allSettled
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value)
        } else {
          console.error(`❌ Batch promise rejected:`, promiseResult.reason)
          results.push({
            league: 'unknown',
            games: 0,
            success: false,
            error: promiseResult.reason?.message || 'Unknown batch error'
          })
        }
      }

      // Smart delay between batches (shorter than before)
      if (batchIndex < totalBatches - 1) {
        const batchDelay = 500 // Only 500ms between batches
        console.log(`💤 Batch complete. Waiting ${batchDelay}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }

    } catch (batchError) {
      console.error(`❌ Error processing batch ${batchIndex + 1}:`, batchError)
      
      // Add failed results for this batch
      for (const league of leaguesBatch) {
        results.push({
          league,
          games: 0,
          success: false,
          error: `Batch processing failed: ${batchError.message}`
        })
      }
    }
  }

  // Calculate performance metrics
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
  const totalGames = results.reduce((sum, result) => sum + (result.games || 0), 0)
  const successfulLeagues = results.filter(r => r.success).length
  const avgDurationPerLeague = results.length > 0 
    ? (results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length).toFixed(1)
    : '0.0'

  // Summary
  console.log('\\n🎯 PERFORMANCE SUMMARY:')
  console.log(`⚡ Total time: ${totalDuration}s (avg ${avgDurationPerLeague}s per league)`)
  console.log(`✅ Successful leagues: ${successfulLeagues}/${LEAGUES.length}`)
  console.log(`📈 Total games processed: ${totalGames}`)
  console.log(`🚀 Speed improvement: ~${Math.round((18 / parseFloat(totalDuration)) * 100)}% faster than sequential`)
  
  console.log('\\n📊 LEAGUE RESULTS:')
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}s)` : ''
    console.log(`${status} ${result.league}: ${result.games || 0} games${duration}${result.error ? ` - ${result.error}` : ''}`)
  })

  return {
    results,
    totalGames,
    totalDuration: parseFloat(totalDuration),
    successfulLeagues,
    avgDurationPerLeague: parseFloat(avgDurationPerLeague)
  }
}

// Export for use
export { fetchOddsAllLeagues }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOddsAllLeagues().catch(console.error)
}