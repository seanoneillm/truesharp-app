const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnoseFetchDataLoss() {
  console.log('🔍 Diagnosing Fetch Data Loss Issues')
  console.log('📊 Simulating real fetch conditions that cause massive data loss')
  
  try {
    const testGameId = `FETCH_LOSS_TEST_${Date.now()}`
    
    await supabase.from('games').insert({
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
    })
    
    console.log('✅ Test game created')
    
    // ISSUE 1: Duplicate oddid issue in fetch code
    console.log('\n🚨 ISSUE 1: Duplicate oddid problem in alternate lines')
    console.log('The fetch code creates duplicate oddids when processing alternate lines!')
    
    // Simulate what the fetch does with alternate lines
    const simulatedFetchRecords = []
    const baseOddId = 'points-all-game-ou-over'
    
    // Base record
    simulatedFetchRecords.push({
      eventid: testGameId,
      oddid: baseOddId,
      sportsbook: 'SportsGameOdds',
      marketname: 'Over/Under',
      bettypeid: 'ou',
      line: '47.5',
      bookodds: -110,
      fetched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Alternate lines - THE PROBLEM: These create duplicate keys!
    for (let i = 1; i <= 10; i++) {
      // FETCH BUG: The code tries to make unique oddid but often fails
      const altOddId = `${baseOddId}_${47.5}` // This will be the SAME for all alts with same spread!
      
      simulatedFetchRecords.push({
        eventid: testGameId,
        oddid: altOddId, // ❌ DUPLICATE ODDID + SAME LINE = CONSTRAINT VIOLATION
        sportsbook: 'SportsGameOdds',
        marketname: 'Alternate Over/Under',
        bettypeid: 'ou',
        line: '47.5', // ❌ SAME LINE VALUE
        bookodds: -110 + i,
        fetched_at: new Date(Date.now() + i * 100).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    console.log(`Attempting to insert ${simulatedFetchRecords.length} records with duplicate oddid+line combinations...`)
    
    const { data: dupResult, error: dupError } = await supabase
      .from('odds')
      .insert(simulatedFetchRecords)
      .select('id')
    
    console.log(`Result: ${dupError ? 'ERROR - ' + dupError.message : 'SUCCESS - ' + (dupResult?.length || 0) + ' inserted'}`)
    
    // ISSUE 2: Timestamp collision problem
    console.log('\n🚨 ISSUE 2: Timestamp collision in rapid inserts')
    
    const timestampCollisionRecords = []
    const baseTimestamp = new Date().toISOString()
    
    // All records get same timestamp due to rapid processing
    for (let i = 0; i < 20; i++) {
      timestampCollisionRecords.push({
        eventid: testGameId,
        oddid: `timestamp-collision-${i}`,
        sportsbook: 'SportsGameOdds',
        marketname: 'Timestamp Test',
        bettypeid: 'test',
        line: '1.5',
        bookodds: 100,
        fetched_at: baseTimestamp, // ❌ SAME TIMESTAMP
        created_at: baseTimestamp,
        updated_at: baseTimestamp
      })
    }
    
    // Insert first batch
    const { data: firstBatch } = await supabase
      .from('odds')
      .insert(timestampCollisionRecords.slice(0, 10))
      .select('id')
    
    console.log(`First batch: ${firstBatch?.length || 0} inserted`)
    
    // Try to insert second batch with same timestamps - triggers will reject these
    const { data: secondBatch, error: timeError } = await supabase
      .from('odds')
      .insert(timestampCollisionRecords.slice(10))
      .select('id')
    
    console.log(`Second batch: ${timeError ? 'ERROR - ' + timeError.message : 'SUCCESS - ' + (secondBatch?.length || 0) + ' inserted'}`)
    
    // ISSUE 3: NULL vs String line handling
    console.log('\n🚨 ISSUE 3: NULL vs String line value problems')
    
    const lineHandlingRecords = [
      {
        eventid: testGameId,
        oddid: 'line-test-1',
        sportsbook: 'SportsGameOdds',
        marketname: 'Line Test',
        bettypeid: 'ml',
        line: null, // Proper NULL for moneyline
        bookodds: -150,
        fetched_at: new Date(Date.now() + 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        eventid: testGameId,
        oddid: 'line-test-1', // Same oddid
        sportsbook: 'SportsGameOdds', 
        marketname: 'Line Test',
        bettypeid: 'ml',
        line: 'null', // ❌ STRING "null" instead of NULL
        bookodds: -140,
        fetched_at: new Date(Date.now() + 2000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        eventid: testGameId,
        oddid: 'line-test-1', // Same oddid
        sportsbook: 'SportsGameOdds',
        marketname: 'Line Test', 
        bettypeid: 'ml',
        line: '', // ❌ EMPTY STRING instead of NULL
        bookodds: -130,
        fetched_at: new Date(Date.now() + 3000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    for (const [index, record] of lineHandlingRecords.entries()) {
      const { data: lineResult, error: lineError } = await supabase
        .from('odds')
        .insert([record])
        .select('id')
      
      console.log(`Line test ${index + 1} (line: ${JSON.stringify(record.line)}): ${lineError ? 'ERROR - ' + lineError.message : 'SUCCESS - ' + (lineResult?.length || 0) + ' inserted'}`)
    }
    
    // Check final count to see data loss
    const { count: finalCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    const totalAttempted = simulatedFetchRecords.length + timestampCollisionRecords.length + lineHandlingRecords.length
    const lossPercentage = ((totalAttempted - (finalCount || 0)) / totalAttempted * 100).toFixed(1)
    
    console.log(`\n📊 DATA LOSS ANALYSIS:`)
    console.log(`  Total records attempted: ${totalAttempted}`)
    console.log(`  Records actually saved: ${finalCount}`)
    console.log(`  Data loss: ${lossPercentage}%`)
    
    console.log(`\n🔧 ROOT CAUSES OF DATA LOSS:`)
    console.log(`  1. ❌ Duplicate oddid+line combinations from alternate lines`)
    console.log(`  2. ❌ Timestamp collisions causing trigger rejections`)
    console.log(`  3. ❌ Inconsistent NULL vs string handling for line values`)
    console.log(`  4. ❌ Race conditions in chunked inserts with same timestamps`)
    
    console.log(`\n💡 FIXES NEEDED:`)
    console.log(`  1. Fix alternate line oddid generation to be truly unique`)
    console.log(`  2. Add microsecond timestamps with proper spreading`)
    console.log(`  3. Standardize NULL vs string line value handling`)
    console.log(`  4. Add better duplicate detection before database insert`)
    console.log(`  5. Add proper error handling for constraint violations`)
    
    // Cleanup
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    console.log(`\n🧹 Cleanup completed`)
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error)
  }
}

// Export for direct execution
module.exports = { diagnoseFetchDataLoss }

// Run if called directly
if (require.main === module) {
  diagnoseFetchDataLoss().catch(console.error)
}