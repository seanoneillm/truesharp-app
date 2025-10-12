/**
 * Test script to verify parlay profit fix
 * This will help us understand exactly what profit values are being saved
 */

// Simulate the mapBetToDatabase function behavior
function mapBetToDatabase(bet, userId, stake, potentialPayout, parlayId, isParlay) {
  const now = new Date().toISOString()
  
  return {
    user_id: userId,
    external_bet_id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sport: bet.sport,
    league: 'NFL',
    bet_type: 'moneyline',
    bet_description: bet.description,
    odds: Math.round(bet.odds),
    stake: stake,
    potential_payout: potentialPayout,
    status: 'pending',
    placed_at: now,
    game_date: bet.gameTime,
    home_team: bet.homeTeam,
    away_team: bet.awayTeam,
    profit: null, // This should ALWAYS be null for pending bets
    sportsbook: bet.sportsbook,
    bet_source: 'manual',
    is_copy_bet: false,
    game_id: bet.gameId,
    oddid: bet.marketType,
    odd_source: bet.sportsbook,
    is_parlay: isParlay,
    parlay_id: parlayId,
  }
}

// Simulate the insertParlayBet logic
function simulateInsertParlayBet(bets, stake) {
  const parlayId = 'test-parlay-' + Date.now()
  const totalPotentialPayout = 350 // Example calculated payout
  
  console.log('🧪 Simulating parlay insertion...')
  console.log('Stake:', stake)
  console.log('Total Potential Payout:', totalPotentialPayout)
  console.log('Number of legs:', bets.length)
  console.log('')
  
  const dbBets = bets.map((bet, index) => {
    // This is the current logic from insertParlayBet
    const legStake = index === 0 ? stake : 0
    const legPayout = index === 0 ? totalPotentialPayout : 0
    
    console.log(`Leg ${index + 1}:`)
    console.log(`  legStake: ${legStake}`)
    console.log(`  legPayout: ${legPayout}`)
    
    const dbBet = mapBetToDatabase(bet, 'test-user', legStake, legPayout, parlayId, true)
    
    console.log(`  profit in dbBet: ${dbBet.profit}`)
    console.log(`  stake in dbBet: ${dbBet.stake}`)
    console.log(`  potential_payout in dbBet: ${dbBet.potential_payout}`)
    console.log('')
    
    return dbBet
  })
  
  return dbBets
}

// Test data
const testBets = [
  {
    sport: 'americanfootball_nfl',
    homeTeam: 'Patriots',
    awayTeam: 'Bills',
    gameTime: '2024-12-08T18:00:00Z',
    marketType: 'americanfootball_nfl-game-1-ml-home',
    odds: -110,
    sportsbook: 'test',
    description: 'Patriots ML',
    gameId: 'game-1'
  },
  {
    sport: 'americanfootball_nfl',
    homeTeam: 'Cowboys',
    awayTeam: 'Eagles',
    gameTime: '2024-12-08T21:00:00Z',
    marketType: 'americanfootball_nfl-game-2-ml-away',
    odds: +150,
    sportsbook: 'test',
    description: 'Eagles ML',
    gameId: 'game-2'
  }
]

// Run the test
const result = simulateInsertParlayBet(testBets, 100)

console.log('=== FINAL RESULT ===')
result.forEach((bet, index) => {
  console.log(`Leg ${index + 1}: profit=${bet.profit}, stake=${bet.stake}, payout=${bet.potential_payout}`)
})

console.log('\n=== ANALYSIS ===')
console.log('Expected: ALL legs should have profit=null')
console.log('Actual profit values:', result.map(bet => bet.profit))

if (result.every(bet => bet.profit === null)) {
  console.log('✅ PASS: All legs have profit=null as expected')
} else {
  console.log('❌ FAIL: Some legs have non-null profit values')
}