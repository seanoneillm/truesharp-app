
import { Bet, BetFilter } from './base-filter-engine';

export function filterByPlayer(player: string): BetFilter {
  return (bet: Bet) => bet.player === player;
}
