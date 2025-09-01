'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Check, ChevronDown, Crown, Filter, Lock, X } from "lucide-react"
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

// Common sports and leagues that are likely in your database
const SPORTS = [
  'All', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'Premier League',
  'Champions League', 'ATP', 'WTA', 'PGA Tour', 'UFC', 'Formula 1', 'NASCAR'
]

const LEAGUES = [
  'All', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'MLS', 'Premier League',
  'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'ATP', 'WTA',
  'PGA Tour', 'European Tour', 'UFC', 'Bellator', 'Formula 1', 'NASCAR', 'IndyCar'
]

const TIME_RANGES = ['All time', '7 days', '30 days', '3 months', 'This year', 'Custom']
const SPORTSBOOKS = ['All', 'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET', 'BetRivers', 'Fanatics']

// Sport to leagues mapping
const SPORT_LEAGUES: { [key: string]: string[] } = {
  'Football': ['NFL', 'NCAAF'],
  'Basketball': ['NBA', 'NCAAB'],
  'Baseball': ['MLB'],
  'Hockey': ['NHL'],
  'Soccer': ['MLS', 'Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'],
  'Tennis': ['ATP', 'WTA'],
  'Golf': ['PGA Tour', 'European Tour'],
  'MMA': ['UFC', 'Bellator'],
  'Racing': ['Formula 1', 'NASCAR', 'IndyCar']
}

// Market categories based on sport
const MARKET_CATEGORIES: { [key: string]: string[] } = {
  'All': ['All', 'Game Lines', 'Player Props', 'Game Props', 'Futures'],
  'Football': ['All', 'Game Lines', 'Player Props', 'Team Props', 'Futures'],
  'Basketball': ['All', 'Game Lines', 'Player Props', 'Team Props', 'Futures'],
  'Baseball': ['All', 'Game Lines', 'Player Props', 'Team Props', 'Futures'],
  'Hockey': ['All', 'Game Lines', 'Player Props', 'Team Props', 'Futures'],
  'Soccer': ['All', 'Match Lines', 'Player Props', 'Team Props', 'Tournament Futures'],
  'Tennis': ['All', 'Match Lines', 'Set Props', 'Game Props', 'Tournament Futures'],
  'Golf': ['All', 'Tournament Winner', 'Top 5/10/20', 'Head to Head', 'Props'],
  'MMA': ['All', 'Fight Lines', 'Method Props', 'Round Props', 'Fight Props'],
  'Racing': ['All', 'Race Winner', 'Podium Finish', 'Head to Head', 'Props']
}

// Specific markets based on category
const SPECIFIC_MARKETS: { [key: string]: string[] } = {
  'Game Lines': ['All', 'Spread', 'Moneyline', 'Total', 'First Half', 'First Quarter'],
  'Player Props': ['All', 'Points', 'Rebounds', 'Assists', 'Passing Yards', 'Rushing Yards', 'Receiving Yards'],
  'Team Props': ['All', 'Team Total', 'First to Score', 'Highest Scoring Quarter'],
  'Game Props': ['All', 'First Touchdown', 'Longest TD', 'Safety', 'Pick Six'],
  'Futures': ['All', 'Championship Winner', 'Division Winner', 'Playoff Berth', 'Season Win Total'],
  'Match Lines': ['All', 'Match Winner', 'Draw No Bet', 'Both Teams to Score'],
  'Set Props': ['All', 'Set Winner', 'Games in Set', 'Tiebreak in Set'],
  'Tournament Winner': ['All', 'Outright Winner', 'Top Amateur'],
  'Fight Lines': ['All', 'Fight Winner', 'Method of Victory', 'Round Betting'],
  'Race Winner': ['All', 'Race Winner', 'Fastest Lap', 'Constructor Winner']
}

// Helper function to determine if odds represent favorite or underdog
const getOddsType = (odds: number): 'favorite' | 'underdog' => {
  return odds < 0 ? 'favorite' : 'underdog'
}

// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  values: string[]
  options: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  label?: string
}

function MultiSelectDropdown({ values, options, onChange, placeholder, disabled = false, label }: MultiSelectDropdownProps) {
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
        className={`w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <span className="truncate">{displayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && !disabled && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = values.includes(option)
              const isAll = option === 'All'
              
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <span className={isAll ? 'font-medium' : ''}>{option}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </>
      )}
      
      {/* Show selected items as badges below dropdown */}
      {values.length > 1 && !values.includes('All') && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => toggleOption(value)}
            >
              {value}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function FilterSystem({ isPro, filters, onFiltersChange, onClearFilters }: FilterSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false) // Start collapsed for cleaner initial view
  
  // Render counter for debugging (remove in production)
  const renderCountRef = useState(() => ({ count: 0 }))[0]
  renderCountRef.count++
  
  console.log(`FilterSystem render count: ${renderCountRef.count}`)

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  // Initialize default values if not set (matching new multi-select schema)
  const currentBetTypes = filters.betTypes || ['All']
  const currentLeagues = filters.leagues || ['All']
  const currentStatuses = filters.statuses || ['All']
  const currentIsParlays = filters.isParlays || ['All']
  const currentSides = filters.sides || ['All']
  const currentOddsTypes = filters.oddsTypes || ['All']

  const getActiveFiltersCount = () => {
    let count = 0
    if (!currentBetTypes.includes('All')) count++
    if (!currentLeagues.includes('All')) count++
    if (!currentStatuses.includes('All')) count++
    if (!currentIsParlays.includes('All')) count++
    if (!currentSides.includes('All')) count++
    if (!currentOddsTypes.includes('All')) count++
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
      oddsRange: undefined,
      spreadRange: undefined,
      totalRange: undefined,
      stakeRange: undefined
    })
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-0 h-auto">
                <Filter className="w-4 h-4" />
                <span className="font-semibold">Filters</span>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center space-x-2">
              {!isPro && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Free Tier
                </Badge>
              )}
              {getActiveFiltersCount() > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Default Filters - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {/* Bet Types */}
              <div>
                <label className="block text-sm font-medium mb-2">Bet Types</label>
                <MultiSelectDropdown
                  values={currentBetTypes}
                  options={BET_TYPES}
                  onChange={(values) => updateFilters({ betTypes: values })}
                  placeholder="Select bet types"
                />
              </div>

              {/* Leagues (combined sport/league) */}
              <div>
                <label className="block text-sm font-medium mb-2">Leagues</label>
                <MultiSelectDropdown
                  values={currentLeagues}
                  options={LEAGUES}
                  onChange={(values) => updateFilters({ leagues: values })}
                  placeholder="Select leagues"
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={filters.customStartDate || ''}
                  onChange={e => updateFilters({ customStartDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Database-specific Filters - Additional row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              {/* Bet Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <MultiSelectDropdown
                  values={currentStatuses}
                  options={STATUS_OPTIONS}
                  onChange={(values) => updateFilters({ statuses: values })}
                  placeholder="Select statuses"
                />
              </div>

              {/* Parlay Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Parlay</label>
                <MultiSelectDropdown
                  values={currentIsParlays}
                  options={IS_PARLAY_OPTIONS}
                  onChange={(values) => updateFilters({ isParlays: values })}
                  placeholder="Select parlay"
                />
              </div>

              {/* Side Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Side</label>
                <MultiSelectDropdown
                  values={currentSides}
                  options={SIDE_OPTIONS}
                  onChange={(values) => updateFilters({ sides: values })}
                  placeholder="Select sides"
                />
              </div>

              {/* Underdog/Favorite Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Odds Type</label>
                <MultiSelectDropdown
                  values={currentOddsTypes}
                  options={ODDS_TYPE_OPTIONS}
                  onChange={(values) => updateFilters({ oddsTypes: values })}
                  placeholder="Select odds types"
                />
              </div>
            </div>


            {/* Pro Tier Filters - Blurred/Locked for non-pro users */}
            <div className={`p-4 rounded-lg border ${isPro ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600'} ${!isPro ? 'relative' : ''}`}>
              {!isPro && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pro Features</p>
                    <p className="text-xs text-gray-500">Upgrade to unlock advanced filters</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-amber-600">Pro Range Filters</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Odds Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Odds Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min (e.g. -200)"
                      value={filters.oddsRange?.min || ''}
                      onChange={(e) => updateFilters({
                        oddsRange: { 
                          ...filters.oddsRange, 
                          min: parseFloat(e.target.value) || 0, 
                          max: filters.oddsRange?.max || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max (e.g. +300)"
                      value={filters.oddsRange?.max || ''}
                      onChange={(e) => updateFilters({
                        oddsRange: { 
                          ...filters.oddsRange, 
                          max: parseFloat(e.target.value) || 0, 
                          min: filters.oddsRange?.min || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Spread Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Spread Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Min (e.g. -14)"
                      value={filters.spreadRange?.min || ''}
                      onChange={(e) => updateFilters({
                        spreadRange: { 
                          ...filters.spreadRange, 
                          min: parseFloat(e.target.value) || 0, 
                          max: filters.spreadRange?.max || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Max (e.g. +7)"
                      value={filters.spreadRange?.max || ''}
                      onChange={(e) => updateFilters({
                        spreadRange: { 
                          ...filters.spreadRange, 
                          max: parseFloat(e.target.value) || 0, 
                          min: filters.spreadRange?.min || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Total Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Total Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Min (e.g. 40.5)"
                      value={filters.totalRange?.min || ''}
                      onChange={(e) => updateFilters({
                        totalRange: { 
                          ...filters.totalRange, 
                          min: parseFloat(e.target.value) || 0, 
                          max: filters.totalRange?.max || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Max (e.g. 55.5)"
                      value={filters.totalRange?.max || ''}
                      onChange={(e) => updateFilters({
                        totalRange: { 
                          ...filters.totalRange, 
                          max: parseFloat(e.target.value) || 0, 
                          min: filters.totalRange?.min || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Stake Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Stake Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min ($)"
                      value={filters.stakeRange?.min || ''}
                      onChange={(e) => updateFilters({
                        stakeRange: { 
                          ...filters.stakeRange, 
                          min: parseFloat(e.target.value) || 0, 
                          max: filters.stakeRange?.max || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max ($)"
                      value={filters.stakeRange?.max || ''}
                      onChange={(e) => updateFilters({
                        stakeRange: { 
                          ...filters.stakeRange, 
                          max: parseFloat(e.target.value) || 0, 
                          min: filters.stakeRange?.min || 0 
                        }
                      })}
                      disabled={!isPro}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}