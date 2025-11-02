/**
 * Debug script to check sport normalization in strategy creation
 * This will help identify why bets aren't being added to strategy_bets table
 */

const testSportFiltering = () => {
  console.log('🏀 Testing Sport Filtering Logic')

  // Simulate the sport normalization that happens in the web API
  function getSportVariations(sport) {
    let sportVariations = []

    if (sport === 'NCAAB' || sport === 'NCAAM' || sport === 'NCAAMB') {
      // This is the exact logic from the web API
      sportVariations = [
        'NCAAB',
        'NCAAM',
        'NCAAMB',
        'ncaab',
        'ncaam',
        'ncaamb',
        'College Basketball',
        'college basketball',
        'NCAA Basketball',
        'ncaa basketball',
        "NCAA Men's Basketball",
        "ncaa men's basketball",
      ]
    } else {
      sportVariations = [sport, sport.toLowerCase(), sport.toUpperCase()]
    }

    return sportVariations
  }

  // Test case: User creates strategy with NCAAB filter
  const strategyFilter = 'NCAAB'
  const sportVariations = getSportVariations(strategyFilter)

  console.log(`\nStrategy Filter: "${strategyFilter}"`)
  console.log('Sport Variations that should match:', sportVariations)

  // Sample bets with different sport/league variations
  const sampleBets = [
    { id: 1, sport: 'NCAAB', league: 'NCAAB' },
    { id: 2, sport: 'NCAAM', league: 'NCAAM' },
    { id: 3, sport: 'NCAAMB', league: 'NCAAMB' },
    { id: 4, sport: 'ncaab', league: 'ncaab' },
    { id: 5, sport: 'College Basketball', league: 'College Basketball' },
    { id: 6, sport: 'NCAA Basketball', league: 'NCAA Basketball' },
    { id: 7, sport: 'NBA', league: 'NBA' }, // Should NOT match
    { id: 8, sport: 'NFL', league: 'NFL' }, // Should NOT match
  ]

  console.log('\nTesting bet matching:')
  sampleBets.forEach(bet => {
    const sportMatches = sportVariations.includes(bet.sport)
    const leagueMatches = sportVariations.includes(bet.league)
    const shouldMatch = sportMatches || leagueMatches

    console.log(
      `  Bet ${bet.id}: sport="${bet.sport}", league="${bet.league}" → ${shouldMatch ? '✅ MATCH' : '❌ NO MATCH'}`
    )
  })

  // Test the Supabase OR condition logic
  console.log('\nSupabase OR Condition:')
  const sportConditions = sportVariations.map(variation => `sport.eq.${variation}`).join(',')
  const leagueConditions = sportVariations.map(variation => `league.eq.${variation}`).join(',')
  const combinedConditions = `${sportConditions},${leagueConditions}`

  console.log('Combined OR condition:', combinedConditions)

  return {
    strategyFilter,
    sportVariations,
    matchingBets: sampleBets.filter(
      bet => sportVariations.includes(bet.sport) || sportVariations.includes(bet.league)
    ),
  }
}

// Run the test
const result = testSportFiltering()
console.log('\n📊 Summary:')
console.log(`Strategy Filter: "${result.strategyFilter}"`)
console.log(`Sport Variations: ${result.sportVariations.length} variations`)
console.log(`Matching Bets: ${result.matchingBets.length} out of 8 sample bets`)
console.log('Matching Bet Details:', result.matchingBets)
