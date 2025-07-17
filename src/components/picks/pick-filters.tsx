// src/components/picks/pick-filters.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface PickFiltersProps {
  selectedSport: string
  setSelectedSport: (sport: string) => void
  selectedTier: string
  setSelectedTier: (tier: string) => void
  onClose: () => void
}

const sports = [
  { value: 'all', label: 'All Sports' },
  { value: 'NFL', label: 'NFL' },
  { value: 'NBA', label: 'NBA' },
  { value: 'MLB', label: 'MLB' },
  { value: 'NHL', label: 'NHL' },
  { value: 'Soccer', label: 'Soccer' },
  { value: 'Tennis', label: 'Tennis' }
]

const tiers = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'premium', label: 'Premium' }
]

export function PickFilters({
  selectedSport,
  setSelectedSport,
  selectedTier,
  setSelectedTier,
  onClose
}: PickFiltersProps) {
  const clearFilters = () => {
    setSelectedSport('all')
    setSelectedTier('all')
  }

  const hasActiveFilters = selectedSport !== 'all' || selectedTier !== 'all'

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filter Picks</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            Tier
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
