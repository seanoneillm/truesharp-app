// src/components/feed/feed-filters.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface FeedFiltersProps {
  onClose: () => void
}

export function FeedFilters({ onClose }: FeedFiltersProps) {
  const sports = ['All', 'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis']
  const postTypes = ['All', 'Picks', 'Wins', 'Analysis', 'General']
  const timeRanges = ['All Time', 'Today', 'This Week', 'This Month']

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filter Feed</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Sports Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sports
          </label>
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <Badge
                key={sport}
                variant={sport === 'All' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-blue-50"
              >
                {sport}
              </Badge>
            ))}
          </div>
        </div>

        {/* Post Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <div className="flex flex-wrap gap-2">
            {postTypes.map((type) => (
              <Badge
                key={type}
                variant={type === 'All' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-blue-50"
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Time Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <Badge
                key={range}
                variant={range === 'All Time' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-blue-50"
              >
                {range}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" size="sm">
            Clear All
          </Button>
          <Button size="sm">
            Apply Filters
          </Button>
        </div>
      </div>
    </Card>
  )
}
