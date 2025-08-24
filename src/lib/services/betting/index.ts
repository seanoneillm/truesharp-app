// Main exports for betting system
export * from './types';
export * from './odds-utils';
export * from './bet-mapping';
export * from './betting-functions';

// Re-export main functions for easy import
export {
  insertSingleBet,
  insertParlayBet,
  calculateParlayPayoutForUI as calculateParlayPayout,
  checkParlayStatus,
  submitBet
} from './betting-functions';

export {
  americanToDecimal,
  decimalToAmerican,
  calculateParlayOdds,
  calculateSingleBetPayout,
  calculateParlayPayout as calculateParlayPayoutInternal,
  calculateProfit
} from './odds-utils';