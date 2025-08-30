'use client'

import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
  const [processedBets, setProcessedBets] = useState<ProcessedBets>({ straight_bets: [], parlay_groups: [] })
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
          .gte('placed_at', startOfDay.toISOString())
          .lt('placed_at', endOfDay.toISOString())
          .order('placed_at', { ascending: false })

        if (error) {
          console.error('Error fetching today\'s bets:', error)
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
        legs: legs.sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()),
        total_stake: totalStake,
        total_potential_payout: totalPotentialPayout,
        status: parlayStatus,
        placed_at: legs[0]?.placed_at || ''
      })
    })

    return {
      straight_bets: straightBets,
      parlay_groups: parlayGroups.sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())
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

  const formatBetDescription = (bet: DatabaseBet) => {
    let description = bet.bet_description
    
    if (bet.line_value !== null && bet.line_value !== undefined) {
      if (bet.bet_type === 'spread') {
        description += ` ${bet.line_value > 0 ? '+' : ''}${bet.line_value}`
      } else if (bet.bet_type === 'total') {
        description += ` ${bet.line_value}`
      }
    }
    
    return description
  }

  const totalBetsCount = processedBets.straight_bets.length + processedBets.parlay_groups.length

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today&apos;s Bets</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
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
        <div className="text-center py-12">
          <div className="relative mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bets placed today</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Ready to make some winning picks? Browse today&apos;s games and start building your strategy.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View Today&apos;s Games
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Render Straight Bets */}
          {processedBets.straight_bets.map((bet) => (
            <div
              key={bet.id}
              className="relative bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(bet.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {formatBetDescription(bet)}
                    </h4>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {bet.sport}
                      </span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                      </span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {bet.home_team} vs {bet.away_team} • {new Date(bet.placed_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bet.status)} mb-2`}>
                    {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                  </span>
                  <div className={`text-lg font-bold ${
                    bet.status === 'won' ? 'text-green-600' :
                    bet.status === 'lost' ? 'text-red-600' :
                    bet.status === 'void' ? 'text-yellow-600' :
                    'text-gray-900'
                  }`}>
                    {bet.status === 'pending' ? 
                      `+$${(bet.potential_payout - bet.stake).toFixed(2)}` : 
                      getProfitDisplay(bet)
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    Stake: ${bet.stake.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                bet.status === 'won' ? 'bg-green-500' :
                bet.status === 'lost' ? 'bg-red-500' :
                bet.status === 'void' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}></div>
            </div>
          ))}

          {/* Render Parlay Groups */}
          {processedBets.parlay_groups.map((parlay) => {
            const isExpanded = expandedParlays.has(parlay.parlay_id)
            return (
              <div
                key={parlay.parlay_id}
                className="relative bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-200 overflow-hidden"
              >
                {/* Parlay Header */}
                <div 
                  className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => toggleParlayExpanded(parlay.parlay_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(parlay.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {parlay.legs.length}-Leg Parlay
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            PARLAY
                          </span>
                          {isExpanded ? 
                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          {parlay.legs.map(leg => leg.sport).filter((sport, index, arr) => arr.indexOf(sport) === index).join(', ')} • 
                          Placed at {new Date(parlay.placed_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          Click to {isExpanded ? 'collapse' : 'view'} legs
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(parlay.status)} mb-2`}>
                        {parlay.status.charAt(0).toUpperCase() + parlay.status.slice(1)}
                      </span>
                      <div className={`text-lg font-bold ${
                        parlay.status === 'won' ? 'text-green-600' :
                        parlay.status === 'lost' ? 'text-red-600' :
                        parlay.status === 'void' ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {parlay.status === 'pending' ? 
                          `+$${(parlay.total_potential_payout - parlay.total_stake).toFixed(2)}` : 
                          getParlayProfitDisplay(parlay)
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        Stake: ${parlay.total_stake.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parlay Legs (Expandable) */}
                {isExpanded && (
                  <div className="bg-purple-50/50 border-t border-purple-100">
                    {parlay.legs.map((leg, index) => (
                      <div key={leg.id} className="px-4 py-3 border-b border-purple-100 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {leg.home_team} vs {leg.away_team}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">{leg.bet_description}</span>
                                {leg.line_value !== null && leg.line_value !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span className="text-gray-600 font-medium">
                                      {leg.bet_type === 'spread' ? 
                                        `${leg.line_value > 0 ? '+' : ''}${leg.line_value}` :
                                        leg.line_value
                                      }
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="text-gray-600 font-medium">
                                  {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(leg.status)}`}>
                              {leg.status.charAt(0).toUpperCase() + leg.status.slice(1)}
                            </span>
                            {getStatusIcon(leg.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                  parlay.status === 'won' ? 'bg-green-500' :
                  parlay.status === 'lost' ? 'bg-red-500' :
                  parlay.status === 'void' ? 'bg-yellow-500' :
                  'bg-purple-500'
                }`}></div>
              </div>
            )
          })}
          
          {totalBetsCount > 3 && (
            <div className="text-center pt-4">
              <Link
                href="/analytics"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all bets →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
