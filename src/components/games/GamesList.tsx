'use client';

import { Game } from '@/lib/types/games';
import { Clock, TrendingUp, Users } from 'lucide-react';
import CompactGameCard from './CompactGameCard';

interface GamesListProps {
  games: Game[];
  sport: string;
  isLoading: boolean;
  marketFilter?: 'all' | 'main' | 'props' | 'futures';
  sortBy?: 'time' | 'popularity' | 'value';
}

export default function GamesList({ games, sport, isLoading, marketFilter = 'all', sortBy = 'time' }: GamesListProps) {
  
  // Sort games based on sortBy parameter
  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime();
      case 'popularity':
        // Mock popularity based on number of bookmakers
        return b.bookmakers.length - a.bookmakers.length;
      case 'value':
        // Mock value calculation - could be based on best odds
        return Math.random() - 0.5; // Random for demo
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
        </div>
        
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded w-48"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-6"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedGames.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Games Available</h3>
            <p className="text-slate-600">
              No {sport.replace('_', ' ').toUpperCase()} games found for the selected date.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Try a different sport</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Or select another date</span>
            </div>
          </div>
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
      {/* Games Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {sortedGames.length} {sortedGames.length === 1 ? 'Game' : 'Games'}
          </h2>
          <p className="text-sm text-slate-600">
            Showing {getFilterLabel()} • Sorted {getSortLabel()}
          </p>
        </div>
        
        <div className="text-sm text-slate-500">
          Updated every 5 minutes
        </div>
      </div>

      {/* Games Grid */}
      <div className="space-y-3">
        {sortedGames.map((game) => (
          <CompactGameCard
            key={game.id}
            game={game}
            marketFilter={marketFilter}
          />
        ))}
      </div>

      {/* Footer Stats */}
      {sortedGames.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>Total Games: <strong>{sortedGames.length}</strong></span>
              <span>Active Sportsbooks: <strong>{Math.max(...sortedGames.map(g => g.bookmakers.length))}</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Live odds updates</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
