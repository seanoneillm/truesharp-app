// src/components/bets/bet-card.tsx
import { CheckCircle, Clock, XCircle, MoreHorizontal, ExternalLink } from 'lucide-react'

interface BetCardProps {
  id: string
  description: string
  odds: string
  stake: string
  status: 'won' | 'lost' | 'pending' | 'void' | 'cancelled'
  payout?: string
  sport: string
  date: string
  game: string
  sportsbook: string
  betType: string
  potentialPayout?: string
  actualPayout?: string
  isPublic?: boolean
  onEdit?: () => void
  onShare?: () => void
  onMakePublic?: () => void
}

function getSportBadgeColor(sport: string) {
  switch (sport) {
    case 'NBA':
      return 'bg-orange-100 text-orange-800'
    case 'NFL':
      return 'bg-green-100 text-green-800'
    case 'MLB':
      return 'bg-blue-100 text-blue-800'
    case 'NHL':
      return 'bg-purple-100 text-purple-800'
    case 'SOCCER':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'won':
      return 'bg-green-100 text-green-800'
    case 'lost':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'void':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPayoutColor(status: string) {
  switch (status) {
    case 'won':
      return 'text-green-600'
    case 'lost':
      return 'text-red-600'
    case 'void':
      return 'text-gray-600'
    case 'cancelled':
      return 'text-gray-600'
    default:
      return 'text-gray-500'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'won':
      return <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
    case 'lost':
      return <XCircle className="mr-1 h-4 w-4 text-red-500" />
    case 'pending':
      return <Clock className="mr-1 h-4 w-4 text-yellow-500" />
    case 'void':
      return <XCircle className="mr-1 h-4 w-4 text-gray-500" />
    case 'cancelled':
      return <XCircle className="mr-1 h-4 w-4 text-gray-500" />
    default:
      return null
  }
}

function getBetTypeDisplay(betType: string) {
  switch (betType) {
    case 'spread':
      return 'Point Spread'
    case 'moneyline':
      return 'Moneyline'
    case 'total':
      return 'Over/Under'
    case 'prop':
      return 'Player Prop'
    default:
      return betType
  }
}

export default function BetCard({
  id,
  description,
  odds,
  stake,
  status,
  payout,
  sport,
  date,
  game,
  sportsbook,
  betType,
  potentialPayout,
  actualPayout,
  isPublic = false,
  onEdit,
  onShare,
  onMakePublic,
}: BetCardProps) {
  const displayPayout = payout || actualPayout || potentialPayout || 'TBD'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSportBadgeColor(sport)}`}
          >
            {sport}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {getBetTypeDisplay(betType)}
          </span>
          {isPublic && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Public
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{date}</span>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bet Details */}
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{description}</h3>
        <p className="mb-2 text-sm text-gray-600">{game}</p>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Odds: {odds}</span>
          <span>•</span>
          <span>Stake: {stake}</span>
          <span>•</span>
          <span className="flex items-center">
            <ExternalLink className="mr-1 h-3 w-3" />
            {sportsbook}
          </span>
        </div>
      </div>

      {/* Status and Payout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon(status)}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${getPayoutColor(status)}`}>{displayPayout}</p>
          {status === 'pending' && potentialPayout && (
            <p className="text-xs text-gray-500">Potential: {potentialPayout}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button onClick={onEdit} className="text-xs text-blue-600 hover:text-blue-500">
                Edit
              </button>
            )}
            {onShare && (
              <button onClick={onShare} className="text-xs text-gray-600 hover:text-gray-500">
                Share
              </button>
            )}
          </div>
          {onMakePublic && !isPublic && (
            <button onClick={onMakePublic} className="text-xs text-green-600 hover:text-green-500">
              Make Public
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
