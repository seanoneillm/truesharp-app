'use client'

import React from 'react'
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Trophy,
  Zap
} from 'lucide-react'
import { OpenBet, formatBetForDisplay } from '@/lib/queries/open-bets'

interface OpenBetsDisplayProps {
  bets: OpenBet[]
  title?: string
  showTitle?: boolean
  maxBets?: number
  compact?: boolean
  className?: string
}

export function OpenBetsDisplay({ 
  bets, 
  title = "Open Bets", 
  showTitle = true,
  maxBets = 5,
  compact = false,
  className = ""
}: OpenBetsDisplayProps) {
  
  if (!bets || bets.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg text-center ${className}`}>
        <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No open bets</p>
      </div>
    )
  }

  const displayBets = bets.slice(0, maxBets)
  const hasMoreBets = bets.length > maxBets

  const totalPotentialProfit = bets.reduce((sum, bet) => {
    return sum + Math.max(0, bet.potential_payout - bet.stake)
  }, 0)

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-orange-500" />
            {title} ({bets.length})
          </h4>
          {!compact && (
            <div className="text-sm text-green-600 font-medium">
              Potential: +${totalPotentialProfit.toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {displayBets.map((bet) => {
          const formattedBet = formatBetForDisplay(bet)
          return (
            <OpenBetCard key={bet.id} bet={formattedBet} compact={compact} />
          )
        })}
      </div>

      {hasMoreBets && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          +{bets.length - maxBets} more bet{bets.length - maxBets !== 1 ? 's' : ''}
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
      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
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
    <div className="p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getBetTypeColor(bet.bet_type)}`}>
            {getBetTypeIcon(bet.bet_type)}
            <span className="ml-1">{bet.bet_type.toUpperCase()}</span>
          </span>
          {bet.sport && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {bet.sport}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">{bet.oddsDisplay}</div>
          <div className="text-xs text-gray-500">${bet.stake}</div>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {bet.gameInfo}
        </p>
        {bet.line_value && (
          <p className="text-xs text-gray-600">
            Line: {bet.line_value > 0 ? '+' : ''}{bet.line_value}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          {bet.gameTime && (
            <div className="flex items-center text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {bet.gameTime}
            </div>
          )}
          {bet.sportsbook && (
            <span className="text-gray-500">{bet.sportsbook}</span>
          )}
        </div>
        <div className="flex items-center text-green-600 font-medium">
          <DollarSign className="h-3 w-3" />
          +{bet.potentialProfit.toFixed(2)}
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

export function OpenBetsSummary({ bets, className = "" }: OpenBetsSummaryProps) {
  if (!bets || bets.length === 0) {
    return null
  }

  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalPotentialPayout = bets.reduce((sum, bet) => sum + bet.potential_payout, 0)
  const totalPotentialProfit = totalPotentialPayout - totalStake

  return (
    <div className={`grid grid-cols-3 gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 ${className}`}>
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