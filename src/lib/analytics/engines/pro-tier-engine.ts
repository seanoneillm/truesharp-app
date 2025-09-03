// Statistical helper functions
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

function calculateConfidenceInterval(stdDev: number, sampleSize: number): [number, number] {
  const zScore = 1.96 // 95% confidence interval
  const marginOfError = zScore * (stdDev / Math.sqrt(sampleSize))
  return [-marginOfError, marginOfError]
}
import { calculateCLV } from './clv-calculator'
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
  const confidenceInterval = calculateConfidenceInterval(standardDeviation, totalBets)

  const clvValues = completedBets.map(b => {
    const betWithOdds = b as Bet & { betOdds?: number; closingOdds?: number }
    if (betWithOdds.betOdds && betWithOdds.closingOdds) {
      return calculateCLV(betWithOdds as Bet & { betOdds: number; closingOdds: number })
    }
    return 0
  })
  const averageCLV = clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length

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
