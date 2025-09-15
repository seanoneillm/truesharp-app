'use client'

import { StrategySelectionModal } from '@/components/strategies/strategy-selection-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { formatBetForDisplay, getDisplaySide } from '@/lib/bet-formatting'
import { cn } from '@/lib/utils'
import { ArrowRight, CheckCircle2, Circle, Plus, Target, Trophy } from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface OpenBet {
  id: string
  sport: string
  league?: string
  home_team?: string
  away_team?: string
  bet_type?: string
  bet_description: string
  odds: string | number
  stake: number
  potential_payout: number
  status: string
  placed_at: string
  game_date?: string
  sportsbook?: string
  player_name?: string
  prop_type?: string
  line_value?: number
  side?: string
  parlay_id?: string
  is_parlay?: boolean
  bet_source?: string
}

interface EnhancedOpenBetsProps {
  openBets: OpenBet[]
  loading: boolean
  onRefresh: () => void
}

export const EnhancedOpenBets: React.FC<EnhancedOpenBetsProps> = ({
  openBets,
  loading,
  onRefresh,
}) => {
  const [selectedBetIds, setSelectedBetIds] = useState<string[]>([])
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false)
  const [isAddingToStrategies, setIsAddingToStrategies] = useState(false)
  const { addToast } = useToast()

  const groupedBets = useMemo(() => {
    if (!Array.isArray(openBets)) {
      return { groups: [], singles: [] }
    }

    const parlayGroups = new Map<string, OpenBet[]>()
    const singles: OpenBet[] = []

    openBets.forEach(bet => {
      if (bet.is_parlay && bet.parlay_id) {
        if (!parlayGroups.has(bet.parlay_id)) {
          parlayGroups.set(bet.parlay_id, [])
        }
        parlayGroups.get(bet.parlay_id)!.push(bet)
      } else {
        singles.push(bet)
      }
    })

    return {
      groups: Array.from(parlayGroups.entries()).map(([parlayId, bets]) => ({
        parlayId,
        bets,
        totalStake: bets.reduce((sum, bet) => sum + (bet.stake || 0), 0),
        totalPayout: bets.reduce((sum, bet) => sum + (bet.potential_payout || 0), 0),
      })),
      singles,
    }
  }, [openBets])

  const openBetsSummary = useMemo(() => {
    if (!Array.isArray(openBets)) {
      return { count: 0, totalProfit: 0, selectedCount: 0, selectedProfit: 0 }
    }

    const totalProfit = openBets.reduce((sum, bet) => {
      return sum + Math.max((bet?.potential_payout || 0) - (bet?.stake || 0), 0)
    }, 0)

    const selectedBets = openBets.filter(bet => selectedBetIds.includes(bet.id))
    const selectedProfit = selectedBets.reduce((sum, bet) => {
      return sum + Math.max((bet?.potential_payout || 0) - (bet?.stake || 0), 0)
    }, 0)

    return {
      count: openBets.length,
      totalProfit: totalProfit,
      selectedCount: selectedBetIds.length,
      selectedProfit: selectedProfit,
    }
  }, [openBets, selectedBetIds])

  const toggleBetSelection = (betId: string) => {
    setSelectedBetIds(prev =>
      prev.includes(betId) ? prev.filter(id => id !== betId) : [...prev, betId]
    )
  }

  const selectAllBets = () => {
    setSelectedBetIds(openBets.map(bet => bet.id))
  }

  const clearSelection = () => {
    setSelectedBetIds([])
  }

  const selectParlay = (parlayId: string) => {
    const parlayGroup = groupedBets.groups.find(g => g.parlayId === parlayId)
    if (parlayGroup) {
      const parlayBetIds = parlayGroup.bets.map(bet => bet.id)
      const allSelected = parlayBetIds.every(id => selectedBetIds.includes(id))
      
      if (allSelected) {
        // Deselect all bets in parlay
        setSelectedBetIds(prev => prev.filter(id => !parlayBetIds.includes(id)))
      } else {
        // Select all bets in parlay
        setSelectedBetIds(prev => [...new Set([...prev, ...parlayBetIds])])
      }
    }
  }

  const handleAddToStrategies = () => {
    setIsStrategyModalOpen(true)
  }

  const handleStrategySelection = async (strategyIds: string[]) => {
    try {
      setIsAddingToStrategies(true)

      const response = await fetch('/api/add-bets-to-strategies', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betIds: selectedBetIds,
          strategyIds: strategyIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bets to strategies')
      }

      // Show success message with detailed results
      if (data.inserted > 0) {
        addToast({
          title: 'Success!',
          description:
            data.message ||
            `Successfully added ${data.inserted} bet${data.inserted !== 1 ? 's' : ''} to strategies`,
          variant: 'success',
          duration: 5000,
        })
      } else {
        addToast({
          title: 'No Changes Made',
          description:
            'All selected bets either already exist in the selected strategies or do not match the strategy filters.',
          variant: 'warning',
          duration: 6000,
        })
      }

      setSelectedBetIds([])
      setIsStrategyModalOpen(false)

      // Refresh the open bets
      onRefresh()
    } catch (error) {
      console.error('Error adding bets to strategies:', error)
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add bets to strategies',
        variant: 'destructive',
        duration: 7000,
      })
    } finally {
      setIsAddingToStrategies(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  return (
    <Card>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Open Bets</h2>
            <p className="text-blue-100">
              {openBetsSummary.count} pending bets • {formatCurrency(openBetsSummary.totalProfit)}{' '}
              potential profit
              {openBetsSummary.selectedCount > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-sm">
                  {openBetsSummary.selectedCount} selected •{' '}
                  {formatCurrency(openBetsSummary.selectedProfit)} profit
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {openBetsSummary.selectedCount > 0 && (
              <Button
                onClick={handleAddToStrategies}
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Target className="mr-2 h-4 w-4" />
                Add to Strategies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <div className="rounded-xl bg-white/10 p-3">
              <Trophy className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        {openBets.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={selectAllBets}
              variant="ghost"
              size="sm"
              className="border border-white/30 text-white hover:bg-white/20"
              disabled={selectedBetIds.length === openBets.length}
            >
              Select All
            </Button>
            <Button
              onClick={clearSelection}
              variant="ghost"
              size="sm"
              className="border border-white/30 text-white hover:bg-white/20"
              disabled={selectedBetIds.length === 0}
            >
              Clear All
            </Button>
            {selectedBetIds.length > 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                {selectedBetIds.length} selected
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="min-h-[200px] p-6">
        {loading && openBets.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 rounded-lg bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : Array.isArray(openBets) && openBets.length > 0 ? (
          <div className="space-y-4">
            {/* Render Parlay Groups */}
            {groupedBets.groups.map(parlayGroup => {
              const allParlayBetsSelected = parlayGroup.bets.every(bet => selectedBetIds.includes(bet.id))
              const someParlayBetsSelected = parlayGroup.bets.some(bet => selectedBetIds.includes(bet.id))

              return (
                <div
                  key={parlayGroup.parlayId}
                  className={cn(
                    'rounded-lg border-2 transition-all duration-200',
                    allParlayBetsSelected ? 'border-blue-500 bg-blue-50' : 
                    someParlayBetsSelected ? 'border-blue-300 bg-blue-25' : 'border-gray-200 bg-gray-50'
                  )}
                >
                  {/* Parlay Header */}
                  <div 
                    className="cursor-pointer p-4 border-b border-gray-200"
                    onClick={() => selectParlay(parlayGroup.parlayId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          {allParlayBetsSelected ? (
                            <CheckCircle2 className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                              PARLAY ({parlayGroup.bets.length} legs)
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {parlayGroup.bets[0]?.sport}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Combined stake: ${parlayGroup.totalStake.toFixed(2)} • 
                            Potential payout: ${parlayGroup.totalPayout.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{formatCurrency(parlayGroup.totalPayout - parlayGroup.totalStake)}
                        </div>
                        <div className="text-xs text-gray-500">potential profit</div>
                      </div>
                    </div>
                  </div>

                  {/* Parlay Legs */}
                  <div className="space-y-2 p-4">
                    {parlayGroup.bets.map((bet, index) => {
                      const isSelected = selectedBetIds.includes(bet.id)
                      const formattedBet = formatBetForDisplay(bet)

                      return (
                        <div
                          key={bet.id}
                          className={cn(
                            'cursor-pointer rounded-md bg-white border p-3 transition-all duration-200 hover:shadow-sm',
                            isSelected && 'border-blue-300 bg-blue-50'
                          )}
                          onClick={() => toggleBetSelection(bet.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">
                                      Leg {index + 1}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="border-purple-300 bg-purple-100 text-xs text-purple-700"
                                    >
                                      {formattedBet.betType}
                                    </Badge>
                                  </div>

                                  <p className="mb-1 text-sm font-medium text-gray-900">
                                    {formattedBet.mainDescription}
                                  </p>

                                  <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <span>Odds: {formattedBet.odds}</span>
                                    {formattedBet.lineDisplay && (
                                      <span>Line: {formattedBet.lineDisplay}</span>
                                    )}
                                    {getDisplaySide(bet) && (
                                      <span className="rounded bg-blue-100 px-1 py-0.5 text-xs font-medium text-blue-700">
                                        {getDisplaySide(bet)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Render Single Bets */}
            {groupedBets.singles.map(bet => {
              const isSelected = selectedBetIds.includes(bet.id)

              return (
                <div
                  key={bet?.id || Math.random()}
                  className={cn(
                    'cursor-pointer rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:shadow-md',
                    isSelected && 'bg-blue-50 ring-2 ring-blue-500'
                  )}
                  onClick={() => toggleBetSelection(bet.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {(() => {
                            const formattedBet = formatBetForDisplay(bet)
                            return (
                              <>
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {formattedBet.sport}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-purple-300 bg-purple-100 text-xs text-purple-700"
                                  >
                                    {formattedBet.betType}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-gray-300 bg-gray-100 text-xs text-gray-700"
                                  >
                                    {formattedBet.sportsbook}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-yellow-300 bg-yellow-100 text-xs text-yellow-800"
                                  >
                                    {formattedBet.status}
                                  </Badge>
                                </div>

                                <p className="mb-2 line-clamp-2 font-medium text-gray-900">
                                  {formattedBet.mainDescription}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="font-medium">Odds: {formattedBet.odds}</span>
                                  <span>Stake: {formattedBet.stake}</span>
                                  {formattedBet.gameDateTime && (
                                    <span>Game: {formattedBet.gameDateTime}</span>
                                  )}
                                  {formattedBet.lineDisplay && (
                                    <span>Line: {formattedBet.lineDisplay}</span>
                                  )}
                                  {getDisplaySide(bet) && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                                      {getDisplaySide(bet)}
                                    </span>
                                  )}
                                </div>

                                {formattedBet.teamsDisplay && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    {formattedBet.teamsDisplay}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>

                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-green-600">
                            +
                            {formatCurrency(
                              Math.max((bet?.potential_payout || 0) - (bet?.stake || 0), 0)
                            )}
                          </div>
                          <div className="text-xs text-gray-500">potential profit</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Bottom Action Bar for Selected Bets */}
            {selectedBetIds.length > 0 && (
              <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedBetIds.length} bet{selectedBetIds.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-blue-700">
                      Total potential profit: {formatCurrency(openBetsSummary.selectedProfit)}
                    </p>
                  </div>
                  <Button onClick={handleAddToStrategies} className="bg-blue-600 hover:bg-blue-700">
                    <Target className="mr-2 h-4 w-4" />
                    Add to Strategies
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No Open Bets Available</h3>
            <p className="mb-6 text-gray-600">
              You don&apos;t have any pending bets for upcoming games at the moment. Place some bets
              to see the enhanced selection features here!
            </p>

            {/* Feature Preview */}
            <div className="mx-auto mb-6 max-w-md rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 font-medium text-gray-900">What you'll see here:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Checkbox selection for multiple bets</li>
                <li>✓ Quick "Select All" and "Clear All" buttons</li>
                <li>✓ Add selected bets to multiple strategies at once</li>
                <li>✓ Automatic validation against strategy filters</li>
                <li>✓ Real-time profit calculations</li>
              </ul>

              {/* Debug button for auth issues */}
              <div className="mt-4 border-t border-gray-200 pt-3">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug-auth-state')
                      const data = await response.json()
                      console.log('Auth Debug:', data)
                      alert(
                        `Auth Debug:\nServer User: ${data.serverAuth.hasUser ? 'Yes' : 'No'}\nError: ${data.serverAuth.error || 'None'}\nCheck console for details`
                      )
                    } catch (error) {
                      console.error('Debug failed:', error)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Debug Auth State
                </Button>
              </div>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Place Your First Bet
            </Button>
          </div>
        )}
      </div>

      {/* Strategy Selection Modal */}
      <StrategySelectionModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        onConfirm={handleStrategySelection}
        isLoading={isAddingToStrategies}
      />
    </Card>
  )
}
