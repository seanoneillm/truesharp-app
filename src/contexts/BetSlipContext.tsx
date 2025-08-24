'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Bet slip types
export interface BetSlipBet {
  id: string;
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  marketType: string;
  selection: string;
  odds: number; // American odds
  line?: number;
  sportsbook: string;
  description: string;
}

interface BetSlipContextType {
  bets: BetSlipBet[];
  isCollapsed: boolean;
  addBet: (bet: BetSlipBet) => { success: boolean; error?: string };
  removeBet: (betId: string) => void;
  clearAllBets: () => void;
  toggleCollapsed: () => void;
  parlayOdds: number | null;
  totalLegs: number;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

// Convert American odds to decimal for calculations
const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
};

// Convert decimal odds back to American
const decimalToAmerican = (decimalOdds: number): number => {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
};

// Calculate parlay odds
const calculateParlayOdds = (bets: BetSlipBet[]): number | null => {
  if (bets.length < 2) return null;
  
  const decimalOdds = bets.map(bet => americanToDecimal(bet.odds));
  const parlayDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  
  return decimalToAmerican(parlayDecimal);
};

export const BetSlipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bets, setBets] = useState<BetSlipBet[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const addBet = (bet: BetSlipBet): { success: boolean; error?: string } => {
    // Check if game is live or finished
    const gameTime = new Date(bet.gameTime);
    const now = new Date();
    if (now >= gameTime) {
      return { success: false, error: 'Cannot bet on live or finished games' };
    }

    // Check maximum legs
    if (bets.length >= 10) {
      return { success: false, error: 'Maximum 10 legs allowed in bet slip' };
    }

    // Check for same game (no same-game parlays)
    const hasGameBet = bets.some(existingBet => existingBet.gameId === bet.gameId);
    if (hasGameBet) {
      return { success: false, error: 'Cannot add multiple bets from the same game' };
    }

    // Check for duplicate bet
    const isDuplicate = bets.some(existingBet => existingBet.id === bet.id);
    if (isDuplicate) {
      return { success: false, error: 'Bet already in slip' };
    }

    setBets(prev => [...prev, bet]);
    
    // Auto-expand bet slip when first bet is added
    if (bets.length === 0) {
      setIsCollapsed(false);
    }
    
    return { success: true };
  };

  const removeBet = (betId: string) => {
    setBets(prev => prev.filter(bet => bet.id !== betId));
  };

  const clearAllBets = () => {
    setBets([]);
  };

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  const parlayOdds = calculateParlayOdds(bets);
  const totalLegs = bets.length;

  const value: BetSlipContextType = {
    bets,
    isCollapsed,
    addBet,
    removeBet,
    clearAllBets,
    toggleCollapsed,
    parlayOdds,
    totalLegs,
  };

  return (
    <BetSlipContext.Provider value={value}>
      {children}
    </BetSlipContext.Provider>
  );
};

export const useBetSlip = (): BetSlipContextType => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};