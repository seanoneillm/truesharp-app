'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Check, ChevronDown, Crown, Filter, Lock, X, Calendar, Target, TrendingUp, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

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

// Database schema-based filter options - specific bet types as requested (removed 'parlay')
const BET_TYPES = ['All', 'spread', 'moneyline', 'total', 'player_prop', 'game_prop']
const STATUS_OPTIONS = ['All', 'pending', 'won', 'lost', 'void', 'cancelled']
// const IS_PARLAY_OPTIONS = ['All', 'true', 'false']
const SIDE_OPTIONS = ['All', 'over', 'under', 'home', 'away']
// const ODDS_TYPE_OPTIONS = ['All', 'favorite', 'underdog'] // Based on odds +/-


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

const SPORTSBOOKS = [
  'All',
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'ESPN Bet',
  'Caesars',
  'PrizePicks',
  'Fliff',
  'Fanatics',
  'Underdog',
  'BetRivers',
  'Sleeper',
  'Betfred',
  'Hard Rock',
  'SugarHouse',
  'Borgata',
  'Sporttrade',
  'TrueSharp',
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
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalFilters(filters)
    }
  }, [filters, hasUnsavedChanges])

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
    <Card className="mb-8 border-0 bg-gradient-to-br from-white to-slate-50/50 shadow-xl backdrop-blur-sm">
      <CardContent className="p-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="mb-6 flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="group flex h-auto items-center space-x-3 p-2 rounded-xl hover:bg-blue-50 transition-all duration-200"
              >
                <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-2 group-hover:from-blue-500 group-hover:to-cyan-500 transition-all duration-200">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-slate-900">Smart Filters</span>
                  <p className="text-sm text-slate-600">Customize your analytics view</p>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    {getActiveFiltersCount()} active
                  </Badge>
                )}
                <ChevronDown
                  className={`h-5 w-5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center space-x-3">
              {/* Save/Cancel Buttons - Moved to top right */}
              {hasUnsavedChanges && (
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="border-slate-300 text-slate-600 hover:bg-slate-50 px-4"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveFilters} 
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg px-4"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              )}
              
              {!isPro && (
                <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 px-3 py-1">
                  <Crown className="mr-1.5 h-3.5 w-3.5" />
                  Free Plan
                </Badge>
              )}
              {isPro && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1">
                  <Crown className="mr-1.5 h-3.5 w-3.5" />
                  Pro Plan
                </Badge>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 px-3 py-1 animate-pulse">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  Unsaved
                </Badge>
              )}
              {getActiveFiltersCount() > 0 && !hasUnsavedChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFilters()
                    setHasUnsavedChanges(false)
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <CollapsibleContent className="space-y-6">
            {/* Basic Filters Section */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Basic Filters</h3>
                  <p className="text-xs text-blue-700">Core betting filters for everyone</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {/* Markets (formerly Bet Types) */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Markets</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.betTypes || ['All']}
                    options={BET_TYPES.map(type => type === 'All' ? 'All Markets' : 
                      type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))}
                    onChange={values => updateLocalFilters({ 
                      betTypes: values.map(v => v === 'All Markets' ? 'All' : v.toLowerCase().replace(' ', '_'))
                    })}
                    placeholder="Select markets"
                  />
                </div>

                {/* Leagues */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>Sports & Leagues</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.leagues || ['All']}
                    options={LEAGUES.map(league => league === 'All' ? 'All Sports' : league)}
                    onChange={values => updateLocalFilters({ 
                      leagues: values.map(v => v === 'All Sports' ? 'All' : v)
                    })}
                    placeholder="Select sports/leagues"
                  />
                </div>

                {/* Start Date - Single Date Picker */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>Start Date</span>
                  </label>
                  <Input
                    type="date"
                    value={localFilters.customStartDate || ''}
                    onChange={e => updateLocalFilters({ customStartDate: e.target.value })}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Select start date"
                  />
                </div>

                {/* Sportsbooks */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <div className="h-4 w-4 rounded bg-purple-600"></div>
                    <span>Sportsbooks</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.sportsbooks || ['All']}
                    options={SPORTSBOOKS.map(book => book === 'All' ? 'All Sportsbooks' : book)}
                    onChange={values => updateLocalFilters({ 
                      sportsbooks: values.map(v => v === 'All Sportsbooks' ? 'All' : v)
                    })}
                    placeholder="Select sportsbooks"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Filters Section */}
            <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Advanced Filters</h3>
                  <p className="text-xs text-green-700">Detailed betting analysis filters</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Bet Status */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>Bet Status</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.statuses || ['All']}
                    options={STATUS_OPTIONS.map(status => {
                      const statusMap = {
                        'All': 'All Statuses',
                        'pending': 'Pending ⏳',
                        'won': 'Won ✅',
                        'lost': 'Lost ❌',
                        'void': 'Void 🚫',
                        'cancelled': 'Cancelled ⭕'
                      }
                      return (statusMap as any)[status] || status
                    })}
                    onChange={values => updateLocalFilters({ 
                      statuses: values.map(v => {
                        const reverseMap = {
                          'All Statuses': 'All',
                          'Pending ⏳': 'pending',
                          'Won ✅': 'won', 
                          'Lost ❌': 'lost',
                          'Void 🚫': 'void',
                          'Cancelled ⭕': 'cancelled'
                        }
                        return (reverseMap as any)[v] || v
                      })
                    })}
                    placeholder="Select bet status"
                  />
                </div>

                {/* Bet Types (formerly Bet Style) */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span>Bet Types</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.isParlays || ['All']}
                    options={['All', 'Straight', 'Parlay']}
                    onChange={values => updateLocalFilters({ 
                      isParlays: values.map(v => {
                        if (v === 'All') return 'All'
                        if (v === 'Straight') return 'false'
                        if (v === 'Parlay') return 'true'
                        return v
                      })
                    })}
                    placeholder="Select bet types"
                  />
                </div>

                {/* Side Filter */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span>Bet Side</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.sides || ['All']}
                    options={SIDE_OPTIONS.map(side => {
                      const sideMap = {
                        'All': 'All Sides',
                        'over': 'Over 📈',
                        'under': 'Under 📉', 
                        'home': 'Home Team 🏠',
                        'away': 'Away Team ✈️'
                      }
                      return (sideMap as any)[side] || side
                    })}
                    onChange={values => updateLocalFilters({ 
                      sides: values.map(v => {
                        const reverseMap = {
                          'All Sides': 'All',
                          'Over 📈': 'over',
                          'Under 📉': 'under',
                          'Home Team 🏠': 'home', 
                          'Away Team ✈️': 'away'
                        }
                        return (reverseMap as any)[v] || v
                      })
                    })}
                    placeholder="Select bet side"
                  />
                </div>

                {/* Odds Type Filter */}
                <div>
                  <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span>Odds Type</span>
                  </label>
                  <MultiSelectDropdown
                    values={localFilters.oddsTypes || ['All']}
                    options={['All Odds', 'Favorites (-) 💪', 'Underdogs (+) 🎯']}
                    onChange={values => updateLocalFilters({ 
                      oddsTypes: values.map(v => {
                        if (v === 'All Odds') return 'All'
                        if (v === 'Favorites (-) 💪') return 'favorite'
                        if (v === 'Underdogs (+) 🎯') return 'underdog'
                        return v
                      })
                    })}
                    placeholder="Select odds type"
                  />
                </div>
              </div>
            </div>

            {/* Pro Range Filters Section */}
            <div
              className={`relative rounded-xl border shadow-sm ${
                isPro 
                  ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
                  : 'border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200'
              }`}
            >
              {!isPro && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md">
                  <div className="text-center p-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Pro Range Filters</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Unlock precise filtering by odds, stakes, and betting ranges
                    </p>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      Upgrade to Pro
                    </Badge>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 p-2">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">Pro Range Filters</h3>
                    <p className="text-xs text-yellow-700">Advanced numerical filters for precise analysis</p>
                  </div>
                  {isPro && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Odds Range */}
                  <div>
                    <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-green-500"></div>
                      <span>Odds Range</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Min Odds</label>
                          <Input
                            type="number"
                            placeholder="-200 (favorite)"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Max Odds</label>
                          <Input
                            type="number"
                            placeholder="+300 (underdog)"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Filter bets by American odds format (-200 to +500)</p>
                    </div>
                  </div>

                  {/* Stake Range */}
                  <div>
                    <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                      <span>Stake Range</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Min Stake</label>
                          <Input
                            type="number"
                            placeholder="$10"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Max Stake</label>
                          <Input
                            type="number"
                            placeholder="$500"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Filter bets by stake amount ($)</p>
                    </div>
                  </div>
                </div>

                {/* Additional Pro Ranges */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Spread Range */}
                  <div>
                    <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      <span>Spread Range</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Min Spread</label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="-14.5"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Max Spread</label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="+7.5"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Filter spread bets by point spread</p>
                    </div>
                  </div>

                  {/* Total Range */}
                  <div>
                    <label className="mb-3 flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                      <span>Total Range</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Min Total</label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="40.5"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-slate-600">Max Total</label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="55.5"
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
                            className="border-yellow-200 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Filter over/under bets by total points</p>
                    </div>
                  </div>
                </div>
                
                {/* Pro Date Range Filters */}
                <div className="border-t border-yellow-200 pt-6 mt-6">
                  <div className="mb-4 flex items-center space-x-2">
                    <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-900">Pro Date Range</h4>
                      <p className="text-xs text-purple-700">Advanced date filtering for precise analysis</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Pro Start Date */}
                    <div className="relative">
                      <label className={`mb-3 flex items-center space-x-2 text-sm font-semibold ${isPro ? 'text-slate-700' : 'text-slate-400'}`}>
                        <Calendar className={`h-4 w-4 ${isPro ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span>Pro Start Date</span>
                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">PRO</Badge>
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={isPro ? (localFilters.customStartDate || '') : ''}
                          onChange={e => isPro && updateLocalFilters({ customStartDate: e.target.value })}
                          disabled={!isPro}
                          className={isPro 
                            ? "border-purple-200 focus:border-purple-500 focus:ring-purple-500" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }
                        />
                        {!isPro && <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Pro End Date */}
                    <div className="relative">
                      <label className={`mb-3 flex items-center space-x-2 text-sm font-semibold ${isPro ? 'text-slate-700' : 'text-slate-400'}`}>
                        <Calendar className={`h-4 w-4 ${isPro ? 'text-purple-600' : 'text-slate-400'}`} />
                        <span>Pro End Date</span>
                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">PRO</Badge>
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={isPro ? (localFilters.customEndDate || '') : ''}
                          onChange={e => isPro && updateLocalFilters({ customEndDate: e.target.value })}
                          disabled={!isPro}
                          className={isPro 
                            ? "border-purple-200 focus:border-purple-500 focus:ring-purple-500" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }
                        />
                        {!isPro && <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Pro users can set custom date ranges for advanced filtering</p>
                </div>
              </div>
            </div>

          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
