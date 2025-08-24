// Utility functions for odds calculations

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds back to American odds
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Calculate parlay odds from multiple American odds
 */
export function calculateParlayOdds(americanOddsArray: number[]): number {
  if (americanOddsArray.length < 2) {
    throw new Error('Parlay requires at least 2 legs');
  }

  // Convert all to decimal odds
  const decimalOdds = americanOddsArray.map(americanToDecimal);
  
  // Multiply all decimal odds together
  const parlayDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  // Convert back to American odds
  return decimalToAmerican(parlayDecimal);
}

/**
 * Calculate payout for a single bet
 */
export function calculateSingleBetPayout(stake: number, americanOdds: number): number {
  const decimalOdds = americanToDecimal(americanOdds);
  return stake * decimalOdds;
}

/**
 * Calculate payout for a parlay
 */
export function calculateParlayPayout(stake: number, americanOddsArray: number[]): number {
  const parlayOdds = calculateParlayOdds(americanOddsArray);
  return calculateSingleBetPayout(stake, parlayOdds);
}

/**
 * Calculate profit (payout minus stake)
 */
export function calculateProfit(payout: number, stake: number): number {
  return payout - stake;
}