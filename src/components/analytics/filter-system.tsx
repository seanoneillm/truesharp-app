'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Check, ChevronDown, Crown, Filter, Lock, X } from 'lucide-react'
import { useState } from 'react'

export interface FilterOptions {
  // Core filters matching database schema - now supporting multiple selections
  betTypes: string[] // Multiple selection: 'spread', 'moneyline', 'total', 'player_prop', 'game_prop', 'parlay'
  leagues: string[] // Multiple selection - Maps to 'sport' column in bets table (contains league names)

  // Database-specific filters - multiple selections
  statuses: string[] // Multiple selection: 'pending', 'won', 'lost', 'void', 'cancelled'
  isParlays: string[] // Multiple selection: 'true', 'false' - maps to is_parlay column
  sides: string[] // Multiple selection: 'over', 'under', 'home', 'away' - maps to side column
  oddsTypes: string[] // Multiple selection: 'favorite', 'underdog' (negative vs positive odds)

  // Time-based filters
  timeRange: string
  customStartDate?: string
  customEndDate?: string

  // Sportsbook filter
  sportsbooks: string[]

  // Pro tier filters (blurred/locked unless pro)
  oddsRange?: { min: number; max: number } // Maps to 'odds' column (integer)
  stakeRange?: { min: number; max: number } // Maps to 'stake' column (numeric)
  lineValueRange?: { min: number; max: number } // Maps to 'line_value' column (numeric)
  spreadRange?: { min: number; max: number }
  totalRange?: { min: number; max: number }

  // Legacy filters (keep for backward compatibility)
  sports: string[]
}

interface FilterSystemProps {
  isPro: boolean
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onClearFilters: () => void
}

// Database schema-based filter options - specific bet types as requested
const BET_TYPES = ['All', 'spread', 'moneyline', 'total', 'player_prop', 'game_prop', 'parlay']
const STATUS_OPTIONS = ['All', 'pending', 'won', 'lost', 'void', 'cancelled']
const IS_PARLAY_OPTIONS = ['All', 'true', 'false']
const SIDE_OPTIONS = ['All', 'over', 'under', 'home', 'away']
const ODDS_TYPE_OPTIONS = ['All', 'favorite', 'underdog'] // Based on odds +/-


const LEAGUES = [
  'All',
  'NFL',
  'NBA',
  'MLB',
  'NHL',
  'NCAAF',
  'NCAAB',
  'MLS',
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'ATP',
  'WTA',
  'PGA Tour',
  'European Tour',
  'UFC',
  'Bellator',
  'Formula 1',
  'NASCAR',
  'IndyCar',
]






// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  values: string[]
  options: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  label?: string
}

function MultiSelectDropdown({
  values,
  options,
  onChange,
  placeholder,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (option: string) => {
    if (option === 'All') {
      // If "All" is selected, clear all other selections
      onChange(['All'])
    } else {
      // Remove "All" if other options are selected
      const newValues = values.includes('All') ? [] : [...values]

      if (newValues.includes(option)) {
        // Remove option
        const filtered = newValues.filter(v => v !== option)
        onChange(filtered.length === 0 ? ['All'] : filtered)
      } else {
        // Add option
        onChange([...newValues, option])
      }
    }
  }

  const displayText = () => {
    if (values.length === 0 || (values.length === 1 && values[0] === 'All')) {
      return placeholder || 'Select options'
    }
    if (values.length === 1) {
      return values[0]
    }
    return `${values.length} selected`
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-md border border-gray-300 bg-white p-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <span className="truncate">{displayText()}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            {options.map(option => {
              const isSelected = values.includes(option)
              const isAll = option === 'All'

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <span className={isAll ? 'font-medium' : ''}>{option}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Show selected items as badges below dropdown */}
      {values.length > 1 && !values.includes('All') && (
        <div className="mt-2 flex flex-wrap gap-1">
          {values.map(value => (
            <Badge
              key={value}
              variant="secondary"
              className="cursor-pointer text-xs"
              onClick={() => toggleOption(value)}
            >
              {value}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterSystem({
  isPro,
  filters,
  onFiltersChange,
}: FilterSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local filters when prop filters change (but only if no unsaved changes)
  useState(() => {
    if (!hasUnsavedChanges) {
      setLocalFilters(filters)
    }
  })

  const updateLocalFilters = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    setHasUnsavedChanges(true)
  }

  const saveFilters = () => {
    onFiltersChange(localFilters)
    setHasUnsavedChanges(false)
    setIsExpanded(false) // Collapse after saving
  }

  const resetFilters = () => {
    setLocalFilters(filters)
    setHasUnsavedChanges(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (!(filters.betTypes || ['All']).includes('All')) count++
    if (!(filters.leagues || ['All']).includes('All')) count++
    if (!(filters.statuses || ['All']).includes('All')) count++
    if (!(filters.isParlays || ['All']).includes('All')) count++
    if (!(filters.sides || ['All']).includes('All')) count++
    if (!(filters.oddsTypes || ['All']).includes('All')) count++
    if (isPro) {
      if (filters.oddsRange) count++
      if (filters.spreadRange) count++
      if (filters.totalRange) count++
      if (filters.stakeRange) count++
    }
    return count
  }

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      betTypes: ['All'],
      leagues: ['All'],
      statuses: ['All'],
      isParlays: ['All'],
      sides: ['All'],
      oddsTypes: ['All'],
      oddsRange: { min: 0, max: 0 },
      spreadRange: { min: 0, max: 0 },
      totalRange: { min: 0, max: 0 },
      stakeRange: { min: 0, max: 0 },
    })
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="mb-4 flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex h-auto items-center space-x-2 p-0">
                <Filter className="h-4 w-4" />
                <span className="font-semibold">Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center space-x-2">
              {!isPro && (
                <Badge variant="outline" className="border-amber-600 text-amber-600">
                  <Crown className="mr-1 h-3 w-3" />
                  Free Tier
                </Badge>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="border-blue-600 text-blue-600">
                  Unsaved Changes
                </Badge>
              )}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFilters()
                    setHasUnsavedChanges(false)
                  }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Default Filters - Always Visible */}
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 md:grid-cols-3">
              {/* Bet Types */}
              <div>
                <label className="mb-2 block text-sm font-medium">Bet Types</label>
                <MultiSelectDropdown
                  values={localFilters.betTypes || ['All']}
                  options={BET_TYPES}
                  onChange={values => updateLocalFilters({ betTypes: values })}
                  placeholder="Select bet types"
                />
              </div>

              {/* Leagues (combined sport/league) */}
              <div>
                <label className="mb-2 block text-sm font-medium">Leagues</label>
                <MultiSelectDropdown
                  values={localFilters.leagues || ['All']}
                  options={LEAGUES}
                  onChange={values => updateLocalFilters({ leagues: values })}
                  placeholder="Select leagues"
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={localFilters.customStartDate || ''}
                  onChange={e => updateLocalFilters({ customStartDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Database-specific Filters - Additional row */}
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20 md:grid-cols-4">
              {/* Bet Status */}
              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <MultiSelectDropdown
                  values={localFilters.statuses || ['All']}
                  options={STATUS_OPTIONS}
                  onChange={values => updateLocalFilters({ statuses: values })}
                  placeholder="Select statuses"
                />
              </div>

              {/* Parlay Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium">Parlay</label>
                <MultiSelectDropdown
                  values={localFilters.isParlays || ['All']}
                  options={IS_PARLAY_OPTIONS}
                  onChange={values => updateLocalFilters({ isParlays: values })}
                  placeholder="Select parlay"
                />
              </div>

              {/* Side Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium">Side</label>
                <MultiSelectDropdown
                  values={localFilters.sides || ['All']}
                  options={SIDE_OPTIONS}
                  onChange={values => updateLocalFilters({ sides: values })}
                  placeholder="Select sides"
                />
              </div>

              {/* Underdog/Favorite Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium">Odds Type</label>
                <MultiSelectDropdown
                  values={localFilters.oddsTypes || ['All']}
                  options={ODDS_TYPE_OPTIONS}
                  onChange={values => updateLocalFilters({ oddsTypes: values })}
                  placeholder="Select odds types"
                />
              </div>
            </div>

            {/* Pro Tier Filters - Blurred/Locked for non-pro users */}
            <div
              className={`rounded-lg border p-4 ${isPro ? 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20' : 'border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'} ${!isPro ? 'relative' : ''}`}
            >
              {!isPro && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                  <div className="text-center">
                    <Lock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pro Features
                    </p>
                    <p className="text-xs text-gray-500">Upgrade to unlock advanced filters</p>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center space-x-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-600">Pro Range Filters</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Odds Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Odds Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min (e.g. -200)"
                      value={localFilters.oddsRange?.min || ''}
                      onChange={e =>
                        updateLocalFilters({
                          oddsRange: {
                            ...localFilters.oddsRange,
                            min: parseFloat(e.target.value) || 0,
                            max: localFilters.oddsRange?.max || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max (e.g. +300)"
                      value={localFilters.oddsRange?.max || ''}
                      onChange={e =>
                        updateLocalFilters({
                          oddsRange: {
                            ...localFilters.oddsRange,
                            max: parseFloat(e.target.value) || 0,
                            min: localFilters.oddsRange?.min || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Spread Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Spread Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Min (e.g. -14)"
                      value={localFilters.spreadRange?.min || ''}
                      onChange={e =>
                        updateLocalFilters({
                          spreadRange: {
                            ...localFilters.spreadRange,
                            min: parseFloat(e.target.value) || 0,
                            max: localFilters.spreadRange?.max || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Max (e.g. +7)"
                      value={localFilters.spreadRange?.max || ''}
                      onChange={e =>
                        updateLocalFilters({
                          spreadRange: {
                            ...localFilters.spreadRange,
                            max: parseFloat(e.target.value) || 0,
                            min: localFilters.spreadRange?.min || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Total Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Total Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Min (e.g. 40.5)"
                      value={localFilters.totalRange?.min || ''}
                      onChange={e =>
                        updateLocalFilters({
                          totalRange: {
                            ...localFilters.totalRange,
                            min: parseFloat(e.target.value) || 0,
                            max: localFilters.totalRange?.max || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Max (e.g. 55.5)"
                      value={localFilters.totalRange?.max || ''}
                      onChange={e =>
                        updateLocalFilters({
                          totalRange: {
                            ...localFilters.totalRange,
                            max: parseFloat(e.target.value) || 0,
                            min: localFilters.totalRange?.min || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Stake Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Stake Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min ($)"
                      value={localFilters.stakeRange?.min || ''}
                      onChange={e =>
                        updateLocalFilters({
                          stakeRange: {
                            ...localFilters.stakeRange,
                            min: parseFloat(e.target.value) || 0,
                            max: localFilters.stakeRange?.max || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max ($)"
                      value={localFilters.stakeRange?.max || ''}
                      onChange={e =>
                        updateLocalFilters({
                          stakeRange: {
                            ...localFilters.stakeRange,
                            max: parseFloat(e.target.value) || 0,
                            min: localFilters.stakeRange?.min || 0,
                          },
                        })
                      }
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            {hasUnsavedChanges && (
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveFilters} className="bg-blue-600 hover:bg-blue-700">
                  Save Filters
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
