// src/components/marketplace/marketplace-filters.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MarketplaceFiltersProps {
  selectedSport: string
  setSelectedSport: (sport: string) => void
  selectedPriceRange: string
  setSelectedPriceRange: (range: string) => void
  selectedTier: string
  setSelectedTier: (tier: string) => void
}

const sports = [
  { value: 'all', label: 'All Sports' },
  { value: 'nfl', label: 'NFL' },
  { value: 'nba', label: 'NBA' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nhl', label: 'NHL' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'tennis', label: 'Tennis' }
]

const priceRanges = [
  { value: 'all', label: 'All Prices' },
  { value: 'low', label: '$1 - $25' },
  { value: 'mid', label: '$26 - $75' },
  { value: 'high', label: '$76+' }
]

const tiers = [
  { value: 'all', label: 'All Tiers' },
  { value: 'standard', label: 'Standard' },
  { value: 'rising', label: 'Rising Star' },
  { value: 'pro', label: 'Professional' },
  { value: 'elite', label: 'Elite' }
]

export function MarketplaceFilters({
  selectedSport,
  setSelectedSport,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedTier,
  setSelectedTier
}: MarketplaceFiltersProps) {
  const clearFilters = () => {
    setSelectedSport('all')
    setSelectedPriceRange('all')
    setSelectedTier('all')
  }

  const hasActiveFilters = selectedSport !== 'all' || selectedPriceRange !== 'all' || selectedTier !== 'all'

  return (
    <Card className="p-6 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sport
          </label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {sports.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <select
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seller Tier
          </label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {tiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button 
            variant="outline" 
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </Card>
  )
}