// Client-side service for betting API calls
import type { BetSlipBet } from '@/contexts/BetSlipContext';
import type { BetSubmissionResult } from '@/lib/services/betting/types';

export interface SubmitBetRequest {
  bets: BetSlipBet[];
  stake: number;
}

/**
 * Submit bets to the backend
 */
export async function submitBets(bets: BetSlipBet[], stake: number): Promise<BetSubmissionResult> {
  try {
    console.log('🚀 Submitting bets to API:', { bets, stake });
    
    const response = await fetch('/api/bets/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bets,
        stake
      }),
    });

    const result = await response.json();
    
    console.log('📨 API Response:', { 
      status: response.status, 
      ok: response.ok, 
      result 
    });

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to submit bet'
      };
    }

    return result;

  } catch (error) {
    console.error('Error submitting bet:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.'
    };
  }
}

/**
 * Check parlay status
 */
export async function checkParlayStatus(parlayId: string) {
  try {
    const response = await fetch(`/api/bets/parlay/${parlayId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to check parlay status');
    }

    return await response.json();

  } catch (error) {
    console.error('Error checking parlay status:', error);
    throw error;
  }
}