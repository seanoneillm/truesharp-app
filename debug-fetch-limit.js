const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugFetchLimit() {
  console.log('🔍 Debugging the Actual Fetch Limit Issue')
  console.log('📊 Analyzing real fetch behavior vs test behavior')
  
  try {
    // 1. Check recent odds insertions to understand the pattern
    console.log('\\n📊 Analyzing recent odds insertion patterns...')
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('eventid, created_at, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(500)
    
    if (recentOdds && recentOdds.length > 0) {
      // Group by eventid to see record counts per game
      const gameOddsCounts = {}
      recentOdds.forEach(odd => {
        gameOddsCounts[odd.eventid] = (gameOddsCounts[odd.eventid] || 0) + 1
      })
      
      console.log(`\\nRecent odds by game (last hour):`)
      Object.entries(gameOddsCounts).forEach(([gameId, count], i) => {
        console.log(`  ${i + 1}. Game ${gameId.substring(0, 8)}...: ${count} odds`)
        if (count === 1000) {
          console.log(`    🎯 Exactly 1000 odds (suspicious!)`)
        }
      })
      
      // Check if any games have exactly 1000 total odds
      console.log('\\n📊 Checking total odds counts for recent games...')
      
      const gameIds = Object.keys(gameOddsCounts).slice(0, 5)
      for (const gameId of gameIds) {
        const { count: totalOdds } = await supabase
          .from('odds')
          .select('*', { count: 'exact', head: true })
          .eq('eventid', gameId)
          .eq('sportsbook', 'SportsGameOdds')
        
        console.log(`  Game ${gameId.substring(0, 8)}...: ${totalOdds} total odds ${totalOdds === 1000 ? '🎯 EXACTLY 1000!' : ''}`)
      }
    }
    
    // 2. Look for the difference between fetch vs direct insert
    console.log('\\n🔍 Comparing fetch process vs direct insert...')
    
    // Check what the fetch process is actually doing differently
    console.log('Key differences between working test and failing fetch:')
    console.log('  1. Fetch uses chunked inserts (500 per chunk)')
    console.log('  2. Fetch processes real API data with complex oddids')
    console.log('  3. Fetch includes alternate lines and sportsbook data')
    console.log('  4. Fetch has duplicate detection logic')
    console.log('  5. Fetch uses exact timestamps from fetch process')
    
    // 3. Test with fetch-like data structure
    console.log('\\n🧪 Testing with fetch-like data structure...')
    
    const testGameId = `FETCH_LIKE_TEST_${Date.now()}`
    
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
    
    console.log('✅ Test game created')
    
    // Generate fetch-like records with realistic oddids
    const fetchLikeRecords = []
    
    // Main lines (like real fetch)
    const mainLines = [
      'points-home-game-ml-home',
      'points-away-game-ml-away', 
      'points-home-game-sp-home',
      'points-away-game-sp-away',
      'points-all-game-ou-over',
      'points-all-game-ou-under'
    ]
    
    // Player props (like real fetch)
    const playerIds = ['PLAYER_1_NFL', 'PLAYER_2_NFL', 'PLAYER_3_NFL', 'PLAYER_4_NFL', 'PLAYER_5_NFL']
    const propTypes = [
      'passing_yards', 'passing_touchdowns', 'rushing_yards', 'rushing_touchdowns',
      'receiving_yards', 'receiving_receptions', 'firstTouchdown', 'touchdowns'
    ]
    const betTypes = ['ou-over', 'ou-under', 'yn-yes', 'yn-no']
    
    let recordIndex = 0
    
    // Add main lines
    mainLines.forEach(oddId => {
      fetchLikeRecords.push({
        eventid: testGameId,
        oddid: oddId,
        sportsbook: 'SportsGameOdds',
        marketname: oddId.includes('ml') ? 'Moneyline' : oddId.includes('sp') ? 'Spread' : 'Over/Under',
        bettypeid: oddId.includes('ml') ? 'ml' : oddId.includes('sp') ? 'sp' : 'ou',
        line: oddId.includes('ml') ? null : `${Math.random() * 10}.5`,
        bookodds: Math.floor(Math.random() * 200) - 150,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      recordIndex++
    })
    
    // Add player props
    playerIds.forEach(playerId => {
      propTypes.forEach(propType => {
        betTypes.forEach(betType => {
          if (recordIndex >= 2000) return // Limit for testing
          
          const oddId = `${propType}-${playerId}-game-${betType}`
          fetchLikeRecords.push({
            eventid: testGameId,
            oddid: oddId,
            sportsbook: 'SportsGameOdds',
            marketname: `${propType.replace('_', ' ')} ${betType.split('-')[1]}`,
            bettypeid: betType.split('-')[0],
            line: betType.includes('ou') ? `${Math.random() * 100}.5` : null,
            bookodds: Math.floor(Math.random() * 200) - 150,
            fetched_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          recordIndex++
        })
      })
    })
    
    // Add alternate lines (like real fetch)
    for (let i = 0; i < 500; i++) {
      if (recordIndex >= 2000) break
      
      const baseOddId = mainLines[i % mainLines.length]
      const altOddId = `${baseOddId}_alt_${i}`
      
      fetchLikeRecords.push({
        eventid: testGameId,
        oddid: altOddId,
        sportsbook: 'SportsGameOdds',
        marketname: 'Alternate Line',
        bettypeid: 'sp',
        line: `${Math.random() * 20}.5`,
        bookodds: Math.floor(Math.random() * 200) - 150,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      recordIndex++
    }
    
    console.log(`📦 Generated ${fetchLikeRecords.length} fetch-like records`)
    
    // Insert using the same chunking strategy as the fetch
    const CHUNK_SIZE = 500
    let totalInserted = 0
    
    for (let i = 0; i < fetchLikeRecords.length; i += CHUNK_SIZE) {
      const chunk = fetchLikeRecords.slice(i, i + CHUNK_SIZE)
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1
      
      console.log(`\\n📦 Processing chunk ${chunkNumber}: ${chunk.length} records`)
      
      const { data: chunkResult, error: chunkError } = await supabase
        .from('odds')
        .insert(chunk)
        .select('id')
      
      if (chunkError) {
        console.log(`  ❌ Chunk ${chunkNumber} failed: ${chunkError.message}`)
        
        if (chunkError.message.includes('duplicate')) {
          console.log(`  ℹ️ Duplicate key constraint (expected)`)
        } else if (chunkError.message.includes('limit') || chunkError.message.includes('maximum')) {
          console.log(`  🎯 FOUND LIMIT ERROR: ${chunkError.message}`)
        }
        break
      } else {
        const inserted = chunkResult?.length || 0
        totalInserted += inserted
        console.log(`  ✅ Chunk ${chunkNumber}: ${inserted} records inserted`)
        
        // Check running total
        const { count: runningTotal } = await supabase
          .from('odds')
          .select('*', { count: 'exact', head: true })
          .eq('eventid', testGameId)
        
        console.log(`  📊 Running total: ${runningTotal}`)
        
        if (runningTotal && runningTotal >= 1000) {
          console.log(`  🎯 Hit 1000 limit, checking if more can be inserted...`)
          
          // Try to insert one more record
          const testRecord = {
            eventid: testGameId,
            oddid: `test-over-1000-${Date.now()}`,
            sportsbook: 'SportsGameOdds',
            marketname: 'Test Over 1000',
            bettypeid: 'test',
            line: '999.5',
            bookodds: 100,
            fetched_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: overLimitResult, error: overLimitError } = await supabase
            .from('odds')
            .insert([testRecord])
            .select('id')
          
          if (overLimitError) {
            console.log(`  🎯 CONFIRMED LIMIT: Cannot insert after 1000 - ${overLimitError.message}`)
            break
          } else {
            console.log(`  ✅ Can still insert after 1000, continuing...`)
          }
        }
      }
      
      // Small delay like the fetch
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Final check
    const { count: finalCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    console.log(`\\n📊 Final Results:`)
    console.log(`  Records attempted: ${fetchLikeRecords.length}`)
    console.log(`  Records inserted: ${totalInserted}`)
    console.log(`  Final database count: ${finalCount}`)
    
    if (finalCount === 1000) {
      console.log(`  🎯 CONFIRMED: Hard stop at exactly 1000 records`)
    } else if (finalCount && finalCount > 1000) {
      console.log(`  ✅ No hard limit found, can exceed 1000`)
    }
    
    // 4. Check for subtle differences in fetch vs test
    console.log('\\n🔍 Checking for subtle differences...')
    
    // The key might be in the dual table insertion
    console.log('Testing dual table insertion (like real fetch)...')
    
    const dualTestRecord = {
      eventid: testGameId,
      oddid: `dual-test-${Date.now()}`,
      sportsbook: 'SportsGameOdds',
      marketname: 'Dual Test',
      bettypeid: 'test',
      line: '1.5',
      bookodds: 100,
      fetched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insert into both tables like the fetch does
    const { error: oddsError } = await supabase
      .from('odds')
      .insert([dualTestRecord])
    
    const { error: openOddsError } = await supabase
      .from('open_odds')
      .insert([dualTestRecord])
    
    console.log(`Dual insertion results:`)
    console.log(`  odds table: ${oddsError ? 'ERROR - ' + oddsError.message : 'SUCCESS'}`)
    console.log(`  open_odds table: ${openOddsError ? 'ERROR - ' + openOddsError.message : 'SUCCESS'}`)
    
    // Cleanup
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('open_odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    
    console.log('\\n🎯 DIAGNOSIS:')
    console.log('Based on this testing, the 1000 limit might be:')
    console.log('  1. A soft limit in trigger logic that doesn\\'t always fire')
    console.log('  2. Related to specific data patterns in real fetch')
    console.log('  3. A constraint that only applies under certain conditions')
    console.log('  4. Something in the dual table insertion logic')
    console.log('  5. A race condition or timing issue during chunked inserts')
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

// Export for direct execution
module.exports = { debugFetchLimit }

// Run if called directly
if (require.main === module) {
  debugFetchLimit().catch(console.error)
}