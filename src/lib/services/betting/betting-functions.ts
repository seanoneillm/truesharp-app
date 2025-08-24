import { SupabaseClient } from '@supabase/supabase-js';
import { Bet, DatabaseBet, ParlayStatus, BetSubmissionResult } from './types';
import { calculateSingleBetPayout, calculateParlayPayout, calculateProfit } from './odds-utils';
import { mapBetToDatabase } from './bet-mapping';

/**
 * Insert a single bet into the database
 */
export async function insertSingleBet(
  supabase: SupabaseClient,
  userId: string, 
  bet: Bet, 
  stake: number
): Promise<BetSubmissionResult> {
  try {
    if (stake < 1 || stake > 10000) {
      return {
        success: false,
        error: 'Stake must be between $1 and $10,000'
      };
    }

    
    // Calculate payout
    const potentialPayout = calculateSingleBetPayout(stake, bet.odds);
    
    // Map to database format
    const dbBet = mapBetToDatabase(bet, userId, stake, potentialPayout, undefined, false);
    
    console.log('🗄️ Inserting single bet:', { 
      dbBet: { ...dbBet, user_id: dbBet.user_id.substring(0, 8) + '...' },
      stake,
      potentialPayout 
    });
    
    // Insert into database
    const { data, error } = await supabase
      .from('bets')
      .insert([dbBet])
      .select('id')
      .single();
      
    console.log('📝 Database insert result:', { 
      success: !error, 
      data, 
      error: error?.message 
    });

    if (error) {
      console.error('Error inserting single bet:', error);
      return {
        success: false,
        error: 'Failed to place bet. Please try again.'
      };
    }

    return {
      success: true,
      betId: data.id,
      message: `Single bet placed successfully for $${stake.toFixed(2)}`
    };

  } catch (error) {
    console.error('Unexpected error in insertSingleBet:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Insert a parlay bet into the database
 */
export async function insertParlayBet(
  supabase: SupabaseClient,
  userId: string, 
  bets: Bet[], 
  stake: number
): Promise<BetSubmissionResult> {
  try {
    if (bets.length < 2 || bets.length > 10) {
      return {
        success: false,
        error: 'Parlay must have between 2 and 10 legs'
      };
    }

    if (stake < 1 || stake > 10000) {
      return {
        success: false,
        error: 'Stake must be between $1 and $10,000'
      };
    }

    
    // Generate parlay ID
    const parlayId = crypto.randomUUID();
    
    // Calculate parlay payout
    const parlayOdds = bets.map(bet => bet.odds);
    const totalPotentialPayout = calculateParlayPayout(stake, parlayOdds);
    
    // Prepare all bet inserts
    const dbBets: DatabaseBet[] = bets.map((bet, index) => {
      // Only the first leg gets the stake, others get 0
      const legStake = index === 0 ? stake : 0;
      // Only the first leg gets the full payout, others get 0
      const legPayout = index === 0 ? totalPotentialPayout : 0;
      
      return mapBetToDatabase(bet, userId, legStake, legPayout, parlayId, true);
    });

    // Insert all bets in a transaction
    const { data, error } = await supabase
      .from('bets')
      .insert(dbBets)
      .select('id');

    if (error) {
      console.error('Error inserting parlay bet:', error);
      return {
        success: false,
        error: 'Failed to place parlay bet. Please try again.'
      };
    }

    return {
      success: true,
      parlayId: parlayId,
      message: `${bets.length}-leg parlay placed successfully for $${stake.toFixed(2)}`
    };

  } catch (error) {
    console.error('Unexpected error in insertParlayBet:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Calculate parlay payout (wrapper function for external use)
 */
export function calculateParlayPayoutForUI(bets: Bet[], stake: number): number {
  if (bets.length === 0) return 0;
  if (bets.length === 1) return calculateSingleBetPayout(stake, bets[0].odds);
  
  const odds = bets.map(bet => bet.odds);
  return calculateParlayPayout(stake, odds);
}

/**
 * Check the status of a parlay by looking at all its legs
 */
export async function checkParlayStatus(supabase: SupabaseClient, parlayId: string): Promise<ParlayStatus | null> {
  try {
    
    // Get all legs of the parlay
    const { data: parlayLegs, error } = await supabase
      .from('bets')
      .select('*')
      .eq('parlay_id', parlayId)
      .eq('is_parlay', true);

    if (error || !parlayLegs || parlayLegs.length === 0) {
      console.error('Error fetching parlay legs:', error);
      return null;
    }

    // Count statuses
    const statusCounts = parlayLegs.reduce((acc, leg) => {
      acc[leg.status] = (acc[leg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalLegs = parlayLegs.length;
    const wonLegs = statusCounts.won || 0;
    const lostLegs = statusCounts.lost || 0;
    const pendingLegs = statusCounts.pending || 0;
    const voidLegs = statusCounts.void || 0;

    // Determine overall parlay status
    let parlayStatus: 'pending' | 'won' | 'lost' | 'void' = 'pending';
    
    if (lostLegs > 0) {
      // Any lost leg = parlay lost
      parlayStatus = 'lost';
    } else if (wonLegs === totalLegs) {
      // All legs won = parlay won
      parlayStatus = 'won';
    } else if (voidLegs > 0 && (wonLegs + voidLegs) === totalLegs) {
      // All legs either won or void = parlay void
      parlayStatus = 'void';
    } else {
      // Still have pending legs
      parlayStatus = 'pending';
    }

    // Get stake and payout from the first leg (which has the actual amounts)
    const firstLeg = parlayLegs.find(leg => leg.stake > 0);
    const totalStake = firstLeg?.stake || 0;
    const potentialPayout = firstLeg?.potential_payout || 0;

    return {
      parlayId,
      status: parlayStatus,
      totalLegs,
      wonLegs,
      lostLegs,
      pendingLegs,
      voidLegs,
      totalStake,
      potentialPayout
    };

  } catch (error) {
    console.error('Unexpected error in checkParlayStatus:', error);
    return null;
  }
}

/**
 * Main function to submit a bet (single or parlay)
 */
export async function submitBet(
  supabase: SupabaseClient,
  userId: string,
  bets: Bet[],
  stake: number
): Promise<BetSubmissionResult> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User must be logged in to place bets'
      };
    }

    if (bets.length === 0) {
      return {
        success: false,
        error: 'No bets to submit'
      };
    }

    if (bets.length === 1) {
      return await insertSingleBet(supabase, userId, bets[0], stake);
    } else {
      return await insertParlayBet(supabase, userId, bets, stake);
    }

  } catch (error) {
    console.error('Unexpected error in submitBet:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}