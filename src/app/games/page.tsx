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

    const handleManualFetch = async () => {
    if (!selectedDate) return;
    
    setIsFetching(true);
    
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
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Manual odds fetch completed:', result);
        // Refresh the games data after fetching new odds
        await loadGamesForDate(selectedDate);
      } else {
        console.error('❌ Manual fetch failed:', result);
      }
    } catch (error) {
      console.error('❌ Error during manual fetch:', error);
    } finally {
      setIsFetching(false);
    }
  };


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
                  {isFetching ? 'Fetching...' : isLoading ? 'Loading...' : 'Fetch Odds'}
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
                  No {activeLeague} Games Today
                </h3>
                <p className="text-slate-600 mb-4">
                  There are no {activeLeague} games scheduled for {selectedDate ? formatDateHeader(selectedDate).toLowerCase() : 'today'}.
                </p>
                <button
                  onClick={handleManualFetch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fetch Latest Odds
                </button>
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