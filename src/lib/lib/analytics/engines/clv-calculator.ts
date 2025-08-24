// clv-calculator.ts

import { Bet } from './free-tier-engine';

/**
 * Calculates Closing Line Value (CLV) for a given bet.
 * CLV = (Closing Odds - Bet Odds) / Bet Odds
 * Returns a decimal (e.g., 0.05 = +5% CLV)
 */
export function calculateCLV(bet: Bet & { betOdds: number; closingOdds: number }): number {
  const { betOdds, closingOdds } = bet;

  if (!betOdds || !closingOdds || betOdds === 0) return 0;

  return (closingOdds - betOdds) / betOdds;
}

