import { calculateConfidenceInterval, calculateStandardDeviation } from '../calculations/statistical-models';
import { calculateCLV } from './clv-calculator';
import { Bet } from './free-tier-engine';

export interface ProAnalyticsSummary {
  totalBets: number;
  winRate: number;
  roi: number;
  averageStake: number;
  netProfit: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
  averageCLV: number;
}

export function calculateProTierAnalytics(bets: Bet[]): ProAnalyticsSummary {
  const completedBets = bets.filter(b => b.status === 'won' || b.status === 'lost');
  const totalBets = completedBets.length;

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
    };
  }

  const wins = completedBets.filter(b => b.status === 'won').length;
  const totalStake = completedBets.reduce((sum, b) => sum + b.stake, 0);
  const totalPayout = completedBets.reduce((sum, b) => sum + b.payout, 0);
  const netProfit = totalPayout - totalStake;
  const roi = netProfit / totalStake;
  const averageStake = totalStake / totalBets;

  const stakes = completedBets.map(b => b.stake);
  const standardDeviation = calculateStandardDeviation(stakes);
  const confidenceInterval = calculateConfidenceInterval(roi, standardDeviation, totalBets);

  const clvValues = completedBets.map(b => calculateCLV(b));
  const averageCLV = clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length;

  return {
    totalBets,
    winRate: wins / totalBets,
    roi,
    averageStake,
    netProfit,
    standardDeviation,
    confidenceInterval,
    averageCLV,
  };
}
