const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabaseOdds() {
  console.log('🔍 Analyzing existing database odds...')
  
  try {
    // Get total counts
    const { data: totalStats, error: statsError } = await supabase
      .from('odds')
      .select('eventid, oddid, created_at, sportsbook')
      .eq('sportsbook', 'SportsGameOdds')
      .order('created_at', { ascending: false })
      .limit(1000)
    
    if (statsError) {
      console.error('Error fetching odds:', statsError)
      return
    }
    
    console.log(`\\n📊 Database Analysis (last 1000 records):`)
    console.log(`Total SportsGameOdds records: ${totalStats.length}`)
    
    // Analyze unique games
    const uniqueGames = new Set(totalStats.map(r => r.eventid))
    console.log(`Unique games: ${uniqueGames.size}`)
    
    // Analyze player props vs main lines
    const playerProps = totalStats.filter(r => r.oddid.includes('_NFL'))
    const mainLines = totalStats.filter(r => r.oddid.startsWith('points-'))
    
    console.log(`Player props: ${playerProps.length}`)
    console.log(`Main lines (points): ${mainLines.length}`)
    console.log(`Other odds: ${totalStats.length - playerProps.length - mainLines.length}`)
    
    // Get date range
    const dates = totalStats.map(r => new Date(r.created_at)).sort((a, b) => a - b)
    if (dates.length > 0) {
      console.log(`Date range: ${dates[0].toISOString()} to ${dates[dates.length - 1].toISOString()}`)
    }
    
    // Check for recent NFL games
    console.log(`\\n🏈 Recent NFL games in database:`)
    const recentGames = Array.from(uniqueGames).slice(0, 10)
    for (const gameId of recentGames) {
      const gameOdds = totalStats.filter(r => r.eventid === gameId)
      const gamePlayerProps = gameOdds.filter(r => r.oddid.includes('_NFL'))
      console.log(`  ${gameId}: ${gameOdds.length} odds (${gamePlayerProps.length} player props)`)
    }
    
    // Sample current player props
    console.log(`\\n🏃 Sample player props in database:`)
    playerProps.slice(0, 10).forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.oddid} (Game: ${prop.eventid})`)
    })
    
    // Check for specific NFL games from our test
    const testGameIds = ['2Dy22vFdCa6FH3PExF4m', 'ouW6XII0uKqRsJazjYBR', '3H5QZ2enxqoreiTpJq0a']
    
    console.log(`\\n🎮 Checking our test games:`)
    for (const gameId of testGameIds) {
      const { count: gameOddsCount } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .eq('eventid', gameId)
        .eq('sportsbook', 'SportsGameOdds')
      
      const { count: gamePlayerPropsCount } = await supabase
        .from('odds')
        .select('*', { count: 'exact', head: true })
        .eq('eventid', gameId)
        .eq('sportsbook', 'SportsGameOdds')
        .like('oddid', '%_NFL%')
      
      console.log(`  ${gameId}: ${gameOddsCount || 0} total odds, ${gamePlayerPropsCount || 0} player props`)
    }
    
    // Test inserting a simple new record to understand the constraint
    console.log(`\\n🧪 Testing database constraint...`)
    const testRecord = {
      eventid: 'TEST_GAME_123',
      oddid: 'test-oddid-123',
      sportsbook: 'SportsGameOdds',
      marketname: 'Test Market',
      bettypeid: 'test',
      line: null,
      bookodds: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: insertResult, error: insertError } = await supabase
      .from('odds')
      .insert([testRecord])
      .select()
    
    if (insertError) {
      console.log(`❌ Test insert failed: ${insertError.message}`)
    } else {
      console.log(`✅ Test insert succeeded`)
      
      // Clean up test record
      await supabase
        .from('odds')
        .delete()
        .eq('eventid', 'TEST_GAME_123')
    }
    
    // Check the table schema constraints
    console.log(`\\n📋 Checking database constraints...`)
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'odds' })
      .single()
    
    if (constraintError) {
      console.log(`ℹ️ Could not fetch constraints: ${constraintError.message}`)
    } else {
      console.log(`Database constraints:`, constraints)
    }
    
  } catch (error) {
    console.error('❌ Analysis error:', error)
  }
}

// Export for direct execution
module.exports = { analyzeDatabaseOdds }

// Run if called directly
if (require.main === module) {
  analyzeDatabaseOdds().catch(console.error)
}