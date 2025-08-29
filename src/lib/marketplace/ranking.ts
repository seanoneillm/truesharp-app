/**
 * Marketplace Strategy Ranking Algorithm
 * 
 * Weighted Scoring System:
 * - ROI Performance (40%): Normalized scoring with outlier caps
 * - Win Rate Consistency (25%): Sustainable performance tracking  
 * - Volume Reliability (20%): Minimum bet requirements (100+ for full points)
 * - Strategy Maturity (10%): Time-based credibility (90+ days for full points)
 * - Recent Activity (5%): Active engagement rewards
 */

export interface StrategyLeaderboardData {
  id: string
  strategy_id: string
  user_id: string
  strategy_name: string
  username: string
  is_verified_seller: boolean
  total_bets: number
  winning_bets: number
  losing_bets: number
  push_bets: number
  roi_percentage: number
  win_rate: number
  overall_rank?: number
  sport_rank?: number
  leaderboard_score?: number
  primary_sport?: string
  strategy_type?: string
  bet_type?: string
  is_eligible: boolean
  minimum_bets_met: boolean
  verification_status: string
  is_monetized: boolean
  subscription_price_weekly?: number
  subscription_price_monthly?: number
  subscription_price_yearly?: number
  created_at: string
  updated_at: string
  last_calculated_at: string
}

export interface RankingWeights {
  roiPerformance: number    // 40%
  winRateConsistency: number // 25%
  volumeReliability: number  // 20%
  strategyMaturity: number   // 10%
  recentActivity: number     // 5%
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  roiPerformance: 0.40,
  winRateConsistency: 0.25,
  volumeReliability: 0.20,
  strategyMaturity: 0.10,
  recentActivity: 0.05
}

/**
 * Calculate ROI Performance Score (0-100)
 * Normalized scoring with outlier caps to prevent extreme values from dominating
 */
export function calculateROIScore(roi: number): number {
  // Cap ROI at reasonable bounds (-50% to +200%)
  const cappedROI = Math.max(-50, Math.min(200, roi))
  
  // Normalize to 0-100 scale
  // 0% ROI = 50 points, +100% ROI = 100 points, -50% ROI = 0 points
  const normalizedScore = ((cappedROI + 50) / 150) * 100
  
  return Math.max(0, Math.min(100, normalizedScore))
}

/**
 * Calculate Win Rate Consistency Score (0-100)
 * Rewards sustainable win rates, penalizes extreme outliers
 */
export function calculateWinRateScore(winRate: number, totalBets: number): number {
  // Convert decimal to percentage if needed
  const winRatePercent = winRate > 1 ? winRate : winRate * 100
  
  // Base score from win rate (50% = 50 points, 60% = 100 points, etc.)
  const baseScore = Math.max(0, (winRatePercent - 40) * 2.5)
  
  // Consistency bonus based on sample size
  let consistencyMultiplier = 1.0
  if (totalBets >= 500) consistencyMultiplier = 1.1
  else if (totalBets >= 200) consistencyMultiplier = 1.05
  else if (totalBets >= 100) consistencyMultiplier = 1.0
  else if (totalBets >= 50) consistencyMultiplier = 0.9
  else consistencyMultiplier = 0.7
  
  return Math.min(100, baseScore * consistencyMultiplier)
}

/**
 * Calculate Volume Reliability Score (0-100)
 * Minimum bet requirements for credibility
 */
export function calculateVolumeScore(totalBets: number): number {
  if (totalBets >= 1000) return 100
  if (totalBets >= 500) return 90
  if (totalBets >= 200) return 80
  if (totalBets >= 100) return 70  // Full reliability threshold
  if (totalBets >= 50) return 50
  if (totalBets >= 25) return 30
  if (totalBets >= 10) return 15
  return totalBets * 1.5  // Linear scale for very low volumes
}

/**
 * Calculate Strategy Maturity Score (0-100)
 * Time-based credibility scoring
 */
export function calculateMaturityScore(createdAt: string): number {
  const now = new Date()
  const created = new Date(createdAt)
  const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceCreation >= 365) return 100      // 1+ years
  if (daysSinceCreation >= 180) return 90       // 6+ months
  if (daysSinceCreation >= 90) return 80        // 3+ months (full maturity)
  if (daysSinceCreation >= 60) return 60        // 2+ months
  if (daysSinceCreation >= 30) return 40        // 1+ month
  if (daysSinceCreation >= 14) return 25        // 2+ weeks
  if (daysSinceCreation >= 7) return 15         // 1+ week
  return Math.max(5, daysSinceCreation * 2)     // Linear for very new strategies
}

/**
 * Calculate Recent Activity Score (0-100)
 * Rewards active strategies with recent betting activity
 */
export function calculateActivityScore(lastBetDate: string | null, updatedAt: string): number {
  if (!lastBetDate) {
    // Fallback to strategy update time if no bet date
    const updated = new Date(updatedAt)
    const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceUpdate <= 7) return 50
    if (daysSinceUpdate <= 30) return 25
    return 10
  }
  
  const lastBet = new Date(lastBetDate)
  const daysSinceLastBet = (Date.now() - lastBet.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceLastBet <= 1) return 100         // Very recent activity
  if (daysSinceLastBet <= 3) return 90          // Recent activity
  if (daysSinceLastBet <= 7) return 75          // Active this week
  if (daysSinceLastBet <= 14) return 50         // Active this month
  if (daysSinceLastBet <= 30) return 25         // Some recent activity
  return Math.max(0, 25 - daysSinceLastBet)    // Declining score
}

/**
 * Calculate composite leaderboard score
 */
export function calculateLeaderboardScore(
  strategy: StrategyLeaderboardData,
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  const roiScore = calculateROIScore(strategy.roi_percentage)
  const winRateScore = calculateWinRateScore(strategy.win_rate, strategy.total_bets)
  const volumeScore = calculateVolumeScore(strategy.total_bets)
  const maturityScore = calculateMaturityScore(strategy.created_at)
  const activityScore = calculateActivityScore(null, strategy.updated_at) // Using updated_at as proxy
  
  // Debug logging for score calculation
  if (process.env.NODE_ENV === 'development') {
    console.log(`Strategy ${strategy.strategy_name} scores:`, {
      roi: roiScore.toFixed(1),
      winRate: winRateScore.toFixed(1), 
      volume: volumeScore.toFixed(1),
      maturity: maturityScore.toFixed(1),
      activity: activityScore.toFixed(1)
    })
  }
  
  const compositeScore = 
    (roiScore * weights.roiPerformance) +
    (winRateScore * weights.winRateConsistency) +
    (volumeScore * weights.volumeReliability) +
    (maturityScore * weights.strategyMaturity) +
    (activityScore * weights.recentActivity)
  
  return Math.round(compositeScore * 100) / 100 // Round to 2 decimal places
}

/**
 * Determine strategy eligibility for leaderboard
 */
export function isStrategyEligible(strategy: StrategyLeaderboardData): boolean {
  return (
    strategy.is_monetized &&
    strategy.total_bets >= 10 && // Minimum bet threshold
    strategy.minimum_bets_met &&
    (new Date().getTime() - new Date(strategy.created_at).getTime()) >= (7 * 24 * 60 * 60 * 1000) // At least 1 week old
  )
}

/**
 * Rank strategies using the weighted scoring algorithm
 */
export function rankStrategies(strategies: StrategyLeaderboardData[]): StrategyLeaderboardData[] {
  // Filter eligible strategies
  const eligibleStrategies = strategies.filter(isStrategyEligible)
  
  // Calculate scores and sort
  const scoredStrategies = eligibleStrategies.map(strategy => ({
    ...strategy,
    leaderboard_score: calculateLeaderboardScore(strategy)
  }))
  
  // Sort by composite score (descending)
  scoredStrategies.sort((a, b) => (b.leaderboard_score || 0) - (a.leaderboard_score || 0))
  
  // Assign overall ranks
  return scoredStrategies.map((strategy, index) => ({
    ...strategy,
    overall_rank: index + 1
  }))
}