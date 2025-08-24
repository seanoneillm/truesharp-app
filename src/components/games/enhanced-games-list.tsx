'use client';

import { Game } from '@/lib/types/games';
import { TrendingUp } from 'lucide-react';
import SimpleOddsCard from './simple-odds-card';
import UniversalGameCard from './universal-game-card';

interface EnhancedGamesListProps {
  games: Game[];
  sport: string;
  isLoading: boolean;
  marketFilter?: 'all' | 'main' | 'props' | 'futures';
  sortBy?: 'time' | 'popularity' | 'value';
  useSimpleCard?: boolean;
}

export default function EnhancedGamesList({ 
  games, 
  sport, 
  isLoading, 
  marketFilter = 'all', 
  sortBy = 'time',
  useSimpleCard = false
}: EnhancedGamesListProps) {
  
  // Sort games based on sortBy parameter
  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime();
      case 'popularity':
        return b.bookmakers.length - a.bookmakers.length;
      case 'value':
        return Math.random() - 0.5; // Random for demo
      default:
        return 0;
    }
  });

  const getSportDisplayName = (sport: string): string => {
    switch (sport) {
      case 'americanfootball_nfl': return 'NFL';
      case 'basketball_nba': return 'NBA';
      case 'baseball_mlb': return 'MLB';
      case 'icehockey_nhl': return 'NHL';
      case 'americanfootball_ncaaf': return 'NCAAF';
      case 'basketball_ncaab': return 'NCAAB';
      case 'soccer_uefa_champs_league': return 'Champions League';
      case 'soccer_usa_mls': return 'MLS';
      default: return sport.replace('_', ' ').toUpperCase();
    }
  };

  const renderGameCard = (game: Game) => {
    // Use simple card if requested (for debugging/testing)
    if (useSimpleCard) {
      return (
        <SimpleOddsCard
          key={game.id}
          game={game}
          />
      );
    }

    // Use universal game card by default
    const leagueDisplayName = getSportDisplayName(sport);
    return (
      <UniversalGameCard
        key={game.id}
        game={game}
        league={leagueDisplayName}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-slate-200 rounded w-16 animate-pulse"></div>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="animate-pulse">
              {/* Compact Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                    <div className="h-3 bg-slate-200 rounded w-8"></div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-28"></div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-8 bg-slate-200 rounded"></div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedGames.length === 0) {
    // Create a mock game object to show UniversalGameCard with tab structure
    const mockGame: Game = {
      id: 'mock-game-' + Date.now(),
      sport_key: sport,
      sport_title: getSportDisplayName(sport),
      commence_time: new Date().toISOString(),
      home_team: 'Home Team',
      away_team: 'Away Team',
      bookmakers: []
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {getSportDisplayName(sport)} (0)
            </h2>
            <p className="text-xs text-slate-500">
              No games scheduled • Preview available markets
            </p>
          </div>
        </div>
        
        {/* Blank UniversalGameCard to show available markets */}
        <UniversalGameCard
          game={mockGame}
          league={getSportDisplayName(sport)}
            />
        
        <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            No {getSportDisplayName(sport)} games scheduled for this date.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            The tab structure above shows the betting markets that will be available when games are scheduled.
          </p>
        </div>
      </div>
    );
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'time': return 'by game time';
      case 'popularity': return 'by popularity';
      case 'value': return 'by best value';
      default: return '';
    }
  };

  const getFilterLabel = () => {
    switch (marketFilter) {
      case 'main': return 'Main Lines';
      case 'props': return 'Player Props';
      case 'futures': return 'Futures';
      default: return 'All Markets';
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Games Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {getSportDisplayName(sport)} ({sortedGames.length})
          </h2>
          <p className="text-xs text-slate-500">
            {getFilterLabel()} • {getSortLabel()}
          </p>
        </div>
        
        <div className="text-xs text-slate-500">
          Live odds
        </div>
      </div>

      {/* Condensed Games Grid */}
      <div className="space-y-3">
        {sortedGames.map((game) => renderGameCard(game))}
      </div>

      {/* Compact Footer Stats */}
      {sortedGames.length > 0 && (
        <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-4">
              <span>{sortedGames.length} games</span>
              <span>{Math.max(...sortedGames.map(g => g.bookmakers.length))} books</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span className="text-blue-600 font-medium">Live</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}