'use client'

import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { BetSlipBet, useBetSlip } from '@/contexts/BetSlipContext'
import { formatOdds } from '@/lib/formatters'
import { useAuth } from '@/lib/hooks/use-auth'
import { ChevronDown, ChevronUp, DollarSign, ShoppingCart, Trash2, X } from 'lucide-react'
import { useState } from 'react'

export default function BetSlip() {
  const { bets, isCollapsed, removeBet, clearAllBets, toggleCollapsed, parlayOdds, totalLegs } =
    useBetSlip()

  const { user } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [wagerAmount, setWagerAmount] = useState<number>(10) // Default $10 wager
  const [isPlacingBet, setIsPlacingBet] = useState(false)

  // Helper function to convert American odds to decimal for payout calculations
  const americanToDecimal = (americanOdds: number): number => {
    if (americanOdds > 0) {
      return americanOdds / 100 + 1
    } else {
      return 100 / Math.abs(americanOdds) + 1
    }
  }

  // Calculate potential payout for single bet or parlay
  const calculatePayout = (): number => {
    if (totalLegs === 0) return 0

    if (totalLegs === 1 && bets[0]) {
      // Single bet payout
      const decimalOdds = americanToDecimal(bets[0].odds)
      return wagerAmount * decimalOdds
    } else if (parlayOdds) {
      // Parlay payout
      const decimalOdds = americanToDecimal(parlayOdds)
      return wagerAmount * decimalOdds
    }

    return 0
  }

  // Calculate profit (payout minus wager)
  const calculateProfit = (): number => {
    return calculatePayout() - wagerAmount
  }

  // Handle wager amount input
  const handleWagerChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setWagerAmount(numValue)
    }
  }

  // Handle place bet
  const handlePlaceBet = async () => {
    if (wagerAmount < 1) {
      showError('Minimum wager is $1')
      return
    }

    if (wagerAmount > 10000) {
      showError('Maximum wager is $10,000')
      return
    }

    // Check if user is authenticated
    if (!user) {
      showError('Please log in to place bets')
      return
    }

    setIsPlacingBet(true)

    try {
      // Ensure we have a fresh session before making the API call
      console.log('🔄 Checking and refreshing session before bet submission...')
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      // Get current session and refresh if needed
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      let validSession = session

      if (sessionError || !session) {
        console.log('❌ No valid session, attempting refresh...')
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession()

        if (refreshError || !refreshedSession) {
          showError('Session expired. Please refresh the page and try again.')
          return
        }

        validSession = refreshedSession
        console.log('✅ Session refreshed successfully')
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        console.log('✅ Valid session found')
      }

      // Ensure we have a valid user ID
      if (!validSession?.user?.id) {
        showError('Unable to authenticate user. Please log in again.')
        return
      }

      // Submit bet using our backend API with user ID for fallback auth
      console.log('📤 Making bet submission request...')
      const result = await fetch('/api/bets/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bets,
          stake: wagerAmount,
          userId: validSession.user.id, // Include user ID for server-side fallback
        }),
      })

      const data = await result.json()

      if (data.success) {
        showSuccess(data.message || 'Bet placed successfully!')
        setTimeout(() => {
          clearAllBets()
          setWagerAmount(10)
        }, 2000)
      } else {
        showError(data.error || 'Failed to place bet')
      }
    } catch (error) {
      console.error('Error submitting bet:', error)
      showError('Failed to place bet. Please try again.')
    } finally {
      setIsPlacingBet(false)
    }
  }

  // Clear error message after 3 seconds
  const showError = (message: string) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 3000)
  }

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Helper function to extract player name from oddid (same logic as universal-game-card)
  const getPlayerName = (oddid: string): string => {
    // New format: batting_stolenBases-FIRST_LAST_1_MLB-game-ou-over
    const nameMatch = oddid.match(/-([A-Z_]+_[A-Z_]+)_1_[A-Z]+-game/)
    if (nameMatch && nameMatch[1]) {
      // Convert TYLER_FREEMAN to Tyler Freeman
      const playerName = nameMatch[1]
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
      return playerName
    }
    return 'Player'
  }

  // Helper function to get prop display name from oddid
  const getPropDisplayName = (oddid: string): string => {
    const lowerOddid = oddid.toLowerCase()

    // Baseball props
    if (lowerOddid.includes('batting_hits')) return 'Hits'
    if (lowerOddid.includes('batting_homeruns') || lowerOddid.includes('batting_homerun'))
      return 'Home Runs'
    if (lowerOddid.includes('batting_rbi')) return 'RBIs'
    if (lowerOddid.includes('batting_runs')) return 'Runs'
    if (lowerOddid.includes('batting_totalbases')) return 'Total Bases'
    if (lowerOddid.includes('batting_strikeouts')) return 'Strikeouts'
    if (lowerOddid.includes('pitching_strikeouts')) return 'Strikeouts'
    if (lowerOddid.includes('pitching_hits')) return 'Hits Allowed'

    // Football props
    if (lowerOddid.includes('passing_yards')) return 'Passing Yards'
    if (lowerOddid.includes('rushing_yards')) return 'Rushing Yards'
    if (lowerOddid.includes('receiving_yards')) return 'Receiving Yards'
    if (lowerOddid.includes('passing_touchdowns')) return 'Passing TDs'
    if (lowerOddid.includes('rushing_touchdowns')) return 'Rushing TDs'
    if (lowerOddid.includes('receiving_touchdowns')) return 'Receiving TDs'

    // Basketball props
    if (lowerOddid.includes('points') && !lowerOddid.includes('team')) return 'Points'
    if (lowerOddid.includes('rebounds')) return 'Rebounds'
    if (lowerOddid.includes('assists')) return 'Assists'

    // Hockey props
    if (lowerOddid.includes('goals')) return 'Goals'
    if (lowerOddid.includes('saves')) return 'Saves'

    return 'Prop'
  }

  // Parse bet information for better display
  const parseBetInfo = (bet: BetSlipBet) => {
    const isPlayerProp =
      bet.marketType.match(/-[A-Z_]+_1_[A-Z]+-game/) || bet.marketType.match(/\d{4,}/)
    const isMainLine =
      bet.marketType.includes('points-home-game-ml') ||
      bet.marketType.includes('points-away-game-ml') ||
      bet.marketType.includes('points-home-game-sp') ||
      bet.marketType.includes('points-away-game-sp') ||
      bet.marketType.includes('points-all-game-ou')

    let playerOrTeam = ''
    let marketDisplay = ''
    let selectionDisplay = bet.selection

    if (isPlayerProp) {
      playerOrTeam = getPlayerName(bet.marketType)
      marketDisplay = getPropDisplayName(bet.marketType)
      // For over/under, show Over/Under instead of just the selection
      if (bet.marketType.includes('-ou-over')) {
        selectionDisplay = 'Over'
      } else if (bet.marketType.includes('-ou-under')) {
        selectionDisplay = 'Under'
      }
    } else if (isMainLine) {
      // For main lines, use team names
      playerOrTeam = bet.selection
      if (bet.marketType.includes('-ml-')) {
        marketDisplay = 'Moneyline'
      } else if (bet.marketType.includes('-sp-')) {
        marketDisplay = 'Spread'
      } else if (bet.marketType.includes('-ou-')) {
        marketDisplay = 'Total'
        selectionDisplay = bet.marketType.includes('over') ? 'Over' : 'Under'
      }
    } else {
      // Fallback for other bet types
      playerOrTeam = bet.selection
      marketDisplay = bet.marketType
    }

    return {
      playerOrTeam,
      marketDisplay,
      selectionDisplay,
      isPlayerProp,
      isMainLine,
    }
  }

  // Don't render if no bets
  if (totalLegs === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Error Toast */}
      {errorMessage && (
        <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-2">
          {errorMessage}
        </div>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-2">
          {successMessage}
        </div>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <button
          onClick={toggleCollapsed}
          className="group flex items-center space-x-3 rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-lg transition-all hover:bg-blue-700"
        >
          <TrueSharpShield className="h-6 w-6" variant="light" />
          <span className="font-semibold">Bet Slip ({totalLegs})</span>
          <ChevronUp className="h-4 w-4 transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <div className="flex max-h-[500px] w-96 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrueSharpShield className="h-8 w-8" variant="light" />
                <div>
                  <h3 className="text-lg font-bold">TrueSharp</h3>
                  <p className="text-xs text-blue-100">Bet Slip</p>
                </div>
              </div>
              <button
                onClick={toggleCollapsed}
                className="text-white transition-colors hover:text-blue-200"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bets List */}
          <div className="max-h-80 flex-1 overflow-y-auto">
            {bets.map(bet => {
              const betInfo = parseBetInfo(bet)
              return (
                <div
                  key={bet.id}
                  className="border-b border-slate-100 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Game Info */}
                      <div className="mb-2 text-xs font-medium text-slate-500">
                        {bet.awayTeam} @ {bet.homeTeam}
                      </div>

                      {/* Player/Team Name */}
                      <div className="mb-1 text-sm font-semibold">
                        {betInfo.isPlayerProp ? (
                          <span className="font-bold text-blue-700">{betInfo.playerOrTeam}</span>
                        ) : (
                          <span className="font-bold text-slate-900">{betInfo.playerOrTeam}</span>
                        )}
                      </div>

                      {/* Market Info */}
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{betInfo.marketDisplay}</span>
                        {betInfo.selectionDisplay &&
                          betInfo.selectionDisplay !== betInfo.playerOrTeam && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-slate-600">
                                {betInfo.selectionDisplay}
                              </span>
                            </>
                          )}
                        {bet.line && (
                          <>
                            <span>•</span>
                            <span>
                              Line: <span className="font-mono font-semibold">{bet.line}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-xs text-slate-400">{bet.sportsbook}</span>
                      </div>
                    </div>

                    <div className="ml-3 flex items-center space-x-2">
                      {/* Odds */}
                      <div className="rounded-md bg-blue-50 px-2 py-1 font-mono text-sm font-bold text-blue-700">
                        {formatOdds(bet.odds)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeBet(bet.id)}
                        className="p-1 text-slate-400 transition-colors hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="rounded-b-2xl border-t border-slate-200 bg-slate-50 p-4">
            {/* Wager Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Wager Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={wagerAmount}
                  onChange={e => handleWagerChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Min: $1</span>
                <span>Max: $10,000</span>
              </div>
            </div>

            {/* Potential Payout Display */}
            {wagerAmount > 0 && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Potential Payout</span>
                  <span className="text-lg font-bold text-green-800">
                    ${calculatePayout().toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-green-600">
                  <span>Profit: ${calculateProfit().toFixed(2)}</span>
                  {totalLegs > 1 && parlayOdds && (
                    <span className="rounded bg-green-600 px-2 py-0.5 font-mono text-white">
                      {formatOdds(parlayOdds)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Parlay Odds (when no wager entered) */}
            {wagerAmount === 0 && parlayOdds && (
              <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-700">
                    {totalLegs}-Leg Parlay
                  </span>
                  <span className="rounded bg-green-600 px-2 py-1 font-mono text-sm font-bold text-white">
                    {formatOdds(parlayOdds)}
                  </span>
                </div>
              </div>
            )}

            {/* Single Bet Display (when no wager entered) */}
            {wagerAmount === 0 && totalLegs === 1 && (
              <div className="mb-3 text-center text-sm text-slate-600">
                Single Bet - {formatOdds(bets[0]?.odds || 0)}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={clearAllBets}
                className="flex flex-1 items-center justify-center space-x-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </button>

              <button
                onClick={handlePlaceBet}
                disabled={wagerAmount < 1 || isPlacingBet || !user}
                className={`flex-2 flex items-center justify-center space-x-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  wagerAmount >= 1 && !isPlacingBet && user
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-slate-300 text-slate-500'
                } `}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>
                  {!user
                    ? 'Login Required'
                    : isPlacingBet
                      ? 'Placing...'
                      : `Place Bet ${wagerAmount >= 1 ? `($${wagerAmount.toFixed(2)})` : ''}`}
                </span>
              </button>
            </div>

            {/* Bet Count */}
            <div className="mt-2 text-center text-xs text-slate-500">{totalLegs}/10 legs</div>
          </div>
        </div>
      )}
    </div>
  )
}
