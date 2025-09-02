// src/lib/analytics/calculations.ts
import { Bet } from '@/lib/hooks/use-analytics'

export interface CalculatedMetrics {
  totalBets: number
  winRate: number
  roi: number
  totalProfit: number
  totalStaked: number
  avgOdds: number
  avgStake: number
  biggestWin: number
  biggestLoss: number
  currentStreak: number
  streakType: 'win' | 'loss' | 'none'
  avgClv: number | null
  profitableSports: number
  variance: number
}

export interface SportPerformance {
  sport: string
  bets: number
  winRate: number
  profit: number
  roi: number
  avgOdds: number
  totalStaked: number
  clv?: number
}

export interface BetTypePerformance {
  betType: string
  bets: number
  winRate: number
  profit: number
  roi: number
  avgOdds: number
}

export interface PerformanceByTimeframe {
  timeframe: string
  bets: number
  profit: number
  winRate: number
  roi: number
  totalStaked: number
}

/**
 * Calculate core betting metrics from bet data
 */
export function calculateMetrics(bets: Bet[], isPro: boolean = false): CalculatedMetrics {
  if (!bets.length) {
    return {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      totalProfit: 0,
      totalStaked: 0,
      avgOdds: 0,
      avgStake: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      streakType: 'none',
      avgClv: null,
      profitableSports: 0,
      variance: 0,
    }
  }

  const settledBets = bets.filter(bet => bet.result === 'won' || bet.result === 'lost')
  const wonBets = settledBets.filter(bet => bet.result === 'won')

  const totalBets = settledBets.length
  const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0

  const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalProfit = settledBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0)
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

  const avgOdds =
    totalBets > 0 ? settledBets.reduce((sum, bet) => sum + bet.odds, 0) / totalBets : 0
  const avgStake = totalBets > 0 ? totalStaked / totalBets : 0

  // Calculate biggest win/loss
  const profits = settledBets.map(bet => bet.profit_loss || 0)
  const biggestWin = Math.max(...profits, 0)
  const biggestLoss = Math.abs(Math.min(...profits, 0))

  // Calculate current streak
  const { streak, streakType } = calculateCurrentStreak(settledBets)

  // Calculate average CLV (Pro only)
  const avgClv = isPro ? calculateAverageClv(settledBets) : null

  // Calculate variance
  const avgProfit = totalBets > 0 ? totalProfit / totalBets : 0
  const variance =
    totalBets > 0
      ? settledBets.reduce((sum, bet) => sum + Math.pow((bet.profit_loss || 0) - avgProfit, 2), 0) /
        totalBets
      : 0

  // Calculate profitable sports count
  const sportStats = calculateSportBreakdown(settledBets, isPro)
  const profitableSports = sportStats.filter(sport => sport.profit > 0).length

  return {
    totalBets: bets.length, // Include all bets, not just settled
    winRate,
    roi,
    totalProfit,
    totalStaked,
    avgOdds,
    avgStake,
    biggestWin,
    biggestLoss,
    currentStreak: streak,
    streakType,
    avgClv,
    profitableSports,
    variance,
  }
}

/**
 * Calculate current win/loss streak
 */
export function calculateCurrentStreak(bets: Bet[]): {
  streak: number
  streakType: 'win' | 'loss' | 'none'
} {
  if (!bets.length) {
    return { streak: 0, streakType: 'none' }
  }

  const settledBets = bets
    .filter(bet => bet.result === 'won' || bet.result === 'lost')
    .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())

  if (!settledBets.length) {
    return { streak: 0, streakType: 'none' }
  }

  const latestResult = settledBets[0].result
  const streakType: 'win' | 'loss' = latestResult === 'won' ? 'win' : 'loss'

  let streak = 0
  for (const bet of settledBets) {
    if (bet.result === latestResult) {
      streak++
    } else {
      break
    }
  }

  return { streak, streakType }
}

/**
 * Calculate sport-by-sport performance breakdown
 */
export function calculateSportBreakdown(bets: Bet[], isPro: boolean = false): SportPerformance[] {
  const sportStats = new Map<
    string,
    {
      bets: Bet[]
      profit: number
      staked: number
    }
  >()

  bets.forEach(bet => {
    if (!sportStats.has(bet.sport)) {
      sportStats.set(bet.sport, { bets: [], profit: 0, staked: 0 })
    }
    const stats = sportStats.get(bet.sport)!
    stats.bets.push(bet)
    stats.profit += bet.profit_loss || 0
    stats.staked += bet.stake
  })

  return Array.from(sportStats.entries())
    .map(([sport, stats]) => {
      const wonCount = stats.bets.filter(bet => bet.result === 'won').length
      const winRate = stats.bets.length > 0 ? (wonCount / stats.bets.length) * 100 : 0
      const roi = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0
      const avgOdds =
        stats.bets.length > 0
          ? stats.bets.reduce((sum, bet) => sum + bet.odds, 0) / stats.bets.length
          : 0

      const clv = isPro ? calculateAverageClvForBets(stats.bets) : undefined

      return {
        sport,
        bets: stats.bets.length,
        winRate,
        profit: stats.profit,
        roi,
        avgOdds,
        totalStaked: stats.staked,
        clv,
      }
    })
    .sort((a, b) => b.profit - a.profit)
}

/**
 * Calculate bet type performance breakdown
 */
export function calculateBetTypeBreakdown(bets: Bet[]): BetTypePerformance[] {
  const betTypeStats = new Map<
    string,
    {
      bets: Bet[]
      profit: number
      staked: number
    }
  >()

  bets.forEach(bet => {
    if (!betTypeStats.has(bet.bet_type)) {
      betTypeStats.set(bet.bet_type, { bets: [], profit: 0, staked: 0 })
    }
    const stats = betTypeStats.get(bet.bet_type)!
    stats.bets.push(bet)
    stats.profit += bet.profit_loss || 0
    stats.staked += bet.stake
  })

  return Array.from(betTypeStats.entries())
    .map(([betType, stats]) => {
      const wonCount = stats.bets.filter(bet => bet.result === 'won').length
      const winRate = stats.bets.length > 0 ? (wonCount / stats.bets.length) * 100 : 0
      const roi = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0
      const avgOdds =
        stats.bets.length > 0
          ? stats.bets.reduce((sum, bet) => sum + bet.odds, 0) / stats.bets.length
          : 0

      return {
        betType,
        bets: stats.bets.length,
        winRate,
        profit: stats.profit,
        roi,
        avgOdds,
      }
    })
    .sort((a, b) => b.roi - a.roi)
}

/**
 * Calculate performance by month
 */
export function calculateMonthlyBreakdown(
  bets: Bet[],
  maxMonths: number = 12
): PerformanceByTimeframe[] {
  const monthlyStats = new Map<
    string,
    {
      bets: number
      profit: number
      staked: number
      won: number
    }
  >()

  bets.forEach(bet => {
    const date = new Date(bet.placed_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyStats.has(monthKey)) {
      monthlyStats.set(monthKey, { bets: 0, profit: 0, staked: 0, won: 0 })
    }

    const stats = monthlyStats.get(monthKey)!
    stats.bets++
    stats.profit += bet.profit_loss || 0
    stats.staked += bet.stake
    if (bet.result === 'won') stats.won++
  })

  return Array.from(monthlyStats.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxMonths) // Get last N months
    .map(([month, stats]) => ({
      timeframe: month,
      bets: stats.bets,
      profit: stats.profit,
      winRate: stats.bets > 0 ? (stats.won / stats.bets) * 100 : 0,
      roi: stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0,
      totalStaked: stats.staked,
    }))
}

/**
 * Calculate daily profit data for charts
 */
export function calculateDailyProfitData(bets: Bet[]): Array<{
  date: string
  profit: number
  cumulativeProfit: number
  bets: number
}> {
  const dailyStats = new Map<string, number>()
  const settledBets = bets
    .filter(bet => bet.result === 'won' || bet.result === 'lost')
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

  settledBets.forEach(bet => {
    const date = bet.placed_at.split('T')[0]
    dailyStats.set(date, (dailyStats.get(date) || 0) + (bet.profit_loss || 0))
  })

  let cumulativeProfit = 0
  return Array.from(dailyStats.entries()).map(([date, profit]) => {
    cumulativeProfit += profit
    const dayBets = settledBets.filter(bet => bet.placed_at.startsWith(date)).length
    return {
      date,
      profit,
      cumulativeProfit,
      bets: dayBets,
    }
  })
}

/**
 * Calculate average CLV (Closing Line Value) for a set of bets
 */
export function calculateAverageClv(bets: Bet[]): number | null {
  const betsWithClv = bets.filter(bet => bet.clv !== null && bet.clv !== undefined)

  if (betsWithClv.length === 0) {
    return null
  }

  const totalClv = betsWithClv.reduce((sum, bet) => sum + (bet.clv || 0), 0)
  return totalClv / betsWithClv.length
}

/**
 * Calculate average CLV for a specific set of bets (helper function)
 */
function calculateAverageClvForBets(bets: Bet[]): number | undefined {
  const clv = calculateAverageClv(bets)
  return clv !== null ? clv : undefined
}

/**
 * Calculate Kelly Criterion recommended bet size
 */
export function calculateKellyCriterion(
  winProbability: number,
  odds: number,
  bankroll: number
): number {
  // Convert American odds to decimal
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1

  // Kelly formula: f = (bp - q) / b
  // where f = fraction of bankroll to bet
  // b = odds received on the wager (decimal odds - 1)
  // p = probability of winning
  // q = probability of losing (1 - p)

  const b = decimalOdds - 1
  const p = winProbability / 100
  const q = 1 - p

  const kellyFraction = (b * p - q) / b

  // Return recommended bet size (never more than 25% of bankroll for safety)
  return Math.max(0, Math.min(kellyFraction * bankroll, bankroll * 0.25))
}

/**
 * Calculate Sharpe Ratio for betting performance
 */
export function calculateSharpeRatio(bets: Bet[]): number {
  const settledBets = bets.filter(bet => bet.result === 'won' || bet.result === 'lost')

  if (settledBets.length < 2) return 0

  const returns = settledBets.map(bet => {
    const stake = bet.stake
    const profit = bet.profit_loss || 0
    return profit / stake // Return rate per bet
  })

  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)
  const stdDev = Math.sqrt(variance)

  return stdDev > 0 ? avgReturn / stdDev : 0
}

/**
 * Calculate odds ranges for analysis
 */
export function calculateOddsRangeBreakdown(bets: Bet[]): Array<{
  range: string
  bets: number
  winRate: number
  profit: number
  roi: number
}> {
  const ranges = [
    { min: -200, max: -151, label: 'Heavy Favorites (-200 to -151)' },
    { min: -150, max: -126, label: 'Favorites (-150 to -126)' },
    { min: -125, max: -101, label: 'Slight Favorites (-125 to -101)' },
    { min: 100, max: 149, label: 'Slight Underdogs (+100 to +149)' },
    { min: 150, max: 199, label: 'Underdogs (+150 to +199)' },
    { min: 200, max: 999, label: 'Heavy Underdogs (+200+)' },
  ]

  return ranges
    .map(range => {
      const rangeBets = bets.filter(bet => {
        return bet.odds >= range.min && bet.odds <= range.max
      })

      const settledBets = rangeBets.filter(bet => bet.result === 'won' || bet.result === 'lost')
      const wonBets = settledBets.filter(bet => bet.result === 'won')
      const profit = settledBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0)
      const staked = settledBets.reduce((sum, bet) => sum + bet.stake, 0)

      return {
        range: range.label,
        bets: settledBets.length,
        winRate: settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0,
        profit,
        roi: staked > 0 ? (profit / staked) * 100 : 0,
      }
    })
    .filter(range => range.bets > 0)
}

/**
 * Calculate bankroll growth over time
 */
export function calculateBankrollGrowth(
  bets: Bet[],
  initialBankroll: number
): Array<{
  date: string
  bankroll: number
  roi: number
}> {
  const sortedBets = bets
    .filter(bet => bet.result === 'won' || bet.result === 'lost')
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

  let currentBankroll = initialBankroll
  const bankrollHistory: Array<{ date: string; bankroll: number; roi: number }> = []

  sortedBets.forEach(bet => {
    currentBankroll += bet.profit_loss || 0
    const roi = ((currentBankroll - initialBankroll) / initialBankroll) * 100

    bankrollHistory.push({
      date: bet.placed_at.split('T')[0],
      bankroll: currentBankroll,
      roi,
    })
  })

  return bankrollHistory
}
