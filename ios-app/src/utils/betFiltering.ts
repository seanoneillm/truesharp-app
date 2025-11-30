// Utilities for filtering bets based on analytics settings

import { BetData, AnalyticsData, AnalyticsMetrics, ChartDataPoint, SportBreakdown } from '../services/supabaseAnalytics';
import { AnalyticsSettings } from '../components/analytics/AnalyticsSettingsModal';
import { groupBetsByParlay } from '../services/parlayGrouping';

/**
 * Check if a bet is a TrueSharp theoretical bet
 * @param bet The bet to check
 * @returns true if the bet is from TrueSharp
 */
export const isTrueSharpBet = (bet: BetData): boolean => {
  return (
    bet.bet_source === 'manual' ||
    bet.sportsbook === 'TrueSharp' ||
    (bet as any).odd_source === 'TrueSharp'
  );
};

/**
 * Filter bets based on analytics settings
 * @param bets Array of bets to filter
 * @param settings Analytics settings containing filtering preferences
 * @returns Filtered array of bets
 */
export const filterBetsBySettings = (bets: BetData[], settings: AnalyticsSettings | null): BetData[] => {
  if (!settings) {
    return bets; // If no settings, return all bets
  }

  // If show_truesharp_bets is true, return all bets
  if (settings.show_truesharp_bets) {
    return bets;
  }

  // If show_truesharp_bets is false, filter out TrueSharp bets
  return bets.filter(bet => !isTrueSharpBet(bet));
};

/**
 * Recalculate analytics metrics based on filtered bets
 * @param filteredBets Filtered array of bets
 * @returns Recalculated metrics
 */
export const recalculateMetrics = (filteredBets: BetData[]): AnalyticsMetrics => {
  // Use the same grouping logic used elsewhere in the app
  const { parlays, singles } = groupBetsByParlay(filteredBets);
  
  // Count total bets: each parlay counts as 1 bet + all singles (matches database)
  const totalBets = parlays.length + singles.length;

  // Create unified bet array for calculations (matches database exactly)
  const unifiedBets = [
    // Parlays with their calculated profit/stake from groupBetsByParlay
    ...parlays.map(parlay => ({
      status: parlay.status,
      stake: parlay.stake,
      profit: parlay.profit,
      placed_at: parlay.placed_at,
      is_parlay: true,
    })),
    // Singles with their profit calculated
    ...singles.map(single => ({
      status: single.status,
      stake: single.stake || 0,
      // Calculate profit for singles (no profit field in BetData interface)
      profit: single.status === 'won'
        ? (single.potential_payout || 0) - (single.stake || 0)
        : single.status === 'lost'
          ? -(single.stake || 0)
          : 0,
      placed_at: single.placed_at || single.game_date,
      is_parlay: false,
    })),
  ];

  // Calculate metrics using exact database logic
  const settledBets = unifiedBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
  const wonBets = settledBets.filter(bet => bet.status === 'won').length;
  const winRate = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0;

  // Calculate total profit from unified bets (matches database)
  const totalProfit = unifiedBets.reduce((sum, bet) => sum + bet.profit, 0);

  // Calculate total stake from unified bets (matches database)  
  const totalStaked = unifiedBets.reduce((sum, bet) => sum + bet.stake, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const avgStake = totalBets > 0 ? totalStaked / totalBets : 0;
  
  // Calculate biggest win/loss from unified profits (matches database)
  const profits = unifiedBets.map(bet => bet.profit).filter(p => p !== 0);
  const biggestWin = profits.length > 0 ? Math.max(...profits) : 0;
  const biggestLoss = profits.length > 0 ? Math.abs(Math.min(...profits)) : 0;
  
  // Calculate current streak using unified bets (matches database)
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | 'none' = 'none';
  
  // Sort unified bets by date (most recent first) for streak calculation
  const sortedUnifiedBets = [...settledBets].sort((a, b) => {
    const aDate = new Date(a.placed_at || 0).getTime();
    const bDate = new Date(b.placed_at || 0).getTime();
    return bDate - aDate;
  });
  
  if (sortedUnifiedBets.length > 0) {
    const lastBetStatus = sortedUnifiedBets[0].status;
    streakType = lastBetStatus === 'won' ? 'win' : 'loss';
    currentStreak = 1;
    
    for (let i = 1; i < sortedUnifiedBets.length; i++) {
      if (sortedUnifiedBets[i].status === lastBetStatus) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Count void bets from unified bets
  const voidBetsCount = unifiedBets.filter(bet => bet.status === 'void' || bet.status === 'push').length;

  return {
    totalBets,
    winRate,
    roi,
    totalProfit,
    avgStake,
    biggestWin,
    biggestLoss,
    expectedValue: 0, // Would need more complex calculation
    avgClv: 0, // Would need CLV data
    straightBetsCount: singles.length,
    parlayBetsCount: parlays.length,
    voidBetsCount,
    streakType,
    currentStreak,
  };
};

/**
 * Recalculate daily profit data based on filtered bets
 * @param filteredBets Filtered array of bets
 * @returns Recalculated daily profit data
 */
export const recalculateDailyProfitData = (filteredBets: BetData[]): ChartDataPoint[] => {
  // Use the same grouping logic to avoid double-counting parlays
  const { parlays, singles } = groupBetsByParlay(filteredBets);
  
  // Create unified bet array for daily calculations  
  const unifiedBets = [
    // Parlays with their calculated profit/stake from groupBetsByParlay
    ...parlays.map(parlay => ({
      status: parlay.status,
      profit: parlay.profit,
      placed_at: parlay.placed_at,
    })),
    // Singles with their profit calculated
    ...singles.map(single => ({
      status: single.status,
      profit: single.status === 'won'
        ? (single.potential_payout || 0) - (single.stake || 0)
        : single.status === 'lost'
          ? -(single.stake || 0)
          : 0,
      placed_at: single.placed_at || single.game_date,
    })),
  ];

  // Group unified bets by date
  const dailyData = new Map<string, { profit: number; bets: number }>();
  
  unifiedBets.forEach(bet => {
    if (bet.status !== 'won' && bet.status !== 'lost') return;
    
    const date = bet.placed_at ? bet.placed_at.split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (!dailyData.has(date)) {
      dailyData.set(date, { profit: 0, bets: 0 });
    }
    
    const dayData = dailyData.get(date)!;
    dayData.bets++;
    dayData.profit += bet.profit;
  });
  
  // Convert to array and calculate cumulative profit
  const sortedDates = Array.from(dailyData.keys()).sort();
  let cumulativeProfit = 0;
  
  return sortedDates.map(date => {
    const dayData = dailyData.get(date)!;
    cumulativeProfit += dayData.profit;
    
    return {
      date,
      profit: dayData.profit,
      cumulativeProfit,
      bets: dayData.bets,
    };
  });
};

/**
 * Recalculate sport breakdown based on filtered bets
 * @param filteredBets Filtered array of bets
 * @returns Recalculated sport breakdown
 */
export const recalculateSportBreakdown = (filteredBets: BetData[]): SportBreakdown[] => {
  // Use the same grouping logic to avoid double-counting parlays
  const { parlays, singles } = groupBetsByParlay(filteredBets);
  
  // Create unified bet array for sport calculations
  const unifiedBets = [
    // Parlays with their calculated profit/stake from groupBetsByParlay
    ...parlays.map(parlay => ({
      sport: parlay.sport,
      profit: parlay.profit,
      stake: parlay.stake,
      status: parlay.status,
    })),
    // Singles with their profit calculated
    ...singles.map(single => ({
      sport: single.sport || 'Unknown',
      profit: single.status === 'won'
        ? (single.potential_payout || 0) - (single.stake || 0)
        : single.status === 'lost'
          ? -(single.stake || 0)
          : 0,
      stake: single.stake || 0,
      status: single.status,
    })),
  ];

  const sportData = new Map<string, { bets: number; profit: number; totalStaked: number; wins: number }>();
  
  unifiedBets.forEach(bet => {
    const sport = bet.sport || 'Unknown';
    
    if (!sportData.has(sport)) {
      sportData.set(sport, { bets: 0, profit: 0, totalStaked: 0, wins: 0 });
    }
    
    const data = sportData.get(sport)!;
    data.bets++;
    data.profit += bet.profit;
    
    if (bet.status === 'won' || bet.status === 'lost') {
      data.totalStaked += bet.stake;
      if (bet.status === 'won') {
        data.wins++;
      }
    }
  });
  
  return Array.from(sportData.entries()).map(([sport, data]) => ({
    sport,
    bets: data.bets,
    profit: data.profit,
    winRate: data.bets > 0 ? (data.wins / data.bets) * 100 : 0, // Fixed: use actual wins vs total bets
    roi: data.totalStaked > 0 ? (data.profit / data.totalStaked) * 100 : 0,
  }));
};

/**
 * Apply TrueSharp filtering to entire analytics data
 * @param analyticsData Original analytics data
 * @param settings Analytics settings
 * @returns Filtered analytics data
 */
export const filterAnalyticsData = (
  analyticsData: AnalyticsData, 
  settings: AnalyticsSettings | null
): AnalyticsData => {
  if (!settings || settings.show_truesharp_bets) {
    return analyticsData; // Return original data if showing all bets
  }
  
  // Filter bets
  const filteredBets = filterBetsBySettings(analyticsData.recentBets, settings);
  
  return {
    ...analyticsData,
    metrics: recalculateMetrics(filteredBets),
    recentBets: filteredBets,
    dailyProfitData: recalculateDailyProfitData(filteredBets),
    sportBreakdown: recalculateSportBreakdown(filteredBets),
    // Keep other breakdowns as-is for now (could be enhanced later)
  };
};