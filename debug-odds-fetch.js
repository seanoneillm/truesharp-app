const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// Debug stats tracking
const debugStats = {
  rawApiOdds: 0,
  parsedOdds: 0,
  attemptedInserts: 0,
  actualInserts: 0,
  droppedDueToMapping: 0,
  nflGameCount: 0,
  nflPlayerProps: 0,
  apiResponses: [],
  mappingIssues: [],
  insertionIssues: []
}

// Load known mappings from the games-page.md file
const knownMappings = new Set([
  // NFL Player Props - Quarterback
  'passing_yards', 'passing_touchdowns', 'passing_interceptions', 'passing_completions',
  'passing_attempts', 'passing_longestCompletion', 'passing_passerRating',
  // NFL Player Props - Running Back & Receivers
  'rushing_yards', 'rushing_touchdowns', 'rushing_attempts', 'rushing_longestRush',
  'receiving_yards', 'receiving_receptions', 'receiving_touchdowns', 'receiving_longestReception',
  'rushing+receiving_yards', 'passing+rushing_yards',
  // NFL Player Props - Defense & Kicker
  'defense_sacks', 'defense_interceptions', 'defense_fumbleRecoveries', 'defense_touchdowns', 'defense_tackles',
  'kicking_totalPoints', 'fieldGoals_made', 'extraPoints_kicksMade', 'fieldGoals_longestMade',
  // General Props
  'fantasyScore', 'turnovers', 'firstTouchdown', 'lastTouchdown', 'firstToScore', 'touchdowns',
  // Main Lines
  'points', 'touchdowns'
])

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to extract market from oddId
function extractMarketFromOddId(oddId) {
  if (!oddId) return null
  const parts = oddId.split('-')
  return parts[0] || null
}

// Helper function to check if market is mapped
function isMarketMapped(oddId) {
  const market = extractMarketFromOddId(oddId)
  if (!market) return false
  
  // Check exact matches and partial matches
  for (const knownMarket of knownMappings) {
    if (market.includes(knownMarket) || knownMarket.includes(market)) {
      return true
    }
  }
  
  return false
}

// Enhanced logging function
function logApiResponse(data, league) {
  console.log(`\\n🔍 [DEBUG] API Response for ${league}:`)
  console.log(`Events count: ${data?.data?.length || 0}`)
  
  if (data?.data?.length > 0) {
    const firstEvent = data.data[0]
    console.log(`Sample event structure:`, JSON.stringify(firstEvent, null, 2).substring(0, 1000))
    
    // Count odds in first event
    if (firstEvent.odds) {
      const oddsCount = Object.keys(firstEvent.odds).length
      debugStats.rawApiOdds += oddsCount
      console.log(`Sample event has ${oddsCount} odds entries`)
      
      // Log first few odds entries with full detail
      const oddsEntries = Object.entries(firstEvent.odds).slice(0, 5)
      console.log(`\\n📊 Sample odds entries:`)
      oddsEntries.forEach(([oddId, oddData], i) => {
        const market = extractMarketFromOddId(oddId)
        const isMapped = isMarketMapped(oddId)
        console.log(`  ${i + 1}. ${oddId}`)
        console.log(`     Market: ${market}`)
        console.log(`     Mapped: ${isMapped}`)
        console.log(`     Data: ${JSON.stringify(oddData, null, 2).substring(0, 200)}...`)
        
        if (!isMapped) {
          debugStats.droppedDueToMapping++
          debugStats.mappingIssues.push({
            oddId,
            market,
            reason: 'Not found in known mappings'
          })
        }
      })
    }
  }
  
  debugStats.apiResponses.push({
    league,
    eventCount: data?.data?.length || 0,
    timestamp: new Date().toISOString()
  })
}

// Enhanced odds processing with detailed logging
async function processOddRecordDebug(odd, oddId, gameId, oddsRecords) {
  const marketName = odd.marketName || 'unknown'
  const betType = odd.betTypeID || 'unknown'
  
  console.log(`\\n🔧 Processing odd: ${oddId}`)
  console.log(`  Market: ${marketName}`)
  console.log(`  Bet Type: ${betType}`)
  console.log(`  Side ID: ${odd.sideID}`)
  
  const market = extractMarketFromOddId(oddId)
  const isMapped = isMarketMapped(oddId)
  
  console.log(`  Extracted Market: ${market}`)
  console.log(`  Is Mapped: ${isMapped}`)
  
  if (!isMapped) {
    console.log(`  ⚠️ DROPPED: Market not mapped`)
    debugStats.droppedDueToMapping++
    debugStats.mappingIssues.push({
      oddId,
      market,
      marketName,
      gameId,
      reason: 'Market not in mapping file'
    })
    return // Don't process unmapped odds
  }
  
  debugStats.parsedOdds++
  
  // Check if this is an NFL player prop
  if (gameId && market && (
    market.includes('passing_') || market.includes('rushing_') || 
    market.includes('receiving_') || market.includes('defense_') ||
    market.includes('kicking_') || market.includes('fieldGoals_')
  )) {
    debugStats.nflPlayerProps++
    console.log(`  🏈 NFL Player Prop detected: ${market}`)
  }
  
  let oddsRecord = {
    eventid: gameId,
    sportsbook: 'SportsGameOdds',
    marketname: marketName?.substring(0, 50),
    bettypeid: betType?.substring(0, 50),
    sideid: odd.sideID?.toString().substring(0, 50),
    oddid: oddId,
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
  
  // Process odds values
  if (betType === 'ml') {
    oddsRecord.bookodds = parseFloat(odd.bookOdds) || null
    oddsRecord.line = null
  } else if (betType === 'sp') {
    oddsRecord.bookodds = parseFloat(odd.bookOdds) || null
    oddsRecord.line = (odd.bookSpread || odd.fairSpread)?.toString() || null
  } else if (betType === 'ou') {
    oddsRecord.bookodds = parseFloat(odd.bookOdds) || null
    oddsRecord.line = (odd.bookOverUnder || odd.fairOverUnder)?.toString() || null
  } else {
    oddsRecord.bookodds = parseFloat(odd.bookOdds) || null
    oddsRecord.line = (odd.bookSpread || odd.fairSpread || odd.bookOverUnder || odd.fairOverUnder)?.toString() || null
  }
  
  console.log(`  📈 Odds: ${oddsRecord.bookodds}, Line: ${oddsRecord.line}`)
  
  // Process sportsbook data
  const byBookmaker = odd.byBookmaker || {}
  const sportsbookCount = Object.keys(byBookmaker).length
  console.log(`  🏪 Sportsbooks with data: ${sportsbookCount}`)
  
  // Map sportsbooks
  if (byBookmaker.fanduel) {
    oddsRecord.fanduelodds = parseFloat(byBookmaker.fanduel.odds) || null
    oddsRecord.fanduellink = byBookmaker.fanduel.deeplink || null
  }
  if (byBookmaker.draftkings) {
    oddsRecord.draftkingsodds = parseFloat(byBookmaker.draftkings.odds) || null
    oddsRecord.draftkingslink = byBookmaker.draftkings.deeplink || null
  }
  if (byBookmaker.caesars) {
    oddsRecord.ceasarsodds = parseFloat(byBookmaker.caesars.odds) || null
    oddsRecord.ceasarslink = byBookmaker.caesars.deeplink || null
  }
  if (byBookmaker.betmgm) {
    oddsRecord.mgmodds = parseFloat(byBookmaker.betmgm.odds) || null
    oddsRecord.mgmlink = byBookmaker.betmgm.deeplink || null
  }
  if (byBookmaker.bovada) {
    oddsRecord.bovadaodds = parseFloat(byBookmaker.bovada.odds) || null
    oddsRecord.bovadalink = byBookmaker.bovada.deeplink || null
  }
  
  oddsRecords.push(oddsRecord)
  debugStats.attemptedInserts++
  
  console.log(`  ✅ Added to insertion queue`)
}

// Main debug function
async function debugOddsFetch() {
  console.log('🚀 Starting DEBUG odds fetch...')
  console.log(`📅 Start time: ${new Date().toISOString()}`)
  
  const startTime = Date.now()
  const NFL_MAPPING = { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' }
  
  try {
    // Calculate date range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Fetching NFL games from ${startISO} to ${futureDateISO}`)
    
    // Fetch NFL events
    const params = new URLSearchParams()
    params.append('leagueID', NFL_MAPPING.leagueID)
    params.append('type', 'match')
    params.append('startsAfter', startISO)
    params.append('startsBefore', futureDateISO)
    params.append('limit', '10') // Limit for debugging
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
    console.log(`\\n📦 API Response received`)
    logApiResponse(data, 'NFL')
    
    if (!data?.data?.length) {
      console.log('❌ No NFL games found')
      return
    }
    
    console.log(`\\n🏈 Processing ${data.data.length} NFL games...`)
    debugStats.nflGameCount = data.data.length
    
    // Process each game
    for (let i = 0; i < Math.min(data.data.length, 3); i++) { // Limit to first 3 games for debug
      const event = data.data[i]
      const gameId = event.eventID
      
      console.log(`\\n🎮 Processing Game ${i + 1}: ${event.eventID}`)
      console.log(`   Teams: ${event.teams?.away?.names?.long || 'Away'} @ ${event.teams?.home?.names?.long || 'Home'}`)
      console.log(`   Start: ${event.status?.startsAt || 'Unknown'}`)
      
      if (!event.odds) {
        console.log('   ⚠️ No odds data for this game')
        continue
      }
      
      const gameOddsCount = Object.keys(event.odds).length
      console.log(`   📊 Odds entries: ${gameOddsCount}`)
      
      const oddsRecords = []
      const oddsArray = Object.values(event.odds)
      
      // Process each odd with detailed logging
      let processedCount = 0
      for (const [oddId, odd] of Object.entries(event.odds)) {
        if (processedCount >= 20) { // Limit processing for debug
          console.log(`   🔄 Limited to first 20 odds for debugging`)
          break
        }
        
        await processOddRecordDebug(odd, oddId, gameId, oddsRecords)
        processedCount++
        
        // Check elapsed time
        if (Date.now() - startTime > 30000) { // 30 seconds
          console.log(`\\n⏰ 30 second limit reached, stopping...`)
          break
        }
      }
      
      console.log(`\\n💾 Attempting database insertion for game ${gameId}`)
      console.log(`   Records to insert: ${oddsRecords.length}`)
      
      if (oddsRecords.length > 0) {
        // First save game data
        const gameData = {
          id: event.eventID,
          sport: 'NFL',
          league: 'NFL',
          home_team: event.teams?.home?.names?.long || 'Unknown',
          away_team: event.teams?.away?.names?.long || 'Unknown',
          home_team_name: event.teams?.home?.names?.long || '',
          away_team_name: event.teams?.away?.names?.long || '',
          game_time: event.status?.startsAt ? new Date(event.status.startsAt).toISOString() : new Date().toISOString(),
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        const { error: gameError } = await supabase
          .from('games')
          .upsert(gameData, { onConflict: 'id', ignoreDuplicates: false })
        
        if (gameError) {
          console.log(`   ❌ Game insert error: ${gameError.message}`)
        } else {
          console.log(`   ✅ Game saved successfully`)
        }
        
        // Insert odds
        const { data: insertedOdds, error: oddsError } = await supabase
          .from('odds')
          .insert(oddsRecords)
          .select('id')
        
        if (oddsError) {
          console.log(`   ❌ Odds insert error: ${oddsError.message}`)
          debugStats.insertionIssues.push({
            gameId,
            error: oddsError.message,
            recordCount: oddsRecords.length
          })
        } else {
          const actualInserted = insertedOdds?.length || 0
          debugStats.actualInserts += actualInserted
          console.log(`   ✅ Successfully inserted ${actualInserted} odds records`)
        }
      }
      
      // Check time limit
      if (Date.now() - startTime > 30000) {
        console.log(`\\n⏰ 30 second time limit reached`)
        break
      }
    }
    
    // Final database query to count total odds
    const { count: totalOddsInDb, error: countError } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    if (!countError) {
      console.log(`\\n📊 Total odds in database: ${totalOddsInDb}`)
    }
    
  } catch (error) {
    console.error('❌ Debug fetch error:', error)
  }
  
  // Print comprehensive summary
  console.log(`\\n\\n🎯 ===== DEBUG SUMMARY =====`)
  console.log(`⏱️  Execution time: ${(Date.now() - startTime) / 1000}s`)
  console.log(`🏈 NFL games found: ${debugStats.nflGameCount}`)
  console.log(`📊 Raw API odds received: ${debugStats.rawApiOdds}`)
  console.log(`🔧 Odds parsed and mapped: ${debugStats.parsedOdds}`)
  console.log(`💾 Odds attempted for insertion: ${debugStats.attemptedInserts}`)
  console.log(`✅ Odds actually inserted: ${debugStats.actualInserts}`)
  console.log(`❌ Odds dropped due to missing mapping: ${debugStats.droppedDueToMapping}`)
  console.log(`🏈 NFL player props identified: ${debugStats.nflPlayerProps}`)
  
  console.log(`\\n🔍 Mapping Issues (${debugStats.mappingIssues.length}):`)
  debugStats.mappingIssues.slice(0, 10).forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.oddId} (${issue.market}) - ${issue.reason}`)
  })
  
  if (debugStats.insertionIssues.length > 0) {
    console.log(`\\n❌ Insertion Issues (${debugStats.insertionIssues.length}):`)
    debugStats.insertionIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. Game ${issue.gameId}: ${issue.error}`)
    })
  }
  
  console.log(`\\n📈 Performance Metrics:`)
  console.log(`  • Parse rate: ${((debugStats.parsedOdds / debugStats.rawApiOdds) * 100).toFixed(1)}%`)
  console.log(`  • Insert success rate: ${((debugStats.actualInserts / debugStats.attemptedInserts) * 100).toFixed(1)}%`)
  console.log(`  • Mapping coverage: ${((debugStats.parsedOdds / (debugStats.parsedOdds + debugStats.droppedDueToMapping)) * 100).toFixed(1)}%`)
  
  console.log(`\\n✅ Debug completed at ${new Date().toISOString()}`)
}

// Export for direct execution
module.exports = { debugOddsFetch }

// Run if called directly
if (require.main === module) {
  debugOddsFetch().catch(console.error)
}