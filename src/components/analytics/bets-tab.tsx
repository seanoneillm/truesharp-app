'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  Filter,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface BetLeg {
  id: string
  sport: string
  league?: string
  bet_type?: string
  bet_description: string
  odds: string | number
  line_value?: number
  prop_type?: string
  player_name?: string
  home_team?: string
  away_team?: string
  side?: string
  status: string
}

interface Bet {
  id: string
  sport: string
  league?: string
  home_team?: string
  away_team?: string
  bet_type?: string
  bet_description: string
  description?: string
  line_value?: number
  side?: string | null
  player_name?: string | null
  odds: string | number
  stake: number
  potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void'
  profit?: number
  game_date?: string
  placed_at: string
  settled_at?: string
  sportsbook?: string
  strategy_id?: string
  is_parlay?: boolean
  parlay_id?: string
  legs?: BetLeg[]
}

interface BetsTabProps {
  bets: Bet[]
  totalBets: number
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onSort?: (field: string, direction: 'asc' | 'desc') => void
}

type SortField = 'placed_at' | 'profit' | 'stake'
type SortDirection = 'asc' | 'desc'

export function BetsTab({
  bets,
  totalBets,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSort,
}: BetsTabProps) {
  const [sortField, setSortField] = useState<SortField>('placed_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc'

    setSortField(field)
    setSortDirection(newDirection)
    onSort?.(field, newDirection)
  }

  const toggleRowExpansion = (betId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(betId)) {
      newExpanded.delete(betId)
    } else {
      newExpanded.add(betId)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="border-green-300 bg-green-100 text-green-800">Won</Badge>
      case 'lost':
        return <Badge className="border-red-300 bg-red-100 text-red-800">Lost</Badge>
      case 'pending':
        return <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'void':
        return <Badge className="border-gray-300 bg-gray-100 text-gray-800">Void</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
  }

  const formatOdds = (odds: string | number) => {
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds
    return numericOdds > 0 ? `+${numericOdds}` : `${numericOdds}`
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    )
  }

  if (isLoading && bets.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-1/4 rounded bg-gray-200"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Showing</p>
                <p className="text-xl font-bold">{bets.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bets</p>
                <p className="text-xl font-bold">{totalBets.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">
                  {bets.filter(bet => bet.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Stake</p>
                <p className="text-xl font-bold">
                  $
                  {(
                    bets.reduce((sum, bet) => sum + bet.stake, 0) / Math.max(bets.length, 1)
                  ).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Bet History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bets.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Bet Details</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('placed_at')}
                        >
                          Date
                          {getSortIcon('placed_at')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('stake')}
                        >
                          Stake
                          {getSortIcon('stake')}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort('profit')}
                        >
                          Profit/Loss
                          {getSortIcon('profit')}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bets.map(bet => (
                      <React.Fragment key={bet.id}>
                        <TableRow className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(bet.id)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedRows.has(bet.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {bet.sport}
                                </Badge>
                                {bet.sportsbook && (
                                  <span className="text-xs text-gray-500">{bet.sportsbook}</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="line-clamp-2 font-medium">{bet.bet_description}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  {bet.home_team && bet.away_team && (
                                    <span className="font-medium">{bet.away_team} @ {bet.home_team}</span>
                                  )}
                                  {bet.side && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium">
                                      {bet.side.toUpperCase()}
                                    </span>
                                  )}
                                  {bet.line_value !== undefined && bet.line_value !== null && (
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium">
                                      {bet.line_value > 0 ? `+${bet.line_value}` : `${bet.line_value}`}
                                    </span>
                                  )}
                                  {bet.player_name && (
                                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 font-medium">
                                      {bet.player_name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Parlay legs preview */}
                              {bet.is_parlay && bet.legs && bet.legs.length > 0 && (
                                <div className="space-y-1 border-l-2 border-gray-200 pl-2 text-xs text-gray-600">
                                  {bet.legs.slice(0, 2).map(leg => (
                                    <div key={leg.id}>
                                      <span className="font-medium">{leg.sport}:</span>{' '}
                                      {leg.bet_description} ({formatOdds(leg.odds)})
                                    </div>
                                  ))}
                                  {bet.legs.length > 2 && (
                                    <div className="text-gray-500">
                                      +{bet.legs.length - 2} more legs
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className="text-sm text-gray-600">
                                {formatOdds(bet.odds)} • {bet.bet_type}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(bet.placed_at).toLocaleDateString()}</p>
                              <p className="text-gray-500">
                                {new Date(bet.placed_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="font-medium">${bet.stake.toFixed(2)}</p>
                          </TableCell>

                          <TableCell>{getStatusBadge(bet.status)}</TableCell>

                          <TableCell>
                            {bet.status === 'pending' ? (
                              <div className="text-sm">
                                <p className="text-blue-600">
                                  To Win: {formatCurrency(bet.potential_payout - bet.stake)}
                                </p>
                              </div>
                            ) : bet.profit !== undefined ? (
                              <p
                                className={`font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {formatCurrency(bet.profit)}
                              </p>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>

                        {expandedRows.has(bet.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50 p-4">
                              {/* Parlay legs full details */}
                              {bet.is_parlay && bet.legs && bet.legs.length > 0 ? (
                                <div className="space-y-4">
                                  <div>
                                    <p className="mb-3 font-medium text-gray-700">
                                      Parlay Legs ({bet.legs.length})
                                    </p>
                                    <div className="space-y-2">
                                      {bet.legs.map((leg, index) => (
                                        <div key={leg.id} className="rounded border bg-white p-3">
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              <div className="mb-1 flex items-center space-x-2">
                                                <Badge variant="outline" className="text-xs">
                                                  {leg.sport}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                  Leg {index + 1}
                                                </span>
                                              </div>
                                              <p className="text-sm font-medium">
                                                {leg.bet_description}
                                              </p>
                                              {leg.home_team && leg.away_team && (
                                                <p className="text-xs text-gray-600">
                                                  {leg.away_team} @ {leg.home_team}
                                                </p>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">{formatOdds(leg.odds)}</p>
                                              {leg.line_value && (
                                                <p className="text-xs text-gray-600">
                                                  Line: {leg.line_value > 0 ? '+' : ''}
                                                  {leg.line_value}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 border-t pt-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                      <p className="font-medium text-gray-700">Total Odds</p>
                                      <p>{formatOdds(bet.odds)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-700">Potential Payout</p>
                                      <p>${bet.potential_payout.toFixed(2)}</p>
                                    </div>
                                    {bet.game_date && (
                                      <div>
                                        <p className="font-medium text-gray-700">Game Date</p>
                                        <p>{new Date(bet.game_date).toLocaleDateString()}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                                  {bet.home_team && bet.away_team && (
                                    <div>
                                      <p className="font-medium text-gray-700">Matchup</p>
                                      <p>
                                        {bet.away_team} @ {bet.home_team}
                                      </p>
                                    </div>
                                  )}

                                  {bet.line_value && (
                                    <div>
                                      <p className="font-medium text-gray-700">Line</p>
                                      <p>
                                        {bet.line_value > 0 ? '+' : ''}
                                        {bet.line_value}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <p className="font-medium text-gray-700">Potential Payout</p>
                                    <p>${bet.potential_payout.toFixed(2)}</p>
                                  </div>

                                  {bet.game_date && (
                                    <div>
                                      <p className="font-medium text-gray-700">Game Date</p>
                                      <p>{new Date(bet.game_date).toLocaleDateString()}</p>
                                    </div>
                                  )}

                                  {bet.settled_at && (
                                    <div>
                                      <p className="font-medium text-gray-700">Settled</p>
                                      <p>{new Date(bet.settled_at).toLocaleDateString()}</p>
                                    </div>
                                  )}

                                  {bet.strategy_id && (
                                    <div>
                                      <p className="font-medium text-gray-700">Strategy</p>
                                      <p className="text-blue-600">Assigned to strategy</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasMore && (
                <div className="border-t bg-gray-50 p-6 text-center">
                  <Button
                    onClick={onLoadMore}
                    disabled={isLoading}
                    variant="default"
                    size="lg"
                    className="w-full min-w-48 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Loading More Bets...
                      </>
                    ) : (
                      <>
                        Show 10 More Bets
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="mt-3 text-sm text-gray-500">
                    Showing {bets.length} of {totalBets.toLocaleString()} total bets
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Click above to load 10 more recent bets
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No bets found</h3>
              <p className="mb-6 text-gray-600">
                {totalBets === 0
                  ? "You haven't placed any bets yet. Start tracking your betting performance!"
                  : 'No bets match your current filters. Try adjusting your filter criteria.'}
              </p>
              <Link href="/games">
                <Button>
                  Recent Bets
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
