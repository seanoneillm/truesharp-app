import { Subscription, SubscriptionPerformance } from '@/types/subscriptions'
import { BetData } from './performance-calc'

export interface ROIAnalysis {
  current: ROIMetrics
  historical: ROIHistoricalData
  projections: ROIProjections
  benchmarks: ROIBenchmarks
  recommendations: ROIRecommendations
}

export interface ROIMetrics {
  overallROI: number
  subscriptionROI: number
  netROI: number
  totalProfit: number
  totalCost: number
  profitability: 'profitable' | 'breakeven' | 'losing'
  confidenceInterval: {
    lower: number
    upper: number
    confidence: number
  }
}

export interface ROIHistoricalData {
  monthlyROI: Array<{
    month: string
    roi: number
    profit: number
    cost: number
    netProfit: number
  }>
  quarterlyROI: Array<{
    quarter: string
    roi: number
    profit: number
    cost: number
    netProfit: number
  }>
  trends: {
    improving: boolean
    stable: boolean
    declining: boolean
    trendPercentage: number
  }
}

export interface ROIProjections {
  next30Days: {
    expectedROI: number
    projectedProfit: number
    projectedCost: number
    confidence: number
  }
  next90Days: {
    expectedROI: number
    projectedProfit: number
    projectedCost: number
    confidence: number
  }
  nextYear: {
    expectedROI: number
    projectedProfit: number
    projectedCost: number
    confidence: number
  }
}

export interface ROIBenchmarks {
  industryAverage: number
  topPerformerThreshold: number
  breakEvenROI: number
  userRanking: number
  percentile: number
}

export interface ROIRecommendations {
  overall: 'continue' | 'optimize' | 'cancel'
  specificActions: Array<{
    action: string
    impact: 'high' | 'medium' | 'low'
    reason: string
    subscriptionId?: string
  }>
  optimizations: Array<{
    type: 'cost_reduction' | 'performance_improvement' | 'diversification'
    suggestion: string
    estimatedImpact: number
  }>
}

export function analyzeSubscriptionROI(
  subscriptions: Subscription[],
  userBets: BetData[],
  timeframe: 'last30days' | 'last90days' | 'last6months' | 'alltime' = 'alltime'
): ROIAnalysis {
  // Calculate current ROI metrics
  const currentMetrics = calculateCurrentROI(subscriptions, userBets, timeframe)

  // Generate historical data
  const historicalData = generateHistoricalROI(subscriptions, userBets)

  // Create projections
  const projections = projectFutureROI(subscriptions, userBets, historicalData)

  // Compare against benchmarks
  const benchmarks = getBenchmarkComparisons(currentMetrics.overallROI)

  // Generate recommendations
  const recommendations = generateROIRecommendations(subscriptions, userBets, currentMetrics)

  return {
    current: currentMetrics,
    historical: historicalData,
    projections,
    benchmarks,
    recommendations,
  }
}

function calculateCurrentROI(
  subscriptions: Subscription[],
  userBets: BetData[],
  timeframe: string
): ROIMetrics {
  // Filter bets by timeframe
  const timeframeBets = filterBetsByTimeframe(userBets, timeframe)
  const copiedBets = timeframeBets.filter(bet => bet.is_copy_bet && bet.source_strategy_id)

  // Calculate total profit from copied bets
  const totalProfit = copiedBets.reduce((sum, bet) => {
    if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
    if (bet.status === 'lost') return sum - bet.stake
    return sum
  }, 0)

  // Calculate total subscription costs
  const totalCost = calculateSubscriptionCosts(subscriptions, timeframe)

  // Calculate ROI metrics
  const totalStake = copiedBets.reduce((sum, bet) => sum + bet.stake, 0)
  const overallROI = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0
  const subscriptionROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const netROI = totalCost > 0 ? ((totalProfit - totalCost) / totalCost) * 100 : 0

  // Determine profitability
  let profitability: 'profitable' | 'breakeven' | 'losing'
  if (totalProfit - totalCost > totalCost * 0.05) profitability = 'profitable'
  else if (Math.abs(totalProfit - totalCost) <= totalCost * 0.05) profitability = 'breakeven'
  else profitability = 'losing'

  // Calculate confidence interval (simplified bootstrap method)
  const confidenceInterval = calculateConfidenceInterval(copiedBets, totalCost)

  return {
    overallROI,
    subscriptionROI,
    netROI,
    totalProfit,
    totalCost,
    profitability,
    confidenceInterval,
  }
}

function filterBetsByTimeframe(bets: BetData[], timeframe: string): BetData[] {
  const now = new Date()
  let cutoffDate: Date

  switch (timeframe) {
    case 'last30days':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'last90days':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'last6months':
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    default:
      return bets
  }

  return bets.filter(bet => new Date(bet.placed_at) >= cutoffDate)
}

function calculateSubscriptionCosts(subscriptions: Subscription[], timeframe: string): number {
  const now = new Date()

  return subscriptions.reduce((total, subscription) => {
    const startDate = new Date(subscription.created_at)
    const endDate = subscription.cancelled_at ? new Date(subscription.cancelled_at) : now

    let cost = 0
    let timeframeDays: number

    switch (timeframe) {
      case 'last30days':
        timeframeDays = 30
        break
      case 'last90days':
        timeframeDays = 90
        break
      case 'last6months':
        timeframeDays = 180
        break
      default:
        timeframeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    }

    // Calculate cost based on frequency
    const dailyRate = getDailySubscriptionRate(subscription)
    cost =
      dailyRate *
      Math.min(
        timeframeDays,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      )

    return total + Math.max(0, cost)
  }, 0)
}

function getDailySubscriptionRate(subscription: Subscription): number {
  switch (subscription.frequency) {
    case 'weekly':
      return subscription.price / 7
    case 'monthly':
      return subscription.price / 30
    case 'yearly':
      return subscription.price / 365
    default:
      return subscription.price / 30
  }
}

function calculateConfidenceInterval(
  bets: BetData[],
  totalCost: number
): { lower: number; upper: number; confidence: number } {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))

  if (settledBets.length < 10) {
    return { lower: 0, upper: 0, confidence: 0 }
  }

  const winRate = settledBets.filter(bet => bet.status === 'won').length / settledBets.length
  const avgOdds =
    settledBets.reduce((sum, bet) => sum + Math.abs(bet.potential_payout - bet.stake), 0) /
    settledBets.length

  // Simplified confidence interval calculation
  const standardError = Math.sqrt((winRate * (1 - winRate)) / settledBets.length)
  const marginOfError = 1.96 * standardError // 95% confidence interval

  const lowerWinRate = Math.max(0, winRate - marginOfError)
  const upperWinRate = Math.min(1, winRate + marginOfError)

  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const lowerROI =
    totalCost > 0 ? ((lowerWinRate * avgOdds * bets.length - totalCost) / totalCost) * 100 : 0
  const upperROI =
    totalCost > 0 ? ((upperWinRate * avgOdds * bets.length - totalCost) / totalCost) * 100 : 0

  return {
    lower: lowerROI,
    upper: upperROI,
    confidence: 95,
  }
}

function generateHistoricalROI(
  subscriptions: Subscription[],
  userBets: BetData[]
): ROIHistoricalData {
  const monthlyData = generateMonthlyROI(subscriptions, userBets)
  const quarterlyData = generateQuarterlyROI(monthlyData)
  const trends = analyzeTrends(monthlyData)

  return {
    monthlyROI: monthlyData,
    quarterlyROI: quarterlyData,
    trends,
  }
}

function generateMonthlyROI(
  subscriptions: Subscription[],
  userBets: BetData[]
): Array<{ month: string; roi: number; profit: number; cost: number; netProfit: number }> {
  const now = new Date()
  const months = []

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    const monthLabel = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    // Get bets for this month
    const monthBets = userBets.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= monthStart && betDate <= monthEnd && bet.is_copy_bet
    })

    // Calculate profit
    const profit = monthBets.reduce((sum, bet) => {
      if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
      if (bet.status === 'lost') return sum - bet.stake
      return sum
    }, 0)

    // Calculate cost
    const cost = subscriptions.reduce((sum, sub) => {
      const subStart = new Date(sub.created_at)
      const subEnd = sub.cancelled_at ? new Date(sub.cancelled_at) : now

      if (subStart <= monthEnd && subEnd >= monthStart) {
        return sum + getDailySubscriptionRate(sub) * 30
      }
      return sum
    }, 0)

    const roi = cost > 0 ? (profit / cost) * 100 : 0
    const netProfit = profit - cost

    months.push({
      month: monthLabel,
      roi,
      profit,
      cost,
      netProfit,
    })
  }

  return months
}

function generateQuarterlyROI(
  monthlyData: Array<{
    month: string
    roi: number
    profit: number
    cost: number
    netProfit: number
  }>
): Array<{ quarter: string; roi: number; profit: number; cost: number; netProfit: number }> {
  const quarters = []

  for (let i = 0; i < monthlyData.length; i += 3) {
    const quarterMonths = monthlyData.slice(i, i + 3)
    const totalProfit = quarterMonths.reduce((sum, month) => sum + month.profit, 0)
    const totalCost = quarterMonths.reduce((sum, month) => sum + month.cost, 0)
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
    const netProfit = totalProfit - totalCost

    const quarterNum = Math.floor(i / 3) + 1
    const year = new Date().getFullYear()

    quarters.push({
      quarter: `Q${quarterNum} ${year}`,
      roi,
      profit: totalProfit,
      cost: totalCost,
      netProfit,
    })
  }

  return quarters
}

function analyzeTrends(
  monthlyData: Array<{
    month: string
    roi: number
    profit: number
    cost: number
    netProfit: number
  }>
): { improving: boolean; stable: boolean; declining: boolean; trendPercentage: number } {
  if (monthlyData.length < 3) {
    return { improving: false, stable: true, declining: false, trendPercentage: 0 }
  }

  // Calculate trend using linear regression
  const recentMonths = monthlyData.slice(-6) // Last 6 months
  const xValues = recentMonths.map((_, index) => index)
  const yValues = recentMonths.map(month => month.roi)

  const n = recentMonths.length
  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const trendPercentage = slope * 100

  const improving = trendPercentage > 2
  const declining = trendPercentage < -2
  const stable = !improving && !declining

  return {
    improving,
    stable,
    declining,
    trendPercentage,
  }
}

function projectFutureROI(
  subscriptions: Subscription[],
  userBets: BetData[],
  historicalData: ROIHistoricalData
): ROIProjections {
  const recentPerformance = historicalData.monthlyROI.slice(-3) // Last 3 months
  const avgROI =
    recentPerformance.reduce((sum, month) => sum + month.roi, 0) / recentPerformance.length
  const avgProfit =
    recentPerformance.reduce((sum, month) => sum + month.profit, 0) / recentPerformance.length
  const avgCost =
    recentPerformance.reduce((sum, month) => sum + month.cost, 0) / recentPerformance.length

  // Apply trend adjustment
  const trendAdjustment = historicalData.trends.trendPercentage / 100

  return {
    next30Days: {
      expectedROI: avgROI * (1 + trendAdjustment),
      projectedProfit: avgProfit * (1 + trendAdjustment),
      projectedCost: avgCost,
      confidence: Math.max(0.3, Math.min(0.9, 0.7 - Math.abs(trendAdjustment))),
    },
    next90Days: {
      expectedROI: avgROI * (1 + trendAdjustment * 3),
      projectedProfit: avgProfit * 3 * (1 + trendAdjustment),
      projectedCost: avgCost * 3,
      confidence: Math.max(0.2, Math.min(0.8, 0.6 - Math.abs(trendAdjustment))),
    },
    nextYear: {
      expectedROI: avgROI * (1 + trendAdjustment * 12),
      projectedProfit: avgProfit * 12 * (1 + trendAdjustment),
      projectedCost: avgCost * 12,
      confidence: Math.max(0.1, Math.min(0.6, 0.4 - Math.abs(trendAdjustment))),
    },
  }
}

function getBenchmarkComparisons(userROI: number): ROIBenchmarks {
  // These would typically come from platform-wide analytics
  const industryAverage = 8.5 // 8.5% average ROI for sports betting subscriptions
  const topPerformerThreshold = 25.0 // Top 10% of performers
  const breakEvenROI = 0.0

  // Calculate user ranking (simplified)
  let percentile = 50 // Default to median
  if (userROI >= topPerformerThreshold) percentile = 90
  else if (userROI >= industryAverage * 1.5) percentile = 75
  else if (userROI >= industryAverage) percentile = 60
  else if (userROI >= 0) percentile = 40
  else percentile = 25

  return {
    industryAverage,
    topPerformerThreshold,
    breakEvenROI,
    userRanking: Math.round(percentile),
    percentile,
  }
}

function generateROIRecommendations(
  subscriptions: Subscription[],
  userBets: BetData[],
  currentMetrics: ROIMetrics
): ROIRecommendations {
  const specificActions: ROIRecommendations['specificActions'] = []
  const optimizations: ROIRecommendations['optimizations'] = []

  // Analyze individual subscription performance
  subscriptions.forEach(subscription => {
    const subscriptionBets = userBets.filter(
      bet => bet.source_strategy_id === subscription.strategy_id
    )
    const profit = subscriptionBets.reduce((sum, bet) => {
      if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
      if (bet.status === 'lost') return sum - bet.stake
      return sum
    }, 0)

    const cost = getDailySubscriptionRate(subscription) * 30
    const subROI = cost > 0 ? (profit / cost) * 100 : 0

    if (subROI < -20) {
      specificActions.push({
        action: `Consider cancelling subscription to ${subscription.seller?.username || 'unknown seller'}`,
        impact: 'high',
        reason: `This subscription has a ${subROI.toFixed(1)}% ROI, significantly underperforming`,
        subscriptionId: subscription.id,
      })
    } else if (subROI > 50) {
      specificActions.push({
        action: `Consider increasing bet size for ${subscription.seller?.username || 'unknown seller'}`,
        impact: 'medium',
        reason: `This subscription has excellent ${subROI.toFixed(1)}% ROI performance`,
        subscriptionId: subscription.id,
      })
    }
  })

  // Overall recommendations
  let overall: 'continue' | 'optimize' | 'cancel'
  if (currentMetrics.profitability === 'profitable') {
    overall = 'continue'
  } else if (currentMetrics.profitability === 'breakeven' || currentMetrics.netROI > -10) {
    overall = 'optimize'
  } else {
    overall = 'cancel'
  }

  // Generate optimizations
  if (currentMetrics.totalCost > currentMetrics.totalProfit) {
    optimizations.push({
      type: 'cost_reduction',
      suggestion: 'Cancel underperforming subscriptions to reduce monthly costs',
      estimatedImpact: 15,
    })
  }

  if (subscriptions.length < 3) {
    optimizations.push({
      type: 'diversification',
      suggestion: 'Consider adding 1-2 more subscriptions to diversify risk',
      estimatedImpact: 10,
    })
  }

  return {
    overall,
    specificActions,
    optimizations,
  }
}
