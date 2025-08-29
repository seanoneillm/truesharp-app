'use client';

import { TrueSharpShield } from '@/components/ui/truesharp-shield';
import { BetSlipBet, useBetSlip } from '@/contexts/BetSlipContext';
import { formatOdds } from '@/lib/formatters';
import { useAuth } from '@/lib/hooks/use-auth';
import { ChevronDown, ChevronUp, DollarSign, ShoppingCart, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function BetSlip() {
  const { 
    bets, 
    isCollapsed, 
    removeBet, 
    clearAllBets, 
    toggleCollapsed, 
    parlayOdds, 
    totalLegs 
  } = useBetSlip();

  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number>(10); // Default $10 wager
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Helper function to convert American odds to decimal for payout calculations
  const americanToDecimal = (americanOdds: number): number => {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    } else {
      return (100 / Math.abs(americanOdds)) + 1;
    }
  };

  // Calculate potential payout for single bet or parlay
  const calculatePayout = (): number => {
    if (totalLegs === 0) return 0;
    
    if (totalLegs === 1 && bets[0]) {
      // Single bet payout
      const decimalOdds = americanToDecimal(bets[0].odds);
      return wagerAmount * decimalOdds;
    } else if (parlayOdds) {
      // Parlay payout
      const decimalOdds = americanToDecimal(parlayOdds);
      return wagerAmount * decimalOdds;
    }
    
    return 0;
  };

  // Calculate profit (payout minus wager)
  const calculateProfit = (): number => {
    return calculatePayout() - wagerAmount;
  };

  // Handle wager amount input
  const handleWagerChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setWagerAmount(numValue);
    }
  };

  // Handle place bet
  const handlePlaceBet = async () => {
    if (wagerAmount < 1) {
      showError('Minimum wager is $1');
      return;
    }
    
    if (wagerAmount > 10000) {
      showError('Maximum wager is $10,000');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      showError('Please log in to place bets');
      return;
    }

    setIsPlacingBet(true);
    
    try {
      // Ensure we have a fresh session before making the API call
      console.log('🔄 Checking and refreshing session before bet submission...');
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      
      // Get current session and refresh if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      let validSession = session;
      
      if (sessionError || !session) {
        console.log('❌ No valid session, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          showError('Session expired. Please refresh the page and try again.');
          return;
        }
        
        validSession = refreshedSession;
        console.log('✅ Session refreshed successfully');
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log('✅ Valid session found');
      }

      // Ensure we have a valid user ID
      if (!validSession?.user?.id) {
        showError('Unable to authenticate user. Please log in again.');
        return;
      }

      // Submit bet using our backend API with user ID for fallback auth
      console.log('📤 Making bet submission request...');
      const result = await fetch('/api/bets/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bets,
          stake: wagerAmount,
          userId: validSession.user.id // Include user ID for server-side fallback
        })
      });

      const data = await result.json();
      
      if (data.success) {
        showSuccess(data.message || 'Bet placed successfully!');
        setTimeout(() => {
          clearAllBets();
          setWagerAmount(10);
        }, 2000);
      } else {
        showError(data.error || 'Failed to place bet');
      }
      
    } catch (error) {
      console.error('Error submitting bet:', error);
      showError('Failed to place bet. Please try again.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Clear error message after 3 seconds
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Helper function to extract player name from oddid (same logic as universal-game-card)
  const getPlayerName = (oddid: string): string => {
    // New format: batting_stolenBases-FIRST_LAST_1_MLB-game-ou-over
    const nameMatch = oddid.match(/-([A-Z_]+_[A-Z_]+)_1_[A-Z]+-game/);
    if (nameMatch && nameMatch[1]) {
      // Convert TYLER_FREEMAN to Tyler Freeman
      const playerName = nameMatch[1]
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
      return playerName;
    }
    return 'Player';
  };

  // Helper function to get prop display name from oddid
  const getPropDisplayName = (oddid: string): string => {
    const lowerOddid = oddid.toLowerCase();
    
    // Baseball props
    if (lowerOddid.includes('batting_hits')) return 'Hits';
    if (lowerOddid.includes('batting_homeruns') || lowerOddid.includes('batting_homerun')) return 'Home Runs';
    if (lowerOddid.includes('batting_rbi')) return 'RBIs';
    if (lowerOddid.includes('batting_runs')) return 'Runs';
    if (lowerOddid.includes('batting_totalbases')) return 'Total Bases';
    if (lowerOddid.includes('batting_strikeouts')) return 'Strikeouts';
    if (lowerOddid.includes('pitching_strikeouts')) return 'Strikeouts';
    if (lowerOddid.includes('pitching_hits')) return 'Hits Allowed';
    
    // Football props
    if (lowerOddid.includes('passing_yards')) return 'Passing Yards';
    if (lowerOddid.includes('rushing_yards')) return 'Rushing Yards';
    if (lowerOddid.includes('receiving_yards')) return 'Receiving Yards';
    if (lowerOddid.includes('passing_touchdowns')) return 'Passing TDs';
    if (lowerOddid.includes('rushing_touchdowns')) return 'Rushing TDs';
    if (lowerOddid.includes('receiving_touchdowns')) return 'Receiving TDs';
    
    // Basketball props
    if (lowerOddid.includes('points') && !lowerOddid.includes('team')) return 'Points';
    if (lowerOddid.includes('rebounds')) return 'Rebounds';
    if (lowerOddid.includes('assists')) return 'Assists';
    
    // Hockey props
    if (lowerOddid.includes('goals')) return 'Goals';
    if (lowerOddid.includes('saves')) return 'Saves';
    
    return 'Prop';
  };

  // Parse bet information for better display
  const parseBetInfo = (bet: BetSlipBet) => {
    const isPlayerProp = bet.marketType.match(/-[A-Z_]+_1_[A-Z]+-game/) || bet.marketType.match(/\d{4,}/);
    const isMainLine = bet.marketType.includes('points-home-game-ml') || 
                      bet.marketType.includes('points-away-game-ml') ||
                      bet.marketType.includes('points-home-game-sp') ||
                      bet.marketType.includes('points-away-game-sp') ||
                      bet.marketType.includes('points-all-game-ou');
    
    let playerOrTeam = '';
    let marketDisplay = '';
    let selectionDisplay = bet.selection;
    
    if (isPlayerProp) {
      playerOrTeam = getPlayerName(bet.marketType);
      marketDisplay = getPropDisplayName(bet.marketType);
      // For over/under, show Over/Under instead of just the selection
      if (bet.marketType.includes('-ou-over')) {
        selectionDisplay = 'Over';
      } else if (bet.marketType.includes('-ou-under')) {
        selectionDisplay = 'Under';
      }
    } else if (isMainLine) {
      // For main lines, use team names
      playerOrTeam = bet.selection;
      if (bet.marketType.includes('-ml-')) {
        marketDisplay = 'Moneyline';
      } else if (bet.marketType.includes('-sp-')) {
        marketDisplay = 'Spread';
      } else if (bet.marketType.includes('-ou-')) {
        marketDisplay = 'Total';
        selectionDisplay = bet.marketType.includes('over') ? 'Over' : 'Under';
      }
    } else {
      // Fallback for other bet types
      playerOrTeam = bet.selection;
      marketDisplay = bet.marketType;
    }
    
    return {
      playerOrTeam,
      marketDisplay,
      selectionDisplay,
      isPlayerProp,
      isMainLine
    };
  };

  // Don't render if no bets
  if (totalLegs === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Error Toast */}
      {errorMessage && (
        <div className="absolute bottom-full right-0 mb-2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2">
          {errorMessage}
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="absolute bottom-full right-0 mb-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2">
          {successMessage}
        </div>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <button
          onClick={toggleCollapsed}
          className="bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-3 group"
        >
          <TrueSharpShield className="w-6 h-6" variant="light" />
          <span className="font-semibold">Bet Slip ({totalLegs})</span>
          <ChevronUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-96 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrueSharpShield className="w-8 h-8" variant="light" />
                <div>
                  <h3 className="font-bold text-lg">TrueSharp</h3>
                  <p className="text-blue-100 text-xs">Bet Slip</p>
                </div>
              </div>
              <button
                onClick={toggleCollapsed}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bets List */}
          <div className="flex-1 overflow-y-auto max-h-80">
            {bets.map((bet) => {
              const betInfo = parseBetInfo(bet);
              return (
                <div
                  key={bet.id}
                  className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Game Info */}
                      <div className="text-xs text-slate-500 font-medium mb-2">
                        {bet.awayTeam} @ {bet.homeTeam}
                      </div>
                      
                      {/* Player/Team Name */}
                      <div className="text-sm font-semibold mb-1">
                        {betInfo.isPlayerProp ? (
                          <span className="text-blue-700 font-bold">{betInfo.playerOrTeam}</span>
                        ) : (
                          <span className="text-slate-900 font-bold">{betInfo.playerOrTeam}</span>
                        )}
                      </div>
                      
                      {/* Market Info */}
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{betInfo.marketDisplay}</span>
                        {betInfo.selectionDisplay && betInfo.selectionDisplay !== betInfo.playerOrTeam && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-600">{betInfo.selectionDisplay}</span>
                          </>
                        )}
                        {bet.line && (
                          <>
                            <span>•</span>
                            <span>Line: <span className="font-mono font-semibold">{bet.line}</span></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-xs text-slate-400">{bet.sportsbook}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-3">
                      {/* Odds */}
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-mono font-bold text-sm">
                        {formatOdds(bet.odds)}
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeBet(bet.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-200">
            {/* Wager Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wager Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={wagerAmount}
                  onChange={(e) => handleWagerChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                <span>Min: $1</span>
                <span>Max: $10,000</span>
              </div>
            </div>

            {/* Potential Payout Display */}
            {wagerAmount > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-700 font-medium text-sm">Potential Payout</span>
                  <span className="text-green-800 font-bold text-lg">
                    ${calculatePayout().toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-green-600">
                  <span>Profit: ${calculateProfit().toFixed(2)}</span>
                  {totalLegs > 1 && parlayOdds && (
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded font-mono">
                      {formatOdds(parlayOdds)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Parlay Odds (when no wager entered) */}
            {wagerAmount === 0 && parlayOdds && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-semibold text-sm">
                    {totalLegs}-Leg Parlay
                  </span>
                  <span className="bg-green-600 text-white px-2 py-1 rounded font-mono font-bold text-sm">
                    {formatOdds(parlayOdds)}
                  </span>
                </div>
              </div>
            )}

            {/* Single Bet Display (when no wager entered) */}
            {wagerAmount === 0 && totalLegs === 1 && (
              <div className="mb-3 text-center text-slate-600 text-sm">
                Single Bet - {formatOdds(bets[0]?.odds || 0)}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={clearAllBets}
                className="flex-1 bg-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
              
              <button
                onClick={handlePlaceBet}
                disabled={wagerAmount < 1 || isPlacingBet || !user}
                className={`
                  flex-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center space-x-1
                  ${wagerAmount >= 1 && !isPlacingBet && user
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {!user ? 'Login Required' :
                   isPlacingBet ? 'Placing...' : 
                   `Place Bet ${wagerAmount >= 1 ? `($${wagerAmount.toFixed(2)})` : ''}`}
                </span>
              </button>
            </div>

            {/* Bet Count */}
            <div className="text-center text-xs text-slate-500 mt-2">
              {totalLegs}/10 legs
            </div>
          </div>
        </div>
      )}
    </div>
  );
}