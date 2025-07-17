


import { Bet, BetFilter } from './base-filter-engine';

export function filterByTeam(team: string): BetFilter {
  return (bet: Bet) => bet.team === team;
}
