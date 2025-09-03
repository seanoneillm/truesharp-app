'use client'

import { CopyBetButtonProps } from '@/types/subscriptions'
import {
  AlertCircle,
  Calculator,
  Check,
  Clock,
  Copy,
  DollarSign,
  Info,
  Loader2,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

export function CopyBetButton({
  pick,
  onCopy,
  disabled = false,
  // isLoading = false, // TS6133: unused parameter
}: CopyBetButtonProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const bet = pick.bet
  const isCopied = pick.copyBetStatus?.copied || false
  const isPending = bet.status === 'pending'
  const isDisabled = disabled || !isPending || isCopied || copying

  const handleCopy = async () => {
    if (isDisabled) return

    setCopying(true)
    try {
      await onCopy(pick.id)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    } catch (error) {
      console.error('Failed to copy bet:', error)
    } finally {
      setCopying(false)
    }
  }

  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`
    return odds.toString()
  }

  const calculateImpliedProbability = (odds: number) => {
    if (odds > 0) {
      return (100 / (odds + 100)) * 100
    } else {
      return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100
    }
  }

  // Show success state
  if (copySuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-center space-x-2 text-green-700">
          <Check className="h-5 w-5" />
          <span className="font-medium">Bet copied successfully!</span>
        </div>
        <p className="mt-1 text-center text-sm text-green-600">
          Check your bet slip to place the wager
        </p>
      </div>
    )
  }

  // Show already copied state
  if (isCopied) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-center space-x-2 text-blue-700">
          <Check className="h-5 w-5" />
          <span className="font-medium">Already copied</span>
        </div>
        {pick.copyBetStatus?.copiedAt && (
          <p className="mt-1 text-center text-sm text-blue-600">
            Copied on {new Date(pick.copyBetStatus.copiedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    )
  }

  // Show settled bet (can't copy)
  if (!isPending) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Clock className="h-5 w-5" />
          <span className="font-medium">Bet has been settled</span>
        </div>
        <p className="mt-1 text-center text-sm text-gray-500">Can only copy active bets</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Copy Button Header */}
      <div className="border-b border-gray-100 p-4">
        <button
          onClick={handleCopy}
          disabled={isDisabled}
          className={`flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
            isDisabled
              ? 'cursor-not-allowed bg-gray-100 text-gray-500'
              : 'active:scale-98 bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Copying Bet...</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              <span>Copy This Bet</span>
            </>
          )}
        </button>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-2 flex w-full items-center justify-center space-x-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <Info className="h-4 w-4" />
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>

      {/* Bet Details */}
      {showDetails && (
        <div className="bg-gray-50 p-4">
          <h4 className="mb-3 font-medium text-gray-900">Bet Details</h4>

          <div className="space-y-3">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-white p-3">
                <div className="mb-1 flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Stake</span>
                </div>
                <p className="text-lg font-bold text-gray-900">${bet.stake.toFixed(0)}</p>
              </div>

              <div className="rounded-lg border bg-white p-3">
                <div className="mb-1 flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">To Win</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ${bet.potential_payout.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Odds & Probability */}
            <div className="rounded-lg border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Odds</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{formatOdds(bet.odds)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Implied Probability</span>
                <span className="text-sm font-medium text-gray-700">
                  {calculateImpliedProbability(bet.odds).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Confidence Rating */}
            {bet.confidence && (
              <div className="rounded-lg border bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Confidence</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{bet.confidence}/5</span>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (bet.confidence || 0) ? 'fill-current text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Line Information */}
            {bet.line_value && (
              <div className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Line</span>
                  <span className="text-lg font-bold text-gray-900">
                    {bet.line_value > 0 ? `+${bet.line_value}` : bet.line_value}
                  </span>
                </div>
              </div>
            )}

            {/* Game Information */}
            <div className="rounded-lg border bg-white p-3">
              <h5 className="mb-2 font-medium text-gray-900">Game Information</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sport:</span>
                  <span className="text-gray-900">{bet.sport}</span>
                </div>
                {bet.league && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">League:</span>
                    <span className="text-gray-900">{bet.league}</span>
                  </div>
                )}
                {bet.home_team && bet.away_team && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matchup:</span>
                    <span className="text-gray-900">
                      {bet.away_team} @ {bet.home_team}
                    </span>
                  </div>
                )}
                {bet.game_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Game Date:</span>
                    <span className="text-gray-900">
                      {new Date(bet.game_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bet Description */}
            <div className="rounded-lg border bg-white p-3">
              <h5 className="mb-2 font-medium text-gray-900">Bet Description</h5>
              <p className="text-sm text-gray-700">{bet.bet_description}</p>

              {bet.bet_type && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="capitalize text-gray-900">{bet.bet_type.replace('_', ' ')}</span>
                </div>
              )}

              {(bet as any).prop_type && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-gray-500">Prop Type:</span>
                  <span className="text-gray-900">{(bet as any).prop_type}</span>
                </div>
              )}

              {(bet as any).Player_name && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-gray-500">Player:</span>
                  <span className="text-gray-900">{(bet as any).Player_name}</span>
                </div>
              )}
            </div>

            {/* ROI Calculator */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Quick Calculator</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Risk:</span>
                  <span className="font-medium text-blue-900">${bet.stake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Win:</span>
                  <span className="font-medium text-blue-900">
                    +${(bet.potential_payout - bet.stake).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Payout:</span>
                  <span className="font-medium text-blue-900">
                    ${bet.potential_payout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Important:</p>
                  <p>
                    This will copy the bet details to your bet slip. You must manually place the
                    wager at your sportsbook. Always verify odds and details before placing any bet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
