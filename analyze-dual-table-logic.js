const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDualTableLogic() {
  console.log('🔍 Analyzing Dual Table Logic and Triggers...')
  
  try {
    // First, let's check if the trigger functions exist
    console.log('\\n📋 Checking trigger functions...')
    
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_catalog.pg_proc')
      .select('proname')
      .or('proname.eq.manage_odds_duplicates,proname.eq.manage_open_odds_duplicates')
    
    if (funcError) {
      console.log('ℹ️ Could not query functions directly, checking with alternative method')
    }
    
    // Check current counts in both tables
    const { count: oddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    const { count: openOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    console.log(`\\n📊 Current table counts:`)
    console.log(`  odds table: ${oddsCount || 'unknown'}`)
    console.log(`  open_odds table: ${openOddsCount || 'unknown'}`)
    
    // Test the dual table insertion logic
    console.log('\\n🧪 Testing dual table insertion...')
    
    // Create test records with same eventid/oddid/line but different timestamps
    const baseRecord = {
      eventid: 'TEST_DUAL_GAME_' + Date.now(),
      oddid: 'test-dual-oddid-123',
      sportsbook: 'SportsGameOdds',
      marketname: 'Test Market',
      bettypeid: 'test',
      line: '1.5',
      bookodds: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Create game record first (foreign key requirement)
    const { error: gameError } = await supabase
      .from('games')
      .insert([{
        id: baseRecord.eventid,
        sport: 'NFL',
        league: 'NFL',
        home_team: 'Test Home',
        away_team: 'Test Away',
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
    
    // Test 1: Insert first record
    const record1 = {
      ...baseRecord,
      fetched_at: new Date(Date.now() - 5000).toISOString() // 5 seconds ago
    }
    
    const { data: insert1Odds, error: error1Odds } = await supabase
      .from('odds')
      .insert([record1])
      .select()
    
    const { data: insert1Open, error: error1Open } = await supabase
      .from('open_odds')
      .insert([record1])
      .select()
    
    console.log(`\\n📝 First insertion:`)
    console.log(`  odds table: ${error1Odds ? 'ERROR - ' + error1Odds.message : 'SUCCESS - ' + insert1Odds?.length + ' records'}`)
    console.log(`  open_odds table: ${error1Open ? 'ERROR - ' + error1Open.message : 'SUCCESS - ' + insert1Open?.length + ' records'}`)
    
    // Test 2: Insert duplicate with newer timestamp
    const record2 = {
      ...baseRecord,
      fetched_at: new Date().toISOString(), // Now (newer)
      bookodds: 150 // Different odds value
    }
    
    const { data: insert2Odds, error: error2Odds } = await supabase
      .from('odds')
      .insert([record2])
      .select()
    
    const { data: insert2Open, error: error2Open } = await supabase
      .from('open_odds')
      .insert([record2])
      .select()
    
    console.log(`\\n📝 Second insertion (duplicate with newer timestamp):`)
    console.log(`  odds table: ${error2Odds ? 'ERROR - ' + error2Odds.message : 'SUCCESS - ' + insert2Odds?.length + ' records'}`)
    console.log(`  open_odds table: ${error2Open ? 'ERROR - ' + error2Open.message : 'SUCCESS - ' + insert2Open?.length + ' records'}`)
    
    // Check what's actually in the tables now
    const { data: finalOdds } = await supabase
      .from('odds')
      .select('fetched_at, bookodds')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    const { data: finalOpenOdds } = await supabase
      .from('open_odds')
      .select('fetched_at, bookodds')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    console.log(`\\n🔍 Final state analysis:`)
    console.log(`  odds table records: ${finalOdds?.length || 0}`)
    if (finalOdds?.length > 0) {
      finalOdds.forEach((record, i) => {
        const isNewer = new Date(record.fetched_at) > new Date(record1.fetched_at)
        console.log(`    Record ${i + 1}: fetched_at=${record.fetched_at}, bookodds=${record.bookodds} (${isNewer ? 'NEWER' : 'OLDER'})`)
      })
    }
    
    console.log(`  open_odds table records: ${finalOpenOdds?.length || 0}`)
    if (finalOpenOdds?.length > 0) {
      finalOpenOdds.forEach((record, i) => {
        const isNewer = new Date(record.fetched_at) > new Date(record1.fetched_at)
        console.log(`    Record ${i + 1}: fetched_at=${record.fetched_at}, bookodds=${record.bookodds} (${isNewer ? 'NEWER' : 'OLDER'})`)
      })
    }
    
    // Test 3: Insert duplicate with older timestamp
    const record3 = {
      ...baseRecord,
      fetched_at: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago (older)
      bookodds: 75 // Different odds value
    }
    
    const { data: insert3Odds, error: error3Odds } = await supabase
      .from('odds')
      .insert([record3])
      .select()
    
    const { data: insert3Open, error: error3Open } = await supabase
      .from('open_odds')
      .insert([record3])
      .select()
    
    console.log(`\\n📝 Third insertion (duplicate with older timestamp):`)
    console.log(`  odds table: ${error3Odds ? 'ERROR - ' + error3Odds.message : 'SUCCESS - ' + insert3Odds?.length + ' records'}`)
    console.log(`  open_odds table: ${error3Open ? 'ERROR - ' + error3Open.message : 'SUCCESS - ' + insert3Open?.length + ' records'}`)
    
    // Final check
    const { data: finalOdds2 } = await supabase
      .from('odds')
      .select('fetched_at, bookodds')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    const { data: finalOpenOdds2 } = await supabase
      .from('open_odds')
      .select('fetched_at, bookodds')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    console.log(`\\n🎯 Final verification after all insertions:`)
    console.log(`  odds table should keep NEWEST (remove oldest):`)
    if (finalOdds2?.length > 0) {
      finalOdds2.forEach((record, i) => {
        console.log(`    Record ${i + 1}: fetched_at=${record.fetched_at}, bookodds=${record.bookodds}`)
      })
    }
    
    console.log(`  open_odds table should keep OLDEST (remove newest):`)
    if (finalOpenOdds2?.length > 0) {
      finalOpenOdds2.forEach((record, i) => {
        console.log(`    Record ${i + 1}: fetched_at=${record.fetched_at}, bookodds=${record.bookodds}`)
      })
    }
    
    // Analyze the behavior
    console.log(`\\n📋 Trigger Analysis:`)
    
    if (finalOdds2?.length === 1 && finalOpenOdds2?.length === 1) {
      const oddsRecord = finalOdds2[0]
      const openOddsRecord = finalOpenOdds2[0]
      
      const oddsIsNewest = new Date(oddsRecord.fetched_at) >= new Date(record1.fetched_at)
      const openOddsIsOldest = new Date(openOddsRecord.fetched_at) <= new Date(record1.fetched_at)
      
      console.log(`  ✅ odds table behavior: ${oddsIsNewest ? 'CORRECT - keeping newest' : 'INCORRECT - not keeping newest'}`)
      console.log(`  ✅ open_odds table behavior: ${openOddsIsOldest ? 'CORRECT - keeping oldest' : 'INCORRECT - not keeping oldest'}`)
    } else {
      console.log(`  ❌ Unexpected record counts - triggers may not be working`)
    }
    
    // Cleanup test records
    console.log(`\\n🧹 Cleaning up test records...`)
    
    await supabase
      .from('odds')
      .delete()
      .eq('eventid', baseRecord.eventid)
    
    await supabase
      .from('open_odds')
      .delete()
      .eq('eventid', baseRecord.eventid)
    
    await supabase
      .from('games')
      .delete()
      .eq('id', baseRecord.eventid)
    
    console.log('✅ Cleanup completed')
    
    // Now let's check the actual odds fetch logic in the codebase
    console.log(`\\n🔧 Reviewing current fetch logic...`)
    
    // Check if both tables are being inserted into equally
    console.log(`Expected behavior:`)
    console.log(`  1. Each odds record should be inserted into BOTH tables`)
    console.log(`  2. odds table trigger should keep newest, remove oldest`)
    console.log(`  3. open_odds table trigger should keep oldest, remove newest`)
    console.log(`  4. Both tables should have equal counts for current odds`)
    
    // Compare recent records between tables
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('eventid, oddid, line, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .order('fetched_at', { ascending: false })
      .limit(100)
    
    const { data: recentOpenOdds } = await supabase
      .from('open_odds')
      .select('eventid, oddid, line, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .order('fetched_at', { ascending: false })
      .limit(100)
    
    console.log(`\\n📊 Recent records comparison:`)
    console.log(`  odds table: ${recentOdds?.length || 0} recent records`)
    console.log(`  open_odds table: ${recentOpenOdds?.length || 0} recent records`)
    
    if (recentOdds && recentOpenOdds) {
      // Check if the same eventid/oddid combinations exist in both tables
      const oddsKeys = new Set(recentOdds.map(r => `${r.eventid}:${r.oddid}:${r.line}`))
      const openOddsKeys = new Set(recentOpenOdds.map(r => `${r.eventid}:${r.oddid}:${r.line}`))
      
      const commonKeys = new Set([...oddsKeys].filter(x => openOddsKeys.has(x)))
      const oddsOnlyKeys = new Set([...oddsKeys].filter(x => !openOddsKeys.has(x)))
      const openOddsOnlyKeys = new Set([...openOddsKeys].filter(x => !oddsKeys.has(x)))
      
      console.log(`  Common records: ${commonKeys.size}`)
      console.log(`  Only in odds: ${oddsOnlyKeys.size}`)
      console.log(`  Only in open_odds: ${openOddsOnlyKeys.size}`)
      
      if (oddsOnlyKeys.size > 0 || openOddsOnlyKeys.size > 0) {
        console.log(`  ⚠️ Tables are not in sync - may indicate dual insertion issue`)
      } else {
        console.log(`  ✅ Tables appear to be in sync`)
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis error:', error)
  }
}

// Export for direct execution
module.exports = { analyzeDualTableLogic }

// Run if called directly
if (require.main === module) {
  analyzeDualTableLogic().catch(console.error)
}