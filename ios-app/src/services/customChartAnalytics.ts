import { supabase } from '../lib/supabase';
import { ChartConfig } from '../components/analytics/CustomChartCreator';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface BetData {
  id: string;
  user_id: string;
  sport: string;
  league: string;
  bet_type: string;
  bet_description: string;
  odds: number;
  stake: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled';
  placed_at: string;
  settled_at?: string;
  game_date: string;
  prop_type?: string;
  player_name?: string;
  home_team?: string;
  away_team?: string;
  profit?: number;
  sportsbook?: string;
  line_value?: number;
  bet_source: string;
  is_copy_bet: boolean;
  side?: 'over' | 'under' | 'home' | 'away';
  is_parlay: boolean;
}

/**
 * Fetch and analyze user's bet data for custom charts
 */
export async function fetchCustomChartData(
  userId: string,
  config: ChartConfig
): Promise<ChartDataPoint[]> {
  try {

    // Fetch user's bets
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching bets:', error);
      return [];
    }

    if (!bets || bets.length === 0) {
      return [];
    }

    // Process data based on chart configuration
    const processedData = processChartData(bets, config);

    return processedData;
  } catch (error) {
    console.error('🚨 Error in fetchCustomChartData:', error);
    return [];
  }
}

/**
 * Process raw bet data based on chart configuration
 */
function processChartData(bets: BetData[], config: ChartConfig): ChartDataPoint[] {
  const { xAxis, yAxis } = config;

  // Group data by X-axis
  const grouped = groupDataByXAxis(bets, xAxis);

  // Calculate Y-axis values for each group
  const processed = Object.entries(grouped).map(([key, betGroup]) => {
    const result: ChartDataPoint = {
      [xAxis]: formatXAxisValue(key, xAxis),
      raw_value: key, // Keep original value for sorting
    };

    // Calculate Y-axis value
    result[yAxis] = calculateYAxisValue(betGroup, yAxis);

    return result;
  });

  // Sort data appropriately
  return sortChartData(processed, xAxis);
}

/**
 * Group data by X-axis field
 */
function groupDataByXAxis(bets: BetData[], xAxis: string): Record<string, BetData[]> {
  return bets.reduce((acc, bet) => {
    let key: string;

    switch (xAxis) {
      case 'sport':
        key = bet.sport || 'Unknown';
        break;

      case 'league':
        key = bet.league || 'Unknown';
        break;

      case 'sportsbook':
        key = bet.sportsbook || 'Unknown';
        break;

      case 'bet_type':
        key = formatBetType(bet.bet_type) || 'Unknown';
        break;

      case 'side':
        key = formatSide(bet.side) || 'Unknown';
        break;

      case 'prop_type':
        key = bet.prop_type || 'Unknown';
        break;

      case 'player_name':
        key = bet.player_name || 'Unknown';
        break;

      case 'home_team':
        key = bet.home_team || 'Unknown';
        break;

      case 'away_team':
        key = bet.away_team || 'Unknown';
        break;

      case 'game_date':
        // Group by game date (YYYY-MM-DD)
        key = bet.game_date
          ? new Date(bet.game_date).toISOString().split('T')[0]
          : 'Unknown';
        break;

      case 'placed_at_day_of_week':
        // Group by day of week
        if (bet.placed_at) {
          const dayOfWeek = new Date(bet.placed_at).getDay();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          key = days[dayOfWeek] || 'Unknown';
        } else {
          key = 'Unknown';
        }
        break;

      case 'placed_at_time_of_day':
        // Group by time of day
        if (bet.placed_at) {
          const hour = new Date(bet.placed_at).getHours();
          if (hour >= 6 && hour < 12) key = 'Morning (6AM-12PM)';
          else if (hour >= 12 && hour < 18) key = 'Afternoon (12PM-6PM)';
          else if (hour >= 18 && hour < 22) key = 'Evening (6PM-10PM)';
          else key = 'Late Night (10PM-6AM)';
        } else {
          key = 'Unknown';
        }
        break;

      case 'stake_size_bucket':
        // Group by stake size buckets
        const stake = bet.stake || 0;
        if (stake <= 25) key = 'Small (≤$25)';
        else if (stake <= 100) key = 'Medium ($25-$100)';
        else key = 'Large (>$100)';
        break;

      case 'odds_range_bucket':
        // Group by odds ranges
        const odds = bet.odds || 0;
        if (odds <= -150) key = 'Chalk (≤-150)';
        else if (odds >= -149 && odds <= 149) key = 'Even Money (-149 to +149)';
        else if (odds >= 150) key = 'Longshots (≥+150)';
        else key = 'Unknown';
        break;

      case 'bet_source':
        // Group by manual vs copy bet
        key = bet.is_copy_bet || bet.bet_source === 'copy' ? 'Copy Bet' : 'Manual Bet';
        break;

      case 'parlay_vs_straight':
        // Group by parlay vs straight bet
        key = bet.is_parlay || bet.bet_type === 'parlay' ? 'Parlay' : 'Straight';
        break;

      // Legacy support
      case 'placed_at':
        // Group by date (YYYY-MM-DD)
        key = bet.placed_at
          ? new Date(bet.placed_at).toISOString().split('T')[0]
          : 'Unknown';
        break;

      default:
        key = 'Unknown';
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(bet);

    return acc;
  }, {} as Record<string, BetData[]>);
}

/**
 * Calculate Y-axis value for a group of bets
 */
function calculateYAxisValue(bets: BetData[], yAxis: string): number {
  if (!bets || bets.length === 0) return 0;

  switch (yAxis) {
    case 'count':
      return bets.length;

    case 'wins_count':
      return bets.filter(bet => bet.status === 'won').length;

    case 'losses_count':
      return bets.filter(bet => bet.status === 'lost').length;

    case 'win_rate':
      return calculateWinRate(bets);

    case 'profit':
      return calculateTotalProfit(bets);

    case 'roi':
      return calculateROI(bets);

    case 'total_staked':
    case 'stake': // Legacy support
      return calculateTotalStake(bets);

    case 'average_stake':
      return calculateAverageStake(bets);

    case 'average_odds':
      return calculateAverageOdds(bets);

    case 'median_odds':
      return calculateMedianOdds(bets);

    case 'void_count':
      return bets.filter(bet => ['void', 'cancelled'].includes(bet.status)).length;

    case 'longshot_hit_rate':
      return calculateLongshotHitRate(bets);

    case 'chalk_hit_rate':
      return calculateChalkHitRate(bets);

    case 'max_win':
      return calculateMaxWin(bets);

    case 'max_loss':
      return calculateMaxLoss(bets);

    case 'profit_variance':
      return calculateProfitVariance(bets);

    default:
      return 0;
  }
}

/**
 * Format X-axis value for display
 */
function formatXAxisValue(value: string, xAxis: string): string {
  switch (xAxis) {
    case 'placed_at':
    case 'game_date':
      // Format date for display
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });

    case 'bet_type':
      return formatBetType(value);

    case 'side':
      return formatSide(value);

    default:
      return value;
  }
}

/**
 * Sort chart data appropriately
 */
function sortChartData(data: ChartDataPoint[], xAxis: string): ChartDataPoint[] {
  switch (xAxis) {
    case 'placed_at':
    case 'game_date':
      // Sort by date
      return data.sort((a, b) => new Date(a.raw_value).getTime() - new Date(b.raw_value).getTime());

    case 'placed_at_day_of_week':
      // Sort by day of week (Sunday first)
      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return data.sort((a, b) => dayOrder.indexOf(a[xAxis]) - dayOrder.indexOf(b[xAxis]));

    case 'stake_size_bucket':
      // Sort by stake size
      const stakeOrder = ['Small (≤$25)', 'Medium ($25-$100)', 'Large (>$100)'];
      return data.sort((a, b) => stakeOrder.indexOf(a[xAxis]) - stakeOrder.indexOf(b[xAxis]));

    case 'odds_range_bucket':
      // Sort by odds range
      const oddsOrder = ['Chalk (≤-150)', 'Even Money (-149 to +149)', 'Longshots (≥+150)'];
      return data.sort((a, b) => oddsOrder.indexOf(a[xAxis]) - oddsOrder.indexOf(b[xAxis]));

    case 'league':
    case 'bet_type':
    case 'sportsbook':
    case 'sport':
      // Sort alphabetically
      return data.sort((a, b) => a[xAxis].localeCompare(b[xAxis]));

    default:
      return data;
  }
}

// Helper calculation functions
function calculateTotalProfit(bets: BetData[]): number {
  return bets.reduce((total, bet) => {
    // Use profit field if available
    if (bet.profit !== null && bet.profit !== undefined) {
      return total + bet.profit;
    }

    // Fallback calculation based on status
    switch (bet.status) {
      case 'won':
        return total + (bet.potential_payout - bet.stake);
      case 'lost':
        return total - bet.stake;
      default:
        return total;
    }
  }, 0);
}

function calculateTotalStake(bets: BetData[]): number {
  return bets.reduce((total, bet) => total + (bet.stake || 0), 0);
}

function calculateWinRate(bets: BetData[]): number {
  const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status));
  if (settledBets.length === 0) return 0;

  const wonBets = settledBets.filter(bet => bet.status === 'won').length;
  return (wonBets / settledBets.length) * 100;
}

function calculateROI(bets: BetData[]): number {
  const totalStake = calculateTotalStake(bets);
  const totalProfit = calculateTotalProfit(bets);

  if (totalStake === 0) return 0;
  return (totalProfit / totalStake) * 100;
}

function calculateAverageStake(bets: BetData[]): number {
  if (bets.length === 0) return 0;
  const totalStake = calculateTotalStake(bets);
  return totalStake / bets.length;
}

function calculateAverageOdds(bets: BetData[]): number {
  if (bets.length === 0) return 0;
  const validOdds = bets.filter(bet => bet.odds != null).map(bet => bet.odds);
  if (validOdds.length === 0) return 0;
  return validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
}

function calculateMedianOdds(bets: BetData[]): number {
  const validOdds = bets
    .filter(bet => bet.odds != null)
    .map(bet => bet.odds)
    .sort((a, b) => a - b);
  if (validOdds.length === 0) return 0;

  const mid = Math.floor(validOdds.length / 2);
  return validOdds.length % 2 === 0 ? (validOdds[mid - 1] + validOdds[mid]) / 2 : validOdds[mid];
}

function calculateLongshotHitRate(bets: BetData[]): number {
  const longshotBets = bets.filter(bet => bet.odds >= 200);
  if (longshotBets.length === 0) return 0;

  const settledLongshots = longshotBets.filter(bet => ['won', 'lost'].includes(bet.status));
  if (settledLongshots.length === 0) return 0;

  const wonLongshots = settledLongshots.filter(bet => bet.status === 'won').length;
  return (wonLongshots / settledLongshots.length) * 100;
}

function calculateChalkHitRate(bets: BetData[]): number {
  const chalkBets = bets.filter(bet => bet.odds <= -150);
  if (chalkBets.length === 0) return 0;

  const settledChalk = chalkBets.filter(bet => ['won', 'lost'].includes(bet.status));
  if (settledChalk.length === 0) return 0;

  const wonChalk = settledChalk.filter(bet => bet.status === 'won').length;
  return (wonChalk / settledChalk.length) * 100;
}

function calculateMaxWin(bets: BetData[]): number {
  const winningBets = bets.filter(bet => bet.status === 'won');
  if (winningBets.length === 0) return 0;

  return Math.max(
    ...winningBets.map(bet => {
      if (bet.profit !== null && bet.profit !== undefined) return bet.profit;
      return bet.potential_payout - bet.stake;
    })
  );
}

function calculateMaxLoss(bets: BetData[]): number {
  const losingBets = bets.filter(bet => bet.status === 'lost');
  if (losingBets.length === 0) return 0;

  return Math.max(...losingBets.map(bet => bet.stake || 0));
}

function calculateProfitVariance(bets: BetData[]): number {
  if (bets.length === 0) return 0;

  const profits = bets.map(bet => {
    if (bet.profit !== null && bet.profit !== undefined) return bet.profit;

    switch (bet.status) {
      case 'won':
        return bet.potential_payout - bet.stake;
      case 'lost':
        return -bet.stake;
      default:
        return 0;
    }
  });

  const mean = profits.reduce((sum, profit) => sum + profit, 0) / profits.length;
  const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - mean, 2), 0) / profits.length;

  return Math.sqrt(variance); // Return standard deviation
}

// Helper formatting functions
function formatBetType(betType: string): string {
  const typeMap: Record<string, string> = {
    'spread': 'Spread',
    'moneyline': 'Moneyline',
    'total': 'Over/Under',
    'player_prop': 'Player Props',
    'game_prop': 'Game Props',
    'first_half': 'First Half',
    'quarter': 'Quarter',
    'period': 'Period',
    'parlay': 'Parlay'
  };
  return typeMap[betType] || betType;
}

function formatSide(side?: string): string {
  if (!side) return 'Unknown';
  const sideMap: Record<string, string> = {
    'over': 'Over',
    'under': 'Under',
    'home': 'Home',
    'away': 'Away'
  };
  return sideMap[side] || side;
}