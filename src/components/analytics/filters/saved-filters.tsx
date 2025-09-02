// src/components/analytics/filters/saved-filters.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Edit, Filter, MoreVertical, Save, Share, Star, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

interface SavedFilter {
  id: string
  name: string
  description: string
  filters: any
  createdAt: Date
  lastUsed?: Date
  useCount: number
  isFavorite: boolean
  isShared: boolean
  tags: string[]
}

interface SavedFiltersProps {
  savedFilters: SavedFilter[]
  onLoadFilter: (filter: SavedFilter) => void
  onDeleteFilter: (filterId: string) => void
  onUpdateFilter: (filterId: string, updates: Partial<SavedFilter>) => void
  onShareFilter: (filterId: string) => void
  isPro: boolean
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({
  savedFilters,
  onLoadFilter,
  onDeleteFilter,
  onUpdateFilter,
  onShareFilter,
  isPro,
}) => {
  const [editingFilter, setEditingFilter] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'used' | 'usage'>('name')

  const filteredAndSortedFilters = savedFilters
    .filter(
      filter =>
        filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'used':
          return (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0)
        case 'usage':
          return b.useCount - a.useCount
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const favoriteFilters = filteredAndSortedFilters.filter(f => f.isFavorite)
  const regularFilters = filteredAndSortedFilters.filter(f => !f.isFavorite)

  const handleEdit = (filter: SavedFilter) => {
    setEditingFilter(filter.id)
    setEditName(filter.name)
    setEditDescription(filter.description)
  }

  const handleSaveEdit = (filterId: string) => {
    onUpdateFilter(filterId, {
      name: editName,
      description: editDescription,
    })
    setEditingFilter(null)
  }

  const handleCancelEdit = () => {
    setEditingFilter(null)
    setEditName('')
    setEditDescription('')
  }

  const handleToggleFavorite = (filterId: string, isFavorite: boolean) => {
    onUpdateFilter(filterId, { isFavorite: !isFavorite })
  }

  const getFilterComplexity = (filters: any) => {
    let complexity = 0
    Object.values(filters).forEach((value: any) => {
      if (Array.isArray(value) && value.length > 0) complexity++
      else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0)
        complexity++
      else if (value) complexity++
    })
    return complexity
  }

  if (!isPro && savedFilters.length === 0) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Save className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Saved Filters</h3>
          <p className="mb-4 text-muted-foreground">
            Save your favorite filter combinations for quick access
          </p>
          <Button>Upgrade to Pro</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Saved Filters</h3>
        <Badge variant="outline">{savedFilters.length} saved</Badge>
      </div>

      {/* Search and Sort */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search filters..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="rounded border px-3 py-2"
        >
          <option value="name">Name</option>
          <option value="created">Created</option>
          <option value="used">Last Used</option>
          <option value="usage">Most Used</option>
        </select>
      </div>

      {/* Favorite Filters */}
      {favoriteFilters.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Favorites</span>
          </div>
          <div className="space-y-2">
            {favoriteFilters.map(filter => (
              <FilterCard
                key={filter.id}
                filter={filter}
                isEditing={editingFilter === filter.id}
                editName={editName}
                editDescription={editDescription}
                onNameChange={setEditName}
                onDescriptionChange={setEditDescription}
                onLoad={() => onLoadFilter(filter)}
                onEdit={() => handleEdit(filter)}
                onSaveEdit={() => handleSaveEdit(filter.id)}
                onCancelEdit={handleCancelEdit}
                onDelete={() => onDeleteFilter(filter.id)}
                onToggleFavorite={() => handleToggleFavorite(filter.id, filter.isFavorite)}
                onShare={() => onShareFilter(filter.id)}
                getComplexity={getFilterComplexity}
                isPro={isPro}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Filters */}
      {regularFilters.length > 0 && (
        <div>
          {favoriteFilters.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">All Filters</span>
            </div>
          )}
          <div className="space-y-2">
            {regularFilters.map(filter => (
              <FilterCard
                key={filter.id}
                filter={filter}
                isEditing={editingFilter === filter.id}
                editName={editName}
                editDescription={editDescription}
                onNameChange={setEditName}
                onDescriptionChange={setEditDescription}
                onLoad={() => onLoadFilter(filter)}
                onEdit={() => handleEdit(filter)}
                onSaveEdit={() => handleSaveEdit(filter.id)}
                onCancelEdit={handleCancelEdit}
                onDelete={() => onDeleteFilter(filter.id)}
                onToggleFavorite={() => handleToggleFavorite(filter.id, filter.isFavorite)}
                onShare={() => onShareFilter(filter.id)}
                getComplexity={getFilterComplexity}
                isPro={isPro}
              />
            ))}
          </div>
        </div>
      )}

      {filteredAndSortedFilters.length === 0 && searchTerm && (
        <div className="py-8 text-center">
          <Filter className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No filters match your search</p>
        </div>
      )}
    </Card>
  )
}

// Filter Card Component
interface FilterCardProps {
  filter: SavedFilter
  isEditing: boolean
  editName: string
  editDescription: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onLoad: () => void
  onEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onShare: () => void
  getComplexity: (filters: any) => number
  isPro: boolean
}

const FilterCard: React.FC<FilterCardProps> = ({
  filter,
  isEditing,
  editName,
  editDescription,
  onNameChange,
  onDescriptionChange,
  onLoad,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleFavorite,
  onShare,
  getComplexity,
  isPro,
}) => {
  const [showActions, setShowActions] = useState(false)

  const complexity = getComplexity(filter.filters)

  const handleLoad = () => {
    onLoad()
    // Update usage stats would happen here
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <Input
          value={editName}
          onChange={e => onNameChange(e.target.value)}
          className="mb-2"
          placeholder="Filter name"
        />
        <Input
          value={editDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          className="mb-3"
          placeholder="Filter description"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSaveEdit}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={handleLoad}>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">{filter.name}</span>
            {filter.isFavorite && <Star className="h-3 w-3 fill-current text-yellow-500" />}
            {filter.isShared && <Share className="h-3 w-3 text-blue-500" />}
          </div>
          <p className="mb-2 text-sm text-muted-foreground">{filter.description}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{complexity} filters</span>
            <span>Used {filter.useCount} times</span>
            {filter.lastUsed && (
              <span>Last used {new Date(filter.lastUsed).toLocaleDateString()}</span>
            )}
          </div>

          {filter.tags.length > 0 && (
            <div className="mt-2 flex gap-1">
              {filter.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setShowActions(!showActions)}>
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showActions && (
            <div className="absolute right-0 top-8 z-10 min-w-32 rounded-lg border bg-background p-1 shadow-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onToggleFavorite()
                  setShowActions(false)
                }}
                className="w-full justify-start"
              >
                <Star className="mr-2 h-3 w-3" />
                {filter.isFavorite ? 'Unfavorite' : 'Favorite'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onEdit()
                  setShowActions(false)
                }}
                className="w-full justify-start"
              >
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Button>
              {isPro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onShare()
                    setShowActions(false)
                  }}
                  className="w-full justify-start"
                >
                  <Share className="mr-2 h-3 w-3" />
                  Share
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete()
                  setShowActions(false)
                }}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
