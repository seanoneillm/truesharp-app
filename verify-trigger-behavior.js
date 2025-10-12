const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTriggerBehavior() {
  console.log('🔍 Verifying Trigger Behavior for Duplicate Management...')
  
  try {
    // Create test game first
    const testGameId = 'TRIGGER_TEST_' + Date.now()
    
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
    
    // Test the trigger behavior for both tables
    const baseOdd = {
      eventid: testGameId,
      oddid: 'trigger-test-oddid',
      sportsbook: 'SportsGameOdds',
      marketname: 'Test Market',
      bettypeid: 'test',
      line: '2.5',
      bookodds: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Test 1: Insert first record with older timestamp
    console.log('\\n📝 Test 1: Inserting first record (older timestamp)...')
    const firstRecord = {
      ...baseOdd,
      fetched_at: new Date(Date.now() - 10000).toISOString() // 10 seconds ago
    }
    
    const { data: odds1, error: oddsError1 } = await supabase
      .from('odds')
      .insert([firstRecord])
      .select('id, fetched_at, bookodds')
    
    const { data: open1, error: openError1 } = await supabase
      .from('open_odds')
      .insert([firstRecord])
      .select('id, fetched_at, bookodds')
    
    console.log(`  odds table: ${oddsError1 ? 'ERROR - ' + oddsError1.message : 'SUCCESS - ' + (odds1?.length || 0) + ' records'}`)
    console.log(`  open_odds table: ${openError1 ? 'ERROR - ' + openError1.message : 'SUCCESS - ' + (open1?.length || 0) + ' records'}`)
    
    // Test 2: Insert duplicate with newer timestamp
    console.log('\\n📝 Test 2: Inserting duplicate with newer timestamp...')
    const newerRecord = {
      ...baseOdd,
      fetched_at: new Date().toISOString(), // Now (newer)
      bookodds: 150 // Different value to see which one gets kept
    }
    
    const { data: odds2, error: oddsError2 } = await supabase
      .from('odds')
      .insert([newerRecord])
      .select('id, fetched_at, bookodds')
    
    const { data: open2, error: openError2 } = await supabase
      .from('open_odds')
      .insert([newerRecord])
      .select('id, fetched_at, bookodds')
    
    console.log(`  odds table: ${oddsError2 ? 'ERROR - ' + oddsError2.message : 'SUCCESS - ' + (odds2?.length || 0) + ' records'}`)
    console.log(`  open_odds table: ${openError2 ? 'ERROR - ' + openError2.message : 'SUCCESS - ' + (open2?.length || 0) + ' records'}`)
    
    // Test 3: Insert duplicate with even older timestamp
    console.log('\\n📝 Test 3: Inserting duplicate with older timestamp...')
    const olderRecord = {
      ...baseOdd,
      fetched_at: new Date(Date.now() - 20000).toISOString(), // 20 seconds ago (oldest)
      bookodds: 75 // Different value
    }
    
    const { data: odds3, error: oddsError3 } = await supabase
      .from('odds')
      .insert([olderRecord])
      .select('id, fetched_at, bookodds')
    
    const { data: open3, error: openError3 } = await supabase
      .from('open_odds')
      .insert([olderRecord])
      .select('id, fetched_at, bookodds')
    
    console.log(`  odds table: ${oddsError3 ? 'ERROR - ' + oddsError3.message : 'SUCCESS - ' + (odds3?.length || 0) + ' records'}`)
    console.log(`  open_odds table: ${openError3 ? 'ERROR - ' + openError3.message : 'SUCCESS - ' + (open3?.length || 0) + ' records'}`)
    
    // Check final state in both tables
    console.log('\\n🔍 Checking final state after all insertions...')
    
    const { data: finalOdds } = await supabase
      .from('odds')
      .select('id, fetched_at, bookodds')
      .eq('eventid', testGameId)
      .eq('oddid', baseOdd.oddid)
      .eq('line', baseOdd.line)
      .order('fetched_at', { ascending: true })
    
    const { data: finalOpen } = await supabase
      .from('open_odds')
      .select('id, fetched_at, bookodds')
      .eq('eventid', testGameId)
      .eq('oddid', baseOdd.oddid)
      .eq('line', baseOdd.line)
      .order('fetched_at', { ascending: true })
    
    console.log(`\\n📊 Final State Analysis:`)
    console.log(`  odds table: ${finalOdds?.length || 0} records`)
    if (finalOdds?.length > 0) {
      finalOdds.forEach((record, i) => {
        const time = new Date(record.fetched_at)
        console.log(`    Record ${i + 1}: fetched_at=${time.toISOString()}, bookodds=${record.bookodds}`)
      })
    }
    
    console.log(`  open_odds table: ${finalOpen?.length || 0} records`)
    if (finalOpen?.length > 0) {
      finalOpen.forEach((record, i) => {
        const time = new Date(record.fetched_at)
        console.log(`    Record ${i + 1}: fetched_at=${time.toISOString()}, bookodds=${record.bookodds}`)
      })
    }
    
    // Analyze the trigger behavior
    console.log(`\\n🎯 Trigger Behavior Analysis:`)
    
    if (finalOdds?.length === 1 && finalOpen?.length === 1) {
      const oddsRecord = finalOdds[0]
      const openRecord = finalOpen[0]
      
      // Determine which timestamps we expect to see based on the logic
      const timestamps = [
        { time: new Date(Date.now() - 20000), value: 75, label: 'oldest' },
        { time: new Date(Date.now() - 10000), value: 100, label: 'middle' },
        { time: new Date(), value: 150, label: 'newest' }
      ].sort((a, b) => a.time - b.time)
      
      const oddsTimestamp = new Date(oddsRecord.fetched_at)
      const openTimestamp = new Date(openRecord.fetched_at)
      
      console.log(`\\n  Expected behavior:`)
      console.log(`    odds table should keep NEWEST record (remove oldest)`)
      console.log(`    open_odds table should keep OLDEST record (remove newest)`)
      
      console.log(`\\n  Actual behavior:`)
      console.log(`    odds table kept: bookodds=${oddsRecord.bookodds} (${oddsRecord.bookodds === 150 ? 'NEWEST ✅' : oddsRecord.bookodds === 100 ? 'MIDDLE ⚠️' : 'OLDEST ❌'})`)
      console.log(`    open_odds table kept: bookodds=${openRecord.bookodds} (${openRecord.bookodds === 75 ? 'OLDEST ✅' : openRecord.bookodds === 100 ? 'MIDDLE ⚠️' : 'NEWEST ❌'})`)
      
      const oddsCorrect = oddsRecord.bookodds === 150 // Should keep newest
      const openCorrect = openRecord.bookodds === 75 // Should keep oldest
      
      if (oddsCorrect && openCorrect) {
        console.log(`\\n✅ TRIGGERS WORKING CORRECTLY`)
        console.log(`   odds table correctly keeps newest records`)
        console.log(`   open_odds table correctly keeps oldest records`)
      } else {
        console.log(`\\n❌ TRIGGERS NOT WORKING AS EXPECTED`)
        if (!oddsCorrect) {
          console.log(`   odds table trigger issue: should keep newest but kept ${oddsRecord.bookodds === 100 ? 'middle' : 'oldest'}`)
        }
        if (!openCorrect) {
          console.log(`   open_odds table trigger issue: should keep oldest but kept ${openRecord.bookodds === 100 ? 'middle' : 'newest'}`)
        }
      }
    } else {
      console.log(`❌ UNEXPECTED: Expected 1 record in each table, got ${finalOdds?.length || 0} in odds and ${finalOpen?.length || 0} in open_odds`)
      console.log(`   This suggests triggers are not handling duplicates properly`)
    }
    
    // Test constraint behavior when triggers don't exist
    console.log(`\\n🔬 Testing constraint-only behavior (if no triggers)...`)
    
    const constraintTestRecord = {
      ...baseOdd,
      oddid: 'constraint-test-oddid', // Different oddid to avoid previous test data
      fetched_at: new Date().toISOString(),
      bookodds: 200
    }
    
    // Insert first record
    const { error: constraint1Error } = await supabase
      .from('odds')
      .insert([constraintTestRecord])
    
    // Try to insert duplicate (should fail with constraint error)
    const { error: constraint2Error } = await supabase
      .from('odds')
      .insert([constraintTestRecord])
    
    console.log(`  First insert: ${constraint1Error ? 'ERROR - ' + constraint1Error.message : 'SUCCESS'}`)
    console.log(`  Duplicate insert: ${constraint2Error ? 'BLOCKED (expected) - ' + constraint2Error.message.substring(0, 100) : 'UNEXPECTED SUCCESS'}`)
    
    if (constraint2Error?.message?.includes('duplicate key')) {
      console.log(`  ✅ Unique constraints are working (blocks true duplicates)`)
    } else {
      console.log(`  ❌ Unique constraints may not be working properly`)
    }
    
    // Cleanup
    console.log(`\\n🧹 Cleaning up test data...`)
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('open_odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    console.log('✅ Cleanup completed')
    
  } catch (error) {
    console.error('❌ Verification error:', error)
  }
}

// Export for direct execution
module.exports = { verifyTriggerBehavior }

// Run if called directly
if (require.main === module) {
  verifyTriggerBehavior().catch(console.error)
}