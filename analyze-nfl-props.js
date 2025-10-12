const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeNFLProps() {
  console.log('🕵️ Analyzing NFL Player Props...')
  
  try {
    // Fetch one NFL game with full detail
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
    console.log(`🌐 Fetching: ${apiUrl}`)
    
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
    console.log(`\\n🎮 Analyzing game: ${event.teams?.away?.names?.long} @ ${event.teams?.home?.names?.long}`)
    console.log(`📊 Total odds entries: ${Object.keys(event.odds || {}).length}`)
    
    // Categorize all odds
    const categories = {
      mainLines: [],
      playerProps: [],
      teamProps: [],
      gameProps: [],
      unknown: []
    }
    
    const playerPropKeywords = [
      'passing_', 'rushing_', 'receiving_', 'defense_', 'kicking_', 'fieldGoals_',
      'batting_', 'pitching_', 'assists', 'rebounds', 'steals', 'blocks',
      'goals', 'saves', 'shots_', 'tackles', 'interceptions', 'fumble'
    ]
    
    Object.entries(event.odds || {}).forEach(([oddId, oddData]) => {
      const lowerOddId = oddId.toLowerCase()
      
      // Check if it's a player prop
      const isPlayerProp = playerPropKeywords.some(keyword => lowerOddId.includes(keyword)) ||
                          (oddId.includes('-') && /[0-9]/.test(oddId) && !oddId.includes('all') && !oddId.includes('home') && !oddId.includes('away'))
      
      if (isPlayerProp) {
        categories.playerProps.push({
          oddId,
          marketName: oddData.marketName,
          statID: oddData.statID,
          statEntityID: oddData.statEntityID
        })
      } else if (oddId.includes('-all-')) {
        categories.gameProps.push({
          oddId,
          marketName: oddData.marketName
        })
      } else if (oddId.includes('-home-') || oddId.includes('-away-')) {
        if (oddId.startsWith('points-') || oddId.startsWith('firstToScore-')) {
          categories.mainLines.push({
            oddId,
            marketName: oddData.marketName
          })
        } else {
          categories.teamProps.push({
            oddId,
            marketName: oddData.marketName
          })
        }
      } else {
        categories.unknown.push({
          oddId,
          marketName: oddData.marketName
        })
      }
    })
    
    console.log(`\\n📈 Odds categorization:`)
    console.log(`  Main Lines: ${categories.mainLines.length}`)
    console.log(`  Player Props: ${categories.playerProps.length}`)
    console.log(`  Team Props: ${categories.teamProps.length}`)
    console.log(`  Game Props: ${categories.gameProps.length}`)
    console.log(`  Unknown: ${categories.unknown.length}`)
    
    // Show examples of each category
    console.log(`\\n🏈 Main Lines Examples:`)
    categories.mainLines.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.oddId} - ${item.marketName}`)
    })
    
    console.log(`\\n🏃 Player Props Examples:`)
    if (categories.playerProps.length === 0) {
      console.log(`  ❌ NO PLAYER PROPS FOUND!`)
      console.log(`  🔍 This explains why only ~1800 odds are being saved instead of the expected player props`)
    } else {
      categories.playerProps.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.oddId} - ${item.marketName} (Entity: ${item.statEntityID})`)
      })
    }
    
    console.log(`\\n🏆 Team Props Examples:`)
    categories.teamProps.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.oddId} - ${item.marketName}`)
    })
    
    console.log(`\\n🎯 Game Props Examples:`)
    categories.gameProps.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.oddId} - ${item.marketName}`)
    })
    
    // Check if we need to use a different API endpoint or parameters for player props
    console.log(`\\n🤔 Investigation Results:`)
    if (categories.playerProps.length === 0) {
      console.log(`❌ ISSUE FOUND: No player props in API response`)
      console.log(`💡 Possible causes:`)
      console.log(`   1. Player props require a different API endpoint`)
      console.log(`   2. Player props require additional parameters`)
      console.log(`   3. Player props are only available closer to game time`)
      console.log(`   4. Account doesn't have access to player props`)
      
      // Check game timing
      const gameTime = new Date(event.status?.startsAt || event.startTime)
      const now = new Date()
      const hoursUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      console.log(`\\n⏰ Game starts in ${hoursUntilGame.toFixed(1)} hours`)
      if (hoursUntilGame > 48) {
        console.log(`   ℹ️  Player props might not be available this far in advance`)
      }
    } else {
      console.log(`✅ Player props are available`)
    }
    
    // Sample the full structure of a few odds
    console.log(`\\n🔬 Sample odds structures:`)
    const sampleOdds = Object.entries(event.odds || {}).slice(0, 3)
    sampleOdds.forEach(([oddId, oddData], i) => {
      console.log(`\\n${i + 1}. ${oddId}:`)
      console.log(JSON.stringify(oddData, null, 2))
    })
    
  } catch (error) {
    console.error('❌ Analysis error:', error)
  }
}

// Export for direct execution
module.exports = { analyzeNFLProps }

// Run if called directly
if (require.main === module) {
  analyzeNFLProps().catch(console.error)
}