import { BetData } from './supabaseAnalytics';

export interface ParlayGroup {
  parlay_id: string;
  legs: BetData[];
  sport: string; // "multi-sport" if legs have different sports
  stake: number;
  potential_payout: number;
  odds: string | number;
  status: 'won' | 'lost' | 'pending' | 'void' | 'push';
  profit: number;
  placed_at: string;
}

export interface GroupedBetsResult {
  singles: BetData[];
  parlays: ParlayGroup[];
}

/**
 * Determine parlay status based on all legs (matches web app logic)
 * A parlay wins only if ALL legs win
 * A parlay loses if ANY leg loses
 * A parlay is pending if ANY leg is still pending
 */
function determineParlayStatus(legs: BetData[]): { status: 'won' | 'lost' | 'pending' | 'void' | 'push', profit: number } {
  // Find legs with non-zero values for stake and potential_payout
  const legWithStake = legs.find(leg => (leg.stake || 0) > 0) || legs[0];
  const legWithPayout = legs.find(leg => (leg.potential_payout || 0) > 0) || legs[0];
  
  const stake = legWithStake.stake || 0;
  const potential_payout = legWithPayout.potential_payout || 0;

  // Always use leg-by-leg analysis (matches web app behavior)
  // Do NOT trust database profit values for status determination
  const wonLegs = legs.filter(leg => leg.status === 'won');
  const lostLegs = legs.filter(leg => leg.status === 'lost');
  const pendingLegs = legs.filter(leg => leg.status === 'pending');
  const voidLegs = legs.filter(leg => leg.status === 'void' || leg.status === 'push');
  const totalLegs = legs.length;

  // Determine overall parlay status (matches web app logic exactly)
  let parlayStatus: 'won' | 'lost' | 'pending' | 'void' | 'push' = 'pending';
  
  if (lostLegs.length > 0) {
    // Any lost leg = parlay lost
    parlayStatus = 'lost';
  } else if (wonLegs.length === totalLegs) {
    // All legs won = parlay won
    parlayStatus = 'won';
  } else if (voidLegs.length > 0 && wonLegs.length + voidLegs.length === totalLegs) {
    // All legs either won or void = parlay void
    parlayStatus = 'void';
  } else {
    // Still have pending legs = parlay pending
    parlayStatus = 'pending';
  }

  // Calculate profit based on determined status
  let profit: number;
  if (parlayStatus === 'won') {
    // For wins, check if any leg has a non-zero profit value in the database
    const legWithDbProfit = legs.find(leg => (leg.profit || 0) !== 0);
    if (legWithDbProfit && legWithDbProfit.profit !== null && legWithDbProfit.profit !== undefined) {
      profit = legWithDbProfit.profit;
    } else {
      profit = potential_payout - stake;
    }
  } else if (parlayStatus === 'lost') {
    profit = -stake;
  } else if (parlayStatus === 'void' || parlayStatus === 'push') {
    profit = 0;
  } else {
    // Pending - always use 0 regardless of what database says
    // The display logic will show "To Win" instead of profit
    profit = 0;
  }

  return { status: parlayStatus, profit };
}

/**
 * Determine sport label for parlay
 * Returns "multi-sport" if legs have different sports
 */
function determineParlayMultiSport(legs: BetData[]): string {
  const sports = new Set(legs.map(leg => leg.sport).filter(Boolean));
  
  if (sports.size === 0) return 'Unknown';
  if (sports.size === 1) return Array.from(sports)[0];
  return 'multi-sport';
}

/**
 * Calculate combined parlay odds from individual leg odds
 */
function calculateParlayOdds(legs: BetData[]): string {
  // Convert American odds to decimal and multiply
  let combinedDecimal = 1;
  
  for (const leg of legs) {
    const odds = typeof leg.odds === 'string' ? parseFloat(leg.odds) : leg.odds;
    if (isNaN(odds)) continue;
    
    // Convert American to decimal
    let decimal: number;
    if (odds > 0) {
      decimal = (odds / 100) + 1;
    } else {
      decimal = (100 / Math.abs(odds)) + 1;
    }
    
    combinedDecimal *= decimal;
  }
  
  // Convert back to American odds
  const americanOdds = combinedDecimal >= 2 
    ? Math.round((combinedDecimal - 1) * 100)
    : Math.round(-100 / (combinedDecimal - 1));
    
  return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`;
}

/**
 * Group bets by parlay_id and create parlay objects
 * Single bets (no parlay_id) remain as singles
 * Returns both as separate arrays without sorting (sorting happens in BetsTab)
 */
export function groupBetsByParlay(bets: BetData[]): GroupedBetsResult {
  const parlayGroups = new Map<string, BetData[]>();
  const singles: BetData[] = [];

  // Group bets by parlay_id
  bets.forEach(bet => {
    if (bet.parlay_id && bet.is_parlay) {
      if (!parlayGroups.has(bet.parlay_id)) {
        parlayGroups.set(bet.parlay_id, []);
      }
      parlayGroups.get(bet.parlay_id)!.push(bet);
    } else {
      singles.push(bet);
    }
  });

  // Convert parlay groups to ParlayGroup objects
  const parlays: ParlayGroup[] = Array.from(parlayGroups.entries()).map(([parlay_id, legs]) => {
    const firstLeg = legs[0];
    const { status, profit } = determineParlayStatus(legs);
    
    // For parlays, find the leg with non-zero stake and potential_payout
    // Sometimes only one leg has the accurate values while others show 0
    const legWithStake = legs.find(leg => (leg.stake || 0) > 0) || firstLeg;
    const legWithPayout = legs.find(leg => (leg.potential_payout || 0) > 0) || firstLeg;
    
    return {
      parlay_id,
      legs: legs.sort((a, b) => (a.placed_at || '').localeCompare(b.placed_at || '')), // Sort legs by date
      sport: determineParlayMultiSport(legs),
      stake: legWithStake.stake || 0,
      potential_payout: legWithPayout.potential_payout || 0,
      odds: calculateParlayOdds(legs),
      status,
      profit,
      placed_at: firstLeg.placed_at || '',
    };
  });

  return { singles, parlays };
}

/**
 * Get display text for parlay legs count
 */
export function getParlayLegsText(legCount: number): string {
  return `${legCount} leg parlay`;
}

/**
 * Format a single bet or parlay for display
 * This ensures consistent formatting across the app
 */
export function formatBetForDisplay(bet: BetData | ParlayGroup): {
  mainTitle: string;
  subtitle: string;
  odds: string;
  stake: string;
  potentialPayout: string;
  status: string;
  profit: string;
  statusColor: string;
} {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return '#10B981'; // green
      case 'lost':
        return '#EF4444'; // red
      case 'pending':
        return '#F59E0B'; // yellow/amber
      case 'void':
      case 'push':
        return '#6B7280'; // gray
      default:
        return '#6B7280';
    }
  };

  // Check if it's a parlay
  if ('legs' in bet) {
    // It's a parlay
    const parlay = bet as ParlayGroup;
    return {
      mainTitle: getParlayLegsText(parlay.legs.length),
      subtitle: parlay.sport,
      odds: typeof parlay.odds === 'string' ? parlay.odds : parlay.odds.toString(),
      stake: formatCurrency(parlay.stake),
      potentialPayout: formatCurrency(parlay.potential_payout),
      status: parlay.status.charAt(0).toUpperCase() + parlay.status.slice(1),
      profit: parlay.status === 'pending' 
        ? formatCurrency(parlay.potential_payout - parlay.stake)
        : formatCurrency(parlay.profit),
      statusColor: getStatusColor(parlay.status),
    };
  } else {
    // It's a single bet
    const singleBet = bet as BetData;
    const profit = singleBet.profit !== null && singleBet.profit !== undefined 
      ? singleBet.profit
      : singleBet.status === 'won' 
        ? (singleBet.potential_payout || 0) - (singleBet.stake || 0)
        : singleBet.status === 'lost'
          ? -(singleBet.stake || 0)
          : 0;
          
    return {
      mainTitle: singleBet.bet_description || 'Bet',
      subtitle: `${singleBet.bet_type || 'Unknown'} • ${singleBet.league || singleBet.sport || 'Unknown'}`,
      odds: typeof singleBet.odds === 'string' ? singleBet.odds : singleBet.odds?.toString() || '',
      stake: formatCurrency(singleBet.stake || 0),
      potentialPayout: formatCurrency(singleBet.potential_payout || 0),
      status: singleBet.status.charAt(0).toUpperCase() + singleBet.status.slice(1),
      profit: singleBet.status === 'pending'
        ? formatCurrency((singleBet.potential_payout || 0) - (singleBet.stake || 0))
        : formatCurrency(profit),
      statusColor: getStatusColor(singleBet.status),
    };
  }
}