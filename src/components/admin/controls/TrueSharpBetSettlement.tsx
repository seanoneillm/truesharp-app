'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { 
  Target, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Equal,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  User,
  Gamepad2,
  MessageCircle,
  X,
  FileText
} from 'lucide-react'

interface GameInfo {
  id: string
  sport: string
  home_team: string
  away_team: string
  home_team_name: string
  away_team_name: string
  game_time: string
  status: string
  home_score: number | null
  away_score: number | null
  league: string
}

interface BetTicket {
  id: string
  bet_id: string
  user_id: string
  reason: string
  custom_reason: string | null
  description: string | null
  status: 'open' | 'in_review' | 'resolved' | 'closed'
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
}

interface TrueSharpBet {
  id: string
  user_id: string | null
  game_id: string | null
  sport: string
  league: string
  bet_type: string
  bet_description: string
  odds: number
  oddid: string | null
  stake: number
  potential_payout: number
  status: string
  placed_at: string
  updated_at: string | null
  home_team: string | null
  away_team: string | null
  player_name: string | null
  line_value: number | null
  side: string | null
  profit: number | null
  parlay_id?: string | null
  is_parlay?: boolean
  score?: string | number | null // Score from odds table
  game?: GameInfo
  ticket?: BetTicket // Associated ticket if this bet has issues reported
  _parlayInfo?: {
    parlay_id: string
    total_legs: number
    leg_index: number
    is_main_leg: boolean
    sport: string
  }
}

interface ParlayGroup {
  parlay_id: string
  legs: TrueSharpBet[]
  stake: number
  potential_payout: number
  odds: number
  status: string
  profit: number | null
  placed_at: string
  sport: string
  ticket?: BetTicket
}

interface TrueSharpBetSettlementProps {
  className?: string
}

export function TrueSharpBetSettlement({ className }: TrueSharpBetSettlementProps) {
  const [bets, setBets] = useState<TrueSharpBet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [settlingBets, setSettlingBets] = useState<Set<string>>(new Set())
  const [dismissingTickets, setDismissingTickets] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  const fetchTrueSharpBets = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/truesharp-bets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch TrueSharp bets: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setBets(result.data || [])
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to load TrueSharp bets')
      }
    } catch (err) {
      console.error('Error fetching TrueSharp bets:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      addToast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [addToast])

  const refreshBets = useCallback(async () => {
    setIsRefreshing(true)
    await fetchTrueSharpBets()
    setIsRefreshing(false)
  }, [fetchTrueSharpBets])

  const settleParlayGroup = async (
    parlayId: string,
    status: 'won' | 'lost' | 'void'
  ) => {
    try {
      setSettlingBets(prev => new Set(prev).add(parlayId))

      // Find all legs of this parlay
      const parlayLegs = bets.filter(bet => bet.parlay_id === parlayId && bet.is_parlay)
      if (parlayLegs.length === 0) {
        throw new Error('Parlay legs not found')
      }

      // Find the main leg with stake and payout
      const mainLeg = parlayLegs.find(leg => leg.stake > 0) || parlayLegs[0]

      let profit: number
      switch (status) {
        case 'won':
          profit = Number((mainLeg.potential_payout - mainLeg.stake).toFixed(2))
          break
        case 'lost':
          profit = Number((-mainLeg.stake).toFixed(2))
          break
        case 'void':
          profit = 0
          break
        default:
          throw new Error('Invalid settlement status')
      }

      // Settle all legs of the parlay
      const settlementPromises = parlayLegs.map(async (leg) => {
        const legProfit = leg.stake > 0 ? profit : 0 // Only main leg gets profit, others get 0

        const response = await fetch('/api/admin/settle-truesharp-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            betId: leg.id,
            status,
            profit: legProfit
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to settle parlay leg ${leg.id}: ${response.statusText}`)
        }

        return await response.json()
      })

      const results = await Promise.all(settlementPromises)

      // Check if all settlements succeeded
      const failed = results.filter(result => !result.success)
      if (failed.length > 0) {
        throw new Error(`Failed to settle ${failed.length} parlay legs`)
      }

      // Optimistically update the UI for all legs
      setBets(prevBets => 
        prevBets.map(bet => 
          bet.parlay_id === parlayId && bet.is_parlay
            ? { 
                ...bet, 
                status,
                profit: bet.stake > 0 ? profit : 0,
                updated_at: new Date().toISOString()
              } 
            : bet
        )
      )

      addToast({
        title: `Parlay Settled`,
        description: `${parlayLegs.length}-leg parlay settled as ${status.toUpperCase()}. Profit: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`,
        variant: "success",
      })

      // Refresh the list to ensure consistency
      setTimeout(() => {
        refreshBets()
      }, 1000)

    } catch (err) {
      console.error('Error settling parlay:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      addToast({
        title: "Parlay Settlement Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSettlingBets(prev => {
        const newSet = new Set(prev)
        newSet.delete(parlayId)
        return newSet
      })
    }
  }

  const settleBet = async (
    betId: string, 
    status: 'won' | 'lost' | 'void'
  ) => {
    try {
      setSettlingBets(prev => new Set(prev).add(betId))

      // Find the bet to calculate profit
      const bet = bets.find(b => b.id === betId)
      if (!bet) {
        throw new Error('Bet not found')
      }

      let profit: number
      
      // For parlay legs, only the main leg (with stake > 0) should get profit
      if (bet.parlay_id && bet.is_parlay) {
        if (bet.stake > 0) {
          // This is the main leg with actual stake - use the pre-calculated potential_payout
          switch (status) {
            case 'won':
              // Use TrueSharp's pre-calculated payout for accuracy
              profit = Number((bet.potential_payout - bet.stake).toFixed(2))
              break
            case 'lost':
              profit = Number((-bet.stake).toFixed(2))
              break
            case 'void':
              profit = 0
              break
            default:
              throw new Error('Invalid settlement status')
          }
        } else {
          // This is a secondary leg with $0 stake - always $0 profit
          profit = 0
        }
      } else {
        // Single bet - use the pre-calculated potential_payout
        switch (status) {
          case 'won':
            profit = Number((bet.potential_payout - bet.stake).toFixed(2))
            break
          case 'lost':
            profit = Number((-bet.stake).toFixed(2))
            break
          case 'void':
            profit = 0
            break
          default:
            throw new Error('Invalid settlement status')
        }
      }

      // Log the calculated values for debugging
      console.log(`Settling bet ${betId}: stake=${bet.stake}, payout=${bet.potential_payout}, calculated_profit=${profit}`)

      // Validate profit is within database constraints (DECIMAL(10,2): -99,999,999.99 to 99,999,999.99)
      if (profit < -99999999.99 || profit > 99999999.99) {
        throw new Error(`Profit value ${profit.toFixed(2)} exceeds database limits (-99,999,999.99 to 99,999,999.99). Stake: $${bet.stake}, Payout: $${bet.potential_payout}`)
      }

      const response = await fetch('/api/admin/settle-truesharp-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId,
          status,
          profit
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to settle bet: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Optimistically update the UI
        setBets(prevBets => 
          prevBets.map(bet => 
            bet.id === betId 
              ? { 
                  ...bet, 
                  status,
                  profit,
                  updated_at: new Date().toISOString()
                } 
              : bet
          )
        )

        const betType = bet.parlay_id && bet.is_parlay ? 
          `Parlay Leg${bet.stake > 0 ? ' (Main)' : ''}` : 'Bet'

        addToast({
          title: bet.status === 'pending' ? `${betType} Settled` : `${betType} Updated`,
          description: result.message,
          variant: "success",
        })

        // Refresh the list to ensure consistency
        setTimeout(() => {
          refreshBets()
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to settle bet')
      }
    } catch (err) {
      console.error('Error settling bet:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      addToast({
        title: "Settlement Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSettlingBets(prev => {
        const newSet = new Set(prev)
        newSet.delete(betId)
        return newSet
      })
    }
  }

  const dismissTicket = async (ticketId: string) => {
    try {
      setDismissingTickets(prev => new Set(prev).add(ticketId))

      const response = await fetch('/api/admin/dismiss-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss ticket: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Remove the bet with this ticket from the list
        setBets(prevBets => 
          prevBets.filter(bet => bet.ticket?.id !== ticketId)
        )

        addToast({
          title: "Ticket Dismissed",
          description: "Ticket has been successfully dismissed and closed.",
          variant: "success",
        })

        // Refresh the list to ensure consistency
        setTimeout(() => {
          refreshBets()
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to dismiss ticket')
      }
    } catch (err) {
      console.error('Error dismissing ticket:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      addToast({
        title: "Dismissal Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDismissingTickets(prev => {
        const newSet = new Set(prev)
        newSet.delete(ticketId)
        return newSet
      })
    }
  }

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true)
      await fetchTrueSharpBets()
      setIsLoading(false)
    }
    initialLoad()
  }, [fetchTrueSharpBets])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatOdds = (odds: number) => {
    // Ensure we handle edge cases for odds display
    if (odds === 0) return 'EVEN'
    if (odds > 0) return `+${odds}`
    return `${odds}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const groupParlayBets = (bets: TrueSharpBet[]): { singles: TrueSharpBet[], parlays: ParlayGroup[] } => {
    const parlayGroups = new Map<string, TrueSharpBet[]>()
    const singles: TrueSharpBet[] = []

    bets.forEach(bet => {
      if (bet.parlay_id && bet.is_parlay) {
        if (!parlayGroups.has(bet.parlay_id)) {
          parlayGroups.set(bet.parlay_id, [])
        }
        parlayGroups.get(bet.parlay_id)!.push(bet)
      } else {
        singles.push(bet)
      }
    })

    const parlays: ParlayGroup[] = Array.from(parlayGroups.entries()).map(([parlay_id, legs]) => {
      // Find the leg with non-zero stake (should be only one)
      const mainLeg = legs.find(leg => leg.stake > 0) || legs[0]
      
      // Determine the sport (multi-sport if different)
      const sports = new Set(legs.map(leg => leg.sport))
      const sport = sports.size === 1 ? Array.from(sports)[0] : 'Multi-Sport'
      
      // Find any ticket associated with this parlay
      const ticket = legs.find(leg => leg.ticket)?.ticket

      return {
        parlay_id,
        legs: legs.sort((a, b) => a.placed_at.localeCompare(b.placed_at)),
        stake: mainLeg.stake,
        potential_payout: mainLeg.potential_payout,
        odds: mainLeg.odds,
        status: mainLeg.status,
        profit: mainLeg.profit,
        placed_at: mainLeg.placed_at,
        sport,
        ticket
      }
    })

    return { singles, parlays }
  }

  const getTeamDisplay = (bet: TrueSharpBet) => {
    if (bet.game) {
      return `${bet.game.away_team_name} @ ${bet.game.home_team_name}`
    } else if (bet.home_team && bet.away_team) {
      return `${bet.away_team} @ ${bet.home_team}`
    }
    return 'N/A'
  }

  const getGameStatus = (bet: TrueSharpBet) => {
    if (!bet.game) return null
    
    const gameTime = new Date(bet.game.game_time)
    const now = new Date()
    
    if (bet.game.status === 'completed' && bet.game.home_score !== null && bet.game.away_score !== null) {
      return `Final: ${bet.game.away_score} - ${bet.game.home_score}`
    } else if (bet.game.status === 'live' || bet.game.status === 'in_progress') {
      if (bet.game.home_score !== null && bet.game.away_score !== null) {
        return `Live: ${bet.game.away_score} - ${bet.game.home_score}`
      }
      return 'Live'
    } else if (gameTime > now) {
      return `${gameTime.toLocaleDateString()} ${gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return bet.game.status === 'upcoming' ? 'Scheduled' : bet.game.status
    }
  }

  const isGameOverdue = (bet: TrueSharpBet) => {
    if (!bet.game) return false
    
    const gameTime = new Date(bet.game.game_time)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999) // End of yesterday
    
    return gameTime <= yesterday
  }

  const getStatusBadge = (status: string, profit?: number | null) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-700 bg-yellow-100 border-yellow-300">
            ⏳ Pending
          </Badge>
        )
      case 'won':
        return (
          <Badge variant="outline" className="text-green-700 bg-green-100 border-green-300">
            ✅ Won {profit !== null && profit !== undefined ? `(+$${profit.toFixed(2)})` : ''}
          </Badge>
        )
      case 'lost':
        return (
          <Badge variant="outline" className="text-red-700 bg-red-100 border-red-300">
            ❌ Lost {profit !== null && profit !== undefined ? `($${profit.toFixed(2)})` : ''}
          </Badge>
        )
      case 'void':
        return (
          <Badge variant="outline" className="text-gray-700 bg-gray-100 border-gray-300">
            ⚪ Void
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-slate-700 bg-slate-100 border-slate-300">
            {status}
          </Badge>
        )
    }
  }

  // Group bets for display - keep individual legs but group them visually
  const { singles, parlays } = groupParlayBets(bets)
  
  // Create display items - flatten parlay legs back to individual bets but keep grouping info
  const allBetsToDisplay = [
    ...singles.filter(bet => bet.status === 'pending' || bet.ticket),
    ...parlays.flatMap(parlay => 
      parlay.legs
        .filter(leg => leg.status === 'pending' || leg.ticket)
        .map(leg => ({ 
          ...leg, 
          _parlayInfo: {
            parlay_id: parlay.parlay_id,
            total_legs: parlay.legs.length,
            leg_index: parlay.legs.findIndex(l => l.id === leg.id),
            is_main_leg: leg.stake > 0,
            sport: parlay.sport
          }
        }))
    )
  ]

  const allItemsToDisplay = allBetsToDisplay.sort((a, b) => {
    // Prioritize tickets first, then group parlays together, then sort by date
    if (a.ticket && !b.ticket) return -1
    if (!a.ticket && b.ticket) return 1
    
    // Group parlay legs together
    if (a._parlayInfo && b._parlayInfo) {
      if (a._parlayInfo.parlay_id === b._parlayInfo.parlay_id) {
        return a._parlayInfo.leg_index - b._parlayInfo.leg_index
      }
      return a._parlayInfo.parlay_id.localeCompare(b._parlayInfo.parlay_id)
    }
    if (a._parlayInfo && !b._parlayInfo) return 1
    if (!a._parlayInfo && b._parlayInfo) return -1
    
    const dateA = new Date(a.placed_at).getTime()
    const dateB = new Date(b.placed_at).getTime()
    return dateA - dateB
  })

  const pendingCount = allBetsToDisplay.filter(bet => bet.status === 'pending').length
  const totalStakes = allBetsToDisplay
    .filter(bet => bet.status === 'pending')
    .reduce((sum, bet) => sum + bet.stake, 0)
  const totalPotentialPayout = allBetsToDisplay
    .filter(bet => bet.status === 'pending')
    .reduce((sum, bet) => sum + bet.potential_payout, 0)

  if (error && !bets.length) {
    return (
      <Card className={`border-red-200/60 bg-red-50 shadow-lg ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error loading TrueSharp bets</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <Button 
            onClick={refreshBets} 
            variant="outline" 
            className="mt-3"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-blue-200/60 bg-blue-50/30 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            TrueSharp Bet Settlement
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                {pendingCount} Unsettled
              </Badge>
              {allBetsToDisplay.filter(bet => bet.ticket).length > 0 && (
                <Badge variant="outline" className="text-orange-600 bg-orange-50">
                  {allBetsToDisplay.filter(bet => bet.ticket).length} Tickets
                </Badge>
              )}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-sm text-slate-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={refreshBets}
              variant="outline"
              size="sm"
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200/40 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : allItemsToDisplay.length === 0 ? (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-slate-500 font-medium">No unsettled TrueSharp bets</p>
            <p className="text-sm text-slate-400">All bets have been settled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allItemsToDisplay.map((bet, index) => {
              const isSettling = settlingBets.has(bet.id)
              const isDismissing = bet.ticket ? dismissingTickets.has(bet.ticket.id) : false
              const gameStatus = getGameStatus(bet)
              const isOverdue = isGameOverdue(bet)
              
              // Check if this is the first leg of a parlay (to show parlay header)
              const isFirstParlayLeg = bet._parlayInfo && 
                (index === 0 || !allItemsToDisplay[index - 1]._parlayInfo || 
                 allItemsToDisplay[index - 1]._parlayInfo!.parlay_id !== bet._parlayInfo.parlay_id)
              
              return (
                <div key={bet.id}>
                  {/* Parlay Header (only for first leg of each parlay) */}
                  {isFirstParlayLeg && (
                    <div className="bg-blue-50 border border-blue-200 rounded-t-lg p-2 mb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            🎲 {bet._parlayInfo!.total_legs}-Leg Parlay
                            <span className="text-xs text-blue-600">({bet._parlayInfo!.sport})</span>
                          </h4>
                        </div>
                        <div className="text-xs text-blue-600">
                          ID: {bet._parlayInfo!.parlay_id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`border ${isFirstParlayLeg ? 'border-t-0 rounded-t-none' : ''} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
                    bet.ticket ? 'border-orange-200 bg-orange-50/30' : 
                    bet._parlayInfo ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-white'
                  }`}>
                    {/* Ticket Reason Section (if ticket exists) */}
                    {bet.ticket && (
                      <div className="mb-3 p-2 bg-orange-100 border border-orange-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-orange-800">Issue Reported:</span>
                              <Badge variant="outline" className="text-orange-700 bg-orange-200 border-orange-300">
                                {bet.ticket.reason}
                              </Badge>
                            </div>
                            {bet.ticket.custom_reason && (
                              <p className="text-sm text-orange-700 mb-1">
                                <strong>Custom reason:</strong> {bet.ticket.custom_reason}
                              </p>
                            )}
                            {bet.ticket.description && (
                              <p className="text-sm text-orange-700">
                                <strong>Description:</strong> {bet.ticket.description}
                              </p>
                            )}
                            <p className="text-xs text-orange-600 mt-1">
                              Reported on {new Date(bet.ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      {/* Bet Information */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                              {bet._parlayInfo && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">
                                  Leg {bet._parlayInfo.leg_index + 1}
                                  {bet._parlayInfo.is_main_leg && " (Main)"}
                                </span>
                              )}
                              {bet.bet_description}
                              {isOverdue && (
                                <div 
                                  className="relative cursor-help" 
                                  title="Game occurred yesterday or earlier - needs settlement"
                                >
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                </div>
                              )}
                            </h3>
                            <div className="flex-shrink-0">
                              {getStatusBadge(bet.status, bet.profit)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>{bet.sport} • {bet.league}</span>
                            <span className="capitalize">{bet.bet_type}</span>
                            {bet.player_name && <span>Player: {bet.player_name}</span>}
                            {bet._parlayInfo && bet._parlayInfo.is_main_leg && (
                              <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded font-medium">
                                Profit Leg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Game Information */}
                        <div className="bg-slate-50 rounded p-2 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="text-slate-500">Game:</span>
                              <span className="ml-1 font-medium">{getTeamDisplay(bet)}</span>
                            </div>
                            {gameStatus && (
                              <div>
                                <span className="text-slate-500">Status:</span>
                                <span className="ml-1 font-medium">{gameStatus}</span>
                              </div>
                            )}
                            {bet.game && (
                              <div>
                                <span className="text-slate-500">Game Date:</span>
                                <span className="ml-1 font-medium">
                                  {new Date(bet.game.game_time).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bet Details */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                          <div>
                            <p className="text-slate-500">Stake</p>
                            <p className={`font-semibold ${bet.stake === 0 ? 'text-slate-400' : ''}`}>
                              {formatCurrency(bet.stake)}
                              {bet.stake === 0 && <span className="text-xs"> (leg)</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Odds</p>
                            <p className="font-semibold">{formatOdds(bet.odds)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Payout</p>
                            <p className={`font-semibold ${bet.potential_payout === 0 ? 'text-slate-400' : 'text-green-600'}`}>
                              {formatCurrency(bet.potential_payout)}
                              {bet.potential_payout === 0 && <span className="text-xs"> (leg)</span>}
                            </p>
                          </div>
                          {bet.side && (
                            <div>
                              <p className="text-slate-500">Side</p>
                              <p className="font-medium capitalize">{bet.side}</p>
                            </div>
                          )}
                          {bet.line_value !== null && (
                            <div>
                              <p className="text-slate-500">Line</p>
                              <p className="font-medium">{bet.line_value}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500">Placed</p>
                            <p className="font-medium">{new Date(bet.placed_at).toLocaleDateString()}</p>
                          </div>
                          {bet.status !== 'pending' && (
                            <div>
                              <p className="text-slate-500">Settled</p>
                              <p className="font-medium text-xs">
                                {bet.updated_at ? new Date(bet.updated_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Score and Odd ID section */}
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-slate-500">Score:</span>
                            <span className={`ml-1 font-mono px-1 py-0.5 rounded text-xs ${
                              bet.score !== undefined && bet.score !== null
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {bet.score !== undefined && bet.score !== null ? bet.score : 'undefined'}
                            </span>
                          </div>

                          {bet.oddid && (
                            <div className="text-xs">
                              <span className="text-slate-500">Odd ID:</span>
                              <span className="ml-1 font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-800 text-xs">
                                {bet.oddid}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Settlement Actions */}
                      <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <div className="text-xs text-slate-500 mb-1 font-medium">
                          {bet.status === 'pending' ? 'Settle Leg:' : 'Change Settlement:'}
                        </div>
                        
                        <Button
                          onClick={() => settleBet(bet.id, 'won')}
                          disabled={isSettling || isDismissing || bet.status === 'won'}
                          className={`h-8 ${
                            bet.status === 'won' 
                              ? 'bg-green-200 text-green-800 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          size="sm"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {bet.status === 'won' ? 'Won ✓' : bet.status === 'pending' ? 'Win' : 'Change to Win'}
                        </Button>
                        
                        <Button
                          onClick={() => settleBet(bet.id, 'lost')}
                          disabled={isSettling || isDismissing || bet.status === 'lost'}
                          variant={bet.status === 'lost' ? 'outline' : 'destructive'}
                          className={`h-8 ${
                            bet.status === 'lost' 
                              ? 'bg-red-200 text-red-800 cursor-not-allowed border-red-200' 
                              : ''
                          }`}
                          size="sm"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {bet.status === 'lost' ? 'Lost ✓' : bet.status === 'pending' ? 'Loss' : 'Change to Loss'}
                        </Button>
                        
                        <Button
                          onClick={() => settleBet(bet.id, 'void')}
                          disabled={isSettling || isDismissing || bet.status === 'void'}
                          variant="outline"
                          className={`h-8 ${
                            bet.status === 'void' 
                              ? 'bg-gray-200 text-gray-800 cursor-not-allowed border-gray-200' 
                              : 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                          }`}
                          size="sm"
                        >
                          <Equal className="h-3 w-3 mr-1" />
                          {bet.status === 'void' ? 'Void ✓' : bet.status === 'pending' ? 'Void' : 'Change to Void'}
                        </Button>

                        {bet.ticket && (
                          <>
                            <div className="border-t border-slate-200 mt-1 pt-1">
                              <div className="text-xs text-slate-500 mb-1 font-medium">Ticket Action:</div>
                            </div>
                            <Button
                              onClick={() => dismissTicket(bet.ticket!.id)}
                              disabled={isSettling || isDismissing}
                              variant="outline"
                              className="text-gray-600 border-gray-300 hover:bg-gray-50 h-8"
                              size="sm"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Dismiss Ticket
                            </Button>
                          </>
                        )}
                        
                        {(isSettling || isDismissing) && (
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {pendingCount > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded border border-blue-200/40">
                <p className="text-lg font-bold text-blue-600">{pendingCount}</p>
                <p className="text-xs text-slate-600">Unsettled</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded border border-green-200/40">
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalStakes)}
                </p>
                <p className="text-xs text-slate-600">Total Stakes</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded border border-purple-200/40">
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(totalPotentialPayout)}
                </p>
                <p className="text-xs text-slate-600">Potential Payout</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}