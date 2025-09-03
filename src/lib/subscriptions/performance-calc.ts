import { Subscription, SubscriptionPerformance } from '@/types/subscriptions'

export interface BetData {
  id: string
  status: 'pending' | 'won' | 'lost' | 'void'
  stake: number
  profit?: number
  potential_payout: number
  placed_at: string
  settled_at?: string
  is_copy_bet: boolean
  source_strategy_id?: string
}

export interface PerformanceTimeframe {
  startDate: Date
  endDate: Date
  label: string
}

export function calculateSubscriptionPerformance(
  subscription: Subscription,
  userBets: BetData[],
  timeframe: 'last30days' | 'alltime' = 'alltime'
): SubscriptionPerformance {
  // Filter bets related to this subscription
  const subscriptionBets = userBets.filter(
    bet => bet.source_strategy_id === subscription.strategy_id
  )

  // Separate copied vs original bets
  const copiedBets = subscriptionBets.filter(bet => bet.is_copy_bet)
  const originalBets = userBets.filter(bet => !bet.is_copy_bet)

  // Calculate timeframe dates
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Filter by timeframe
  const getTimeframeBets = (bets: BetData[], timeframe: 'last30days' | 'alltime') => {
    if (timeframe === 'last30days') {
      return bets.filter(bet => new Date(bet.placed_at) >= thirtyDaysAgo)
    }
    return bets
  }

  const timeframeCopiedBets = getTimeframeBets(copiedBets, timeframe)
  const timeframeOriginalBets = getTimeframeBets(originalBets, timeframe)

  // Calculate basic metrics
  const totalBets = timeframeCopiedBets.length
  const settledBets = timeframeCopiedBets.filter(bet => ['won', 'lost'].includes(bet.status))
  const wonBets = timeframeCopiedBets.filter(bet => bet.status === 'won')
  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0

  // Calculate profit/loss
  const totalProfit = timeframeCopiedBets.reduce((sum, bet) => {
    if (bet.status === 'won') {
      return sum + (bet.profit || bet.potential_payout - bet.stake)
    } else if (bet.status === 'lost') {
      return sum - bet.stake
    }
    return sum
  }, 0)

  const totalStake = timeframeCopiedBets.reduce((sum, bet) => sum + bet.stake, 0)
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0

  // Calculate subscription cost
  const subscriptionStartDate = new Date(subscription.created_at)
  const monthsSubscribed = Math.max(
    1,
    Math.ceil((now.getTime() - subscriptionStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  )

  let subscriptionCost = 0
  if (timeframe === 'last30days') {
    // Calculate cost for last 30 days only
    subscriptionCost = getMonthlyEquivalentPrice(subscription)
  } else {
    // Calculate total cost since subscription started
    subscriptionCost = getMonthlyEquivalentPrice(subscription) * monthsSubscribed
  }

  const netValue = totalProfit - subscriptionCost

  // Last 30 days performance
  const last30DaysBets = getTimeframeBets(copiedBets, 'last30days')
  const last30DaysWon = last30DaysBets.filter(bet => bet.status === 'won')
  const last30DaysProfit = last30DaysBets.reduce((sum, bet) => {
    if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
    if (bet.status === 'lost') return sum - bet.stake
    return sum
  }, 0)

  // All time performance
  const allTimeBets = copiedBets
  const allTimeWon = allTimeBets.filter(bet => bet.status === 'won')
  const allTimeProfit = allTimeBets.reduce((sum, bet) => {
    if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
    if (bet.status === 'lost') return sum - bet.stake
    return sum
  }, 0)

  return {
    roi,
    winRate,
    totalBets,
    copiedBets: timeframeCopiedBets.length,
    originalBets: timeframeOriginalBets.length,
    profit: totalProfit,
    subscriptionCost,
    netValue,
    last30DaysPerformance: {
      bets: last30DaysBets.length,
      wins: last30DaysWon.length,
      profit: last30DaysProfit,
    },
    allTimePerformance: {
      bets: allTimeBets.length,
      wins: allTimeWon.length,
      profit: allTimeProfit,
    },
  }
}

export function getMonthlyEquivalentPrice(subscription: Subscription): number {
  const price = subscription.price

  switch (subscription.frequency) {
    case 'weekly':
      return price * 4.33 // Average weeks per month
    case 'monthly':
      return price
    case 'yearly':
      return price / 12
    default:
      return price
  }
}

export function calculateAggregatePerformance(
  subscriptions: Subscription[],
  userBets: BetData[]
): {
  totalCost: number
  totalProfit: number
  overallROI: number
  bestPerformer: string | null
  worstPerformer: string | null
  monthlyBreakdown: Array<{
    month: string
    subscriptionsCost: number
    betsPlaced: number
    profit: number
    roi: number
  }>
} {
  let totalCost = 0
  let totalProfit = 0
  let bestROI = -Infinity
  let worstROI = Infinity
  let bestPerformer: string | null = null
  let worstPerformer: string | null = null

  // Calculate performance for each subscription
  subscriptions.forEach(subscription => {
    const performance = calculateSubscriptionPerformance(subscription, userBets)
    totalCost += performance.subscriptionCost
    totalProfit += performance.profit

    if (performance.roi > bestROI) {
      bestROI = performance.roi
      bestPerformer = subscription.seller?.username || subscription.strategy?.name || 'Unknown'
    }

    if (performance.roi < worstROI) {
      worstROI = performance.roi
      worstPerformer = subscription.seller?.username || subscription.strategy?.name || 'Unknown'
    }
  })

  const overallROI = totalCost > 0 ? ((totalProfit - totalCost) / totalCost) * 100 : 0

  // Calculate monthly breakdown for the last 12 months
  const monthlyBreakdown = calculateMonthlyBreakdown(subscriptions, userBets)

  return {
    totalCost,
    totalProfit,
    overallROI,
    bestPerformer,
    worstPerformer,
    monthlyBreakdown,
  }
}

function calculateMonthlyBreakdown(
  subscriptions: Subscription[],
  userBets: BetData[]
): Array<{
  month: string
  subscriptionsCost: number
  betsPlaced: number
  profit: number
  roi: number
}> {
  const now = new Date()
  const months = []

  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    // Calculate subscriptions cost for the month
    const activeSubscriptions = subscriptions.filter(sub => {
      const subStart = new Date(sub.created_at)
      const subEnd = sub.cancelled_at ? new Date(sub.cancelled_at) : new Date()
      return subStart <= monthEnd && subEnd >= monthStart
    })

    const monthlySubscriptionsCost = activeSubscriptions.reduce((sum, sub) => {
      return sum + getMonthlyEquivalentPrice(sub)
    }, 0)

    // Get bets placed in this month that are copies from subscriptions
    const monthBets = userBets.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return (
        betDate >= monthStart && betDate <= monthEnd && bet.is_copy_bet && bet.source_strategy_id
      )
    })

    // Calculate profit for the month
    const monthProfit = monthBets.reduce((sum, bet) => {
      if (bet.status === 'won') return sum + (bet.profit || bet.potential_payout - bet.stake)
      if (bet.status === 'lost') return sum - bet.stake
      return sum
    }, 0)

    const monthROI =
      monthlySubscriptionsCost > 0
        ? ((monthProfit - monthlySubscriptionsCost) / monthlySubscriptionsCost) * 100
        : 0

    months.push({
      month: monthLabel,
      subscriptionsCost: monthlySubscriptionsCost,
      betsPlaced: monthBets.length,
      profit: monthProfit,
      roi: monthROI,
    })
  }

  return months
}

export function calculateSubscriptionValue(
  subscription: Subscription,
  performance: SubscriptionPerformance
): {
  valueScore: number
  valueCategory: 'excellent' | 'good' | 'average' | 'poor'
  valueMetrics: {
    profitPerDollar: number
    betsPerMonth: number
    winRateVsExpected: number
    costEfficiency: number
  }
} {
  const monthlyCost = getMonthlyEquivalentPrice(subscription)
  const monthlyBets = performance.last30DaysPerformance.bets
  const monthlyProfit = performance.last30DaysPerformance.profit

  // Calculate value metrics
  const profitPerDollar = monthlyCost > 0 ? monthlyProfit / monthlyCost : 0
  const betsPerMonth = monthlyBets
  const expectedWinRate = 52.4 // Break-even win rate for typical -110 bets
  const winRateVsExpected = performance.winRate - expectedWinRate
  const costEfficiency =
    monthlyCost > 0 && performance.netValue > 0 ? performance.netValue / monthlyCost : 0

  // Calculate composite value score (0-100)
  let valueScore = 0

  // Profit per dollar (40% weight)
  valueScore += Math.max(0, Math.min(40, (profitPerDollar + 1) * 20))

  // Activity level (20% weight)
  valueScore += Math.max(0, Math.min(20, (betsPerMonth / 10) * 20))

  // Win rate vs expected (25% weight)
  valueScore += Math.max(0, Math.min(25, (winRateVsExpected + 10) * 1.25))

  // Cost efficiency (15% weight)
  valueScore += Math.max(0, Math.min(15, costEfficiency * 15))

  // Determine value category
  let valueCategory: 'excellent' | 'good' | 'average' | 'poor'
  if (valueScore >= 80) valueCategory = 'excellent'
  else if (valueScore >= 60) valueCategory = 'good'
  else if (valueScore >= 40) valueCategory = 'average'
  else valueCategory = 'poor'

  return {
    valueScore,
    valueCategory,
    valueMetrics: {
      profitPerDollar,
      betsPerMonth,
      winRateVsExpected,
      costEfficiency,
    },
  }
}
