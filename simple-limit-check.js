const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simpleLimitCheck() {
  console.log('🔍 Simple Check: Why Exactly 1000 Odds Per Game?')
  
  try {
    // Check recent games to confirm the pattern
    console.log('📊 Checking recent games for 1000-record pattern...')
    
    const { data: recentGames } = await supabase
      .from('games')
      .select('id, league, home_team, away_team, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (recentGames) {
      console.log('\\nRecent games and their odds counts:')
      
      for (const game of recentGames) {
        const { count: oddsCount } = await supabase
          .from('odds')
          .select('*', { count: 'exact', head: true })
          .eq('eventid', game.id)
          .eq('sportsbook', 'SportsGameOdds')
        
        console.log(`${game.league} ${game.away_team} @ ${game.home_team}: ${oddsCount} odds ${oddsCount === 1000 ? '🎯' : ''}`)
        
        if (oddsCount === 1000) {
          // This game has exactly 1000 - let's check if there were more attempts
          console.log(`  🔍 Checking insertion attempts for this game...`)
          
          // Check open_odds table too
          const { count: openOddsCount } = await supabase
            .from('open_odds')
            .select('*', { count: 'exact', head: true })
            .eq('eventid', game.id)
            .eq('sportsbook', 'SportsGameOdds')
          
          console.log(`  open_odds table: ${openOddsCount} records`)
          
          if (openOddsCount !== oddsCount) {
            console.log(`  ⚠️ Mismatch: open_odds has ${openOddsCount}, odds has ${oddsCount}`)
          }
        }
      }
    }
    
    // Check if there's a pattern in the oddids that get saved vs dropped
    console.log('\\n🔍 Analyzing oddid patterns in 1000-record games...')
    
    const { data: gamesWithExact1000 } = await supabase
      .rpc('get_games_with_exact_count', { target_count: 1000 })
      .limit(3)
    
    // If that RPC doesn't exist, do it manually
    const gamesTo1000Check = recentGames?.filter(async (game) => {
      const { count } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .eq('eventid', game.id)
        .eq('sportsbook', 'SportsGameOdds')
      return count === 1000
    }).slice(0, 2)
    
    if (gamesTo1000Check && gamesTo1000Check.length > 0) {
      for (const game of gamesTo1000Check) {
        console.log(`\\nAnalyzing game ${game.id.substring(0, 8)}... with exactly 1000 odds:`)
        
        const { data: gameOdds } = await supabase
          .from('odds')
          .select('oddid, marketname, created_at')
          .eq('eventid', game.id)
          .eq('sportsbook', 'SportsGameOdds')
          .order('created_at', { ascending: true })
          .limit(10) // First 10
        
        const { data: lastOdds } = await supabase
          .from('odds')
          .select('oddid, marketname, created_at')
          .eq('eventid', game.id)
          .eq('sportsbook', 'SportsGameOdds')
          .order('created_at', { ascending: false })
          .limit(10) // Last 10
        
        console.log('  First 10 odds saved:')
        gameOdds?.forEach((odd, i) => {
          console.log(`    ${i + 1}. ${odd.oddid} - ${odd.marketname}`)
        })
        
        console.log('  Last 10 odds saved:')
        lastOdds?.forEach((odd, i) => {
          console.log(`    ${i + 1}. ${odd.oddid} - ${odd.marketname}`)
        })
        
        // Check if the last timestamp suggests a cutoff
        if (lastOdds && lastOdds.length > 0) {
          const lastTimestamp = new Date(lastOdds[0].created_at)
          console.log(`  Last odds timestamp: ${lastTimestamp.toISOString()}`)
        }
      }
    }
    
    // Test the chunked insertion theory
    console.log('\\n🧪 Testing chunked insertion hypothesis...')
    
    // The theory: Maybe the fetch stops after exactly 2 chunks of 500
    // Let's see if we can replicate this
    
    const testGameId = `CHUNK_TEST_${Date.now()}`
    await supabase
      .from('games')
      .insert([{
        id: testGameId,
        sport: 'NFL',
        league: 'NFL',
        home_team: 'Test Home',
        away_team: 'Test Away',
        home_team_name: 'Test Home Team',
        away_team_name: 'Test Away Team',
        game_time: new Date().toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    
    console.log('Testing 2 chunks of 500 (total 1000)...')
    
    // Chunk 1: 500 records
    const chunk1 = []
    for (let i = 0; i < 500; i++) {
      chunk1.push({
        eventid: testGameId,
        oddid: `chunk1-${i}`,
        sportsbook: 'SportsGameOdds',
        marketname: `Chunk 1 Market ${i}`,
        bettypeid: 'test',
        line: `${i}.5`,
        bookodds: 100 + i,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    const { data: chunk1Result, error: chunk1Error } = await supabase
      .from('odds')
      .insert(chunk1)
      .select('id')
    
    console.log(`Chunk 1 result: ${chunk1Error ? 'ERROR - ' + chunk1Error.message : 'SUCCESS - ' + (chunk1Result?.length || 0) + ' inserted'}`)
    
    // Small delay like the fetch
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Chunk 2: 500 records
    const chunk2 = []
    for (let i = 0; i < 500; i++) {
      chunk2.push({
        eventid: testGameId,
        oddid: `chunk2-${i}`,
        sportsbook: 'SportsGameOdds',
        marketname: `Chunk 2 Market ${i}`,
        bettypeid: 'test',
        line: `${500 + i}.5`,
        bookodds: 600 + i,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    const { data: chunk2Result, error: chunk2Error } = await supabase
      .from('odds')
      .insert(chunk2)
      .select('id')
    
    console.log(`Chunk 2 result: ${chunk2Error ? 'ERROR - ' + chunk2Error.message : 'SUCCESS - ' + (chunk2Result?.length || 0) + ' inserted'}`)
    
    // Check total
    const { count: totalTestCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    console.log(`Total after 2 chunks: ${totalTestCount}`)
    
    // Try chunk 3
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const chunk3 = []
    for (let i = 0; i < 100; i++) {
      chunk3.push({
        eventid: testGameId,
        oddid: `chunk3-${i}`,
        sportsbook: 'SportsGameOdds',
        marketname: `Chunk 3 Market ${i}`,
        bettypeid: 'test',
        line: `${1000 + i}.5`,
        bookodds: 1100 + i,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    const { data: chunk3Result, error: chunk3Error } = await supabase
      .from('odds')
      .insert(chunk3)
      .select('id')
    
    console.log(`Chunk 3 result: ${chunk3Error ? 'ERROR - ' + chunk3Error.message : 'SUCCESS - ' + (chunk3Result?.length || 0) + ' inserted'}`)
    
    const { count: finalTestCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    console.log(`Final test count: ${finalTestCount}`)
    
    if (finalTestCount === 1000) {
      console.log('🎯 CONFIRMED: Something stops insertion at exactly 1000')
    } else if (finalTestCount && finalTestCount > 1000) {
      console.log('✅ No hard limit - can exceed 1000 in controlled test')
    }
    
    // Cleanup
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    
    console.log('\\n🎯 SUMMARY:')
    console.log('The 1000 odds limit appears to be caused by:')
    console.log('  • Either a database trigger that counts records per game')
    console.log('  • Or application logic in the fetch that stops at 1000')
    console.log('  • Or a constraint that only applies to specific data patterns')
    console.log('\\nNext step: Check the fetch logs during actual run to see where it stops')
    
  } catch (error) {
    console.error('❌ Check error:', error)
  }
}

// Export for direct execution
module.exports = { simpleLimitCheck }

// Run if called directly
if (require.main === module) {
  simpleLimitCheck().catch(console.error)
}