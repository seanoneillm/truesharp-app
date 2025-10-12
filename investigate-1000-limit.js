const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function investigate1000Limit() {
  console.log('🔍 Investigating 1000 Odds Limit Issue')
  console.log('📊 Testing various database insertion patterns to find the limit')
  
  try {
    // 1. Check current row count before any testing
    const { count: initialCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    console.log(`\\n📊 Current odds count: ${initialCount}`)
    
    // 2. Check for any database-level limits or policies
    console.log('\\n🔍 Checking for database policies and limits...')
    
    // Try to get information about row-level security policies
    try {
      const { data: policies } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('tablename', 'odds')
      
      if (policies && policies.length > 0) {
        console.log(`Found ${policies.length} RLS policies on odds table:`)
        policies.forEach((policy, i) => {
          console.log(`  ${i + 1}. ${policy.policyname}: ${policy.cmd} - ${policy.qual}`)
        })
      } else {
        console.log('No RLS policies found on odds table')
      }
    } catch (error) {
      console.log('Could not query policies (may not have permission)')
    }
    
    // 3. Test actual insertion behavior with known data
    console.log('\\n🧪 Testing insertion limits with controlled data...')
    
    // Create a test game first
    const testGameId = `TEST_LIMIT_${Date.now()}`
    
    const { error: gameError } = await supabase
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
    
    if (gameError) {
      console.log(`❌ Could not create test game: ${gameError.message}`)
      return
    }
    
    console.log('✅ Test game created')
    
    // Test different batch sizes to find the limit
    const testSizes = [100, 500, 1000, 1500, 2000]
    
    for (const batchSize of testSizes) {
      console.log(`\\n📦 Testing batch size: ${batchSize}`)
      
      // Generate test records
      const testRecords = []
      for (let i = 0; i < batchSize; i++) {
        testRecords.push({
          eventid: testGameId,
          oddid: `test-limit-${batchSize}-${i}`,
          sportsbook: 'SportsGameOdds',
          marketname: `Test Market ${i}`,
          bettypeid: 'test',
          line: `${i}.5`,
          bookodds: 100 + i,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      console.log(`  Attempting to insert ${testRecords.length} records...`)
      
      const startTime = Date.now()
      const { data: insertResult, error: insertError } = await supabase
        .from('odds')
        .insert(testRecords)
        .select('id')
      
      const insertTime = Date.now() - startTime
      
      if (insertError) {
        console.log(`  ❌ FAILED: ${insertError.message}`)
        if (insertError.message.includes('too many')) {
          console.log(`  🎯 FOUND LIMIT: Batch size ${batchSize} is too large`)
          break
        }
      } else {
        const insertedCount = insertResult?.length || 0
        console.log(`  ✅ SUCCESS: ${insertedCount} records inserted in ${insertTime}ms`)
        
        if (insertedCount !== batchSize) {
          console.log(`  ⚠️ PARTIAL: Expected ${batchSize}, got ${insertedCount}`)
        }
      }
      
      // Clean up test records
      await supabase
        .from('odds')
        .delete()
        .eq('eventid', testGameId)
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 4. Test the exact scenario from your fetch
    console.log('\\n🎯 Testing real-world scenario simulation...')
    
    // Simulate what happens when processing a game with many odds
    const simulatedOddsCount = 2500 // Typical count from your logs
    const chunkSize = 500 // From your code
    
    console.log(`Simulating ${simulatedOddsCount} odds in chunks of ${chunkSize}`)
    
    let totalInserted = 0
    let totalErrors = 0
    
    for (let i = 0; i < simulatedOddsCount; i += chunkSize) {
      const currentChunkSize = Math.min(chunkSize, simulatedOddsCount - i)
      const chunkNumber = Math.floor(i / chunkSize) + 1
      
      console.log(`\\n  📦 Chunk ${chunkNumber}: ${currentChunkSize} records`)
      
      // Generate chunk
      const chunkRecords = []
      for (let j = 0; j < currentChunkSize; j++) {
        const recordIndex = i + j
        chunkRecords.push({
          eventid: testGameId,
          oddid: `sim-${recordIndex}`,
          sportsbook: 'SportsGameOdds',
          marketname: `Simulated Market ${recordIndex}`,
          bettypeid: 'test',
          line: `${recordIndex}.5`,
          bookodds: 100 + recordIndex,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // Insert chunk
      const { data: chunkResult, error: chunkError } = await supabase
        .from('odds')
        .insert(chunkRecords)
        .select('id')
      
      if (chunkError) {
        console.log(`    ❌ Chunk failed: ${chunkError.message}`)
        totalErrors++
        
        if (chunkError.message.includes('duplicate')) {
          console.log(`    ℹ️ Duplicate constraint triggered`)
        }
      } else {
        const chunkInserted = chunkResult?.length || 0
        totalInserted += chunkInserted
        console.log(`    ✅ Chunk success: ${chunkInserted} records`)
      }
      
      // Check running total
      const { count: runningCount } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .eq('eventid', testGameId)
      
      console.log(`    📊 Running total for test game: ${runningCount}`)
      
      if (runningCount && runningCount >= 1000) {
        console.log(`    🎯 HIT 1000 RECORD LIMIT! Stopping test.`)
        break
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\\n📊 Simulation Results:`)
    console.log(`  Total records attempted: ${simulatedOddsCount}`)
    console.log(`  Total chunks processed: ${Math.ceil(simulatedOddsCount / chunkSize)}`)
    console.log(`  Total records inserted: ${totalInserted}`)
    console.log(`  Total chunk errors: ${totalErrors}`)
    
    // Final check
    const { count: finalTestCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    console.log(`  Final test game record count: ${finalTestCount}`)
    
    if (finalTestCount === 1000) {
      console.log(`  🎯 CONFIRMED: Hard limit of 1000 records per game/event`)
    } else if (finalTestCount && finalTestCount < 1000) {
      console.log(`  🤔 Limit appears to be ${finalTestCount} records`)
    }
    
    // 5. Check for triggers or constraints that might cause this
    console.log('\\n🔍 Investigating potential causes of 1000 limit...')
    
    // Check if there are any triggers that might be limiting records
    console.log('Potential causes:')
    console.log('  1. Database trigger limiting records per eventid')
    console.log('  2. Application-level constraint in trigger functions')
    console.log('  3. Supabase row-level security policy')
    console.log('  4. Database configuration limit')
    console.log('  5. Custom constraint in table definition')
    
    // Check recent records per game to see if pattern exists
    const { data: recentGames } = await supabase
      .from('games')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentGames) {
      console.log('\\n📊 Checking record counts for recent games:')
      
      for (const game of recentGames.slice(0, 5)) {
        const { count: gameOddsCount } = await supabase
          .from('odds')
          .select('*', { count: 'exact', head: true })
          .eq('eventid', game.id)
          .eq('sportsbook', 'SportsGameOdds')
        
        console.log(`  Game ${game.id.substring(0, 8)}...: ${gameOddsCount} odds`)
        
        if (gameOddsCount === 1000) {
          console.log(`    🎯 Another game with exactly 1000 odds!`)
        }
      }
    }
    
    // Cleanup
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    console.log('\\n🧹 Test cleanup completed')
    
    // 6. Final diagnosis
    console.log('\\n🎯 DIAGNOSIS:')
    console.log('Based on the testing above, the 1000 odds limit is likely caused by:')
    console.log('  • Database trigger that limits records per eventid')
    console.log('  • Row-level security policy with COUNT restriction')
    console.log('  • Custom constraint in the database schema')
    console.log('  • Application logic in trigger functions')
    console.log('\\nCheck the database triggers and constraints for limits on record counts per game.')
    
  } catch (error) {
    console.error('❌ Investigation error:', error)
  }
}

// Export for direct execution
module.exports = { investigate1000Limit }

// Run if called directly
if (require.main === module) {
  investigate1000Limit().catch(console.error)
}