const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFixedFetch() {
  console.log('🚀 Testing FIXED Odds Fetch with Corrected Dual Table Logic...')
  console.log(`📅 Start time: ${new Date().toISOString()}`)
  
  try {
    // Get current table counts before fetch
    const { count: oddsCountBefore } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    const { count: openOddsCountBefore } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    console.log(`\\n📊 Before fetch:`)
    console.log(`  odds table: ${oddsCountBefore || 0} records`)
    console.log(`  open_odds table: ${openOddsCountBefore || 0} records`)
    console.log(`  Difference: ${Math.abs((oddsCountBefore || 0) - (openOddsCountBefore || 0))} records`)
    
    // Test the actual fetch API endpoint
    console.log(`\\n🔥 Calling the FIXED fetch-odds-dual-table API...`)
    
    const fetchResponse = await fetch('http://localhost:3000/api/fetch-odds-dual-table', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!fetchResponse.ok) {
      console.error(`❌ Fetch API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
      return
    }
    
    const fetchResult = await fetchResponse.json()
    
    console.log(`\\n📋 Fetch API Response:`)
    console.log(`  Success: ${fetchResult.success}`)
    console.log(`  Total games processed: ${fetchResult.totalGames || 0}`)
    console.log(`  Successful leagues: ${fetchResult.successfulLeagues || 0}/${fetchResult.totalLeagues || 0}`)
    console.log(`  Last updated: ${fetchResult.lastUpdated}`)
    
    if (fetchResult.results) {
      console.log(`\\n🏈 League Results:`)
      fetchResult.results.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.league}: ${result.games || 0} games, ${result.success ? '✅' : '❌'} ${result.error ? '- ' + result.error : ''}`)
      })
    }
    
    // Wait a moment for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get table counts after fetch
    const { count: oddsCountAfter } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    const { count: openOddsCountAfter } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .eq('sportsbook', 'SportsGameOdds')
    
    console.log(`\\n📊 After fetch:`)
    console.log(`  odds table: ${oddsCountAfter || 0} records`)
    console.log(`  open_odds table: ${openOddsCountAfter || 0} records`)
    console.log(`  Difference: ${Math.abs((oddsCountAfter || 0) - (openOddsCountAfter || 0))} records`)
    
    // Calculate changes
    const oddsIncrease = (oddsCountAfter || 0) - (oddsCountBefore || 0)
    const openOddsIncrease = (openOddsCountAfter || 0) - (openOddsCountBefore || 0)
    
    console.log(`\\n📈 Changes from fetch:`)
    console.log(`  odds table: ${oddsIncrease > 0 ? '+' : ''}${oddsIncrease} records`)
    console.log(`  open_odds table: ${openOddsIncrease > 0 ? '+' : ''}${openOddsIncrease} records`)
    
    // Analyze if the fix worked
    console.log(`\\n🎯 Fix Analysis:`)
    
    const beforeDiff = Math.abs((oddsCountBefore || 0) - (openOddsCountBefore || 0))
    const afterDiff = Math.abs((oddsCountAfter || 0) - (openOddsCountAfter || 0))
    
    if (Math.abs(oddsIncrease - openOddsIncrease) <= 1) {
      console.log(`✅ DUAL TABLE FIX WORKING: Both tables received similar record increases`)
      console.log(`   odds increase: ${oddsIncrease}`)
      console.log(`   open_odds increase: ${openOddsIncrease}`)
      console.log(`   Difference: ${Math.abs(oddsIncrease - openOddsIncrease)} (acceptable)`)
    } else {
      console.log(`❌ DUAL TABLE ISSUE PERSISTS: Unequal record increases`)
      console.log(`   odds increase: ${oddsIncrease}`)
      console.log(`   open_odds increase: ${openOddsIncrease}`)
      console.log(`   Difference: ${Math.abs(oddsIncrease - openOddsIncrease)} (problematic)`)
    }
    
    if (afterDiff < beforeDiff) {
      console.log(`✅ IMPROVEMENT: Table difference reduced from ${beforeDiff} to ${afterDiff}`)
    } else if (afterDiff > beforeDiff) {
      console.log(`❌ REGRESSION: Table difference increased from ${beforeDiff} to ${afterDiff}`)
    } else {
      console.log(`➡️ NO CHANGE: Table difference remains ${afterDiff}`)
    }
    
    // Check for recent NFL player props
    console.log(`\\n🏈 Checking for NFL player props in recent data...`)
    
    const { data: recentPlayerProps } = await supabase
      .from('odds')
      .select('oddid, marketname, eventid, fetched_at')
      .eq('sportsbook', 'SportsGameOdds')
      .like('oddid', '%_NFL%')
      .order('fetched_at', { ascending: false })
      .limit(10)
    
    console.log(`Recent NFL player props found: ${recentPlayerProps?.length || 0}`)
    if (recentPlayerProps?.length > 0) {
      recentPlayerProps.slice(0, 5).forEach((prop, i) => {
        console.log(`  ${i + 1}. ${prop.oddid} - ${prop.marketname}`)
      })
      console.log(`✅ NFL player props are being captured successfully`)
    } else {
      console.log(`⚠️ No recent NFL player props found - may be due to timing or game status`)
    }
    
    // Final assessment
    console.log(`\\n🎉 FINAL ASSESSMENT:`)
    
    const totalRecords = (oddsCountAfter || 0) + (openOddsCountAfter || 0)
    const syncPercentage = totalRecords > 0 ? (Math.min(oddsCountAfter || 0, openOddsCountAfter || 0) * 2 / totalRecords * 100) : 0
    
    console.log(`  Total records across both tables: ${totalRecords.toLocaleString()}`)
    console.log(`  Table sync percentage: ${syncPercentage.toFixed(1)}%`)
    
    if (syncPercentage > 95) {
      console.log(`  ✅ EXCELLENT: Tables are well synchronized`)
    } else if (syncPercentage > 85) {
      console.log(`  ⚠️ GOOD: Tables are reasonably synchronized`)
    } else {
      console.log(`  ❌ POOR: Tables need better synchronization`)
    }
    
    const playerPropCount = recentPlayerProps?.length || 0
    if (playerPropCount > 0) {
      console.log(`  ✅ Player props are being captured`)
    } else {
      console.log(`  ℹ️ Player props status unclear (check timing/games)`)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
  
  console.log(`\\n✅ Fixed fetch test completed at ${new Date().toISOString()}`)
}

// Export for direct execution
module.exports = { testFixedFetch }

// Run if called directly
if (require.main === module) {
  testFixedFetch().catch(console.error)
}