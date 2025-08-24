"use client"

import React, { useState, useEffect } from 'react'
import { 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
  Copy,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  Percent,
  BarChart3,
  Timer
} from 'lucide-react'
import { PickFeedProps, SubscriptionPick } from '@/types/subscriptions'

export function PickFeed({ 
  subscriptionId, 
  picks, 
  isLoading = false, 
  onCopyBet,
  showCopyButton = true 
}: PickFeedProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost' | 'void'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence' | 'odds'>('newest')
  const [expandedPicks, setExpandedPicks] = useState<Set<string>>(new Set())

  const filteredPicks = picks
    ?.filter(pick => {
      if (statusFilter !== 'all' && pick.bet.status !== statusFilter) {
        return false
      }

      if (timeframe !== 'all') {
        const pickDate = new Date(pick.posted_at)
        const now = new Date()
        const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
        const cutoff = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
        
        if (pickDate < cutoff) {
          return false
        }
      }

      return true
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
        case 'confidence':
          return (b.bet.confidence || 0) - (a.bet.confidence || 0)
        case 'odds':
          return Math.abs(b.bet.odds) - Math.abs(a.bet.odds)
        case 'newest':
        default:
          return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
      }
    }) || []

  const toggleExpanded = (pickId: string) => {
    const newExpanded = new Set(expandedPicks)
    if (newExpanded.has(pickId)) {
      newExpanded.delete(pickId)
    } else {
      newExpanded.add(pickId)
    }
    setExpandedPicks(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'lost':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'void':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'lost':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'void':
        return 'bg-gray-50 text-gray-800 border-gray-200'
      case 'pending':
      default:
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
  }

  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getSportIcon = (sport: string) => {
    // This could be expanded with actual sport icons
    switch (sport.toLowerCase()) {
      case 'nfl':
      case 'football':
        return '🏈'
      case 'nba':
      case 'basketball':
        return '🏀'
      case 'mlb':
      case 'baseball':
        return '⚾'
      case 'nhl':
      case 'hockey':
        return '🏒'
      case 'soccer':
        return '⚽'
      case 'tennis':
        return '🎾'
      case 'golf':
        return '⛳'
      case 'mma':
        return '🥊'
      default:
        return '🎯'
    }
  }

  if (isLoading) {
    return <PickFeedLoading />
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All picks</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="confidence">Highest confidence</option>
              <option value="odds">Highest odds</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredPicks.length} pick{filteredPicks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Picks List */}
      {filteredPicks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No picks found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' || timeframe !== 'all' 
              ? 'Try adjusting your filters to see more picks'
              : 'No picks have been posted yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPicks.map((pick) => (
            <PickCard 
              key={pick.id}
              pick={pick}
              isExpanded={expandedPicks.has(pick.id)}
              onToggleExpanded={() => toggleExpanded(pick.id)}
              onCopyBet={onCopyBet}
              showCopyButton={showCopyButton}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PickCardProps {
  pick: SubscriptionPick
  isExpanded: boolean
  onToggleExpanded: () => void
  onCopyBet: (pickId: string) => void
  showCopyButton: boolean
}

function PickCard({ pick, isExpanded, onToggleExpanded, onCopyBet, showCopyButton }: PickCardProps) {
  const bet = pick.bet
  const isSettled = ['won', 'lost', 'void'].includes(bet.status)
  const isPending = bet.status === 'pending'

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'lost':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'void':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'lost':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'void':
        return 'bg-gray-50 text-gray-800 border-gray-200'
      case 'pending':
      default:
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
  }

  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'nfl':
      case 'football':
        return '🏈'
      case 'nba':
      case 'basketball':
        return '🏀'
      case 'mlb':
      case 'baseball':
        return '⚾'
      case 'nhl':
      case 'hockey':
        return '🏒'
      case 'soccer':
        return '⚽'
      case 'tennis':
        return '🎾'
      case 'golf':
        return '⛳'
      case 'mma':
        return '🥊'
      default:
        return '🎯'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">{getSportIcon(bet.sport)}</div>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-600">{bet.sport}</span>
                {bet.league && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{bet.league}</span>
                  </>
                )}
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  {new Date(pick.posted_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">
                {bet.home_team && bet.away_team 
                  ? `${bet.away_team} @ ${bet.home_team}`
                  : bet.bet_description
                }
              </h3>
              
              <p className="text-gray-600 mt-1">{bet.bet_description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bet.status)}`}>
              {getStatusIcon(bet.status)}
              <span className="ml-2 capitalize">{bet.status}</span>
            </div>

            {/* Copy Button */}
            {showCopyButton && isPending && pick.copyBetStatus && !pick.copyBetStatus.copied && (
              <button
                onClick={() => onCopyBet(pick.id)}
                className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Bet
              </button>
            )}

            {/* Already Copied Indicator */}
            {pick.copyBetStatus?.copied && (
              <div className="inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-1" />
                Copied
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Odds */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Percent className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                {formatOdds(bet.odds)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Odds</p>
          </div>

          {/* Stake */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                ${bet.stake.toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Stake</p>
          </div>

          {/* Potential Payout */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                ${bet.potential_payout.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500">To Win</p>
          </div>

          {/* Confidence */}
          {bet.confidence && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-lg font-bold text-gray-900">
                  {bet.confidence}/5
                </span>
              </div>
              <p className="text-xs text-gray-500">Confidence</p>
            </div>
          )}
        </div>

        {/* Line Value */}
        {bet.line_value && (
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">Line: </span>
            <span className="text-sm font-medium text-gray-900">
              {bet.line_value > 0 ? `+${bet.line_value}` : bet.line_value}
            </span>
          </div>
        )}

        {/* Result (if settled) */}
        {isSettled && bet.profit !== undefined && (
          <div className="text-center p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Result:</span>
              <span className={`text-lg font-bold ${
                bet.profit > 0 ? 'text-green-600' : bet.profit < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onToggleExpanded}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Pick ID:</span>
                <p className="text-gray-900 font-mono text-xs">{pick.id}</p>
              </div>
              
              <div>
                <span className="text-gray-500">Posted:</span>
                <p className="text-gray-900">{new Date(pick.posted_at).toLocaleString()}</p>
              </div>

              {bet.game_date && (
                <div>
                  <span className="text-gray-500">Game Date:</span>
                  <p className="text-gray-900">{new Date(bet.game_date).toLocaleString()}</p>
                </div>
              )}

              {bet.settled_at && (
                <div>
                  <span className="text-gray-500">Settled:</span>
                  <p className="text-gray-900">{new Date(bet.settled_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {bet.prop_type && (
              <div>
                <span className="text-gray-500">Prop Type:</span>
                <p className="text-gray-900">{bet.prop_type}</p>
              </div>
            )}

            {bet.Player_name && (
              <div>
                <span className="text-gray-500">Player:</span>
                <p className="text-gray-900">{bet.Player_name}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PickFeedLoading() {
  return (
    <div className="space-y-6">
      {/* Filters Loading */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      </div>

      {/* Pick Cards Loading */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-48 mb-1 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}