// import {
//   calculateConfidenceInterval,
//   calculateStandardDeviation,
// } from '../calculations/statistical-models'

// Temporary implementations
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

function calculateConfidenceInterval(
  roi: number,
  stdDev: number,
  sampleSize: number
): [number, number] {
  const zScore = 1.96 // 95% confidence interval
  const marginOfError = zScore * (stdDev / Math.sqrt(sampleSize))
  return [roi - marginOfError, roi + marginOfError]
}
// import { calculateCLV } from './clv-calculator'
import { Bet } from './free-tier-engine'

export interface ProAnalyticsSummary {
  totalBets: number
  winRate: number
  roi: number
  averageStake: number
  netProfit: number
  standardDeviation: number
  confidenceInterval: [number, number]
  averageCLV: number
}

export function calculateProTierAnalytics(bets: Bet[]): ProAnalyticsSummary {
  const completedBets = bets.filter(b => b.status === 'won' || b.status === 'lost')
  const totalBets = completedBets.length

  if (totalBets === 0) {
    return {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      averageStake: 0,
      netProfit: 0,
      standardDeviation: 0,
      confidenceInterval: [0, 0],
      averageCLV: 0,
    }
  }

  const wins = completedBets.filter(b => b.status === 'won').length
  const totalStake = completedBets.reduce((sum, b) => sum + b.stake, 0)
  const totalPayout = completedBets.reduce((sum, b) => sum + b.payout, 0)
  const netProfit = totalPayout - totalStake
  const roi = netProfit / totalStake
  const averageStake = totalStake / totalBets

  const stakes = completedBets.map(b => b.stake)
  const standardDeviation = calculateStandardDeviation(stakes)
  const confidenceInterval = calculateConfidenceInterval(roi, standardDeviation, totalBets)

  // const clvValues = completedBets
  //   .filter(b => b.odds && b.closing_odds)
  //   .map(b => calculateCLV({ ...b, betOdds: b.odds!, closingOdds: b.closing_odds! } as Bet & { betOdds: number; closingOdds: number }))
  // const averageCLV = clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length
  const averageCLV = 0

  return {
    totalBets,
    winRate: wins / totalBets,
    roi,
    averageStake,
    netProfit,
    standardDeviation,
    confidenceInterval,
    averageCLV,
  }
}
