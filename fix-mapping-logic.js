const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// Updated mapping logic that properly extracts market types
const knownMappings = new Set([
  // NFL Player Props - Quarterback
  'passing_yards', 'passing_touchdowns', 'passing_interceptions', 'passing_completions',
  'passing_attempts', 'passing_longestCompletion', 'passing_passerRating',
  'passing+rushing_yards',
  // NFL Player Props - Running Back & Receivers  
  'rushing_yards', 'rushing_touchdowns', 'rushing_attempts', 'rushing_longestRush',
  'receiving_yards', 'receiving_receptions', 'receiving_touchdowns', 'receiving_longestReception',
  'rushing+receiving_yards',
  // NFL Player Props - Defense & Kicker
  'defense_sacks', 'defense_interceptions', 'defense_fumbleRecoveries', 'defense_touchdowns', 'defense_tackles',
  'kicking_totalPoints', 'fieldGoals_made', 'extraPoints_kicksMade', 'fieldGoals_longestMade',
  // General Props and simple ones
  'fantasyScore', 'turnovers', 'firstTouchdown', 'lastTouchdown', 'firstToScore', 'touchdowns',
  // Main Lines
  'points',
  // Additional markets found in API
  'firstBasket', 'anytimeTouchdown', 'firstScore', 'lastScore'
])

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Fixed function to extract market from oddId
function extractMarketFromOddId(oddId) {
  if (!oddId) return null
  
  // For player props: format is usually marketType-PLAYER_ID-period-betType-side
  // For main lines: format is usually statID-entityID-period-betType-side
  
  const parts = oddId.split('-')
  if (parts.length < 2) return null
  
  // First part is always the market/stat type
  const marketType = parts[0]
  
  // Check if this looks like a player prop (has player ID in second part)
  const secondPart = parts[1] || ''
  const hasPlayerID = secondPart.includes('_NFL') || /^[A-Z_]+[0-9]/.test(secondPart)
  
  if (hasPlayerID) {
    // This is a player prop, return the market type
    return marketType
  } else {
    // This might be a main line or team prop
    return marketType
  }
}

// Enhanced function to check if market is mapped
function isMarketMapped(oddId) {
  const market = extractMarketFromOddId(oddId)
  if (!market) return false
  
  // Direct match
  if (knownMappings.has(market)) {
    return true
  }
  
  // Check for partial matches (for composite markets like passing+rushing_yards)
  for (const knownMarket of knownMappings) {
    if (market.includes(knownMarket.split('_')[0]) || knownMarket.includes(market)) {
      return true
    }
  }
  
  return false
}

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
  insertionIssues: [],
  mappedMarkets: new Set(),
  unmappedMarkets: new Set()
}

// Enhanced logging function
function logMappingAnalysis(oddId, isMapped) {
  const market = extractMarketFromOddId(oddId)
  
  if (isMapped) {
    debugStats.mappedMarkets.add(market)
  } else {
    debugStats.unmappedMarkets.add(market)
    debugStats.mappingIssues.push({
      oddId,
      market,
      reason: 'Market not in mapping file'
    })
  }
}

// Test the fixed mapping logic
async function testMappingLogic() {
  console.log('🧪 Testing Fixed Mapping Logic...')
  
  try {
    // Fetch NFL game data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]
    
    const params = new URLSearchParams()
    params.append('leagueID', 'NFL')
    params.append('type', 'match')
    params.append('startsAfter', startISO)
    params.append('startsBefore', futureDateISO)
    params.append('limit', '1')
    params.append('includeAltLines', 'true')
    
    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
    
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
    
    const event = data.data[0]
    console.log(`\\n🎮 Testing mapping on: ${event.teams?.away?.names?.long} @ ${event.teams?.home?.names?.long}`)
    
    const totalOdds = Object.keys(event.odds || {}).length
    debugStats.rawApiOdds = totalOdds
    console.log(`📊 Total odds to test: ${totalOdds}`)
    
    // Test mapping on all odds
    let mapped = 0
    let unmapped = 0
    let playerProps = 0
    
    Object.entries(event.odds || {}).forEach(([oddId, oddData]) => {
      const market = extractMarketFromOddId(oddId)
      const isMapped = isMarketMapped(oddId)
      
      logMappingAnalysis(oddId, isMapped)
      
      if (isMapped) {
        mapped++
        debugStats.parsedOdds++
      } else {
        unmapped++
        debugStats.droppedDueToMapping++
      }
      
      // Check if this is a player prop
      if (oddId.includes('_NFL') || (market && ['passing', 'rushing', 'receiving', 'defense', 'kicking', 'fieldGoals', 'firstTouchdown', 'touchdowns'].some(prop => market.includes(prop)))) {
        playerProps++
      }
    })
    
    debugStats.nflPlayerProps = playerProps
    
    console.log(`\\n📈 Mapping Results:`)
    console.log(`  ✅ Mapped: ${mapped} (${((mapped / totalOdds) * 100).toFixed(1)}%)`)
    console.log(`  ❌ Unmapped: ${unmapped} (${((unmapped / totalOdds) * 100).toFixed(1)}%)`)
    console.log(`  🏈 Player Props: ${playerProps}`)
    
    console.log(`\\n🎯 Mapped Markets (${debugStats.mappedMarkets.size}):`)
    Array.from(debugStats.mappedMarkets).slice(0, 10).forEach((market, i) => {
      console.log(`  ${i + 1}. ${market}`)
    })
    
    console.log(`\\n❌ Unmapped Markets (${debugStats.unmappedMarkets.size}):`)
    Array.from(debugStats.unmappedMarkets).slice(0, 10).forEach((market, i) => {
      console.log(`  ${i + 1}. ${market}`)
    })
    
    // Show specific examples
    console.log(`\\n📋 Mapping Examples:`)
    const sampleOdds = Object.entries(event.odds || {}).slice(0, 10)
    sampleOdds.forEach(([oddId, oddData], i) => {
      const market = extractMarketFromOddId(oddId)
      const isMapped = isMarketMapped(oddId)
      const isPlayerProp = oddId.includes('_NFL')
      console.log(`  ${i + 1}. ${oddId}`)
      console.log(`     Market: ${market}`)
      console.log(`     Mapped: ${isMapped ? '✅' : '❌'}`)
      console.log(`     Player Prop: ${isPlayerProp ? '🏈' : '📊'}`)
      console.log(`     Market Name: ${oddData.marketName}`)
    })
    
    // Identify what markets we need to add to mapping
    console.log(`\\n💡 Missing Markets to Add to Mapping:`)
    const missingMarkets = Array.from(debugStats.unmappedMarkets).filter(market => 
      market && !knownMappings.has(market)
    )
    
    missingMarkets.slice(0, 20).forEach((market, i) => {
      console.log(`  ${i + 1}. "${market}",`)
    })
    
    console.log(`\\n📊 Final Stats:`)
    console.log(`  • Raw API odds: ${debugStats.rawApiOdds}`)
    console.log(`  • Would be parsed: ${debugStats.parsedOdds}`)
    console.log(`  • Would be dropped: ${debugStats.droppedDueToMapping}`)
    console.log(`  • Player props identified: ${debugStats.nflPlayerProps}`)
    console.log(`  • Parse rate: ${((debugStats.parsedOdds / debugStats.rawApiOdds) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Export for direct execution
module.exports = { testMappingLogic, extractMarketFromOddId, isMarketMapped }

// Run if called directly
if (require.main === module) {
  testMappingLogic().catch(console.error)
}