'use client'

import { OpenBet, formatBetForDisplay } from '@/lib/queries/open-bets'
import { Calendar, Clock, DollarSign, Target, TrendingUp, Trophy, Zap } from 'lucide-react'

interface OpenBetsDisplayProps {
  bets: OpenBet[]
  title?: string
  showTitle?: boolean
  compact?: boolean
  className?: string
}

export function OpenBetsDisplay({
  bets,
  title = 'Open Bets',
  showTitle = true,
  compact = false,
  className = '',
}: OpenBetsDisplayProps) {
  if (!bets || bets.length === 0) {
    return (
      <div className={`rounded-lg bg-gray-50 p-4 text-center ${className}`}>
        <Clock className="mx-auto mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm text-gray-600">No open bets</p>
      </div>
    )
  }

  // Show all bets in a scrollable container instead of limiting with maxBets
  const displayBets = bets
  const shouldScroll = bets.length > 3 // Enable scrolling if more than 3 bets

  const totalPotentialProfit = bets.reduce((sum, bet) => {
    return sum + Math.max(0, bet.potential_payout - bet.stake)
  }, 0)

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h4 className="flex items-center font-semibold text-gray-900">
            <Zap className="mr-2 h-4 w-4 text-orange-500" />
            {title} ({bets.length})
          </h4>
          {!compact && (
            <div className="text-sm font-medium text-green-600">
              Potential: +${totalPotentialProfit.toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div className={`space-y-2 ${shouldScroll ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
        {displayBets.map(bet => {
          const formattedBet = formatBetForDisplay(bet)
          return <OpenBetCard key={bet.id} bet={formattedBet} compact={compact} />
        })}
      </div>

      {shouldScroll && (
        <div className="border-t border-gray-100 pt-2 text-center text-xs text-gray-400">
          ↕ Scroll to view all {bets.length} bets
        </div>
      )}
    </div>
  )
}

interface OpenBetCardProps {
  bet: ReturnType<typeof formatBetForDisplay>
  compact?: boolean
}

function OpenBetCard({ bet, compact = false }: OpenBetCardProps) {
  const getBetTypeIcon = (betType: string) => {
    switch (betType.toLowerCase()) {
      case 'moneyline':
      case 'ml':
        return <Trophy className="h-3 w-3 text-blue-500" />
      case 'spread':
      case 'point_spread':
        return <Target className="h-3 w-3 text-green-500" />
      case 'total':
      case 'over_under':
        return <TrendingUp className="h-3 w-3 text-purple-500" />
      default:
        return <Target className="h-3 w-3 text-gray-500" />
    }
  }

  const getBetTypeColor = (betType: string) => {
    switch (betType.toLowerCase()) {
      case 'moneyline':
      case 'ml':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'spread':
      case 'point_spread':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'total':
      case 'over_under':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2 transition-colors hover:border-gray-200">
        <div className="flex min-w-0 flex-1 items-center space-x-2">
          {getBetTypeIcon(bet.bet_type)}
          <div className="truncate text-sm">
            <span className="font-medium">{bet.gameInfo}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span className="font-medium">{bet.oddsDisplay}</span>
          <span className="text-green-600">+${bet.potentialProfit.toFixed(0)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getBetTypeColor(bet.bet_type)}`}
          >
            {getBetTypeIcon(bet.bet_type)}
            <span className="ml-1">{bet.bet_type.toUpperCase()}</span>
          </span>
          {bet.sport && (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">{bet.sport}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">{bet.oddsDisplay}</div>
          <div className="text-xs text-gray-500">${bet.stake}</div>
        </div>
      </div>

      <div className="mb-2">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">{bet.gameInfo}</p>
        {bet.line_value && (
          <p className="text-xs text-gray-600">
            Line: {bet.line_value > 0 ? '+' : ''}
            {bet.line_value}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          {bet.gameTime && (
            <div className="flex items-center text-gray-500">
              <Calendar className="mr-1 h-3 w-3" />
              {bet.gameTime}
            </div>
          )}
          {bet.sportsbook && <span className="text-gray-500">{bet.sportsbook}</span>}
        </div>
        <div className="flex items-center font-medium text-green-600">
          <DollarSign className="h-3 w-3" />+{bet.potentialProfit.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

/**
 * Summary component showing aggregated open bets info
 */
interface OpenBetsSummaryProps {
  bets: OpenBet[]
  className?: string
}

export function OpenBetsSummary({ bets, className = '' }: OpenBetsSummaryProps) {
  if (!bets || bets.length === 0) {
    return null
  }

  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalPotentialPayout = bets.reduce((sum, bet) => sum + bet.potential_payout, 0)
  const totalPotentialProfit = totalPotentialPayout - totalStake

  return (
    <div
      className={`grid grid-cols-3 gap-3 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-3 ${className}`}
    >
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{bets.length}</div>
        <div className="text-xs text-gray-600">Open Bets</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">${totalStake.toFixed(0)}</div>
        <div className="text-xs text-gray-600">Total Staked</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-600">+${totalPotentialProfit.toFixed(0)}</div>
        <div className="text-xs text-gray-600">Potential Profit</div>
      </div>
    </div>
  )
}
