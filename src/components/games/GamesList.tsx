'use client'

import { Game } from '@/lib/types/games'
import { Clock, TrendingUp, Users } from 'lucide-react'
import CompactGameCard from './CompactGameCard'

interface GamesListProps {
  games: Game[]
  sport: string
  isLoading: boolean
  marketFilter?: 'all' | 'main' | 'props' | 'futures'
  sortBy?: 'time' | 'popularity' | 'value'
}

export default function GamesList({
  games,
  sport,
  isLoading,
  marketFilter = 'all',
  sortBy = 'time',
}: GamesListProps) {
  // Sort games based on sortBy parameter
  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      case 'popularity':
        // Mock popularity based on number of bookmakers
        return b.bookmakers.length - a.bookmakers.length
      case 'value':
        // Mock value calculation - could be based on best odds
        return Math.random() - 0.5 // Random for demo
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200"></div>
        </div>

        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center space-x-3">
                    <div className="h-4 w-16 rounded bg-slate-200"></div>
                    <div className="h-4 w-12 rounded bg-slate-200"></div>
                  </div>
                  <div className="h-5 w-48 rounded bg-slate-200"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-16 rounded bg-slate-200"></div>
                  <div className="h-8 w-16 rounded bg-slate-200"></div>
                  <div className="h-6 w-6 rounded bg-slate-200"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (sortedGames.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900">No Games Available</h3>
            <p className="text-slate-600">
              No {sport.replace('_', ' ').toUpperCase()} games found for the selected date.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Try a different sport</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Or select another date</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'time':
        return 'by game time'
      case 'popularity':
        return 'by popularity'
      case 'value':
        return 'by best value'
      default:
        return ''
    }
  }

  const getFilterLabel = () => {
    switch (marketFilter) {
      case 'main':
        return 'Main Lines'
      case 'props':
        return 'Player Props'
      case 'futures':
        return 'Futures'
      default:
        return 'All Markets'
    }
  }

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

        <div className="text-sm text-slate-500">Updated every 5 minutes</div>
      </div>

      {/* Games Grid */}
      <div className="space-y-3">
        {sortedGames.map(game => (
          <CompactGameCard key={game.id} game={game} marketFilter={marketFilter} />
        ))}
      </div>

      {/* Footer Stats */}
      {sortedGames.length > 0 && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>
                Total Games: <strong>{sortedGames.length}</strong>
              </span>
              <span>
                Active Sportsbooks:{' '}
                <strong>{Math.max(...sortedGames.map(g => g.bookmakers.length))}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Live odds updates</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
