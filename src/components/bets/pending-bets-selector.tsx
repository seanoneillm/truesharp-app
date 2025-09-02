'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface PendingBet {
  id: string
  sport: string
  league: string
  bet_type: string
  bet_description: string
  odds: number
  stake: number
  potential_payout: number
  game_date: string
  home_team?: string
  away_team?: string
  player_name?: string
  prop_type?: string
  line_value?: number
  side?: string
  sportsbook?: string
}

interface PendingBetsSelectorProps {
  onBetsSelected: (betIds: string[]) => void
  selectedBetIds: string[]
}

export const PendingBetsSelector: React.FC<PendingBetsSelectorProps> = ({
  onBetsSelected,
  selectedBetIds,
}) => {
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingBets()
  }, [])

  const fetchPendingBets = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/pending-bets', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending bets')
      }

      setPendingBets(data.data)
    } catch (error) {
      console.error('Error fetching pending bets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load pending bets')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBetSelection = (betId: string) => {
    const newSelectedIds = selectedBetIds.includes(betId)
      ? selectedBetIds.filter(id => id !== betId)
      : [...selectedBetIds, betId]

    onBetsSelected(newSelectedIds)
  }

  const selectAll = () => {
    onBetsSelected(pendingBets.map(bet => bet.id))
  }

  const clearAll = () => {
    onBetsSelected([])
  }

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatGameDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="mr-2" />
        Loading pending bets...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Button onClick={fetchPendingBets} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (pendingBets.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">No pending bets found for future games.</p>
        <Button onClick={fetchPendingBets} variant="outline">
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Pending Bets ({pendingBets.length})</h3>
          {selectedBetIds.length > 0 && (
            <Badge variant="secondary">{selectedBetIds.length} selected</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={selectedBetIds.length === pendingBets.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={selectedBetIds.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {pendingBets.map(bet => {
          const isSelected = selectedBetIds.includes(bet.id)

          return (
            <Card
              key={bet.id}
              className={cn(
                'cursor-pointer p-4 transition-all hover:shadow-md',
                isSelected && 'ring-primary bg-primary/5 ring-2'
              )}
              onClick={() => toggleBetSelection(bet.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isSelected ? (
                    <CheckCircle2 className="text-primary h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {bet.sport}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {bet.bet_type}
                        </Badge>
                        {bet.sportsbook && (
                          <Badge variant="outline" className="text-xs">
                            {bet.sportsbook}
                          </Badge>
                        )}
                      </div>

                      <p className="mb-1 line-clamp-2 text-sm font-medium">{bet.bet_description}</p>

                      <div className="text-xs text-muted-foreground">
                        {bet.home_team && bet.away_team ? (
                          <span>
                            {bet.away_team} @ {bet.home_team}
                          </span>
                        ) : bet.player_name ? (
                          <span>{bet.player_name}</span>
                        ) : null}
                        {bet.line_value && <span> • Line: {bet.line_value}</span>}
                        {bet.side && <span> • {bet.side}</span>}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Game: {formatGameDate(bet.game_date)}
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <div className="font-medium">{formatOdds(bet.odds)}</div>
                      <div className="text-muted-foreground">{formatCurrency(bet.stake)}</div>
                      <div className="text-xs text-green-600">
                        Win: {formatCurrency(bet.potential_payout)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
