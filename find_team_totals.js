const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findTeamTotals() {
  console.log('🔍 Searching for NBA team total points patterns like NFL...\n')
  
  try {
    // Get ALL odds for basketball games
    const { data: allOdds } = await supabase
      .from('odds')
      .select('oddid, marketname, eventid')
      .limit(10000)
      
    // Find basketball odds
    const basketballOdds = []
    for (const odd of allOdds) {
      const { data: game } = await supabase
        .from('games')
        .select('league, sport')
        .eq('id', odd.eventid)
        .single()
        
      if (game && (
        game.league?.includes('NBA') || 
        game.league?.includes('WNBA') || 
        game.league?.includes('NCAAB')
      )) {
        basketballOdds.push(odd.oddid)
      }
    }
    
    console.log(`📊 Found ${basketballOdds.length} basketball odds to analyze`)
    
    // Search for team total patterns like NFL uses
    const nflPatterns = [
      'points-home-game-ou-over',
      'points-home-game-ou-under', 
      'points-away-game-ou-over',
      'points-away-game-ou-under'
    ]
    
    console.log('\n🏈 NFL Team Scoring Patterns:')
    nflPatterns.forEach(pattern => {
      console.log(`   ${pattern}`)
    })
    
    console.log('\n🏀 Searching for equivalent NBA patterns...')
    
    nflPatterns.forEach(pattern => {
      const matches = basketballOdds.filter(oddid => oddid && oddid === pattern)
      if (matches.length > 0) {
        console.log(`✅ ${pattern}: ${matches.length} exact matches`)
      } else {
        console.log(`❌ ${pattern}: 0 exact matches`)
      }
    })
    
    // Search for any home/away team total patterns
    console.log('\n🔍 Broader search for team total patterns...')
    
    const teamPatterns = {
      'home_total_over': basketballOdds.filter(id => id && id.includes('points-home') && id.includes('ou-over')),
      'home_total_under': basketballOdds.filter(id => id && id.includes('points-home') && id.includes('ou-under')),
      'away_total_over': basketballOdds.filter(id => id && id.includes('points-away') && id.includes('ou-over')),
      'away_total_under': basketballOdds.filter(id => id && id.includes('points-away') && id.includes('ou-under')),
      
      // Check what we do have for home/away
      'home_any': basketballOdds.filter(id => id && id.includes('points-home') && id.includes('game')),
      'away_any': basketballOdds.filter(id => id && id.includes('points-away') && id.includes('game')),
    }
    
    Object.entries(teamPatterns).forEach(([pattern, matches]) => {
      if (matches.length > 0) {
        console.log(`✅ ${pattern}: ${matches.length} matches`)
        matches.slice(0, 3).forEach(match => {
          if (match) console.log(`   ${match}`)
        })
        if (matches.length > 3) console.log(`   ... and ${matches.length - 3} more`)
      } else {
        console.log(`❌ ${pattern}: 0 matches`)
      }
    })
    
    // If no over/under team totals, what team patterns DO exist?
    console.log('\n📋 ALL team-related patterns found:')
    const allTeamPatterns = basketballOdds.filter(id => 
      id && (
        (id.includes('points-home') || id.includes('points-away')) && 
        !id.match(/points-[A-Z_]+\d*_NBA/) // Exclude player props
      )
    )
    
    const uniqueTeamPatterns = [...new Set(allTeamPatterns)]
    console.log(`Found ${uniqueTeamPatterns.length} unique team patterns:`)
    uniqueTeamPatterns.forEach(pattern => {
      console.log(`   ${pattern}`)
    })
    
  } catch (error) {
    console.error('Error searching for team totals:', error)
  }
}

findTeamTotals()