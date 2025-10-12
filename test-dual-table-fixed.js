const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDualTableFixed() {
  console.log('🔍 Testing Dual Table Logic (Fixed)...')
  
  try {
    // Check current counts
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
    console.log(`  Difference: ${Math.abs((oddsCount || 0) - (openOddsCount || 0))} records`)
    
    if (Math.abs((oddsCount || 0) - (openOddsCount || 0)) > 1000) {
      console.log(`  ⚠️ SIGNIFICANT MISMATCH - Tables are not being populated equally`)
    }
    
    // Test with proper game creation
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
    
    // Create game record with all required fields
    const { error: gameError } = await supabase
      .from('games')
      .insert([{
        id: baseRecord.eventid,
        sport: 'NFL',
        league: 'NFL',
        home_team: 'Test Home',
        away_team: 'Test Away',
        home_team_name: 'Test Home Team Name',
        away_team_name: 'Test Away Team Name',
        game_time: new Date().toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    
    if (gameError) {
      console.log(`❌ Could not create test game: ${gameError.message}`)
      return
    }
    
    console.log('✅ Test game created successfully')
    
    // Test dual insertion as done in the actual fetch code
    console.log('\\n🧪 Testing dual insertion like in fetch code...')
    
    const testRecord = {
      ...baseRecord,
      fetched_at: new Date().toISOString()
    }
    
    // Insert into both tables like the fetch code does
    console.log('📝 Inserting into open_odds...')
    const { data: openInsert, error: openError } = await supabase
      .from('open_odds')
      .insert([testRecord])
      .select('id')
    
    console.log('📝 Inserting into odds...')
    const { data: oddsInsert, error: oddsError } = await supabase
      .from('odds')
      .insert([testRecord])
      .select('id')
    
    console.log(`\\nResults:`)
    console.log(`  open_odds: ${openError ? 'ERROR - ' + openError.message : 'SUCCESS - ' + (openInsert?.length || 0) + ' records'}`)
    console.log(`  odds: ${oddsError ? 'ERROR - ' + oddsError.message : 'SUCCESS - ' + (oddsInsert?.length || 0) + ' records'}`)
    
    // Test duplicate handling
    console.log('\\n🔄 Testing duplicate handling...')
    
    const duplicateRecord = {
      ...baseRecord,
      fetched_at: new Date(Date.now() + 5000).toISOString(), // 5 seconds later
      bookodds: 150 // Different value
    }
    
    console.log('📝 Inserting duplicate into open_odds...')
    const { data: openDup, error: openDupError } = await supabase
      .from('open_odds')
      .insert([duplicateRecord])
      .select('id')
    
    console.log('📝 Inserting duplicate into odds...')
    const { data: oddsDup, error: oddsDupError } = await supabase
      .from('odds')
      .insert([duplicateRecord])
      .select('id')
    
    console.log(`\\nDuplicate Results:`)
    console.log(`  open_odds: ${openDupError ? 'ERROR - ' + openDupError.message : 'SUCCESS - ' + (openDup?.length || 0) + ' records'}`)
    console.log(`  odds: ${oddsDupError ? 'ERROR - ' + oddsDupError.message : 'SUCCESS - ' + (oddsDup?.length || 0) + ' records'}`)
    
    // Check final state
    console.log('\\n🔍 Checking final state...')
    
    const { data: finalOpen } = await supabase
      .from('open_odds')
      .select('*')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    const { data: finalOdds } = await supabase
      .from('odds')
      .select('*')
      .eq('eventid', baseRecord.eventid)
      .eq('oddid', baseRecord.oddid)
      .eq('line', baseRecord.line)
    
    console.log(`Final records:`)
    console.log(`  open_odds: ${finalOpen?.length || 0} records`)
    console.log(`  odds: ${finalOdds?.length || 0} records`)
    
    if (finalOpen?.length > 0) {
      finalOpen.forEach((record, i) => {
        console.log(`    open_odds[${i}]: fetched_at=${record.fetched_at}, bookodds=${record.bookodds}`)
      })
    }
    
    if (finalOdds?.length > 0) {
      finalOdds.forEach((record, i) => {
        console.log(`    odds[${i}]: fetched_at=${record.fetched_at}, bookodds=${record.bookodds}`)
      })
    }
    
    // Cleanup
    await supabase.from('open_odds').delete().eq('eventid', baseRecord.eventid)
    await supabase.from('odds').delete().eq('eventid', baseRecord.eventid)
    await supabase.from('games').delete().eq('id', baseRecord.eventid)
    
    console.log('✅ Test cleanup completed')
    
    // Now let's analyze the actual fetch code
    console.log('\\n📋 Analyzing fetch-odds-dual-table code...')
    
    // Check recent records to see the sync issue
    const { data: recentOdds } = await supabase
      .from('odds')
      .select('eventid, oddid, line, fetched_at, created_at')
      .eq('sportsbook', 'SportsGameOdds')
      .order('created_at', { ascending: false })
      .limit(50)
    
    const { data: recentOpen } = await supabase
      .from('open_odds')
      .select('eventid, oddid, line, fetched_at, created_at')
      .eq('sportsbook', 'SportsGameOdds')
      .order('created_at', { ascending: false })
      .limit(50)
    
    console.log(`\\n📊 Recent records analysis:`)
    console.log(`  Recent odds records: ${recentOdds?.length || 0}`)
    console.log(`  Recent open_odds records: ${recentOpen?.length || 0}`)
    
    if (recentOdds && recentOpen) {
      // Create sets of unique combinations for comparison
      const oddsKeys = new Set(recentOdds.map(r => `${r.eventid}:${r.oddid}:${r.line}`))
      const openKeys = new Set(recentOpen.map(r => `${r.eventid}:${r.oddid}:${r.line}`))
      
      const inBoth = [...oddsKeys].filter(key => openKeys.has(key))
      const onlyInOdds = [...oddsKeys].filter(key => !openKeys.has(key))
      const onlyInOpen = [...openKeys].filter(key => !oddsKeys.has(key))
      
      console.log(`  Records in both tables: ${inBoth.length}`)
      console.log(`  Only in odds table: ${onlyInOdds.length}`)
      console.log(`  Only in open_odds table: ${onlyInOpen.length}`)
      
      if (onlyInOdds.length > 0) {
        console.log(`\\n❌ Records only in odds table (missing from open_odds):`)
        onlyInOdds.slice(0, 5).forEach((key, i) => {
          console.log(`    ${i + 1}. ${key}`)
        })
      }
      
      if (onlyInOpen.length > 0) {
        console.log(`\\n❌ Records only in open_odds table (missing from odds):`)
        onlyInOpen.slice(0, 5).forEach((key, i) => {
          console.log(`    ${i + 1}. ${key}`)
        })
      }
    }
    
    console.log(`\\n🎯 DIAGNOSIS:`)
    
    const recordDiff = Math.abs((oddsCount || 0) - (openOddsCount || 0))
    if (recordDiff > 1000) {
      console.log(`❌ MAJOR ISSUE: Tables have ${recordDiff} record difference`)
      console.log(`   This indicates the dual table insertion in fetch-odds-dual-table is NOT working correctly`)
      console.log(`   Expected: Both tables should have nearly identical record counts`)
      console.log(`   Actual: Significant mismatch suggests one table is not being populated`)
    } else if (recordDiff > 100) {
      console.log(`⚠️ MINOR ISSUE: Tables have ${recordDiff} record difference`)
      console.log(`   This could be due to timing differences or partial failures`)
    } else {
      console.log(`✅ Tables are reasonably in sync (${recordDiff} record difference)`)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Export for direct execution
module.exports = { testDualTableFixed }

// Run if called directly
if (require.main === module) {
  testDualTableFixed().catch(console.error)
}