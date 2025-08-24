// ===========================================
// File 6: src/app/games/page.tsx
// ===========================================

'use client';

import DatePicker from '@/components/games/DatePicker';
import GamesList from '@/components/games/GamesList';
import { fetchAllGames } from '@/lib/odds/odds-api';
import { Game } from '@/lib/types/games';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function GamesPage() {
  const [games, setGames] = useState<Record<string, Game[]>>({});
  const [activeSport, setActiveSport] = useState('baseball_mlb');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGames = async (date: Date = selectedDate) => {
    setIsLoading(true);
    try {
      // Validate date before calling API
      if (!date || isNaN(date.getTime())) {
        throw new Error('Invalid date provided to fetchGames');
      }
      
      const gamesData = await fetchAllGames(date);
      setGames(gamesData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching games:', error);
      // Keep games empty on error - user will see "No games available" message
      setGames({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    fetchGames(date);
  };

  const collectAndRefreshData = async () => {
    setIsCollecting(true);
    try {
      console.log('🔄 Collecting fresh odds data...');
      
      // First, fetch fresh data from The Odds API (frontend call that works)
      console.log('🎯 Fetching games for date:', selectedDate);
      console.log('🏀 Active sport:', activeSport);
      
      const gamesData = await fetchAllGames(selectedDate);
      console.log('📊 All games data structure:', Object.keys(gamesData));
      console.log('📊 Games by sport:', Object.entries(gamesData).map(([sport, games]) => `${sport}: ${games.length}`));
      
      const currentSportGames = gamesData[activeSport] || [];
      console.log(`🎮 Games for ${activeSport}:`, currentSportGames.length);
      
      if (currentSportGames.length === 0) {
        console.log('⚠️ No games found for sport:', activeSport);
        console.log('⚠️ Available sports with games:', Object.entries(gamesData).filter(([_, games]) => games.length > 0));
        setGames(gamesData);
        setLastUpdated(new Date());
        return;
      }

      console.log(`📊 Found ${currentSportGames.length} games for ${activeSport}, sending to Supabase...`);
      console.log('🔍 Sample game data:', currentSportGames[0]);
      
      const requestPayload = {
        gamesData: currentSportGames,
        sportKey: activeSport
      };
      
      console.log('📤 Sending payload to API:', {
        gamesCount: requestPayload.gamesData.length,
        sportKey: requestPayload.sportKey,
        firstGame: requestPayload.gamesData[0]?.id || 'No games'
      });
      
      // Send the games data to our API for Supabase insertion
      const collectResponse = await fetch('/api/games/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const collectResult = await collectResponse.json();
      
      if (!collectResult.success) {
        throw new Error(collectResult.message || 'Failed to insert data into Supabase');
      }

      console.log('✅ Data collection completed:', collectResult);
      
      // Update the games display with the fresh data
      setGames(gamesData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Data collection failed:', error);
      // Still try to refresh the display even if collection failed
      await fetchGames();
    } finally {
      setIsCollecting(false);
    }
  };

  // Calculate game counts for tabs
  const gameCounts = Object.entries(games).reduce((acc, [sport, sportGames]) => {
    acc[sport] = sportGames.length;
    return acc;
  }, {} as Record<string, number>);

  // Get current sport games
  const currentGames = games[activeSport] || [];

  const formatDateHeader = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today\'s Games';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday\'s Games';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow\'s Games';
    } else {
      return `Games for ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    }
  };

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {formatDateHeader(selectedDate)}
              </h1>
              <p className="text-blue-100">
                Live odds and lines from top sportsbooks
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
              
              {lastUpdated && (
                <div className="hidden sm:block text-sm text-blue-200">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              
              <button
                onClick={collectAndRefreshData}
                disabled={isLoading || isCollecting}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                  ${(isLoading || isCollecting)
                    ? 'bg-white/20 text-white/60 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 hover:shadow-md'
                  }
                `}
              >
                <RefreshCw className={`w-4 h-4 ${(isLoading || isCollecting) ? 'animate-spin' : ''}`} />
                <span>
                  {isCollecting ? 'Collecting...' : isLoading ? 'Loading...' : 'Refresh & Collect'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Sports Tab Menu */}
        <EnhancedSportsTabMenu
          activeSport={activeSport}
          onSportChange={setActiveSport}
          gameCounts={gameCounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Games List */}
        <GamesList
          games={currentGames}
          sport={activeSport}
          isLoading={isLoading}
        />

        {/* API Usage Notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start">
            <div className="text-amber-700 text-sm">
              <strong>API Usage:</strong> This page uses The Odds API. Make sure to set your 
              <code className="mx-1 px-2 py-1 bg-amber-100 rounded font-mono text-xs">NEXT_PUBLIC_ODDS_API_KEY</code> 
              environment variable. Free tier includes 500 requests per month.
            </div>
          </div>
        </div>
      </div>
  );
}