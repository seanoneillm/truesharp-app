'use client'

import { useState, useEffect, useMemo } from 'react'
import { OpenBet, getAllBetsForStrategy, groupBetsByParlay, formatBetForDisplay } from '@/lib/queries/open-bets'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, DollarSign, Target, TrendingUp, Trophy, Loader2, X } from 'lucide-react'

interface StrategyBetsModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId: string
  strategyName: string
}

export function StrategyBetsModal({ isOpen, onClose, strategyId, strategyName }: StrategyBetsModalProps) {
  const [bets, setBets] = useState<OpenBet[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'settled'>('all')

  useEffect(() => {
    if (isOpen && strategyId) {
      fetchAllBets()
    }
  }, [isOpen, strategyId])

  const fetchAllBets = async () => {
    setLoading(true)
    try {
      const allBets = await getAllBetsForStrategy(strategyId)
      setBets(allBets)
    } catch (error) {
      console.error('Error fetching strategy bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBets = useMemo(() => {
    switch (filter) {
      case 'open':
        return bets.filter(bet => bet.status === 'pending')
      case 'settled':
        return bets.filter(bet => ['won', 'lost', 'push'].includes(bet.status))
      default:
        return bets
    }
  }, [bets, filter])

  const groupedBets = useMemo(() => {
    return groupBetsByParlay(filteredBets)
  }, [filteredBets])

  const betsSummary = useMemo(() => {
    const total = bets.length
    const open = bets.filter(bet => bet.status === 'pending').length
    const won = bets.filter(bet => bet.status === 'won').length
    const lost = bets.filter(bet => bet.status === 'lost').length
    const push = bets.filter(bet => bet.status === 'push').length
    const settled = won + lost + push

    const totalStake = bets
      .filter(bet => ['won', 'lost', 'push'].includes(bet.status))
      .reduce((sum, bet) => sum + bet.stake, 0)
    
    const totalProfit = bets
      .filter(bet => ['won', 'lost', 'push'].includes(bet.status))
      .reduce((sum, bet) => {
        if (bet.status === 'won') return sum + (bet.potential_payout - bet.stake)
        if (bet.status === 'lost') return sum - bet.stake
        return sum // push = no change
      }, 0)

    return { total, open, won, lost, push, settled, totalStake, totalProfit }
  }, [bets])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'push':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const BetCard = ({ bet }: { bet: ReturnType<typeof formatBetForDisplay> }) => (
    <div className="rounded-md border border-gray-100 bg-white p-2.5 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <Badge variant="outline" className="text-xs h-5 px-1.5">
            {bet.sport}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs h-5 px-1.5 ${getBetTypeColor(bet.betType)}`}
          >
            {getBetTypeIcon(bet.betType)}
            <span className="ml-1">{bet.betType.toUpperCase()}</span>
          </Badge>
          <Badge
            variant="outline"
            className="text-xs h-5 px-1.5 border-gray-300 bg-gray-100 text-gray-700"
          >
            {bet.sportsbook}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs h-5 px-1.5 ${getStatusColor(bet.status)}`}
          >
            {bet.status.toUpperCase()}
          </Badge>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-gray-900">{bet.odds}</div>
          <div className="text-xs text-gray-500">${bet.stake}</div>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900 leading-tight">{bet.mainDescription}</p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-gray-500">
          {bet.gameDateTime && (
            <span className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              {bet.gameDateTime}
            </span>
          )}
          {bet.lineDisplay && (
            <span>Line: {bet.lineDisplay}</span>
          )}
        </div>
        <div className={`flex items-center font-medium ${
          bet.status === 'won' ? 'text-green-600' : 
          bet.status === 'lost' ? 'text-red-600' : 'text-gray-600'
        }`}>
          <DollarSign className="h-3 w-3" />
          {bet.status === 'won' ? `+${bet.potentialProfit.toFixed(2)}` : 
           bet.status === 'lost' ? `-${bet.stake}` :
           bet.status === 'pending' ? `+${bet.potentialProfit.toFixed(2)}` : '0.00'}
        </div>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-5 max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Bets</h2>
            <p className="text-sm text-gray-600">{strategyName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading bets...</span>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-blue-900">{betsSummary.total}</div>
                <div className="text-xs text-blue-700">Total Bets</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-green-900">{betsSummary.won}</div>
                <div className="text-xs text-green-700">Won</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-red-900">{betsSummary.lost}</div>
                <div className="text-xs text-red-700">Lost</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                <div className={`text-lg font-bold ${
                  betsSummary.totalProfit >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(betsSummary.totalProfit)}
                </div>
                <div className="text-xs text-purple-700">Total P&L</div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({bets.length})
              </Button>
              <Button
                variant={filter === 'open' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('open')}
              >
                Open ({betsSummary.open})
              </Button>
              <Button
                variant={filter === 'settled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('settled')}
              >
                Settled ({betsSummary.settled})
              </Button>
            </div>

            {/* Bets List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredBets.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bets found</h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? 'This strategy has no bets yet.'
                      : `No ${filter} bets found.`
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Render Parlay Groups */}
                  {groupedBets.groups.map(parlayGroup => (
                    <div key={parlayGroup.parlayId} className="rounded-lg border-2 border-purple-200 bg-purple-50">
                      {/* Parlay Header */}
                      <div className="border-b border-purple-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 h-5 px-2">
                              PARLAY ({parlayGroup.bets.length} legs)
                            </Badge>
                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                              {parlayGroup.bets[0]?.sport}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">
                              {formatCurrency(parlayGroup.totalPayout - parlayGroup.totalStake)}
                            </div>
                            <div className="text-xs text-gray-500">potential profit</div>
                          </div>
                        </div>
                        <p className="mt-1.5 text-sm text-purple-700">
                          Total stake: {formatCurrency(parlayGroup.totalStake)} • 
                          Potential payout: {formatCurrency(parlayGroup.totalPayout)}
                        </p>
                      </div>

                      {/* Parlay Legs */}
                      <div className="space-y-2 p-3">
                        {parlayGroup.bets.map((bet, index) => {
                          const formattedBet = formatBetForDisplay(bet)
                          return (
                            <div key={bet.id} className="rounded-md border border-purple-100 bg-white p-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-medium text-purple-600">
                                  Leg {index + 1}
                                </span>
                                <Badge variant="outline" className="text-xs h-4 px-1.5">
                                  {formattedBet.betType}
                                </Badge>
                              </div>
                              <BetCard bet={formattedBet} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Render Single Bets */}
                  {groupedBets.singles.map(bet => {
                    const formattedBet = formatBetForDisplay(bet)
                    return <BetCard key={bet.id} bet={formattedBet} />
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}