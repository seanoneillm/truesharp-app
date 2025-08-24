import { Bet, BetFilter } from './base-filter-engine';

export function filterBySport(sport: string): BetFilter {
  return (bet: Bet) => bet.sport === sport;
}

export function filterByLeague(league: string): BetFilter {
  return (bet: Bet) => bet.league === league;
}
