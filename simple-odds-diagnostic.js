const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const LEAGUES = ['NFL', 'NBA', 'WNBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'UEFA_CHAMPIONS_LEAGUE']

async function simpleOddsDiagnostic() {
  console.log('🔍 Simple Odds Diagnostic - Why Only 2,116 Odds Saved?')
  
  try {
    // 1. Check current state by league
    console.log('\\n📊 Current database state by league:')
    
    for (const league of LEAGUES) {
      const { data: games } = await supabase
        .from('games')
        .select('id')
        .eq('league', league)
        .limit(1000)
      
      if (games && games.length > 0) {
        const gameIds = games.map(g => g.id)
        
        const { count: oddsCount } = await supabase
          .from('odds')
          .select('*', { count: 'exact', head: true })
          .eq('sportsbook', 'SportsGameOdds')
          .in('eventid', gameIds)
        
        console.log(`  ${league}: ${games.length} games, ${oddsCount || 0} odds`)
      } else {
        console.log(`  ${league}: 0 games, 0 odds`)
      }
    }
    
    // 2. Check recent activity (last 2 hours)
    console.log('\\n🕐 Recent odds activity (last 2 hours):')
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('eventid, oddid, line, created_at, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(50)
    
    console.log(`Recent odds inserted: ${recentOdds?.length || 0}`)
    
    if (recentOdds && recentOdds.length > 0) {
      // Check which games got recent odds
      const gameIds = [...new Set(recentOdds.map(r => r.eventid))]
      console.log(`Unique games with recent odds: ${gameIds.length}`)
      
      // Check what leagues these games belong to
      const { data: recentGames } = await supabase
        .from('games')
        .select('id, league, game_time, status')
        .in('id', gameIds)
      
      if (recentGames) {
        const leagueCounts = {}
        recentGames.forEach(game => {
          leagueCounts[game.league] = (leagueCounts[game.league] || 0) + 1
        })
        
        console.log('\\nRecent odds by league:')
        Object.entries(leagueCounts).forEach(([league, count]) => {
          console.log(`  ${league}: ${count} games with new odds`)
        })
      }
    }
    
    // 3. Check for game filtering issues
    console.log('\\n🎮 Checking game status filtering...')
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Check games in the next 7 days by league
    for (const league of ['NFL', 'MLB', 'WNBA']) {
      const { data: upcomingGames } = await supabase
        .from('games')
        .select('id, game_time, status')
        .eq('league', league)
        .gte('game_time', today.toISOString())
        .lte('game_time', futureDate.toISOString())
        .order('game_time', { ascending: true })
        .limit(10)
      
      console.log(`\\n${league} upcoming games (next 7 days):`)
      if (upcomingGames && upcomingGames.length > 0) {
        upcomingGames.forEach((game, i) => {
          const gameTime = new Date(game.game_time)
          const hasStarted = now > gameTime
          const minutesFromNow = Math.round((gameTime.getTime() - now.getTime()) / (1000 * 60))
          
          console.log(`  ${i + 1}. ${game.id} - ${game.status} - ${hasStarted ? 'STARTED' : minutesFromNow + 'min from now'}`)
        })
      } else {
        console.log(`  No upcoming games found`)
      }
    }
    
    // 4. Test the game-started logic specifically
    console.log('\\n⏰ Testing game-started filtering logic...')
    
    // Get a few recent games and test the exact logic from the fetch code
    const { data: testGames } = await supabase
      .from('games')
      .select('id, game_time, status, league')
      .order('game_time', { ascending: false })
      .limit(10)
    
    if (testGames) {
      console.log('Testing game-started logic on recent games:')
      testGames.forEach((game, i) => {
        const gameTime = new Date(game.game_time)
        const bufferTime = 10 * 60 * 1000 // 10 minute buffer from fetch code
        const gameHasStarted = now.getTime() > (gameTime.getTime() + bufferTime)
        
        console.log(`  ${i + 1}. ${game.league} ${game.id.substring(0, 8)}... - ${gameHasStarted ? '🚫 SKIPPED' : '✅ PROCESSABLE'}`)
      })
    }
    
    // 5. Check for duplicate patterns
    console.log('\\n🔍 Checking duplicate patterns in recent data...')
    
    const { data: duplicateCheck } = await supabase
      .from('odds')
      .select('eventid, oddid, line, count(*)')
      .eq('sportsbook', 'SportsGameOdds')
      .gte('created_at', twoHoursAgo)
      .group('eventid, oddid, line')
      .having('count(*) > 1')
      .limit(10)
    
    if (duplicateCheck && duplicateCheck.length > 0) {
      console.log(`Found ${duplicateCheck.length} duplicate combinations in recent data`)
      duplicateCheck.forEach((dup, i) => {
        console.log(`  ${i + 1}. ${dup.eventid}:${dup.oddid}:${dup.line} appears ${dup.count} times`)
      })
    } else {
      console.log('No obvious duplicates found in recent data')
    }
    
    // 6. Test actual API responses for problematic leagues
    console.log('\\n🌐 Testing API responses for NFL, MLB, WNBA...')
    
    for (const league of ['NFL', 'MLB', 'WNBA']) {
      console.log(`\\nTesting ${league} API:`)
      
      try {
        const sportMappings = {
          NFL: 'NFL',
          MLB: 'MLB', 
          WNBA: 'WNBA'
        }
        
        const params = new URLSearchParams()
        params.append('leagueID', sportMappings[league])
        params.append('type', 'match')
        params.append('startsAfter', today.toISOString().split('T')[0])
        params.append('startsBefore', futureDate.toISOString().split('T')[0])
        params.append('limit', '3')
        params.append('includeAltLines', 'true')
        
        const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
        
        const response = await fetch(apiUrl, {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const events = data?.data || []
          
          console.log(`  API returned ${events.length} events`)
          
          if (events.length > 0) {
            const sampleEvent = events[0]
            const oddsCount = Object.keys(sampleEvent.odds || {}).length
            const gameTime = sampleEvent.status?.startsAt || sampleEvent.startTime
            const gameStartTime = new Date(gameTime)
            const gameHasStarted = now.getTime() > (gameStartTime.getTime() + 10 * 60 * 1000)
            
            console.log(`  Sample game: ${sampleEvent.eventID}`)
            console.log(`  Game time: ${gameTime}`)
            console.log(`  Has started: ${gameHasStarted}`)
            console.log(`  Odds count: ${oddsCount}`)
            console.log(`  Would be processed: ${!gameHasStarted && oddsCount > 0 ? 'YES' : 'NO'}`)
          }
        } else {
          console.log(`  API error: ${response.status} ${response.statusText}`)
        }
        
      } catch (error) {
        console.log(`  Error: ${error.message}`)
      }
    }
    
    // 7. Final diagnosis
    console.log('\\n🎯 DIAGNOSIS:')
    console.log('Based on the analysis above, the 2,116 odds limitation is likely due to:')
    console.log('1. Game-started filtering (most NFL/MLB/WNBA games already started)')
    console.log('2. Seasonal timing (some leagues out of season)')  
    console.log('3. API rate limiting or errors for specific leagues')
    console.log('4. Unique constraint blocking legitimate new odds')
    console.log('\\nCheck the specific patterns above to identify the root cause.')
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error)
  }
}

// Export for direct execution
module.exports = { simpleOddsDiagnostic }

// Run if called directly
if (require.main === module) {
  simpleOddsDiagnostic().catch(console.error)
}