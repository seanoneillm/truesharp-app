const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// All leagues from the fetch code
const LEAGUES = ['NFL', 'NBA', 'WNBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UEFA_CHAMPIONS_LEAGUE']

const SPORT_MAPPINGS = {
  NFL: { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' },
  NBA: { sportID: 'BASKETBALL', leagueID: 'NBA', sport_key: 'basketball_nba' },
  WNBA: { sportID: 'BASKETBALL', leagueID: 'WNBA', sport_key: 'basketball_wnba' },
  MLB: { sportID: 'BASEBALL', leagueID: 'MLB', sport_key: 'baseball_mlb' },
  NHL: { sportID: 'HOCKEY', leagueID: 'NHL', sport_key: 'icehockey_nhl' },
  NCAAF: { sportID: 'FOOTBALL', leagueID: 'NCAAF', sport_key: 'americanfootball_ncaaf' },
  NCAAB: { sportID: 'BASKETBALL', leagueID: 'NCAAB', sport_key: 'basketball_ncaab' },
  MLS: { sportID: 'SOCCER', leagueID: 'MLS', sport_key: 'soccer_mls' },
  UEFA_CHAMPIONS_LEAGUE: { sportID: 'SOCCER', leagueID: 'UEFA_CHAMPIONS_LEAGUE', sport_key: 'soccer_uefa_champs_league' },
}

async function investigateMissingOdds() {
  console.log('🕵️ Investigating Missing Odds Issue...')
  console.log('📊 Analyzing each league to understand filtering/deletion behavior')
  
  try {
    // Get current database state by league
    console.log('\\n📋 Current database state by league:')
    
    for (const league of LEAGUES) {
      const { count: gameCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('league', league)
      
      const { count: oddsCount } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .eq('sportsbook', 'SportsGameOdds')
        .in('eventid', 
          supabase
            .from('games')
            .select('id')
            .eq('league', league)
        )
      
      console.log(`  ${league}: ${gameCount || 0} games, ${oddsCount || 0} odds`)
    }
    
    // Check recent insertions
    console.log('\\n🕐 Recent odds insertions (last 1 hour):')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('eventid, created_at')
      .eq('sportsbook', 'SportsGameOdds')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(100)
    
    console.log(`  Recent odds inserted: ${recentOdds?.length || 0}`)
    
    if (recentOdds?.length > 0) {
      // Group by eventid to see which games got odds
      const gameOddsCount = {}
      recentOdds.forEach(odd => {
        gameOddsCount[odd.eventid] = (gameOddsCount[odd.eventid] || 0) + 1
      })
      
      console.log(`  Unique games with recent odds: ${Object.keys(gameOddsCount).length}`)
      console.log(`  Sample game odds counts:`)
      Object.entries(gameOddsCount).slice(0, 5).forEach(([gameId, count], i) => {
        console.log(`    ${i + 1}. Game ${gameId}: ${count} odds`)
      })
    }
    
    // Now let's simulate the fetch process for each league to see what happens
    console.log('\\n🧪 Simulating fetch process for each league...')
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]
    
    for (const league of LEAGUES.slice(0, 3)) { // Test first 3 leagues
      console.log(`\\n🔍 Testing ${league}...`)
      
      const sportMapping = SPORT_MAPPINGS[league]
      
      try {
        // Fetch API data for this league
        const params = new URLSearchParams()
        params.append('leagueID', sportMapping.leagueID)
        params.append('type', 'match')
        params.append('startsAfter', startISO)
        params.append('startsBefore', futureDateISO)
        params.append('limit', '5') // Limit for testing
        params.append('includeAltLines', 'true')
        
        const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
        
        const response = await fetch(apiUrl, {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          console.log(`  ❌ API Error: ${response.status} ${response.statusText}`)
          continue
        }
        
        const data = await response.json()
        const events = data?.data || []
        
        console.log(`  📊 API returned ${events.length} events`)
        
        if (events.length === 0) {
          console.log(`  ℹ️ No events found for ${league}`)
          continue
        }
        
        // Analyze each event
        for (let i = 0; i < Math.min(events.length, 2); i++) {
          const event = events[i]
          const gameId = event.eventID
          const gameTime = event.status?.startsAt || event.startTime
          const oddsCount = Object.keys(event.odds || {}).length
          
          console.log(`\\n    🎮 Game ${i + 1}: ${gameId}`)
          console.log(`      Start time: ${gameTime}`)
          console.log(`      Odds count: ${oddsCount}`)
          
          // Check if game has started (simulate the logic from fetch code)
          const gameStartTime = new Date(gameTime)
          const bufferTime = 10 * 60 * 1000 // 10 minute buffer
          const gameHasStarted = now.getTime() > (gameStartTime.getTime() + bufferTime)
          
          console.log(`      Game has started: ${gameHasStarted ? '✅ YES' : '❌ NO'}`)
          
          if (gameHasStarted) {
            console.log(`      🚫 SKIPPED - Game already started`)
            continue
          }
          
          // Check if game exists in database
          const { data: existingGame } = await supabase
            .from('games')
            .select('id, status')
            .eq('id', gameId)
            .single()
          
          console.log(`      Game in DB: ${existingGame ? '✅ YES' : '❌ NO'}`)
          if (existingGame) {
            console.log(`      Game status: ${existingGame.status}`)
          }
          
          // Check existing odds for this game
          const { count: existingOddsCount } = await supabase
            .from('odds')
            .select('*', { count: 'exact', head: true })
            .eq('eventid', gameId)
            .eq('sportsbook', 'SportsGameOdds')
          
          console.log(`      Existing odds: ${existingOddsCount || 0}`)
          
          // Simulate what would happen if we tried to insert
          if (!gameHasStarted && oddsCount > 0) {
            console.log(`      🎯 Would attempt to process ${oddsCount} odds`)
            
            // Sample a few odds to see their structure
            const sampleOdds = Object.entries(event.odds || {}).slice(0, 3)
            sampleOdds.forEach(([oddId, oddData], j) => {
              console.log(`        Sample ${j + 1}: ${oddId}`)
              
              // Check if this exact combination exists
              const line = oddData.bookSpread || oddData.fairSpread || oddData.bookOverUnder || oddData.fairOverUnder || null
              console.log(`          Line: ${line}`)
              console.log(`          Unique key: ${gameId}:${oddId}:${line}`)
            })
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${league}: ${error.message}`)
      }
    }
    
    // Check for any deletion triggers or constraints that might be removing data
    console.log('\\n🔍 Checking for potential data deletion mechanisms...')
    
    // Look for recent deletions (if there are deletion logs)
    console.log('\\n📊 Recent database activity analysis:')
    
    // Check games that should have odds but don't
    const { data: gamesWithoutOdds } = await supabase
      .from('games')
      .select('id, league, game_time, status')
      .not('id', 'in', 
        `(${supabase
          .from('odds')
          .select('eventid')
          .eq('sportsbook', 'SportsGameOdds')
          .toString()})`
      )
      .gte('game_time', startISO)
      .order('game_time', { ascending: false })
      .limit(20)
    
    console.log(`\\nGames without odds (${gamesWithoutOdds?.length || 0}):`)
    if (gamesWithoutOdds?.length > 0) {
      gamesWithoutOdds.slice(0, 10).forEach((game, i) => {
        console.log(`  ${i + 1}. ${game.league} - ${game.id} (${game.status}) - ${game.game_time}`)
      })
    }
    
    // Check the distribution of saved odds by uniqueness
    console.log('\\n🔍 Analyzing odds uniqueness patterns...')
    
    const { data: oddsSample } = await supabase
      .from('odds')
      .select('eventid, oddid, line, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .order('fetched_at', { ascending: false })
      .limit(100)
    
    if (oddsSample?.length > 0) {
      // Group by unique combination
      const uniqueCombos = new Set()
      const duplicatePattern = {}
      
      oddsSample.forEach(odd => {
        const key = `${odd.eventid}:${odd.oddid}:${odd.line}`
        if (uniqueCombos.has(key)) {
          duplicatePattern[key] = (duplicatePattern[key] || 1) + 1
        } else {
          uniqueCombos.add(key)
        }
      })
      
      console.log(`  Unique combinations in recent 100 odds: ${uniqueCombos.size}`)
      console.log(`  Potential duplicates found: ${Object.keys(duplicatePattern).length}`)
      
      if (Object.keys(duplicatePattern).length > 0) {
        console.log(`  Sample duplicate patterns:`)
        Object.entries(duplicatePattern).slice(0, 3).forEach(([key, count], i) => {
          console.log(`    ${i + 1}. ${key} appears ${count + 1} times`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error)
  }
  
  console.log('\\n🎯 Investigation completed. Check results above for patterns.')
}

// Export for direct execution
module.exports = { investigateMissingOdds }

// Run if called directly
if (require.main === module) {
  investigateMissingOdds().catch(console.error)
}