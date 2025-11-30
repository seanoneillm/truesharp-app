const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkMainLines() {
  console.log('🔍 Maybe team total points are part of main lines? Checking...\n')
  
  try {
    // Get odds for the NBA game we know has data
    const { data: gameOdds } = await supabase
      .from('odds')
      .select('oddid, marketname, line')
      .eq('eventid', 'kZgTeL7imTPo4H5iH4wb')
      
    console.log(`📊 Total odds: ${gameOdds?.length}`)
    
    // Check what "points" patterns exist
    const pointsPatterns = gameOdds?.filter(o => o.oddid && o.oddid.includes('points')) || []
    
    console.log('\n📋 ALL points patterns in this NBA game:')
    
    const uniquePointsPatterns = [...new Set(pointsPatterns.map(p => p.oddid))]
    uniquePointsPatterns.sort().forEach(pattern => {
      const example = pointsPatterns.find(p => p.oddid === pattern)
      console.log(`   ${pattern} - ${example?.marketname} ${example?.line ? `(${example.line})` : ''}`)
    })
    
    // Maybe team totals are represented differently
    console.log('\n🔍 Looking for patterns that could be team totals...')
    
    // Check if there are team-specific total patterns
    const possibleTeamTotals = gameOdds?.filter(o => 
      o.oddid && 
      o.oddid.includes('points') && 
      !o.oddid.match(/points-[A-Z_]+\d*_NBA/) && // Not player props
      (o.oddid.includes('home') || o.oddid.includes('away') || o.oddid.includes('all'))
    ) || []
    
    if (possibleTeamTotals.length > 0) {
      console.log('\n✅ Possible team total patterns:')
      possibleTeamTotals.slice(0, 10).forEach(odd => {
        console.log(`   ${odd.oddid} - ${odd.marketname} ${odd.line ? `(${odd.line})` : ''}`)
      })
    } else {
      console.log('\n❌ No team total patterns found')
    }
    
    // Check if the main game total could be what we want
    const gameTotal = gameOdds?.filter(o => 
      o.oddid && o.oddid.includes('points-all-game-ou')
    ) || []
    
    if (gameTotal.length > 0) {
      console.log('\n🎯 Game total patterns (maybe this is what team props should show?):')
      gameTotal.slice(0, 5).forEach(odd => {
        console.log(`   ${odd.oddid} - ${odd.marketname} ${odd.line ? `(${odd.line})` : ''}`)
      })
    }
    
    // Let's also see what the spread and moneyline patterns look like for context
    console.log('\n📊 Main line patterns for context:')
    
    const mainLineTypes = {
      'Spread': gameOdds?.filter(o => o.oddid && o.oddid.includes('points') && o.oddid.includes('sp')) || [],
      'Moneyline': gameOdds?.filter(o => o.oddid && o.oddid.includes('points') && o.oddid.includes('ml')) || [],
      'Total': gameOdds?.filter(o => o.oddid && o.oddid.includes('points-all') && o.oddid.includes('ou')) || []
    }
    
    Object.entries(mainLineTypes).forEach(([type, odds]) => {
      if (odds.length > 0) {
        console.log(`\n${type} (${odds.length} odds):`)
        odds.slice(0, 3).forEach(odd => {
          console.log(`   ${odd.oddid} - ${odd.marketname} ${odd.line ? `(${odd.line})` : ''}`)
        })
      }
    })
    
  } catch (error) {
    console.error('Error checking main lines:', error)
  }
}

checkMainLines()