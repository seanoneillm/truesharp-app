import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { submitBet, validateBetSubmission, BetSubmissionBet, BetSubmissionResult } from '../services/betSubmission';
import { calculateBetSlipPayout, OddsCalculation } from '../utils/oddsCalculation';

export interface BetSlipBet {
  id: string;
  gameId: string;
  sport: string;
  marketType: string;
  selection: string;
  odds: number;
  line?: number;
  sportsbook: string;
  description: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
}

interface BetSlipState {
  bets: BetSlipBet[];
  isCollapsed: boolean;
  parlayOdds: number | null;
  totalLegs: number;
  wagerAmount: number;
  isPlacingBet: boolean;
}

type BetSlipAction =
  | { type: 'ADD_BET'; payload: BetSlipBet }
  | { type: 'REMOVE_BET'; payload: string }
  | { type: 'CLEAR_ALL_BETS' }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'SET_WAGER_AMOUNT'; payload: number }
  | { type: 'SET_PLACING_BET'; payload: boolean };

const initialState: BetSlipState = {
  bets: [],
  isCollapsed: true,
  parlayOdds: null,
  totalLegs: 0,
  wagerAmount: 10, // Default $10 wager
  isPlacingBet: false,
};

// Helper function to convert American odds to decimal
const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  } else {
    return 100 / Math.abs(americanOdds) + 1;
  }
};

// Helper function to convert decimal odds back to American
const decimalToAmerican = (decimalOdds: number): number => {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
};

// Calculate parlay odds from multiple bets
const calculateParlayOdds = (bets: BetSlipBet[]): number | null => {
  if (bets.length < 2) return null;
  
  const decimalOdds = bets.map(bet => americanToDecimal(bet.odds));
  const parlayDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  return decimalToAmerican(parlayDecimal);
};

function betSlipReducer(state: BetSlipState, action: BetSlipAction): BetSlipState {
  switch (action.type) {
    case 'ADD_BET': {
      const newBets = [...state.bets, action.payload];
      return {
        ...state,
        bets: newBets,
        totalLegs: newBets.length,
        parlayOdds: calculateParlayOdds(newBets),
        isCollapsed: false, // Expand when bet is added
      };
    }
    case 'REMOVE_BET': {
      const newBets = state.bets.filter(bet => bet.id !== action.payload);
      return {
        ...state,
        bets: newBets,
        totalLegs: newBets.length,
        parlayOdds: calculateParlayOdds(newBets),
        isCollapsed: newBets.length === 0 ? true : state.isCollapsed,
      };
    }
    case 'CLEAR_ALL_BETS': {
      return {
        ...state,
        bets: [],
        totalLegs: 0,
        parlayOdds: null,
        isCollapsed: true,
      };
    }
    case 'TOGGLE_COLLAPSED': {
      return {
        ...state,
        isCollapsed: !state.isCollapsed,
      };
    }
    case 'SET_WAGER_AMOUNT': {
      return {
        ...state,
        wagerAmount: action.payload,
      };
    }
    case 'SET_PLACING_BET': {
      return {
        ...state,
        isPlacingBet: action.payload,
      };
    }
    default:
      return state;
  }
}

interface BetSlipContextType {
  bets: BetSlipBet[];
  isCollapsed: boolean;
  parlayOdds: number | null;
  totalLegs: number;
  wagerAmount: number;
  isPlacingBet: boolean;
  addBet: (bet: BetSlipBet) => { success: boolean; error?: string };
  removeBet: (betId: string) => void;
  clearAllBets: () => void;
  toggleCollapsed: () => void;
  setWagerAmount: (amount: number) => void;
  placeBet: () => Promise<BetSubmissionResult>;
  calculatePayout: () => OddsCalculation;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

interface BetSlipProviderProps {
  children: ReactNode;
}

export const BetSlipProvider: React.FC<BetSlipProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(betSlipReducer, initialState);

  const addBet = (bet: BetSlipBet) => {

    // Check if game is live or finished
    const gameTime = new Date(bet.gameTime);
    const now = new Date();
    const bufferTime = 10 * 60 * 1000; // 10 minutes buffer
    
    if (now.getTime() >= gameTime.getTime() + bufferTime) {
      return { success: false, error: 'Cannot bet on live or finished games' };
    }

    // Check for same game (no same-game parlays)
    const hasGameBet = state.bets.some(existingBet => existingBet.gameId === bet.gameId);
    if (hasGameBet) {
      return { success: false, error: 'Cannot add multiple bets from the same game' };
    }

    // Check for duplicate bet
    const hasDuplicateBet = state.bets.some(existingBet => 
      existingBet.gameId === bet.gameId && 
      existingBet.marketType === bet.marketType &&
      existingBet.selection === bet.selection
    );
    if (hasDuplicateBet) {
      return { success: false, error: 'This bet is already in your slip' };
    }

    // Check maximum bets (limit to 10)
    if (state.bets.length >= 10) {
      return { success: false, error: 'Maximum 10 bets allowed in bet slip' };
    }

    dispatch({ type: 'ADD_BET', payload: bet });
    return { success: true };
  };

  const removeBet = (betId: string) => {
    dispatch({ type: 'REMOVE_BET', payload: betId });
  };

  const clearAllBets = () => {
    dispatch({ type: 'CLEAR_ALL_BETS' });
  };

  const toggleCollapsed = () => {
    dispatch({ type: 'TOGGLE_COLLAPSED' });
  };

  const setWagerAmount = (amount: number) => {
    dispatch({ type: 'SET_WAGER_AMOUNT', payload: amount });
  };

  const calculatePayout = (): OddsCalculation => {
    const amount = state.wagerAmount || 10; // Default to 10 if undefined
    return calculateBetSlipPayout(amount, state.bets);
  };

  const placeBet = async (): Promise<BetSubmissionResult> => {
    // Set placing bet state
    dispatch({ type: 'SET_PLACING_BET', payload: true });

    try {
      // Validate before submission
      const validation = validateBetSubmission(state.bets, state.wagerAmount);
      if (!validation.isValid) {
        console.error('❌ Bet validation failed:', validation.error);
        return {
          success: false,
          error: validation.error
        };
      }

      // Convert BetSlipBet to BetSubmissionBet format
      const submissionBets: BetSubmissionBet[] = state.bets.map(bet => {
        return {
          id: bet.id,
          gameId: bet.gameId,
          sport: bet.sport || 'unknown', // Fallback to prevent empty sport
          homeTeam: bet.homeTeam,
          awayTeam: bet.awayTeam,
          gameTime: bet.gameTime,
          marketType: bet.marketType,
          selection: bet.selection,
          odds: bet.odds,
          line: bet.line,
          sportsbook: bet.sportsbook,
          description: bet.description,
        };
      });
      // Submit bet
      const result = await submitBet(submissionBets, state.wagerAmount);
      if (result.success) {
        // Clear bet slip on success
        setTimeout(() => {
          dispatch({ type: 'CLEAR_ALL_BETS' });
          dispatch({ type: 'SET_WAGER_AMOUNT', payload: 10 }); // Reset to default
        }, 2000); // Give user time to see success message
      } else {
        console.error('❌ iOS: Bet submission failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Error in placeBet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      // Reset placing bet state
      dispatch({ type: 'SET_PLACING_BET', payload: false });
    }
  };

  const contextValue: BetSlipContextType = {
    bets: state.bets,
    isCollapsed: state.isCollapsed,
    parlayOdds: state.parlayOdds,
    totalLegs: state.totalLegs,
    wagerAmount: state.wagerAmount,
    isPlacingBet: state.isPlacingBet,
    addBet,
    removeBet,
    clearAllBets,
    toggleCollapsed,
    setWagerAmount,
    placeBet,
    calculatePayout,
  };

  return (
    <BetSlipContext.Provider value={contextValue}>
      {children}
    </BetSlipContext.Provider>
  );
};

export const useBetSlip = (): BetSlipContextType => {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};