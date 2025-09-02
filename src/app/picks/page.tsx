// src/app/picks/page.tsx
'use client'

import { PickCard } from '@/components/picks/pick-card'
import { PickFilters } from '@/components/picks/pick-filters'
import { Button } from '@/components/ui/button'
import { mockData } from '@/lib/mock-data'
import { Clock, Filter, Target, TrendingUp, Trophy } from 'lucide-react'
import { useState } from 'react'

export default function PicksPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')

  const filterOptions = [
    { id: 'all', label: 'All Picks', icon: Target, description: 'All available picks' },
    { id: 'live', label: 'Live', icon: Clock, description: 'Games starting soon' },
    { id: 'hot', label: 'Hot', icon: TrendingUp, description: 'Popular picks' },
    { id: 'won', label: 'Recent Wins', icon: Trophy, description: 'Latest winning picks' },
  ]

  // Get all picks with user data
  const picksWithUsers = mockData.picks.map(pick => {
    const author = mockData.users.find(user => user.id === pick.userId)!
    const seller = mockData.sellers.find(seller => seller.userId === pick.userId)
    return seller ? { ...pick, author, seller } : { ...pick, author }
  })

  // Filter picks
  const filteredPicks = picksWithUsers.filter(pick => {
    // Sport filter
    if (selectedSport !== 'all' && pick.sport !== selectedSport) return false

    // Tier filter
    if (selectedTier !== 'all' && pick.tier !== selectedTier) return false

    // Status filter
    switch (activeFilter) {
      case 'live':
        const gameTime = new Date(pick.gameTime)
        const now = new Date()
        const hoursUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        return pick.status === 'pending' && hoursUntilGame > 0 && hoursUntilGame <= 4
      case 'hot':
        return pick.engagement.views > 200 || pick.engagement.likes > 30
      case 'won':
        return pick.status === 'won'
      default:
        return true
    }
  })

  // Sort picks by posted date (newest first)
  const sortedPicks = filteredPicks.sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Picks Feed</h1>
              <p className="text-gray-600">Latest picks from verified bettors</p>
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex w-fit space-x-1 rounded-lg bg-gray-100 p-1">
            {filterOptions.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <filter.icon className="mr-2 h-4 w-4" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <PickFilters
            selectedSport={selectedSport}
            setSelectedSport={setSelectedSport}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {sortedPicks.length} picks
            {selectedSport !== 'all' && ` • ${selectedSport}`}
            {selectedTier !== 'all' && ` • ${selectedTier} tier`}
          </p>
        </div>

        {/* Picks Grid */}
        {sortedPicks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <Target className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No picks found</h3>
              <p className="text-gray-500">
                {activeFilter === 'live'
                  ? 'No live games starting soon.'
                  : 'Try adjusting your filters to see more picks.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {sortedPicks.map(pick => (
              <PickCard key={pick.id} pick={pick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
