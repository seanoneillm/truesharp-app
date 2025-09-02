'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getRequiredFilterChanges, StrategyValidationResult, validateStrategyFilters } from '@/lib/utils/strategy-validation'
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
  Wand2
} from "lucide-react"

// TrueSharp Shield Component
const TrueSharpShield = ({ className = "h-8 w-8" }) => (
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
  onCreateStrategy?: (strategy: Omit<Strategy, 'id' | 'created_at' | 'updated_at' | 'subscriber_count' | 'performance_roi' | 'performance_win_rate' | 'performance_total_bets' | 'roi_percentage' | 'win_rate' | 'total_bets' | 'winning_bets' | 'losing_bets' | 'push_bets' | 'primary_sport' | 'bet_type' | 'verification_status' | 'is_verified_seller' | 'overall_rank' | 'sport_rank' | 'is_eligible' | 'minimum_bets_met' | 'is_monetized'>) => Promise<void>
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
  onFiltersChange
}: StrategiesTabProps) {
  console.log("StrategiesTab - strategies prop:", strategies);
  console.log("StrategiesTab - strategies length:", strategies?.length);
  console.log("StrategiesTab - isLoading:", isLoading);
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null)
  const [createForm, setCreateForm] = useState<CreateStrategyForm>({
    name: '',
    description: ''
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
        monetized: false
      })
      setCreateForm({
        name: '',
        description: ''
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
      monetized: !strategy.monetized
    })
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!onDeleteStrategy || !confirm('Are you sure you want to delete this strategy?')) return
    
    await onDeleteStrategy(strategyId)
  }

  const formatCurrency = (amount: number) => {
    return `$${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
  }

  const getFilterSummary = (filters: FilterOptions) => {
    if (!filters) return 'No filters applied'
    
    const parts = []
    if (filters.sports && filters.sports.length > 0) parts.push(`${filters.sports.length} sports`)
    if (filters.betTypes && filters.betTypes.length > 0) parts.push(`${filters.betTypes.length} bet types`)
    if (filters.sportsbooks && filters.sportsbooks.length > 0) parts.push(`${filters.sportsbooks.length} books`)
    return parts.length > 0 ? parts.join(', ') : 'No filters applied'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Betting Strategies</h2>
          <p className="text-gray-600">Create and manage your custom betting strategies</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto sm:max-w-3xl" style={{ transform: 'translateX(200px)' }}>
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <TrueSharpShield className="h-12 w-12" />
              </div>
              <DialogTitle>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  Create New Strategy
                </div>
              </DialogTitle>
              <div className="text-sm text-gray-600 max-w-md mx-auto">
                Build a custom strategy from your current filters to track performance patterns and identify winning opportunities
              </div>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              {/* Validation Alert */}
              {validation?.isValid === false && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 mb-2">Filter Validation Required</h4>
                      <div className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700">• {error}</p>
                        ))}
                      </div>
                      {onFiltersChange && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={autoFixFilters}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Auto-Fix Filters
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Details Form */}
              <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Strategy Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., NBA Favorites, NFL Underdogs, MLB Over Strategy"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base"
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Choose a descriptive name that reflects your betting approach
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-blue-600" />
                    Strategy Description
                    <span className="font-normal text-gray-500 ml-2">(Optional)</span>
                  </label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe your strategy's logic, target situations, or any specific criteria you focus on..."
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none text-base"
                  />
                  <p className="text-xs text-gray-500 flex items-center">
                    <Filter className="w-3 h-3 mr-1" />
                    Optional details about your strategy approach and methodology
                  </p>
                </div>
              </div>

              {/* Current Filters Preview */}
              {currentFilters && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-600 rounded-full p-2">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-4 text-center text-lg">
                    Strategy Filters Preview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {currentFilters.sports && currentFilters.sports.length > 0 && !currentFilters.sports.includes('All') && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="font-medium text-blue-700">Sports:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {currentFilters.sports.map(sport => (
                            <Badge key={sport} variant="secondary" className="text-xs">{sport}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentFilters.betTypes && currentFilters.betTypes.length > 0 && !currentFilters.betTypes.includes('All') && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="font-medium text-blue-700">Bet Types:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {currentFilters.betTypes.map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentFilters.leagues && currentFilters.leagues.length > 0 && !currentFilters.leagues.includes('All') && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="font-medium text-blue-700">Leagues:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {currentFilters.leagues.map(league => (
                            <Badge key={league} variant="secondary" className="text-xs">{league}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentFilters.statuses && currentFilters.statuses.length > 0 && !currentFilters.statuses.includes('All') && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <span className="font-medium text-blue-700">Status:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {currentFilters.statuses.map(status => (
                            <Badge key={status} variant="secondary" className="text-xs">{status}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {(!currentFilters.sports?.some(s => s !== 'All') && 
                    !currentFilters.betTypes?.some(t => t !== 'All') && 
                    !currentFilters.leagues?.some(l => l !== 'All') && 
                    !currentFilters.statuses?.some(s => s !== 'All')) && (
                    <div className="text-center text-gray-500 text-sm mt-2">
                      No specific filters applied - strategy will include all bets
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-gray-50 rounded-lg p-6 border-t border-gray-200">
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-base font-medium"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateStrategy}
                    disabled={!createForm.name || (validation?.isValid === false) || isCreating}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white min-w-[160px] shadow-lg text-base font-medium"
                  >
                    {isCreating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Strategy...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Create Strategy
                      </div>
                    )}
                  </Button>
                </div>
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500 flex items-center justify-center">
                    <TrueSharpShield className="h-4 w-4 mr-1" />
                    Powered by TrueSharp Analytics
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Create Strategy Section - Always Visible */}
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div>
          <h3 className="font-medium text-gray-900">Create New Strategy</h3>
          <p className="text-sm text-gray-600">Build a strategy from your current filters or create a new one</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {/* Strategies Grid */}
      {strategies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map(strategy => (
            <Card key={strategy.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{strategy.name}</CardTitle>
                    {strategy.description && (
                      <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleMonetization(strategy)}
                    >
                      {strategy.monetized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingStrategy(strategy)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <Badge variant={strategy.monetized ? "default" : "secondary"}>
                    {strategy.monetized ? 'Monetized' : 'Personal'}
                  </Badge>
                  
                  {strategy.is_verified_seller && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
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
                
                <div className="flex items-center space-x-2 mb-3">
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
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                      📅 Since {new Date(strategy.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {getFilterSummary(strategy.filters)}
                  </Badge>
                </div>
                
                {/* Ranking Information */}
                {(strategy.overall_rank || strategy.sport_rank) && (
                  <div className="flex items-center space-x-4 mb-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    {strategy.overall_rank && (
                      <div className="text-center">
                        <p className="text-xs text-yellow-700 font-medium">Overall Rank</p>
                        <p className="text-sm font-bold text-yellow-800">#{strategy.overall_rank}</p>
                      </div>
                    )}
                    {strategy.sport_rank && (
                      <div className="text-center">
                        <p className="text-xs text-yellow-700 font-medium">{strategy.primary_sport} Rank</p>
                        <p className="text-sm font-bold text-yellow-800">#{strategy.sport_rank}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {/* Performance Metrics - Enhanced with Leaderboard Data */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="w-4 h-4 text-gray-600 mr-1" />
                    </div>
                    <p className="text-xs text-gray-600">Total Bets</p>
                    <p className="text-lg font-bold">{strategy.total_bets || 0}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <BarChart3 className="w-4 h-4 text-gray-600 mr-1" />
                    </div>
                    <p className="text-xs text-gray-600">Win Rate</p>
                    <p className="text-lg font-bold">{((strategy.win_rate || 0) * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      {strategy.minimum_bets_met ? 
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" /> : 
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
                      }
                    </div>
                    <p className="text-xs text-gray-600">Min Bets</p>
                    <p className={`text-sm font-bold ${strategy.minimum_bets_met ? 'text-green-600' : 'text-yellow-600'}`}>
                      {strategy.minimum_bets_met ? 'Met' : 'Pending'}
                    </p>
                  </div>
                </div>
                
                {/* Detailed Bet Breakdown */}
                {strategy.winning_bets !== undefined && strategy.losing_bets !== undefined && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-700">Wins</p>
                      <p className="text-sm font-bold text-green-800">{strategy.winning_bets}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-red-700">Losses</p>
                      <p className="text-sm font-bold text-red-800">{strategy.losing_bets}</p>
                    </div>
                    {strategy.push_bets !== undefined && strategy.push_bets > 0 ? (
                      <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-700">Pushes</p>
                        <p className="text-sm font-bold text-gray-800">{strategy.push_bets}</p>
                      </div>
                    ) : (
                      <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700">Record</p>
                        <p className="text-sm font-bold text-blue-800">{strategy.winning_bets}-{strategy.losing_bets}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ROI Display - Enhanced */}
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4 border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    {(strategy.roi_percentage || 0) >= 0 ? 
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" /> : 
                      <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                    }
                    <span className="text-sm font-medium text-gray-700">Return on Investment</span>
                  </div>
                  <p className={`text-2xl font-bold ${(strategy.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(strategy.roi_percentage || 0) >= 0 ? '+' : ''}{(strategy.roi_percentage || 0).toFixed(2)}%
                  </p>
                  {(strategy.total_bets || 0) >= 50 && (strategy.roi_percentage || 0) > 10 && (
                    <p className="text-xs text-green-700 mt-1 font-medium">🔥 Hot Strategy</p>
                  )}
                </div>

                {strategy.monetized && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subscribers:</span>
                      <span className="font-medium flex items-center">
                        <Users className="w-4 h-4 mr-1" />
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
                      <div className="text-xs text-gray-500 text-center">
                        ${strategy.pricing_monthly}/month per subscriber
                      </div>
                    )}
                  </div>
                )}
                
                {!strategy.monetized && (strategy.total_bets || 0) >= 50 && (strategy.roi_percentage || 0) > 5 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 text-center">
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
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategies Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first betting strategy to start tracking specific bet types and performance patterns.
            </p>
            <Button onClick={handleOpenCreateModal} disabled={!currentFilters}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Strategy
            </Button>
            {!currentFilters && (
              <p className="text-sm text-gray-500 mt-2">
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
            <Target className="w-5 h-5" />
            <span>How Strategies Work</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">1. Define Filters</h4>
              <p className="text-gray-600">
                Set specific criteria for sports, bet types, and other parameters to automatically categorize your bets.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">2. Track Performance</h4>
              <p className="text-gray-600">
                Monitor ROI, win rates, and other key metrics for each strategy to identify your most profitable approaches.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">3. Monetize (Optional)</h4>
              <p className="text-gray-600">
                Share profitable strategies with subscribers and earn revenue from your betting expertise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}