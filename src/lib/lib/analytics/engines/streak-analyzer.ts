
import { Bet } from './free-tier-engine';

/**
 * Calculates the current win streak from a list of bets.
 */
export function calculateWinStreak(bets: Bet[]): number {
  let streak = 0;


  for (let i = bets.length - 1; i >= 0; i--) {
    const bet = bets[i];
    if (bet?.status === 'won') {
      streak++;
    } else if (bet?.status === 'lost') {
      break;
    }
  }

  return streak;
}

