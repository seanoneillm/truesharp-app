'use client'

import BetSlip from '@/components/bet-slip/BetSlip'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import DateSelector from '@/components/games/date-selector'
import EnhancedGamesList from '@/components/games/enhanced-games-list'
import LeagueTabs, { LeagueType } from '@/components/games/league-tabs'
import { BetSlipProvider } from '@/contexts/BetSlipContext'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { useBetSlipToast } from '@/lib/hooks/use-bet-slip-toast'
import { gamesDataService } from '@/lib/services/games-data'
import { Game } from '@/lib/types/games'
import { convertDatabaseGamesToGames } from '@/lib/utils/database-to-game-converter'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

function GamesPageContent() {
  console.log('🚀 GAMES PAGE RENDERING!!!');
  
  const [games, setGames] = useState<Record<string, Game[]>>({});
  const [activeLeague, setActiveLeague] = useState<LeagueType>('MLB');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Toast notifications for bet slip actions
  const { ToastContainer } = useBetSlipToast();

  // Initialize date safely after hydration
  useEffect(() => {
    // Set to today's date on mount
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    console.log('🎯 Setting initial date to today:', today.toISOString().split('T')[0]);
    setSelectedDate(today);
  }, []);

  const loadGamesForDate = useCallback(async (date: Date) => {
    setIsLoading(true);
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      if (!dateStr) {
        throw new Error('Invalid date format');
      }
      
      console.log('🎯 Loading games for date:', dateStr);
      console.log('🎯 Date object:', date);
      
      // Fetch games for all supported leagues
      const allLeagues = ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB'];
      const gamesPromises = allLeagues.map(async (league) => {
        try {
          console.log(`🔍 Fetching ${league} games for ${dateStr}`);
          const leagueGames = await gamesDataService.getGamesForLeagueAndDate(league, dateStr);
          console.log(`📊 ${league} games result:`, leagueGames.length);
          return { league, games: leagueGames };
        } catch (error) {
          console.warn(`⚠️ Failed to load ${league} games:`, error);
          return { league, games: [] };
        }
      });
      
      const leagueResults = await Promise.all(gamesPromises);
      
      // Convert database games to frontend format and organize by sport
      const newGames: Record<string, Game[]> = {};
      let totalGames = 0;
      
      for (const { league, games: leagueGames } of leagueResults) {
        if (leagueGames.length > 0) {
          const convertedGames = convertDatabaseGamesToGames(leagueGames);
          const sportKey = getSportKey(league as LeagueType);
          newGames[sportKey] = convertedGames;
          totalGames += convertedGames.length;
          console.log(`✅ Loaded ${convertedGames.length} ${league} games`);
        }
      }
      
      // Fill in empty arrays for leagues with no games
      const allSportKeys = [
        'baseball_mlb', 'basketball_nba', 'americanfootball_nfl', 
        'soccer_usa_mls', 'icehockey_nhl', 'americanfootball_ncaaf', 
        'basketball_ncaab', 'soccer_uefa_champs_league'
      ];
      
      for (const sportKey of allSportKeys) {
        if (!newGames[sportKey]) {
          newGames[sportKey] = [];
        }
      }
      
      setGames(newGames);
      
      if (totalGames > 0) {
        console.log(`✅ Total games loaded: ${totalGames}`);
      } else {
        console.log('⚠️ No games found for this date across all leagues');
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error loading games:', error);
      // Reset to empty state
      const emptyGames: Record<string, Game[]> = {
        'baseball_mlb': [],
        'basketball_nba': [],
        'americanfootball_nfl': [],
        'soccer_usa_mls': [],
        'icehockey_nhl': [],
        'americanfootball_ncaaf': [],
        'basketball_ncaab': [],
        'soccer_uefa_champs_league': []
      };
      setGames(emptyGames);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load today's games on initial mount
  useEffect(() => {
    const loadInitialGames = async () => {
      try {
        console.log('🚀 loadInitialGames triggered, selectedDate:', selectedDate);
        if (selectedDate) {
          console.log('🚀 About to call loadGamesForDate with:', selectedDate);
          await loadGamesForDate(selectedDate);
          console.log('🚀 loadGamesForDate completed');
        }
      } catch (error) {
        console.error('❌ Error in loadInitialGames:', error);
      }
    };
    
    // Only load if we have a selected date
    if (selectedDate) {
      console.log('🚀 selectedDate available, calling loadInitialGames');
      loadInitialGames();
    } else {
      console.log('🚀 selectedDate not available yet');
    }
  }, [selectedDate, loadGamesForDate]);

  const handleDateChange = (date: Date) => {
    // Normalize the date to start of day for consistency
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    setSelectedDate(normalizedDate);
    loadGamesForDate(normalizedDate);
  };

  // Retry mechanism with exponential backoff
  const handleManualFetchWithRetry = async (currentRetryCount = 0) => {
    const maxRetries = 2;
    const baseDelay = 2000; // 2 seconds
    
    if (!selectedDate) return;
    
    setIsFetching(true);
    setRetryCount(currentRetryCount);
    
    try {
      const response = await fetch('/api/fetch-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: 'ALL', // Fetch all sports
          date: selectedDate.toISOString().split('T')[0]
        })
      });
      
      // Check if the request failed due to network/server issues
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - offer retry option
          const shouldRetry = currentRetryCount < maxRetries && confirm(
            `⏱️ Rate limited by the odds API. Would you like to automatically retry in ${Math.pow(2, currentRetryCount + 1)} seconds? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
          );
          
          if (shouldRetry) {
            const delay = baseDelay * Math.pow(2, currentRetryCount); // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            setTimeout(() => {
              handleManualFetchWithRetry(currentRetryCount + 1);
            }, delay);
            return;
          } else {
            alert('⏱️ Rate limited by the odds API. Please wait 5-10 minutes before trying again manually.');
            console.warn('⚠️ Rate limited by odds API - user declined retry');
            return;
          }
        } else if (response.status >= 500) {
          // Server error - offer retry for server errors
          if (currentRetryCount < maxRetries) {
            const shouldRetry = confirm(
              `🚨 Server error occurred. Would you like to retry? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
            );
            if (shouldRetry) {
              setTimeout(() => {
                handleManualFetchWithRetry(currentRetryCount + 1);
              }, baseDelay);
              return;
            }
          }
          alert('🚨 Server error occurred. Please try again later.');
          console.error('❌ Server error:', response.status, response.statusText);
          return;
        } else {
          // Other HTTP error
          alert(`❌ Request failed: ${response.status} ${response.statusText}`);
          console.error('❌ HTTP error:', response.status, response.statusText);
          return;
        }
      }
      
      const result = await response.json();
      
      if (result.success || (result.successfulRequests && result.successfulRequests > 0)) {
        console.log('✅ Manual odds fetch completed:', result);
        
        // Show detailed success message
        const successMsg = result.message || `Successfully fetched ${result.totalGames || 0} games from ${result.successfulRequests || 0}/${result.totalRequests || 0} API requests`;
        alert(`✅ ${successMsg}`);
        
        // Reset retry count on success
        setRetryCount(0);
        
        // Refresh the games data after fetching new odds
        await loadGamesForDate(selectedDate);
      } else {
        console.error('❌ Manual fetch failed:', result);
        if (result.message?.includes('rate limit')) {
          // Handle rate limiting in response
          const shouldRetry = currentRetryCount < maxRetries && confirm(
            `⏱️ ${result.message} Would you like to automatically retry in ${Math.pow(2, currentRetryCount + 1)} seconds?`
          );
          
          if (shouldRetry) {
            const delay = baseDelay * Math.pow(2, currentRetryCount);
            setTimeout(() => {
              handleManualFetchWithRetry(currentRetryCount + 1);
            }, delay);
            return;
          }
        }
        
        alert(`❌ ${result.message || result.error || 'Fetch failed'}`);
      }
    } catch (error) {
      console.error('❌ Error during manual fetch:', error);
      
      // Handle different types of errors with retry option
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const shouldRetry = currentRetryCount < maxRetries && confirm(
          `🌐 Network error: Unable to connect to the server. Would you like to retry? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
        );
        
        if (shouldRetry) {
          setTimeout(() => {
            handleManualFetchWithRetry(currentRetryCount + 1);
          }, baseDelay);
          return;
        }
        
        alert('🌐 Network error: Unable to connect to the server. Please check your connection and try again.');
      } else if (error instanceof Error) {
        alert(`❌ Error: ${error.message}`);
      } else {
        alert('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      if (currentRetryCount === 0) {
        setIsFetching(false);
        setRetryCount(0);
      }
    }
  };

  // Wrapper function for backward compatibility
  const handleManualFetch = () => handleManualFetchWithRetry(0);


  // Map league to sport key helper function
  const getSportKey = (league: LeagueType): string => {
    const sportKeyMap: Record<LeagueType, string> = {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba',
      'MLB': 'baseball_mlb',
      'NHL': 'icehockey_nhl',
      'NCAAF': 'americanfootball_ncaaf',
      'NCAAB': 'basketball_ncaab',
      'Champions League': 'soccer_uefa_champs_league',
      'MLS': 'soccer_usa_mls'
    };
    return sportKeyMap[league];
  };

  // Get current sport games
  const activeSportKey = getSportKey(activeLeague);
  const currentGames = games[activeSportKey] || [];

  // Available leagues with games (dynamic based on data)
  const availableLeagues: LeagueType[] = ['MLB', 'NFL', 'NBA', 'NHL', 'NCAAF', 'NCAAB', 'Champions League', 'MLS'];


  const formatDateHeader = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Normalize the input date for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (normalizedDate.getTime() === today.getTime()) {
      return 'Today\'s Games';
    } else if (normalizedDate.getTime() === yesterday.getTime()) {
      return 'Yesterday\'s Games';
    } else if (normalizedDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow\'s Games';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }) + ' Games';
    }
  };

  // Calculate game counts for tabs
  const gameCounts = Object.entries(games).reduce((acc, [sport, sportGames]) => {
    acc[sport] = sportGames.length;
    return acc;
  }, {} as Record<string, number>);

  // Season detection helpers (including preseason and playoffs)
  const isInSeason = (league: LeagueType): boolean => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    const seasonMap: Record<LeagueType, number[]> = {
      'MLB': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // February-November (spring training + playoffs)
      'NBA': [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], // September-July (preseason + playoffs)
      'NFL': [7, 8, 9, 10, 11, 12, 1, 2, 3], // July-March (preseason + playoffs)
      'NHL': [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], // September-July (preseason + playoffs)
      'NCAAF': [7, 8, 9, 10, 11, 12, 1, 2], // July-February (preseason + bowl games/playoffs)
      'NCAAB': [10, 11, 12, 1, 2, 3, 4, 5], // October-May (preseason + March Madness)
      'MLS': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round (preseason + MLS Cup)
      'Champions League': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7] // August-July (qualifiers + final)
    };
    
    return seasonMap[league]?.includes(month) ?? false;
  };

  const getSeasonMessage = (league: LeagueType, date: Date | null): string => {
    const inSeason = isInSeason(league);
    const dateStr = date ? formatDateHeader(date).toLowerCase() : 'this date';
    
    if (inSeason) {
      return `No ${league} games scheduled for ${dateStr}. Games may be scheduled for other dates.`;
    }
    
    const seasonInfo: Record<LeagueType, string> = {
      'NFL': 'NFL season runs July-March (preseason through playoffs)',
      'NBA': 'NBA season runs September-July (preseason through playoffs)', 
      'NHL': 'NHL season runs September-July (preseason through playoffs)',
      'NCAAF': 'College Football season runs July-February (preseason through bowl games)',
      'NCAAB': 'College Basketball season runs October-May (preseason through March Madness)',
      'MLB': 'MLB season runs February-November (spring training through World Series)',
      'MLS': 'MLS season runs year-round (preseason through MLS Cup)',
      'Champions League': 'Champions League runs August-July (qualifiers through final)'
    };
    
    return `${league} is currently off-season. ${seasonInfo[league]}.`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Clean Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {selectedDate ? formatDateHeader(selectedDate) : 'Loading...'}
              </h1>
              <p className="text-blue-100 text-sm">
                Live odds and betting markets
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <div className="flex items-center space-x-1 text-sm text-blue-200">
                  <Clock className="w-4 h-4" />
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
              
              <button
                onClick={handleManualFetch}
                disabled={isLoading || isFetching}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                  ${(isLoading || isFetching)
                    ? 'bg-white/20 text-white/60 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                  }
                `}
              >
                <RefreshCw className={`w-4 h-4 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
                <span>
                  {isFetching ? 
                    (retryCount > 0 ? `Retrying... (${retryCount}/2)` : 'Fetching...') : 
                    isLoading ? 'Loading...' : 'Fetch Odds'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* League Tabs */}
        <LeagueTabs
          activeLeague={activeLeague}
          onLeagueChange={setActiveLeague}
          availableLeagues={availableLeagues}
          gameCounts={gameCounts}
          seasonStatus={availableLeagues.reduce((acc, league) => {
            acc[league] = isInSeason(league);
            return acc;
          }, {} as Record<LeagueType, boolean>)}
        />

        {/* Games List */}
        <EnhancedGamesList
          games={currentGames}
          sport={activeSportKey}
          isLoading={isLoading}
          marketFilter="all"
          sortBy="time"
        />

        {/* Empty State */}
        {!isLoading && currentGames.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Calendar className="w-16 h-16 text-slate-300" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  No {activeLeague} Games Available
                </h3>
                <p className="text-slate-600 mb-4">
                  {getSeasonMessage(activeLeague, selectedDate)}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={handleManualFetch}
                    disabled={isLoading || isFetching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isFetching ? 
                      (retryCount > 0 ? `Retrying... (${retryCount}/2)` : 'Fetching...') : 
                      'Check for Games'}
                  </button>
                  {!isInSeason(activeLeague) && (
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      💡 Try MLB or MLS for current games
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bet Slip */}
        <BetSlip />
        
        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </DashboardLayout>
  );
}

export default function GamesPage() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <GamesPageContent />
      </BetSlipProvider>
    </AuthProvider>
  );
}