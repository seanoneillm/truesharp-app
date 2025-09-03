'use client'

import { PickFeedProps, SubscriptionPick } from '@/types/subscriptions'
import {
  // ExternalLink, // TS6133: unused import
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Eye,
  // RefreshCw, // TS6133: unused import
  Filter,
  Percent,
  // TrendingDown, // TS6133: unused import
  Star,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useState /*, useEffect*/ } from 'react' // TS6133: useEffect unused

export function PickFeed({
  // subscriptionId, // TS6133: unused parameter
  picks,
  isLoading = false,
  onCopyBet,
  showCopyButton = true,
}: PickFeedProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost' | 'void'>(
    'all'
  )
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence' | 'odds'>('newest')
  const [expandedPicks, setExpandedPicks] = useState<Set<string>>(new Set())

  const filteredPicks =
    picks
      ?.filter(pick => {
        if (statusFilter !== 'all' && pick.bet.status !== statusFilter) {
          return false
        }

        if (timeframe !== 'all') {
          const pickDate = new Date(pick.posted_at)
          const now = new Date()
          const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
          const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

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

  // const getStatusIcon = (status: string) => { // TS6133: unused function
  //   switch (status) {
  //     case 'won':
  //       return <CheckCircle className="h-5 w-5 text-green-500" />
  //     case 'lost':
  //       return <XCircle className="h-5 w-5 text-red-500" />
  //     case 'void':
  //       return <AlertTriangle className="h-5 w-5 text-gray-500" />
  //     case 'pending':
  //     default:
  //       return <Clock className="h-5 w-5 text-yellow-500" />
  //   }
  // }

  // const getStatusColor = (status: string) => { // TS6133: unused function
  //   switch (status) {
  //     case 'won':
  //       return 'bg-green-50 text-green-800 border-green-200'
  //     case 'lost':
  //       return 'bg-red-50 text-red-800 border-red-200'
  //     case 'void':
  //       return 'bg-gray-50 text-gray-800 border-gray-200'
  //     case 'pending':
  //     default:
  //       return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  //   }
  // }

  // const formatOdds = (odds: number) => { // TS6133: unused function
  //   if (odds > 0) return `+${odds}`
  //   return odds.toString()
  // }

  // const formatCurrency = (amount: number) => { // TS6133: unused function
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 2,
  //   }).format(amount)
  // }

  // const getSportIcon = (sport: string) => { // TS6133: unused function
  //   // This could be expanded with actual sport icons
  //   switch (sport.toLowerCase()) {
  //     case 'nfl':
  //     case 'football':
  //       return '🏈'
  //     case 'nba':
  //     case 'basketball':
  //       return '🏀'
  //     case 'mlb':
  //     case 'baseball':
  //       return '⚾'
  //     case 'nhl':
  //     case 'hockey':
  //       return '🏒'
  //     case 'soccer':
  //       return '⚽'
  //     case 'tennis':
  //       return '🎾'
  //     case 'golf':
  //       return '⛳'
  //     case 'mma':
  //       return '🥊'
  //     default:
  //       return '🎯'
  //   }
  // }

  if (isLoading) {
    return <PickFeedLoading />
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as typeof timeframe)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No picks found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' || timeframe !== 'all'
              ? 'Try adjusting your filters to see more picks'
              : 'No picks have been posted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPicks.map(pick => (
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

function PickCard({
  pick,
  isExpanded,
  onToggleExpanded,
  onCopyBet,
  showCopyButton,
}: PickCardProps) {
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">{getSportIcon(bet.sport)}</div>

            <div>
              <div className="mb-1 flex items-center space-x-2">
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
                  : bet.bet_description}
              </h3>

              <p className="mt-1 text-gray-600">{bet.bet_description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status */}
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(bet.status)}`}
            >
              {getStatusIcon(bet.status)}
              <span className="ml-2 capitalize">{bet.status}</span>
            </div>

            {/* Copy Button */}
            {showCopyButton && isPending && pick.copyBetStatus && !pick.copyBetStatus.copied && (
              <button
                onClick={() => onCopyBet(pick.id)}
                className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Copy className="mr-1 h-4 w-4" />
                Copy Bet
              </button>
            )}

            {/* Already Copied Indicator */}
            {pick.copyBetStatus?.copied && (
              <div className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                <CheckCircle className="mr-1 h-4 w-4" />
                Copied
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Odds */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <Percent className="mr-1 h-4 w-4 text-purple-500" />
              <span className="text-lg font-bold text-gray-900">{formatOdds(bet.odds)}</span>
            </div>
            <p className="text-xs text-gray-500">Odds</p>
          </div>

          {/* Stake */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <DollarSign className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-gray-900">${bet.stake.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-500">Stake</p>
          </div>

          {/* Potential Payout */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <TrendingUp className="mr-1 h-4 w-4 text-blue-500" />
              <span className="text-lg font-bold text-gray-900">
                ${bet.potential_payout.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500">To Win</p>
          </div>

          {/* Confidence */}
          {bet.confidence && (
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                <span className="text-lg font-bold text-gray-900">{bet.confidence}/5</span>
              </div>
              <p className="text-xs text-gray-500">Confidence</p>
            </div>
          )}
        </div>

        {/* Line Value */}
        {bet.line_value && (
          <div className="mb-4 text-center">
            <span className="text-sm text-gray-500">Line: </span>
            <span className="text-sm font-medium text-gray-900">
              {bet.line_value > 0 ? `+${bet.line_value}` : bet.line_value}
            </span>
          </div>
        )}

        {/* Result (if settled) */}
        {isSettled && bet.profit !== undefined && (
          <div className="rounded-lg border bg-gray-50 p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Result:</span>
              <span
                className={`text-lg font-bold ${
                  bet.profit > 0
                    ? 'text-green-600'
                    : bet.profit < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            onClick={onToggleExpanded}
            className="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <Eye className="mr-2 h-4 w-4" />
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Pick ID:</span>
                <p className="font-mono text-xs text-gray-900">{pick.id}</p>
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

            {(bet as any).prop_type && (
              <div>
                <span className="text-gray-500">Prop Type:</span>
                <p className="text-gray-900">{(bet as any).prop_type}</p>
              </div>
            )}

            {(bet as any).Player_name && (
              <div>
                <span className="text-gray-500">Player:</span>
                <p className="text-gray-900">{(bet as any).Player_name}</p>
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
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Pick Cards Loading */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                <div>
                  <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="mb-1 h-6 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="mb-1 h-6 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
