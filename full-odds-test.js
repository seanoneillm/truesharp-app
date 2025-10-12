const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Full debug stats
const fullStats = {
  startTime: Date.now(),
  apiGamesFetched: 0,
  totalApiOdds: 0,
  totalProcessedOdds: 0,
  totalAttemptedInserts: 0,
  totalSuccessfulInserts: 0,
  duplicateErrors: 0,
  playerPropCount: 0,
  mainLineCount: 0,
  gamesPropCount: 0,
  insertionErrors: [],
  samplePlayerProps: []
}

// Helper function to safely parse odds values  
const safeParseOdds = (value) => {
  if (!value) return null
  const parsed = parseFloat(String(value))
  if (isNaN(parsed)) return null
  
  // Filter out clearly invalid odds
  if (Math.abs(parsed) > 50000) {
    console.log(`⚠️ Filtering out extreme odds value: ${parsed}`)
    return null
  }
  
  const limited = Math.min(Math.max(parsed, -9999), 9999)
  return Math.round(limited)
}

// Helper function to truncate strings
const truncateString = (value, maxLength) => {
  if (!value) return null
  const str = String(value)
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

// Helper function to normalize line values
function normalizeLineValue(line) {
  if (line === null || line === undefined || line === 'null' || line === '') {
    return null
  }
  return String(line)
}

// Process individual odd record (matching the actual API logic)
async function processOddRecord(odd, oddId, gameId, oddsRecords) {
  const marketName = odd.marketName || 'unknown'
  const betType = odd.betTypeID || 'unknown'

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

  // Map bet types and extract line value
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
      line: normalizeLineValue(odd.bookSpread || odd.fairSpread),
    }
  } else if (betType === 'ou') {
    oddsRecord = {
      ...oddsRecord,
      bookodds: safeParseOdds(odd.bookOdds),
      line: normalizeLineValue(odd.bookOverUnder || odd.fairOverUnder),
    }
  } else {
    oddsRecord = {
      ...oddsRecord,
      bookodds: safeParseOdds(odd.bookOdds),
      line: normalizeLineValue(odd.bookSpread || odd.fairSpread || odd.bookOverUnder || odd.fairOverUnder),
    }
  }

  // Process sportsbook data
  const byBookmaker = odd.byBookmaker || {}
  
  const fanduel = byBookmaker.fanduel
  if (fanduel) {
    oddsRecord.fanduelodds = safeParseOdds(fanduel.odds)
    oddsRecord.fanduellink = fanduel.deeplink || null
  }

  const draftkings = byBookmaker.draftkings
  if (draftkings) {
    oddsRecord.draftkingsodds = safeParseOdds(draftkings.odds)
    oddsRecord.draftkingslink = draftkings.deeplink || null
  }

  const caesars = byBookmaker.caesars
  if (caesars) {
    oddsRecord.ceasarsodds = safeParseOdds(caesars.odds)
    oddsRecord.ceasarslink = caesars.deeplink || null
  }

  const betmgm = byBookmaker.betmgm
  if (betmgm) {
    oddsRecord.mgmodds = safeParseOdds(betmgm.odds)
    oddsRecord.mgmlink = betmgm.deeplink || null
  }

  const bovada = byBookmaker.bovada
  if (bovada) {
    oddsRecord.bovadaodds = safeParseOdds(bovada.odds)
    oddsRecord.bovadalink = bovada.deeplink || null
  }

  // Categorize the odds type
  if (oddId.includes('_NFL')) {
    fullStats.playerPropCount++
    if (fullStats.samplePlayerProps.length < 10) {
      fullStats.samplePlayerProps.push({
        oddId,
        marketName,
        gameId
      })
    }
  } else if (oddId.includes('-all-')) {
    fullStats.gamesPropCount++
  } else {
    fullStats.mainLineCount++
  }

  oddsRecords.push(oddsRecord)
  fullStats.totalProcessedOdds++
}

// Save odds data (matching the dual table logic)
async function saveOddsDataWithDualTables(gameId, odds) {
  try {
    const oddsRecords = []

    // Check if game has started (simplified version)
    const { data: gameData } = await supabase
      .from('games')
      .select('status, game_time')
      .eq('id', gameId)
      .single()
    
    const gameHasStarted = gameData?.status === 'started' || 
                          gameData?.status === 'live' || 
                          gameData?.status === 'final'

    if (gameHasStarted) {
      console.log(`⏭️ Skipping game ${gameId} - already started`)
      return
    }

    // Process all odds from API
    const oddsArray = Object.values(odds)
    
    // Track processed odds to avoid duplicates
    const processedMainLines = new Set()
    const processedAltLines = new Set()
    
    console.log(`🔧 Processing ${oddsArray.length} odds for game ${gameId}`)
    
    // Process each odd (FULL PROCESSING - NO LIMITS)
    for (const odd of oddsArray) {
      const oddId = odd.oddID || null
      if (!oddId) continue

      // Process main line
      const mainLineKey = `${gameId}:${oddId}`
      if (!processedMainLines.has(mainLineKey)) {
        await processOddRecord(odd, oddId, gameId, oddsRecords)
        processedMainLines.add(mainLineKey)
      }

      // Process alternate lines from sportsbooks
      const byBookmaker = odd.byBookmaker || {}
      
      for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
        const sportsbook = sportsbookData
        const altLines = sportsbook.altLines || []
        
        if (altLines.length > 0) {
          for (const altLine of altLines) {
            const lineValue = altLine.spread || altLine.overUnder || `alt-${Date.now()}`
            const altLineKey = `${gameId}:${oddId}:${lineValue}`
            
            if (!processedAltLines.has(altLineKey)) {
              const altOdd = {
                marketName: odd.marketName,
                betTypeID: odd.betTypeID,
                sideID: odd.sideID,
                oddID: odd.oddID,
                bookOdds: altLine.odds,
                bookSpread: altLine.spread,
                bookOverUnder: altLine.overUnder,
                fairSpread: altLine.spread,
                fairOverUnder: altLine.overUnder,
                byBookmaker: { [sportsbookName]: sportsbook }
              }
              
              await processOddRecord(altOdd, oddId, gameId, oddsRecords)
              processedAltLines.add(altLineKey)
            }
          }
        }
      }
    }

    if (oddsRecords.length > 0) {
      console.log(`💾 Attempting to insert ${oddsRecords.length} records for game ${gameId}`)
      fullStats.totalAttemptedInserts += oddsRecords.length
      
      // Add timestamps
      const recordsWithTimestamp = oddsRecords.map(record => ({
        ...record,
        line: normalizeLineValue(record.line),
        updated_at: new Date().toISOString(),
      }))

      // Insert into odds table 
      const { data: insertedOdds, error: oddsError } = await supabase
        .from('odds')
        .insert(recordsWithTimestamp)
        .select('id')

      if (!oddsError) {
        const actualInserted = insertedOdds?.length || 0
        fullStats.totalSuccessfulInserts += actualInserted
        console.log(`✅ Successfully inserted ${actualInserted} odds records`)
      } else {
        if (oddsError.message?.includes('duplicate')) {
          fullStats.duplicateErrors++
          console.log(`ℹ️ Some duplicates handled by database constraints (expected)`)
        } else {
          console.error(`❌ Insertion error: ${oddsError.message}`)
          fullStats.insertionErrors.push({
            gameId,
            error: oddsError.message,
            recordCount: oddsRecords.length
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
    fullStats.insertionErrors.push({
      gameId,
      error: error.message,
      recordCount: oddsRecords?.length || 0
    })
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
      home_team: homeTeam?.names?.long || homeTeam?.name || 'Unknown Home Team',
      away_team: awayTeam?.names?.long || awayTeam?.name || 'Unknown Away Team',
      home_team_name: homeTeam?.names?.long || homeTeam?.name || '',
      away_team_name: awayTeam?.names?.long || awayTeam?.name || '',
      game_time: event.startTime ? new Date(event.startTime).toISOString() : new Date().toISOString(),
      status: event.status || 'scheduled',
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

// Main test function
async function fullOddsTest() {
  console.log('🚀 Starting FULL odds processing test...')
  console.log(`📅 Start time: ${new Date().toISOString()}`)
  
  const NFL_MAPPING = { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' }
  
  try {
    // Calculate date range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Fetching NFL games from ${startISO} to ${futureDateISO}`)
    
    const params = new URLSearchParams()
    params.append('leagueID', NFL_MAPPING.leagueID)
    params.append('type', 'match')
    params.append('startsAfter', startISO)
    params.append('startsBefore', futureDateISO)
    params.append('limit', '3') // Process first 3 games fully
    params.append('includeAltLines', 'true')
    
    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
    console.log(`🌐 API URL: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data?.data?.length) {
      console.log('❌ No NFL games found')
      return
    }
    
    fullStats.apiGamesFetched = data.data.length
    console.log(`\\n🏈 Processing ${data.data.length} NFL games with FULL processing...`)
    
    // Process each game completely
    for (let i = 0; i < data.data.length; i++) {
      const event = data.data[i]
      const gameId = event.eventID
      
      console.log(`\\n🎮 Processing Game ${i + 1}: ${event.eventID}`)
      console.log(`   Teams: ${event.teams?.away?.names?.long || 'Away'} @ ${event.teams?.home?.names?.long || 'Home'}`)
      console.log(`   Start: ${event.status?.startsAt || event.startTime || 'Unknown'}`)
      
      if (!event.odds) {
        console.log('   ⚠️ No odds data for this game')
        continue
      }
      
      const gameOddsCount = Object.keys(event.odds).length
      fullStats.totalApiOdds += gameOddsCount
      console.log(`   📊 API odds entries: ${gameOddsCount}`)
      
      // Save game first
      const savedGame = await saveGameData(event, NFL_MAPPING)
      
      if (savedGame && event.odds) {
        // Process ALL odds for this game
        await saveOddsDataWithDualTables(savedGame.id, event.odds)
      }
      
      // Check if we've hit our time limit (30 seconds)
      if (Date.now() - fullStats.startTime > 30000) {
        console.log(`\\n⏰ 30 second time limit reached`)
        break
      }
    }
    
    // Final database query to verify what we have
    const { count: totalOddsInDb, error: countError } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    console.log(`\\n📊 Current total odds in database: ${totalOddsInDb || 'Error getting count'}`)
    
  } catch (error) {
    console.error('❌ Full test error:', error)
  }
  
  // Print comprehensive final report
  const executionTime = (Date.now() - fullStats.startTime) / 1000
  
  console.log(`\\n\\n🎯 ===== COMPREHENSIVE FINAL REPORT =====`)
  console.log(`⏱️  Total execution time: ${executionTime.toFixed(1)}s`)
  console.log(`🎮 NFL games processed: ${fullStats.apiGamesFetched}`)
  console.log(`📊 Total API odds received: ${fullStats.totalApiOdds}`)
  console.log(`🔧 Total odds processed: ${fullStats.totalProcessedOdds}`)
  console.log(`💾 Total odds attempted for insertion: ${fullStats.totalAttemptedInserts}`)
  console.log(`✅ Total odds actually inserted: ${fullStats.totalSuccessfulInserts}`)
  console.log(`🔄 Duplicate errors (expected): ${fullStats.duplicateErrors}`)
  
  console.log(`\\n📈 Odds Breakdown:`)
  console.log(`  🏈 Player Props: ${fullStats.playerPropCount}`)
  console.log(`  📊 Main Lines: ${fullStats.mainLineCount}`)
  console.log(`  🎯 Game Props: ${fullStats.gamesPropCount}`)
  
  console.log(`\\n🏃 Sample Player Props Found:`)
  fullStats.samplePlayerProps.slice(0, 5).forEach((prop, i) => {
    console.log(`  ${i + 1}. ${prop.oddId} - ${prop.marketName}`)
  })
  
  if (fullStats.insertionErrors.length > 0) {
    console.log(`\\n❌ Insertion Errors (${fullStats.insertionErrors.length}):`)
    fullStats.insertionErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. Game ${error.gameId}: ${error.error}`)
    })
  }
  
  console.log(`\\n📊 Key Metrics:`)
  console.log(`  • Processing efficiency: ${((fullStats.totalProcessedOdds / fullStats.totalApiOdds) * 100).toFixed(1)}%`)
  console.log(`  • Insertion success rate: ${((fullStats.totalSuccessfulInserts / fullStats.totalAttemptedInserts) * 100).toFixed(1)}%`)
  console.log(`  • Player props ratio: ${((fullStats.playerPropCount / fullStats.totalProcessedOdds) * 100).toFixed(1)}%`)
  
  console.log(`\\n✅ Full test completed at ${new Date().toISOString()}`)
}

// Export for direct execution
module.exports = { fullOddsTest }

// Run if called directly
if (require.main === module) {
  fullOddsTest().catch(console.error)
}