'use client'

import React from 'react'
import { Clock, Target, TrendingUp, Calendar, Trophy, Zap } from 'lucide-react'
import { OpenBet, formatBetForDisplay } from '@/lib/queries/open-bets'

interface SubscriberOpenBetsDisplayProps {
  bets: OpenBet[]
  title?: string
  showTitle?: boolean
  maxBets?: number
  className?: string
}

export function SubscriberOpenBetsDisplay({
  bets,
  title = 'Current Open Bets',
  showTitle = true,
  maxBets = 5,
  className = '',
}: SubscriberOpenBetsDisplayProps) {
  if (!bets || bets.length === 0) {
    return (
      <div className={`rounded-lg bg-gray-50 p-4 text-center ${className}`}>
        <Clock className="mx-auto mb-2 h-5 w-5 text-gray-400" />
        <p className="text-sm text-gray-600">No open bets</p>
      </div>
    )
  }

  const displayBets = bets.slice(0, maxBets)
  const hasMoreBets = bets.length > maxBets

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h4 className="flex items-center font-semibold text-gray-900">
            <Zap className="mr-2 h-4 w-4 text-orange-500" />
            {title} ({bets.length})
          </h4>
        </div>
      )}

      <div className="space-y-2">
        {displayBets.map(bet => {
          const formattedBet = formatBetForDisplay(bet)
          return <SubscriberBetCard key={bet.id} bet={formattedBet} />
        })}
      </div>

      {hasMoreBets && (
        <div className="border-t border-gray-100 pt-2 text-center text-xs text-gray-500">
          +{bets.length - maxBets} more bet{bets.length - maxBets !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

interface SubscriberBetCardProps {
  bet: ReturnType<typeof formatBetForDisplay>
}

function SubscriberBetCard({ bet }: SubscriberBetCardProps) {
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

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex flex-1 items-center space-x-2">
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
        </div>
      </div>

      <div className="mb-2">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">{bet.gameInfo}</p>
        {bet.home_team && bet.away_team && (
          <p className="mt-1 text-xs text-gray-600">
            {bet.away_team} @ {bet.home_team}
          </p>
        )}
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
      </div>
    </div>
  )
}

/**
 * Summary component showing aggregated open bets info (subscriber-friendly)
 */
interface SubscriberOpenBetsSummaryProps {
  bets: OpenBet[]
  className?: string
}

export function SubscriberOpenBetsSummary({
  bets,
  className = '',
}: SubscriberOpenBetsSummaryProps) {
  if (!bets || bets.length === 0) {
    return null
  }

  // Count by bet type for subscribers
  const betTypeCounts = bets.reduce(
    (counts, bet) => {
      const type = bet.bet_type.toLowerCase()
      counts[type] = (counts[type] || 0) + 1
      return counts
    },
    {} as Record<string, number>
  )

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{bets.length}</div>
          <div className="text-xs text-gray-600">Open Picks</div>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(betTypeCounts).map(([type, count]) => (
            <span key={type} className="rounded border bg-white px-2 py-1 text-xs">
              {count} {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
