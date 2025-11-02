import { supabase } from './supabase';
import { BetData } from './betFormatting';

export interface DashboardStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  roi: number;
  todaysBets: number;
  activeBets: number;
}

export interface ParlayGroup {
  parlay_id: string;
  legs: BetData[];
  total_stake: number;
  total_potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  placed_at: string;
}

export interface ProcessedBets {
  straight_bets: BetData[];
  parlay_groups: ParlayGroup[];
}

export interface ProfitData {
  date: string;
  profit: number;
}

/**
 * Fetch user's dashboard statistics
 */
export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return getDefaultStats();
    }

    if (!bets || bets.length === 0) {
      return getDefaultStats();
    }

    // Calculate statistics
    const totalBets = bets.length;
    const settledBets = bets.filter(bet => bet.status === 'won' || bet.status === 'lost');
    const wonBets = bets.filter(bet => bet.status === 'won').length;
    const winRate = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0;
    
    // Calculate total profit with correct parlay handling
    const processedBets = processBets(bets);
    const parlayProfitsProcessed = new Set<string>();
    let totalProfit = 0;

    // Handle straight bets
    processedBets.straight_bets.forEach(bet => {
      if (bet.status === 'won' && bet.profit) {
        totalProfit += bet.profit;
      } else if (bet.status === 'lost' && bet.stake) {
        totalProfit -= bet.stake;
      }
    });

    // Handle parlay groups (count once per parlay, not per leg)
    processedBets.parlay_groups.forEach(parlayGroup => {
      if (!parlayProfitsProcessed.has(parlayGroup.parlay_id) && 
          (parlayGroup.status === 'won' || parlayGroup.status === 'lost')) {
        parlayProfitsProcessed.add(parlayGroup.parlay_id);
        
        if (parlayGroup.status === 'won') {
          // For winning parlays: profit = total_potential_payout - total_stake
          totalProfit += parlayGroup.total_potential_payout - parlayGroup.total_stake;
        } else if (parlayGroup.status === 'lost') {
          // For losing parlays: loss = -total_stake (only once, not per leg)
          totalProfit -= parlayGroup.total_stake;
        }
      }
    });

    // Calculate ROI
    const totalStaked = bets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    // Count today's bets
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todaysBets = bets.filter(bet => {
      if (!bet.game_date) return false;
      const gameDate = new Date(bet.game_date);
      return gameDate >= startOfDay && gameDate < endOfDay;
    }).length;

    // Count active/pending bets
    const activeBets = bets.filter(bet => bet.status === 'pending').length;

    return {
      totalBets,
      winRate,
      totalProfit,
      roi,
      todaysBets,
      activeBets,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return getDefaultStats();
  }
}

/**
 * Fetch today's bets for the user - Fixed parlay grouping logic
 * For unsettled parlays, groups the entire parlay with the earliest open leg date
 */
export async function fetchTodaysBets(userId: string): Promise<ProcessedBets> {
  try {
    // Get today's date in local timezone
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // First, get all bets for today (straight bets and parlay legs with games today)
    const { data: todayBets, error: todayError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .gte('game_date', startOfDay.toISOString())
      .lt('game_date', endOfDay.toISOString())
      .order('placed_at', { ascending: false });

    if (todayError) {
      console.error("Error fetching today's bets:", todayError);
      return { straight_bets: [], parlay_groups: [] };
    }

    const todayBetsData: BetData[] = todayBets || [];
    
    // Get parlay IDs from today's bets
    const parlayIds = [...new Set(
      todayBetsData
        .filter(bet => bet.is_parlay && bet.parlay_id)
        .map(bet => bet.parlay_id)
    )];

    // If there are parlays, fetch ALL legs for those parlays (not just today's)
    let allParlayLegs: BetData[] = [];
    if (parlayIds.length > 0) {
      const { data: parlayData, error: parlayError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .in('parlay_id', parlayIds)
        .order('placed_at', { ascending: false });

      if (!parlayError && parlayData) {
        allParlayLegs = parlayData;
      }
    }

    // Combine straight bets from today with complete parlay legs
    const straightBetsToday = todayBetsData.filter(bet => !bet.is_parlay);
    const allRelevantBets = [...straightBetsToday, ...allParlayLegs];
    
    return processBetsWithParlayDateLogic(allRelevantBets, startOfDay, endOfDay);
  } catch (error) {
    console.error('Error fetching today\'s bets:', error);
    return { straight_bets: [], parlay_groups: [] };
  }
}

/**
 * Fetch recent bets for the user
 */
export async function fetchRecentBets(userId: string, limit: number = 10): Promise<BetData[]> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent bets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent bets:', error);
    return [];
  }
}

/**
 * Fetch profit data for analytics preview
 */
export async function fetchProfitData(
  userId: string,
  period: 'week' | 'month' | 'year' = 'month',
  year?: number
): Promise<{ profitData: ProfitData[]; totalProfit: number; winRate: number; totalBets: number }> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        const targetYear = year || now.getFullYear();
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59);
        break;
    }

    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .gte('placed_at', startDate.toISOString())
      .lte('placed_at', endDate.toISOString())
      .order('placed_at', { ascending: true });

    if (error) {
      console.error('Error fetching profit data:', error);
      return { profitData: [], totalProfit: 0, winRate: 0, totalBets: 0 };
    }

    const bets: BetData[] = data || [];
    
    // Group bets by date and calculate daily profit
    const dailyProfits = new Map<string, number>();
    let totalProfit = 0;

    // Process bets to properly handle parlays and calculate timeframe-specific metrics
    const processedBets = processBets(bets);
    const parlayProfitsProcessed = new Set<string>();
    
    // Track timeframe-specific metrics
    let timeframeWins = 0;
    let timeframeLosses = 0;
    let timeframeTotalBets = 0;

    // Handle straight bets
    processedBets.straight_bets.forEach(bet => {
      if (bet.status === 'won' || bet.status === 'lost') {
        const date = new Date(bet.placed_at || bet.game_date || '').toISOString().split('T')[0];
        const profit = bet.status === 'won' ? (bet.profit || 0) : -(bet.stake || 0);
        
        dailyProfits.set(date, (dailyProfits.get(date) || 0) + profit);
        totalProfit += profit;
        
        // Count for win rate calculation
        if (bet.status === 'won') timeframeWins++;
        if (bet.status === 'lost') timeframeLosses++;
        timeframeTotalBets++;
      } else if (bet.status === 'pending' || bet.status === 'void') {
        timeframeTotalBets++;
      }
    });

    // Handle parlay groups (count once per parlay, not per leg)
    processedBets.parlay_groups.forEach(parlayGroup => {
      if (!parlayProfitsProcessed.has(parlayGroup.parlay_id)) {
        parlayProfitsProcessed.add(parlayGroup.parlay_id);
        timeframeTotalBets++; // Each parlay counts as 1 bet
        
        if (parlayGroup.status === 'won' || parlayGroup.status === 'lost') {
          const date = new Date(parlayGroup.placed_at || '').toISOString().split('T')[0];
          let profit = 0;
          
          if (parlayGroup.status === 'won') {
            // For winning parlays: profit = total_potential_payout - total_stake
            profit = parlayGroup.total_potential_payout - parlayGroup.total_stake;
            timeframeWins++;
          } else if (parlayGroup.status === 'lost') {
            // For losing parlays: loss = -total_stake (only once, not per leg)
            profit = -parlayGroup.total_stake;
            timeframeLosses++;
          }
          
          dailyProfits.set(date, (dailyProfits.get(date) || 0) + profit);
          totalProfit += profit;
        }
      }
    });

    // Calculate timeframe-specific win rate
    const settledBets = timeframeWins + timeframeLosses;
    const winRate = settledBets > 0 ? (timeframeWins / settledBets) * 100 : 0;

    // Convert to array format and calculate cumulative profits
    const sortedDailyProfits = Array.from(dailyProfits.entries())
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Convert daily profits to cumulative profits starting from 0
    const profitData: ProfitData[] = [];
    let cumulativeProfit = 0;
    
    for (const dailyData of sortedDailyProfits) {
      cumulativeProfit += dailyData.profit;
      profitData.push({
        date: dailyData.date,
        profit: cumulativeProfit
      });
    }

    return { profitData, totalProfit, winRate, totalBets: timeframeTotalBets };
  } catch (error) {
    console.error('Error fetching profit data:', error);
    return { profitData: [], totalProfit: 0, winRate: 0, totalBets: 0 };
  }
}

/**
 * Process bets with correct parlay date logic for Today's Bets
 * For unsettled parlays, shows the parlay on the date of the first open leg
 */
function processBetsWithParlayDateLogic(
  bets: BetData[], 
  startOfDay: Date, 
  endOfDay: Date
): ProcessedBets {
  const straightBets: BetData[] = [];
  const parlayMap = new Map<string, BetData[]>();
  const parlayDateMap = new Map<string, Date>();

  // Separate straight bets and group parlay legs
  bets.forEach(bet => {
    if (bet.is_parlay && bet.parlay_id) {
      if (!parlayMap.has(bet.parlay_id)) {
        parlayMap.set(bet.parlay_id, []);
      }
      parlayMap.get(bet.parlay_id)!.push(bet);
    } else {
      // Only include straight bets that are actually from today
      const gameDate = new Date(bet.game_date || bet.placed_at || '');
      if (gameDate >= startOfDay && gameDate < endOfDay) {
        straightBets.push(bet);
      }
    }
  });

  // Determine which parlays should be shown "today" based on parlay date logic
  const parlayGroups: ParlayGroup[] = [];
  parlayMap.forEach((legs, parlayId) => {
    // Calculate parlay status based on leg statuses
    const wonLegs = legs.filter(leg => leg.status === 'won').length;
    const lostLegs = legs.filter(leg => leg.status === 'lost').length;
    const voidLegs = legs.filter(leg => leg.status === 'void').length;
    const pendingLegs = legs.filter(leg => leg.status === 'pending').length;

    let parlayStatus: 'pending' | 'won' | 'lost' | 'void' = 'pending';

    if (lostLegs > 0) {
      parlayStatus = 'lost';
    } else if (voidLegs === legs.length) {
      parlayStatus = 'void';
    } else if (wonLegs === legs.length) {
      parlayStatus = 'won';
    } else if (pendingLegs > 0) {
      parlayStatus = 'pending';
    }

    // Determine if this parlay should be shown today
    let shouldShowToday = false;
    
    if (parlayStatus === 'pending') {
      // For unsettled parlays, find the earliest open (pending) leg date
      const openLegs = legs.filter(leg => leg.status === 'pending');
      if (openLegs.length > 0) {
        const earliestOpenDate = new Date(Math.min(...openLegs.map(leg => 
          new Date(leg.game_date || leg.placed_at || '').getTime()
        )));
        
        // Show the parlay today if the earliest open leg is today
        shouldShowToday = earliestOpenDate >= startOfDay && earliestOpenDate < endOfDay;
      }
    } else {
      // For SETTLED parlays, use the placed_at date (when the bet was placed)
      // This handles cases where game_date might be missing or inconsistent
      const placedAtDate = new Date(legs[0]?.placed_at || '');
      shouldShowToday = placedAtDate >= startOfDay && placedAtDate < endOfDay;
    }

    if (shouldShowToday) {
      // Find the leg with actual stake/payout values
      let legWithStake = legs.find(leg => leg.stake && leg.stake > 0 && leg.potential_payout && leg.potential_payout > 0);
      
      if (!legWithStake) {
        legWithStake = legs.find(leg => leg.stake && leg.stake > 0);
      }
      
      if (!legWithStake) {
        legWithStake = legs[0];
      }

      const totalStake = legWithStake?.stake || 0;
      const totalPotentialPayout = legWithStake?.potential_payout || 0;

      parlayGroups.push({
        parlay_id: parlayId,
        legs: legs.sort((a, b) => new Date(a.placed_at || '').getTime() - new Date(b.placed_at || '').getTime()),
        total_stake: totalStake,
        total_potential_payout: totalPotentialPayout,
        status: parlayStatus,
        placed_at: legs[0]?.placed_at || '',
      });
    }
  });

  return {
    straight_bets: straightBets,
    parlay_groups: parlayGroups.sort(
      (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    ),
  };
}

/**
 * Process bets to separate straight bets and parlay groups (original function)
 */
function processBets(bets: BetData[]): ProcessedBets {
  const straightBets: BetData[] = [];
  const parlayMap = new Map<string, BetData[]>();

  // Separate straight bets and group parlay legs
  bets.forEach(bet => {
    if (bet.is_parlay && bet.parlay_id) {
      if (!parlayMap.has(bet.parlay_id)) {
        parlayMap.set(bet.parlay_id, []);
      }
      parlayMap.get(bet.parlay_id)!.push(bet);
    } else {
      straightBets.push(bet);
    }
  });

  // Convert parlay map to parlay groups
  const parlayGroups: ParlayGroup[] = [];
  parlayMap.forEach((legs, parlayId) => {
    // Calculate parlay status based on leg statuses
    const wonLegs = legs.filter(leg => leg.status === 'won').length;
    const lostLegs = legs.filter(leg => leg.status === 'lost').length;
    const voidLegs = legs.filter(leg => leg.status === 'void').length;
    const pendingLegs = legs.filter(leg => leg.status === 'pending').length;

    let parlayStatus: 'pending' | 'won' | 'lost' | 'void' = 'pending';

    if (lostLegs > 0) {
      parlayStatus = 'lost';
    } else if (voidLegs === legs.length) {
      parlayStatus = 'void';
    } else if (wonLegs === legs.length) {
      parlayStatus = 'won';
    } else if (pendingLegs > 0) {
      parlayStatus = 'pending';
    }

    // Find the leg with actual stake/payout values
    let legWithStake = legs.find(leg => leg.stake && leg.stake > 0 && leg.potential_payout && leg.potential_payout > 0);
    
    if (!legWithStake) {
      legWithStake = legs.find(leg => leg.stake && leg.stake > 0);
    }
    
    if (!legWithStake) {
      legWithStake = legs[0];
    }

    const totalStake = legWithStake?.stake || 0;
    const totalPotentialPayout = legWithStake?.potential_payout || 0;

    parlayGroups.push({
      parlay_id: parlayId,
      legs: legs.sort((a, b) => new Date(a.placed_at || '').getTime() - new Date(b.placed_at || '').getTime()),
      total_stake: totalStake,
      total_potential_payout: totalPotentialPayout,
      status: parlayStatus,
      placed_at: legs[0]?.placed_at || '',
    });
  });

  return {
    straight_bets: straightBets,
    parlay_groups: parlayGroups.sort(
      (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
    ),
  };
}

/**
 * Get default dashboard stats when no data is available
 */
function getDefaultStats(): DashboardStats {
  return {
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    roi: 0,
    todaysBets: 0,
    activeBets: 0,
  };
}