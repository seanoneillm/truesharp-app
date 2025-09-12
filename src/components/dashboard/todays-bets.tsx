'use client'

import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatBetForDisplay, getDisplaySide } from '@/lib/bet-formatting'

interface DatabaseBet {
  id: string
  sport: string
  bet_description: string
  odds: number
  stake: number
  status: 'pending' | 'won' | 'lost' | 'void'
  profit?: number
  placed_at: string
  potential_payout: number
  is_parlay: boolean
  parlay_id?: string
  bet_type: string
  home_team: string
  away_team: string
  line_value?: number
  game_date?: string
}

interface ParlayGroup {
  parlay_id: string
  legs: DatabaseBet[]
  total_stake: number
  total_potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void'
  placed_at: string
}

interface ProcessedBets {
  straight_bets: DatabaseBet[]
  parlay_groups: ParlayGroup[]
}

export default function TodaysBets() {
  const { user } = useAuth()
  const [processedBets, setProcessedBets] = useState<ProcessedBets>({
    straight_bets: [],
    parlay_groups: [],
  })
  const [loading, setLoading] = useState(true)
  const [expandedParlays, setExpandedParlays] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchTodaysBets() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Get today's date in EST timezone
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        const { data, error } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id)
          .gte('game_date', startOfDay.toISOString())
          .lt('game_date', endOfDay.toISOString())
          .order('placed_at', { ascending: false })

        if (error) {
          console.error("Error fetching today's bets:", error)
        } else {
          const rawBets: DatabaseBet[] = data || []
          const processed = processBets(rawBets)
          setProcessedBets(processed)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaysBets()
  }, [user])

  const processBets = (bets: DatabaseBet[]): ProcessedBets => {
    const straightBets: DatabaseBet[] = []
    const parlayMap = new Map<string, DatabaseBet[]>()

    // Separate straight bets and group parlay legs
    bets.forEach(bet => {
      if (bet.is_parlay && bet.parlay_id) {
        if (!parlayMap.has(bet.parlay_id)) {
          parlayMap.set(bet.parlay_id, [])
        }
        parlayMap.get(bet.parlay_id)!.push(bet)
      } else {
        straightBets.push(bet)
      }
    })

    // Convert parlay map to parlay groups
    const parlayGroups: ParlayGroup[] = []
    parlayMap.forEach((legs, parlayId) => {
      // Calculate parlay status based on leg statuses
      const wonLegs = legs.filter(leg => leg.status === 'won').length
      const lostLegs = legs.filter(leg => leg.status === 'lost').length
      const voidLegs = legs.filter(leg => leg.status === 'void').length
      const pendingLegs = legs.filter(leg => leg.status === 'pending').length

      let parlayStatus: 'pending' | 'won' | 'lost' | 'void' = 'pending'

      if (lostLegs > 0) {
        parlayStatus = 'lost'
      } else if (voidLegs === legs.length) {
        parlayStatus = 'void'
      } else if (wonLegs === legs.length) {
        parlayStatus = 'won'
      } else if (pendingLegs > 0) {
        parlayStatus = 'pending'
      }

      // Find the leg with actual stake/payout values (should be non-zero)
      // In parlays, typically only one leg has the stake/payout, others are 0
      let legWithStake = legs.find(leg => leg.stake > 0 && leg.potential_payout > 0)

      // Fallback: if no leg has both values, find one with just stake > 0
      if (!legWithStake) {
        legWithStake = legs.find(leg => leg.stake > 0)
      }

      // Final fallback: use first leg
      if (!legWithStake) {
        legWithStake = legs[0]
      }

      const totalStake = legWithStake?.stake || 0
      const totalPotentialPayout = legWithStake?.potential_payout || 0

      parlayGroups.push({
        parlay_id: parlayId,
        legs: legs.sort(
          (a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()
        ),
        total_stake: totalStake,
        total_potential_payout: totalPotentialPayout,
        status: parlayStatus,
        placed_at: legs[0]?.placed_at || '',
      })
    })

    return {
      straight_bets: straightBets,
      parlay_groups: parlayGroups.sort(
        (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
      ),
    }
  }

  const toggleParlayExpanded = (parlayId: string) => {
    setExpandedParlays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parlayId)) {
        newSet.delete(parlayId)
      } else {
        newSet.add(parlayId)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      case 'void':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'void':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getProfitDisplay = (bet: DatabaseBet) => {
    if (bet.status === 'pending') {
      return `$${bet.potential_payout.toFixed(2)}`
    }

    if (bet.status === 'won' && bet.profit) {
      return `+$${bet.profit.toFixed(2)}`
    }

    if (bet.status === 'lost') {
      return `-$${bet.stake.toFixed(2)}`
    }

    if (bet.status === 'void') {
      return `$0.00`
    }

    return `$${bet.stake.toFixed(2)}`
  }

  const getParlayProfitDisplay = (parlay: ParlayGroup) => {
    if (parlay.status === 'pending') {
      return `$${parlay.total_potential_payout.toFixed(2)}`
    }

    if (parlay.status === 'won') {
      const profit = parlay.total_potential_payout - parlay.total_stake
      return `+$${profit.toFixed(2)}`
    }

    if (parlay.status === 'lost') {
      return `-$${parlay.total_stake.toFixed(2)}`
    }

    if (parlay.status === 'void') {
      return `$0.00`
    }

    return `$${parlay.total_stake.toFixed(2)}`
  }


  const totalBetsCount = processedBets.straight_bets.length + processedBets.parlay_groups.length

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Today&apos;s Bets</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Bets</h2>
            <p className="text-sm text-gray-500">Your betting activity today</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalBetsCount}</div>
          <div className="text-xs text-gray-500">Bets Today</div>
        </div>
      </div>

      {totalBetsCount === 0 ? (
        <div className="py-12 text-center">
          <div className="relative mb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No bets placed today</h3>
          <p className="mx-auto mb-6 max-w-sm text-gray-500">
            Ready to make some winning picks? Browse today&apos;s games and start building your
            strategy.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
          >
            View Today&apos;s Games
          </Link>
        </div>
      ) : (
        <div>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {/* Render Straight Bets */}
            {processedBets.straight_bets.map(bet => (
              <div
                key={bet.id}
                className="relative rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start space-x-4">
                    <div className="mt-1 flex-shrink-0">{getStatusIcon(bet.status)}</div>
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const formattedBet = formatBetForDisplay(bet)
                        return (
                          <>
                            <div className="mb-2 flex items-center space-x-2">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                {formattedBet.sport}
                              </span>
                              <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                {formattedBet.betType}
                              </span>
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                {formattedBet.sportsbook}
                              </span>
                              <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                                {formattedBet.status}
                              </span>
                            </div>
                            
                            <h4 className="mb-1 text-sm font-semibold text-gray-900">
                              {formattedBet.mainDescription}
                            </h4>
                            
                            <div className="mb-2 flex items-center space-x-3 text-xs text-gray-600">
                              <span className="font-medium">Odds: {formattedBet.odds}</span>
                              <span>Stake: {formattedBet.stake}</span>
                              {formattedBet.gameDateTime && (
                                <span>Game: {formattedBet.gameDateTime}</span>
                              )}
                              {formattedBet.lineDisplay && (
                                <span>Line: {formattedBet.lineDisplay}</span>
                              )}
                              {getDisplaySide(bet) && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium">
                                  {getDisplaySide(bet)}
                                </span>
                              )}
                            </div>
                            
                            {formattedBet.teamsDisplay && (
                              <div className="text-xs text-gray-500">
                                {formattedBet.teamsDisplay}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
  
                  <div className="ml-4 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(bet.status)} mb-2`}
                    >
                      {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                    </span>
                    <div
                      className={`text-lg font-bold ${
                        bet.status === 'won'
                          ? 'text-green-600'
                          : bet.status === 'lost'
                            ? 'text-red-600'
                            : bet.status === 'void'
                              ? 'text-yellow-600'
                              : 'text-gray-900'
                      }`}
                    >
                      {bet.status === 'pending'
                        ? `+$${(bet.potential_payout - bet.stake).toFixed(2)}`
                        : getProfitDisplay(bet)}
                    </div>
                    <div className="text-xs text-gray-500">Stake: ${bet.stake.toFixed(2)}</div>
                  </div>
                </div>
  
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-xl ${
                    bet.status === 'won'
                      ? 'bg-green-500'
                      : bet.status === 'lost'
                        ? 'bg-red-500'
                        : bet.status === 'void'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                  }`}
                ></div>
              </div>
            ))}
  
            {/* Render Parlay Groups */}
            {processedBets.parlay_groups.map(parlay => {
              const isExpanded = expandedParlays.has(parlay.parlay_id)
              return (
                <div
                  key={parlay.parlay_id}
                  className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white"
                >
                  {/* Parlay Header */}
                  <div
                    className="cursor-pointer p-4 transition-all duration-200 hover:shadow-md"
                    onClick={() => toggleParlayExpanded(parlay.parlay_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start space-x-4">
                        <div className="mt-1 flex-shrink-0">{getStatusIcon(parlay.status)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center space-x-3">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {parlay.legs.length}-Leg Parlay
                            </h4>
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                              PARLAY
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="mb-1 text-xs text-gray-500">
                            {parlay.legs
                              .map(leg => leg.sport)
                              .filter((sport, index, arr) => arr.indexOf(sport) === index)
                              .join(', ')}{' '}
                            • Placed at{' '}
                            {new Date(parlay.placed_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-gray-400">
                            Click to {isExpanded ? 'collapse' : 'view'} legs
                          </div>
                        </div>
                      </div>
  
                      <div className="ml-4 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(parlay.status)} mb-2`}
                        >
                          {parlay.status.charAt(0).toUpperCase() + parlay.status.slice(1)}
                        </span>
                        <div
                          className={`text-lg font-bold ${
                            parlay.status === 'won'
                              ? 'text-green-600'
                              : parlay.status === 'lost'
                                ? 'text-red-600'
                                : parlay.status === 'void'
                                  ? 'text-yellow-600'
                                  : 'text-gray-900'
                          }`}
                        >
                          {parlay.status === 'pending'
                            ? `+$${(parlay.total_potential_payout - parlay.total_stake).toFixed(2)}`
                            : getParlayProfitDisplay(parlay)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stake: ${parlay.total_stake.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Parlay Legs (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-purple-100 bg-purple-50/50">
                      {parlay.legs.map((leg, index) => (
                        <div
                          key={leg.id}
                          className="border-b border-purple-100 px-4 py-3 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-1 items-center space-x-3">
                              <div className="flex-shrink-0">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 text-sm font-medium text-gray-900">
                                  {leg.home_team} vs {leg.away_team}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">
                                    {leg.bet_description}
                                  </span>
                                  {leg.line_value !== null && leg.line_value !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="font-medium text-gray-600">
                                        {leg.bet_type === 'spread'
                                          ? `${leg.line_value > 0 ? '+' : ''}${leg.line_value}`
                                          : leg.line_value}
                                      </span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="font-medium text-gray-600">
                                    {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getStatusColor(leg.status)}`}
                              >
                                {leg.status.charAt(0).toUpperCase() + leg.status.slice(1)}
                              </span>
                              {getStatusIcon(leg.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
  
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-xl ${
                      parlay.status === 'won'
                        ? 'bg-green-500'
                        : parlay.status === 'lost'
                          ? 'bg-red-500'
                          : parlay.status === 'void'
                            ? 'bg-yellow-500'
                            : 'bg-purple-500'
                    }`}
                  ></div>
                </div>
              )
            })}
          </div>
          
          {/* Footer with scroll hint and view all link */}
          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            {totalBetsCount > 3 && (
              <div className="text-xs text-gray-400">
                ↕ Scroll above to view all {totalBetsCount} bets
              </div>
            )}
            <Link
              href="/analytics"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all bets →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
