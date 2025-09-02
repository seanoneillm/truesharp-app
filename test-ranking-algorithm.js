// Test script for the leaderboard ranking algorithm
const {
  calculateROIScore,
  calculateWinRateScore,
  calculateVolumeScore,
  calculateMaturityScore,
  calculateActivityScore,
  calculateLeaderboardScore,
  rankStrategies,
} = require('./src/lib/marketplace/ranking.ts')

// Test data - representative strategies with different characteristics
const testStrategies = [
  {
    id: '1',
    strategy_id: 'strategy-1',
    user_id: 'user-1',
    strategy_name: 'High Volume NBA Strategy',
    username: 'nba_expert',
    is_verified_seller: true,
    total_bets: 500,
    winning_bets: 275,
    losing_bets: 200,
    push_bets: 25,
    roi_percentage: 15.5, // Good ROI
    win_rate: 0.55, // 55% win rate
    is_eligible: true,
    minimum_bets_met: true,
    verification_status: 'verified',
    is_monetized: true,
    created_at: '2024-01-01T00:00:00Z', // 8+ months old
    updated_at: '2024-12-15T00:00:00Z',
    last_calculated_at: '2024-12-15T00:00:00Z',
  },
  {
    id: '2',
    strategy_id: 'strategy-2',
    user_id: 'user-2',
    strategy_name: 'New High ROI Strategy',
    username: 'rising_star',
    is_verified_seller: false,
    total_bets: 75,
    winning_bets: 48,
    losing_bets: 25,
    push_bets: 2,
    roi_percentage: 35.2, // Very high ROI
    win_rate: 0.64, // 64% win rate
    is_eligible: true,
    minimum_bets_met: false,
    verification_status: 'unverified',
    is_monetized: true,
    created_at: '2024-10-01T00:00:00Z', // 2+ months old
    updated_at: '2024-12-15T00:00:00Z',
    last_calculated_at: '2024-12-15T00:00:00Z',
  },
  {
    id: '3',
    strategy_id: 'strategy-3',
    user_id: 'user-3',
    strategy_name: 'Conservative Long-Term Strategy',
    username: 'veteran_bettor',
    is_verified_seller: true,
    total_bets: 1200,
    winning_bets: 660,
    losing_bets: 480,
    push_bets: 60,
    roi_percentage: 8.3, // Lower but steady ROI
    win_rate: 0.55, // 55% win rate
    is_eligible: true,
    minimum_bets_met: true,
    verification_status: 'verified',
    is_monetized: true,
    created_at: '2023-06-01T00:00:00Z', // 1.5+ years old
    updated_at: '2024-12-15T00:00:00Z',
    last_calculated_at: '2024-12-15T00:00:00Z',
  },
]

console.log('=== Testing Leaderboard Ranking Algorithm ===\n')

// Test individual scoring functions
console.log('1. Individual Score Components:')
testStrategies.forEach((strategy, index) => {
  console.log(`\nStrategy ${index + 1}: "${strategy.strategy_name}"`)

  const roiScore = calculateROIScore(strategy.roi_percentage)
  const winRateScore = calculateWinRateScore(strategy.win_rate, strategy.total_bets)
  const volumeScore = calculateVolumeScore(strategy.total_bets)
  const maturityScore = calculateMaturityScore(strategy.created_at)
  const activityScore = calculateActivityScore(null, strategy.updated_at)

  console.log(`  ROI Score (40%): ${roiScore.toFixed(1)} (ROI: ${strategy.roi_percentage}%)`)
  console.log(
    `  Win Rate Score (25%): ${winRateScore.toFixed(1)} (Rate: ${(strategy.win_rate * 100).toFixed(1)}%)`
  )
  console.log(`  Volume Score (20%): ${volumeScore.toFixed(1)} (Bets: ${strategy.total_bets})`)
  console.log(`  Maturity Score (10%): ${maturityScore.toFixed(1)} (Age: ${strategy.created_at})`)
  console.log(`  Activity Score (5%): ${activityScore.toFixed(1)}`)

  const compositeScore = calculateLeaderboardScore(strategy)
  console.log(`  → Composite Score: ${compositeScore.toFixed(2)}`)
})

// Test ranking function
console.log('\n2. Final Rankings:')
const rankedStrategies = rankStrategies(testStrategies)

rankedStrategies.forEach((strategy, index) => {
  console.log(`\nRank #${strategy.overall_rank}: "${strategy.strategy_name}"`)
  console.log(`  Score: ${strategy.leaderboard_score?.toFixed(2)}`)
  console.log(
    `  ROI: ${strategy.roi_percentage}% | Win Rate: ${(strategy.win_rate * 100).toFixed(1)}%`
  )
  console.log(`  Volume: ${strategy.total_bets} bets | Verified: ${strategy.is_verified_seller}`)
})

console.log('\n=== Algorithm Verification Complete ===')
console.log('\nExpected behavior:')
console.log('- Volume should matter (20% weight)')
console.log('- ROI performance is most important (40% weight)')
console.log('- Win rate consistency is crucial (25% weight)')
console.log('- Strategy maturity provides credibility (10% weight)')
console.log('- Recent activity rewards engagement (5% weight)')
