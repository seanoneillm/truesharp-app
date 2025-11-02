/**
 * Odds calculation utilities for iOS app
 * Mirrors the functionality from the web app's betting system
 */

export interface OddsCalculation {
  payout: number;
  profit: number;
}

/**
 * Convert American odds to decimal odds
 */
export const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  } else {
    return 100 / Math.abs(americanOdds) + 1;
  }
};

/**
 * Convert decimal odds to American odds
 */
export const decimalToAmerican = (decimalOdds: number): number => {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
};

/**
 * Calculate payout for a single bet
 */
export const calculateSingleBetPayout = (stake: number, americanOdds: number): number => {
  if (!stake || stake <= 0 || !americanOdds || typeof americanOdds !== 'number') {
    return 0;
  }
  
  const decimalOdds = americanToDecimal(americanOdds);
  return stake * decimalOdds;
};

/**
 * Calculate profit for a single bet (payout minus stake)
 */
export const calculateSingleBetProfit = (stake: number, americanOdds: number): number => {
  const payout = calculateSingleBetPayout(stake, americanOdds);
  return payout - stake;
};

/**
 * Calculate parlay odds from multiple American odds
 */
export const calculateParlayOdds = (americanOddsArray: number[]): number => {
  if (americanOddsArray.length < 2) {
    throw new Error('Parlay must have at least 2 legs');
  }

  const decimalOdds = americanOddsArray.map(odds => americanToDecimal(odds));
  const parlayDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  return decimalToAmerican(parlayDecimal);
};

/**
 * Calculate parlay payout
 */
export const calculateParlayPayout = (stake: number, americanOddsArray: number[]): number => {
  const parlayOdds = calculateParlayOdds(americanOddsArray);
  return calculateSingleBetPayout(stake, parlayOdds);
};

/**
 * Calculate parlay profit (payout minus stake)
 */
export const calculateParlayProfit = (stake: number, americanOddsArray: number[]): number => {
  const payout = calculateParlayPayout(stake, americanOddsArray);
  return payout - stake;
};

/**
 * Calculate potential payout for bet slip (single or parlay)
 */
export const calculateBetSlipPayout = (
  stake: number,
  bets: { odds: number }[]
): OddsCalculation => {
  // Handle invalid inputs
  if (!stake || stake <= 0 || !bets || bets.length === 0) {
    return { payout: 0, profit: 0 };
  }

  // Filter out bets with invalid odds
  const validBets = bets.filter(bet => bet && bet.odds && typeof bet.odds === 'number');
  
  if (validBets.length === 0) {
    return { payout: 0, profit: 0 };
  }

  if (validBets.length === 1) {
    const payout = calculateSingleBetPayout(stake, validBets[0].odds);
    return {
      payout,
      profit: payout - stake
    };
  } else {
    const payout = calculateParlayPayout(stake, validBets.map(bet => bet.odds));
    return {
      payout,
      profit: payout - stake
    };
  }
};

/**
 * Format odds for display (add + for positive odds)
 */
export const formatOdds = (odds: number): string => {
  if (!odds || typeof odds !== 'number') {
    return '-';
  }
  
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  if (!amount || typeof amount !== 'number') {
    return '$0.00';
  }
  return `$${amount.toFixed(2)}`;
};