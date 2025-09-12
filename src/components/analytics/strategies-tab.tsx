'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getRequiredFilterChanges,
  StrategyValidationResult,
  validateStrategyFilters,
} from '@/lib/utils/strategy-validation'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Settings,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wand2,
} from 'lucide-react'

// TrueSharp Shield Component
const TrueSharpShield = ({ className = 'h-8 w-8' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill="url(#shieldGradient)"
      stroke="#3b82f6"
      strokeWidth="2"
    />
    <path
      d="M35 45 L45 55 L65 35"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)
import { useState } from 'react'
import { FilterOptions } from './filter-system'

interface Strategy {
  id: string
  name: string
  description: string
  filters: FilterOptions
  monetized: boolean
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  subscriber_count: number
  performance_roi: number
  performance_win_rate: number
  performance_total_bets: number
  created_at: string
  updated_at: string
  start_date?: string // Start date for strategy filtering
  // Additional leaderboard fields
  roi_percentage?: number
  win_rate?: number
  total_bets?: number
  winning_bets?: number
  losing_bets?: number
  push_bets?: number
  primary_sport?: string
  bet_type?: string
  verification_status?: string
  is_verified_seller?: boolean
  overall_rank?: number
  sport_rank?: number
  is_eligible?: boolean
  minimum_bets_met?: boolean
  is_monetized?: boolean
}

interface StrategiesTabProps {
  strategies: Strategy[]
  isLoading?: boolean
  currentFilters?: FilterOptions
  onCreateStrategy?: (
    strategy: Omit<
      Strategy,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'subscriber_count'
      | 'performance_roi'
      | 'performance_win_rate'
      | 'performance_total_bets'
      | 'roi_percentage'
      | 'win_rate'
      | 'total_bets'
      | 'winning_bets'
      | 'losing_bets'
      | 'push_bets'
      | 'primary_sport'
      | 'bet_type'
      | 'verification_status'
      | 'is_verified_seller'
      | 'overall_rank'
      | 'sport_rank'
      | 'is_eligible'
      | 'minimum_bets_met'
      | 'is_monetized'
    >
  ) => Promise<void>
  onUpdateStrategy?: (id: string, updates: Partial<Strategy>) => Promise<void>
  onDeleteStrategy?: (id: string) => Promise<void>
  onFiltersChange?: (filters: FilterOptions) => void
}

interface CreateStrategyForm {
  name: string
  description: string
}

export function StrategiesTab({
  strategies,
  isLoading = false,
  currentFilters,
  onCreateStrategy,
  onUpdateStrategy,
  onDeleteStrategy,
  onFiltersChange,
}: StrategiesTabProps) {
  console.log('StrategiesTab - strategies prop:', strategies)
  console.log('StrategiesTab - strategies length:', strategies?.length)
  console.log('StrategiesTab - isLoading:', isLoading)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateStrategyForm>({
    name: '',
    description: '',
  })
  const [validation, setValidation] = useState<StrategyValidationResult | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Validate current filters when modal opens or filters change
  const validateCurrentFilters = () => {
    if (currentFilters) {
      const result = validateStrategyFilters(currentFilters)
      setValidation(result)
      return result
    }
    return null
  }

  // Auto-fix filters to make them valid for strategy creation
  const autoFixFilters = () => {
    if (currentFilters && onFiltersChange) {
      const requiredChanges = getRequiredFilterChanges(currentFilters)
      const fixedFilters = { ...currentFilters, ...requiredChanges }
      onFiltersChange(fixedFilters)
      setValidation(validateStrategyFilters(fixedFilters))
    }
  }

  const handleCreateStrategy = async () => {
    if (!onCreateStrategy || !createForm.name || !currentFilters) return

    const validationResult = validateStrategyFilters(currentFilters)

    if (!validationResult.isValid) {
      setValidation(validationResult)
      return
    }

    setIsCreating(true)
    try {
      await onCreateStrategy({
        name: createForm.name,
        description: createForm.description,
        filters: currentFilters,
        monetized: false,
      })
      setCreateForm({
        name: '',
        description: '',
      })
      setShowCreateModal(false)
      setValidation(null)
    } catch (error) {
      console.error('Error creating strategy:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenCreateModal = () => {
    setShowCreateModal(true)
    validateCurrentFilters()
  }

  const handleToggleMonetization = async (strategy: Strategy) => {
    if (!onUpdateStrategy) return

    await onUpdateStrategy(strategy.id, {
      monetized: !strategy.monetized,
    })
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!onDeleteStrategy || !confirm('Are you sure you want to delete this strategy?')) return

    await onDeleteStrategy(strategyId)
  }


  const getFilterSummary = (filters: FilterOptions) => {
    if (!filters) return 'No filters applied'

    const parts = []
    if (filters.sports && filters.sports.length > 0) parts.push(`${filters.sports.length} sports`)
    if (filters.betTypes && filters.betTypes.length > 0)
      parts.push(`${filters.betTypes.length} bet types`)
    if (filters.sportsbooks && filters.sportsbooks.length > 0)
      parts.push(`${filters.sportsbooks.length} books`)
    return parts.length > 0 ? parts.join(', ') : 'No filters applied'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-6 h-12 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Enhanced with better spacing */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Betting Strategies</h2>
            <p className="text-lg text-slate-600 mt-2">Create and manage your custom betting strategies</p>
          </div>
          
          {/* Create Strategy Button - Moved higher and more prominent */}
          <Button 
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg px-6 py-3 text-lg font-medium"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Strategy
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center space-x-6 text-sm text-slate-600">
          <span className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
            {strategies.length} {strategies.length === 1 ? 'Strategy' : 'Strategies'}
          </span>
          {strategies.some(s => s.monetized) && (
            <span className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-600" />
              {strategies.filter(s => s.monetized).length} Monetized
            </span>
          )}
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogTrigger asChild>
          <div style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] mx-auto">
          <div className="flex h-full max-h-[90vh] w-full flex-col">
              {/* Header Section - Fixed */}
              <div className="flex-shrink-0 rounded-t-3xl border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6">
                <DialogHeader>
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-600 opacity-20 blur-xl"></div>
                        <TrueSharpShield className="relative h-16 w-16 drop-shadow-lg" />
                      </div>
                    </div>
                    <DialogTitle>
                      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 bg-clip-text text-3xl font-bold text-transparent">
                        Create New Strategy
                      </div>
                    </DialogTitle>
                    <div className="mx-auto max-w-lg text-base leading-relaxed text-gray-700">
                      Build a custom strategy from your current filters to track performance patterns and
                      identify winning opportunities with professional analytics
                    </div>
                  </div>
                </DialogHeader>
              </div>

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-8">
                {/* Validation Alert */}
                {validation?.isValid === false && (
                  <div className="animate-in fade-in-50 slide-in-from-top-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6 shadow-lg">
                    <div className="flex items-start space-x-4">
                      <div className="rounded-full bg-red-100 p-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-3 text-lg font-semibold text-red-900">Filter Validation Required</h4>
                        <div className="space-y-2">
                          {validation.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-800 flex items-center">
                              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              {error}
                            </p>
                          ))}
                        </div>
                        {onFiltersChange && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                            onClick={autoFixFilters}
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
                            Auto-Fix Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy Details Form */}
                <div className="space-y-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg">
                  <div className="space-y-4">
                    <label className="flex items-center text-lg font-semibold text-gray-900">
                      <div className="mr-3 rounded-lg bg-blue-100 p-2">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      Strategy Name 
                      <span className="ml-2 text-red-500">*</span>
                    </label>
                    <Input
                      value={createForm.name}
                      onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g., NBA Favorites, NFL Underdogs, MLB Over Strategy"
                      className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-lg font-medium shadow-sm transition-all duration-300 placeholder:text-gray-400 focus:border-blue-500 focus:shadow-lg focus:ring-4 focus:ring-blue-200"
                    />
                    <div className="flex items-center rounded-lg bg-blue-50 p-3">
                      <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Choose a descriptive name that reflects your betting approach and strategy focus
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center text-lg font-semibold text-gray-900">
                      <div className="mr-3 rounded-lg bg-purple-100 p-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                      </div>
                      Strategy Description
                      <span className="ml-3 text-base font-normal text-gray-500">(Optional)</span>
                    </label>
                    <Textarea
                      value={createForm.description}
                      onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Describe your strategy's logic, target situations, key criteria, or any specific methodology you follow..."
                      rows={5}
                      className="w-full resize-none rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-base leading-relaxed shadow-sm transition-all duration-300 placeholder:text-gray-400 focus:border-purple-500 focus:shadow-lg focus:ring-4 focus:ring-purple-200"
                    />
                    <div className="flex items-center rounded-lg bg-purple-50 p-3">
                      <Filter className="mr-2 h-4 w-4 text-purple-600" />
                      <p className="text-sm text-purple-700">
                        Provide optional details about your strategy approach, methodology, and key insights
                      </p>
                    </div>
                  </div>
              </div>

                {/* Current Filters Preview */}
                {currentFilters && (
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8 shadow-xl">
                    <div className="mb-6 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-indigo-600 opacity-30 blur-lg"></div>
                        <div className="relative rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 p-3 shadow-lg">
                          <Filter className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <h4 className="mb-6 text-center text-2xl font-bold text-gray-900">
                      Strategy Filters Preview
                    </h4>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {currentFilters.sports &&
                        currentFilters.sports.length > 0 &&
                        !currentFilters.sports.includes('All') && (
                          <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="mb-3 flex items-center text-base font-semibold text-blue-800">
                              <span className="mr-2 h-2 w-2 rounded-full bg-blue-600"></span>
                              Sports
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentFilters.sports.map(sport => (
                                <Badge key={sport} variant="secondary" className="rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200">
                                  {sport}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      {currentFilters.betTypes &&
                        currentFilters.betTypes.length > 0 &&
                        !currentFilters.betTypes.includes('All') && (
                          <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="mb-3 flex items-center text-base font-semibold text-green-800">
                              <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                              Bet Types
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentFilters.betTypes.map(type => (
                                <Badge key={type} variant="secondary" className="rounded-full bg-green-100 text-green-800 hover:bg-green-200">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      {currentFilters.leagues &&
                        currentFilters.leagues.length > 0 &&
                        !currentFilters.leagues.includes('All') && (
                          <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="mb-3 flex items-center text-base font-semibold text-purple-800">
                              <span className="mr-2 h-2 w-2 rounded-full bg-purple-600"></span>
                              Leagues
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentFilters.leagues.map(league => (
                                <Badge key={league} variant="secondary" className="rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200">
                                  {league}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      {currentFilters.statuses &&
                        currentFilters.statuses.length > 0 &&
                        !currentFilters.statuses.includes('All') && (
                          <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="mb-3 flex items-center text-base font-semibold text-orange-800">
                              <span className="mr-2 h-2 w-2 rounded-full bg-orange-600"></span>
                              Status
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentFilters.statuses.map(status => (
                                <Badge key={status} variant="secondary" className="rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200">
                                  {status}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                    {!currentFilters.sports?.some(s => s !== 'All') &&
                      !currentFilters.betTypes?.some(t => t !== 'All') &&
                      !currentFilters.leagues?.some(l => l !== 'All') &&
                      !currentFilters.statuses?.some(s => s !== 'All') && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <Filter className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-gray-600">
                            No specific filters applied
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Strategy will include all bets in your history
                          </p>
                        </div>
                      )}
                  </div>
                )}

              </div>
            </div>

              {/* Footer Section - Fixed */}
              <div className="flex-shrink-0 rounded-b-3xl border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex w-full justify-center space-x-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="min-w-[140px] border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStrategy}
                    disabled={!createForm.name || validation?.isValid === false || isCreating}
                    className="min-w-[180px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 disabled:scale-100 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <div className="flex items-center">
                        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creating Strategy...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Target className="mr-3 h-5 w-5" />
                        Create Strategy
                      </div>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center space-x-2 rounded-full bg-white px-6 py-3 shadow-sm">
                  <TrueSharpShield className="h-5 w-5" />
                  <span className="text-sm font-medium text-gray-600">Powered by TrueSharp Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Strategies Grid */}
      {strategies.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map(strategy => (
            <Card key={strategy.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-lg">{strategy.name}</CardTitle>
                    {strategy.description && (
                      <p className="mb-3 text-sm text-gray-600">{strategy.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleMonetization(strategy)}
                    >
                      {strategy.monetized ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-3 flex items-center space-x-2">
                  <Badge variant={strategy.monetized ? 'default' : 'secondary'}>
                    {strategy.monetized ? 'Monetized' : 'Personal'}
                  </Badge>

                  {strategy.is_verified_seller && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}

                  {strategy.verification_status === 'premium' && (
                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                      ⭐ Premium
                    </Badge>
                  )}

                  {strategy.is_eligible && (
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      Eligible
                    </Badge>
                  )}
                </div>

                <div className="mb-3 flex items-center space-x-2">
                  {strategy.primary_sport && (
                    <Badge variant="outline" className="text-xs">
                      🏈 {strategy.primary_sport}
                    </Badge>
                  )}

                  {strategy.bet_type && (
                    <Badge variant="outline" className="text-xs">
                      🎯 {strategy.bet_type}
                    </Badge>
                  )}

                  {strategy.start_date && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                    >
                      📅 Since{' '}
                      {new Date(strategy.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Badge>
                  )}

                  <Badge variant="outline" className="text-xs">
                    <Filter className="mr-1 h-3 w-3" />
                    {getFilterSummary(strategy.filters)}
                  </Badge>
                </div>

                {/* Ranking Information */}
                {(strategy.overall_rank || strategy.sport_rank) && (
                  <div className="mb-3 flex items-center space-x-4 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-2">
                    {strategy.overall_rank && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-yellow-700">Overall Rank</p>
                        <p className="text-sm font-bold text-yellow-800">
                          #{strategy.overall_rank}
                        </p>
                      </div>
                    )}
                    {strategy.sport_rank && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-yellow-700">
                          {strategy.primary_sport} Rank
                        </p>
                        <p className="text-sm font-bold text-yellow-800">#{strategy.sport_rank}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {/* Performance Metrics - Enhanced with Leaderboard Data */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="mb-1 flex items-center justify-center">
                      <Target className="mr-1 h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-600">Total Bets</p>
                    <p className="text-lg font-bold">{strategy.total_bets || 0}</p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="mb-1 flex items-center justify-center">
                      <BarChart3 className="mr-1 h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-600">Win Rate</p>
                    <p className="text-lg font-bold">
                      {((strategy.win_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="mb-1 flex items-center justify-center">
                      {strategy.minimum_bets_met ? (
                        <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="mr-1 h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Min Bets</p>
                    <p
                      className={`text-sm font-bold ${strategy.minimum_bets_met ? 'text-green-600' : 'text-yellow-600'}`}
                    >
                      {strategy.minimum_bets_met ? 'Met' : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Detailed Bet Breakdown */}
                {strategy.winning_bets !== undefined && strategy.losing_bets !== undefined && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded border border-green-200 bg-green-50 p-2 text-center">
                      <p className="text-xs text-green-700">Wins</p>
                      <p className="text-sm font-bold text-green-800">{strategy.winning_bets}</p>
                    </div>
                    <div className="rounded border border-red-200 bg-red-50 p-2 text-center">
                      <p className="text-xs text-red-700">Losses</p>
                      <p className="text-sm font-bold text-red-800">{strategy.losing_bets}</p>
                    </div>
                    {strategy.push_bets !== undefined && strategy.push_bets > 0 ? (
                      <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-700">Pushes</p>
                        <p className="text-sm font-bold text-gray-800">{strategy.push_bets}</p>
                      </div>
                    ) : (
                      <div className="rounded border border-blue-200 bg-blue-50 p-2 text-center">
                        <p className="text-xs text-blue-700">Record</p>
                        <p className="text-sm font-bold text-blue-800">
                          {strategy.winning_bets}-{strategy.losing_bets}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ROI Display - Enhanced */}
                <div className="mb-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center">
                    {(strategy.roi_percentage || 0) >= 0 ? (
                      <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">Return on Investment</span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${(strategy.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {(strategy.roi_percentage || 0) >= 0 ? '+' : ''}
                    {(strategy.roi_percentage || 0).toFixed(2)}%
                  </p>
                  {(strategy.total_bets || 0) >= 50 && (strategy.roi_percentage || 0) > 10 && (
                    <p className="mt-1 text-xs font-medium text-green-700">🔥 Hot Strategy</p>
                  )}
                </div>

                {strategy.monetized && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subscribers:</span>
                      <span className="flex items-center font-medium">
                        <Users className="mr-1 h-4 w-4" />
                        {strategy.subscriber_count}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Monthly Revenue:</span>
                      <span className="font-medium text-green-600">
                        ${((strategy.pricing_monthly || 0) * strategy.subscriber_count).toFixed(0)}
                      </span>
                    </div>

                    {strategy.pricing_monthly && (
                      <div className="text-center text-xs text-gray-500">
                        ${strategy.pricing_monthly}/month per subscriber
                      </div>
                    )}
                  </div>
                )}

                {!strategy.monetized &&
                  (strategy.total_bets || 0) >= 50 &&
                  (strategy.roi_percentage || 0) > 5 && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-center text-sm text-green-800">
                        🎉 Great performance! Consider enabling monetization.
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No Strategies Yet</h3>
            <p className="mb-6 text-gray-600">
              Create your first betting strategy to start tracking specific bet types and
              performance patterns.
            </p>
            <Button onClick={handleOpenCreateModal} disabled={!currentFilters}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Strategy
            </Button>
            {!currentFilters && (
              <p className="mt-2 text-sm text-gray-500">
                Set some filters in the analytics page to create a strategy
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strategy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>How Strategies Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="mb-2 font-medium">1. Define Filters</h4>
              <p className="text-gray-600">
                Set specific criteria for sports, bet types, and other parameters to automatically
                categorize your bets.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mb-2 font-medium">2. Track Performance</h4>
              <p className="text-gray-600">
                Monitor ROI, win rates, and other key metrics for each strategy to identify your
                most profitable approaches.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="mb-2 font-medium">3. Monetize (Optional)</h4>
              <p className="text-gray-600">
                Share profitable strategies with subscribers and earn revenue from your betting
                expertise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
