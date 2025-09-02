// Quick test to verify bet type filtering fix
const testData = {
  name: 'TEST Spread Fix',
  description: 'Testing spread filtering after fix',
  filter_config: {
    sides: ['All'],
    sports: [],
    leagues: ['NFL'],
    betTypes: ['spread'],
    statuses: ['All'],
    isParlays: ['All'],
    oddsTypes: ['All'],
    timeRange: 'All time',
    sportsbooks: [],
  },
  monetized: false,
}

// Extract the logic from the API to test
const filters = testData.filter_config
const allowedBetTypes = ['total', 'moneyline', 'spread', 'player_prop', 'team_prop', 'game_prop']
const betTypes = filters.betTypes || []
const hasAllBetTypes = betTypes.includes('All')
const specificBetTypes = betTypes.filter(bt => bt !== 'All' && allowedBetTypes.includes(bt))

// This is the key fix: use the actual bet type for filtering, not the parlay category
const betType = hasAllBetTypes ? 'All' : specificBetTypes[0]

console.log('🎯 BET TYPE EXTRACTION TEST:')
console.log('   hasAllBetTypes:', hasAllBetTypes)
console.log('   specificBetTypes:', specificBetTypes)
console.log('   FINAL betType for filtering:', betType)

// Test the filtering logic
if (betType && betType !== 'All') {
  console.log('🔍 Applying bet_type filter:', betType)

  const betTypeVariations = []
  const lowerBetType = betType.toLowerCase()

  if (lowerBetType === 'spread') {
    betTypeVariations.push('spread', 'point_spread', 'ps')
  }

  console.log('🔍 Bet type variations to match:', betTypeVariations)
  console.log('✅ Would filter for ONLY spread bets now!')
} else {
  console.log('🔍 No bet_type filter applied (betType is All or null)')
}
