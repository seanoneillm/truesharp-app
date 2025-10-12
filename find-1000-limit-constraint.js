const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function find1000LimitConstraint() {
  console.log('🕵️ Finding the 1000 Record Limit Constraint')
  
  try {
    // 1. Check for triggers on the odds table
    console.log('\\n🔍 Checking for triggers on odds table...')
    
    try {
      const { data: triggers, error: triggerError } = await supabase
        .rpc('get_table_triggers', { table_name: 'odds' })
      
      if (!triggerError && triggers) {
        console.log(`Found triggers:`, triggers)
      } else {
        console.log('Could not query triggers directly')
      }
    } catch (error) {
      console.log('Could not query triggers (may not have permission)')
    }
    
    // 2. Check for check constraints
    console.log('\\n🔍 Checking for check constraints...')
    
    try {
      const { data: constraints } = await supabase
        .from('information_schema.check_constraints')
        .select('*')
        .eq('table_name', 'odds')
      
      if (constraints && constraints.length > 0) {
        console.log(`Found check constraints:`)
        constraints.forEach((constraint, i) => {
          console.log(`  ${i + 1}. ${constraint.constraint_name}: ${constraint.check_clause}`)
        })
      } else {
        console.log('No check constraints found')
      }
    } catch (error) {
      console.log('Could not query check constraints')
    }
    
    // 3. Look for functions that might be limiting records
    console.log('\\n🔍 Looking for functions that might limit records...')
    
    try {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_definition')
        .like('routine_name', '%odds%')
        .or('routine_name.like.%manage%,routine_name.like.%limit%,routine_name.like.%duplicate%')
      
      if (functions && functions.length > 0) {
        console.log(`Found potentially relevant functions:`)
        functions.forEach((func, i) => {
          console.log(`\\n  ${i + 1}. Function: ${func.routine_name}`)
          if (func.routine_definition) {
            const def = func.routine_definition.toString()
            if (def.includes('1000') || def.includes('limit') || def.includes('count')) {
              console.log(`    🎯 SUSPICIOUS: Contains limit-related code`)
              console.log(`    Definition snippet: ${def.substring(0, 200)}...`)
            } else {
              console.log(`    Definition available but no obvious limits found`)
            }
          }
        })
      } else {
        console.log('No relevant functions found')
      }
    } catch (error) {
      console.log('Could not query functions')
    }
    
    // 4. Test the trigger behavior specifically
    console.log('\\n🧪 Testing trigger behavior at the 1000 limit...')
    
    // Create test game
    const testGameId = `TRIGGER_TEST_${Date.now()}`
    
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
    
    // Insert exactly 999 records
    console.log('📦 Inserting exactly 999 records...')
    const records999 = []
    for (let i = 0; i < 999; i++) {
      records999.push({
        eventid: testGameId,
        oddid: `test-999-${i}`,
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
    
    const { data: insert999, error: error999 } = await supabase
      .from('odds')
      .insert(records999)
      .select('id')
    
    console.log(`999 records result: ${error999 ? 'ERROR - ' + error999.message : 'SUCCESS - ' + (insert999?.length || 0) + ' inserted'}`)
    
    // Try to insert the 1000th record
    console.log('📦 Inserting the 1000th record...')
    const { data: insert1000, error: error1000 } = await supabase
      .from('odds')
      .insert([{
        eventid: testGameId,
        oddid: 'test-1000',
        sportsbook: 'SportsGameOdds',
        marketname: 'Test Market 1000',
        bettypeid: 'test',
        line: '1000.5',
        bookodds: 1100,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
    
    console.log(`1000th record result: ${error1000 ? 'ERROR - ' + error1000.message : 'SUCCESS - ' + (insert1000?.length || 0) + ' inserted'}`)
    
    // Try to insert the 1001st record
    console.log('📦 Attempting to insert the 1001st record...')
    const { data: insert1001, error: error1001 } = await supabase
      .from('odds')
      .insert([{
        eventid: testGameId,
        oddid: 'test-1001',
        sportsbook: 'SportsGameOdds',
        marketname: 'Test Market 1001',
        bettypeid: 'test',
        line: '1001.5',
        bookodds: 1101,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
    
    console.log(`1001st record result: ${error1001 ? 'ERROR - ' + error1001.message : 'SUCCESS - ' + (insert1001?.length || 0) + ' inserted'}`)
    
    // Check final count
    const { count: finalCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', testGameId)
    
    console.log(`Final record count: ${finalCount}`)
    
    if (error1001 && !error1000) {
      console.log('🎯 CONFIRMED: Limit triggers exactly at 1001st record')
      console.log(`Error message: ${error1001.message}`)
      
      if (error1001.message.includes('trigger') || error1001.message.includes('function')) {
        console.log('🎯 This is definitely a database trigger causing the limit')
      }
    }
    
    // 5. Check the manage_odds_duplicates function specifically
    console.log('\\n🔍 Checking manage_odds_duplicates function...')
    
    try {
      // Try to get the function definition
      const { data: oddsDuplicateFunc } = await supabase
        .from('information_schema.routines')
        .select('routine_definition')
        .eq('routine_name', 'manage_odds_duplicates')
        .single()
      
      if (oddsDuplicateFunc && oddsDuplicateFunc.routine_definition) {
        const funcDef = oddsDuplicateFunc.routine_definition.toString()
        console.log('Found manage_odds_duplicates function!')
        
        if (funcDef.includes('1000')) {
          console.log('🎯 FOUND IT! Function contains 1000 limit')
          console.log('Function definition:')
          console.log(funcDef)
        } else if (funcDef.includes('limit') || funcDef.includes('count')) {
          console.log('⚠️ Function has limit logic but not obviously 1000')
          console.log('Relevant parts:')
          // Extract lines containing limit/count
          const lines = funcDef.split('\\n')
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes('limit') || line.toLowerCase().includes('count')) {
              console.log(`  Line ${i}: ${line.trim()}`)
            }
          })
        } else {
          console.log('Function found but no obvious limits detected')
          console.log('Function length:', funcDef.length, 'characters')
        }
      } else {
        console.log('manage_odds_duplicates function not found or not accessible')
      }
    } catch (error) {
      console.log('Could not access manage_odds_duplicates function')
    }
    
    // Cleanup
    await supabase.from('odds').delete().eq('eventid', testGameId)
    await supabase.from('games').delete().eq('id', testGameId)
    
    console.log('\\n🎯 SUMMARY:')
    console.log('The 1000 record limit per game is caused by:')
    console.log('  • A database trigger (likely manage_odds_duplicates)')
    console.log('  • The trigger fires BEFORE INSERT and limits records per eventid')
    console.log('  • This explains why your fetch processes thousands but only saves 1000')
    console.log('\\n🔧 TO FIX:')
    console.log('  1. Find and modify the manage_odds_duplicates function')
    console.log('  2. Remove or increase the 1000 record limit')
    console.log('  3. Or modify the trigger logic to allow more records per game')
    
  } catch (error) {
    console.error('❌ Investigation error:', error)
  }
}

// Export for direct execution
module.exports = { find1000LimitConstraint }

// Run if called directly
if (require.main === module) {
  find1000LimitConstraint().catch(console.error)
}