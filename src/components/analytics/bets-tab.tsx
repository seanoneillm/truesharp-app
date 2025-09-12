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
import { formatBetForDisplay, getDisplaySide } from '@/lib/bet-formatting'

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
      case 'cancelled':
        return <Badge className="border-gray-300 bg-gray-100 text-gray-800">Push</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusBorderClass = (status: string) => {
    switch (status) {
      case 'won':
        return 'border-l-4 border-l-green-500 bg-green-50/30'
      case 'lost':
        return 'border-l-4 border-l-red-500 bg-red-50/30'
      case 'pending':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/30'
      case 'void':
      case 'cancelled':
        return 'border-l-4 border-l-gray-500 bg-gray-50/30'
      default:
        return 'border-l-4 border-l-gray-300'
    }
  }

  const getLegStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">✓ Won</span>
      case 'lost':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">✗ Lost</span>
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">⏳ Pending</span>
      case 'void':
      case 'cancelled':
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">— Push</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-md">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Showing</p>
                <p className="text-2xl font-bold text-blue-900">{bets.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-md">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Total Bets</p>
                <p className="text-2xl font-bold text-purple-900">{totalBets.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 p-3 shadow-md animate-pulse">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Pending</p>
                <p className="text-2xl font-bold text-amber-900">
                  {bets.filter(bet => bet.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Avg Stake</p>
                <p className="text-2xl font-bold text-emerald-900">
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
                        <TableRow className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${getStatusBorderClass(bet.status)}`}>
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
                            {(() => {
                              const formattedBet = formatBetForDisplay(bet)
                              return (
                                <div className="space-y-2">
                                  {/* Header with key info */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs font-medium">
                                        {formattedBet.sport}
                                      </Badge>
                                      <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700 font-medium text-xs">
                                        {formattedBet.betType}
                                      </span>
                                      {formattedBet.sportsbook && (
                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 font-medium text-xs">
                                          {formattedBet.sportsbook}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm font-medium">
                                      {formattedBet.odds}
                                    </div>
                                  </div>
                                  
                                  {/* Main description - more prominent */}
                                  <div className="font-medium text-gray-900 text-sm leading-tight">
                                    {formattedBet.mainDescription}
                                  </div>
                                  
                                  {/* Teams and line info - compact */}
                                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                                    {formattedBet.teamsDisplay && (
                                      <span className="font-medium">{formattedBet.teamsDisplay}</span>
                                    )}
                                    {formattedBet.lineDisplay && (
                                      <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">Line: {formattedBet.lineDisplay}</span>
                                    )}
                                    {getDisplaySide(bet) && (
                                      <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 font-medium">
                                        {getDisplaySide(bet)}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Parlay legs preview - more compact */}
                                  {bet.is_parlay && bet.legs && bet.legs.length > 0 && (
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm">
                                      <div className="text-xs font-medium text-slate-700 mb-1">
                                        {bet.legs.length} Legs:
                                      </div>
                                      {bet.legs.slice(0, 3).map(leg => (
                                        <div key={leg.id} className="flex items-center justify-between text-xs">
                                          <span className="text-gray-700">
                                            <span className="font-medium">{leg.sport}</span>: {leg.bet_description.substring(0, 40)}{leg.bet_description.length > 40 ? '...' : ''}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono text-gray-600">{formatOdds(leg.odds)}</span>
                                            {getLegStatusBadge(leg.status)}
                                          </div>
                                        </div>
                                      ))}
                                      {bet.legs.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center pt-1">
                                          +{bet.legs.length - 3} more legs (expand to see all)
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
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
                                <p className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                                  To Win: {formatCurrency(bet.potential_payout - bet.stake)}
                                </p>
                              </div>
                            ) : bet.profit !== undefined ? (
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm shadow-md border-2 ${
                                bet.profit >= 0 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600' 
                                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600'
                              }`}>
                                {bet.profit >= 0 ? '↗' : '↘'} {formatCurrency(bet.profit)}
                              </div>
                            ) : (
                              <span className="text-gray-400 font-medium">-</span>
                            )}
                          </TableCell>
                        </TableRow>

                        {expandedRows.has(bet.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 border-t-4 border-t-slate-200">
                              {/* Parlay legs full details */}
                              {bet.is_parlay && bet.legs && bet.legs.length > 0 ? (
                                <div className="space-y-4">
                                  <div>
                                    <p className="mb-3 font-medium text-gray-700">
                                      Parlay Legs ({bet.legs.length})
                                    </p>
                                    <div className="space-y-3">
                                      {bet.legs.map((leg, index) => {
                                        // Format each leg like a single bet for consistency
                                        const formattedLeg = formatBetForDisplay(leg)
                                        return (
                                          <div key={leg.id} className={`rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-lg ${getStatusBorderClass(leg.status)}`}>
                                            <div className="space-y-2">
                                              {/* Header with key info - same as single bets */}
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                                    Leg {index + 1}
                                                  </span>
                                                  <Badge variant="outline" className="text-xs font-medium">
                                                    {formattedLeg.sport}
                                                  </Badge>
                                                  <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700 font-medium text-xs">
                                                    {formattedLeg.betType}
                                                  </span>
                                                  {formattedLeg.sportsbook && (
                                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 font-medium text-xs">
                                                      {formattedLeg.sportsbook}
                                                    </span>
                                                  )}
                                                  {getLegStatusBadge(leg.status)}
                                                </div>
                                                <div className="text-sm font-medium">
                                                  {formattedLeg.odds}
                                                </div>
                                              </div>
                                              
                                              {/* Main description - same formatting as single bets */}
                                              <div className="font-medium text-gray-900 text-sm leading-tight">
                                                {formattedLeg.mainDescription}
                                              </div>
                                              
                                              {/* Teams and line info - same compact format */}
                                              <div className="flex items-center space-x-3 text-xs text-gray-600">
                                                {formattedLeg.teamsDisplay && (
                                                  <span className="font-medium">{formattedLeg.teamsDisplay}</span>
                                                )}
                                                {formattedLeg.lineDisplay && (
                                                  <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">
                                                    Line: {formattedLeg.lineDisplay}
                                                  </span>
                                                )}
                                                {getDisplaySide(leg) && (
                                                  <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 font-medium">
                                                    {getDisplaySide(leg)}
                                                  </span>
                                                )}
                                                {formattedLeg.gameDateTime && (
                                                  <span className="text-gray-500">
                                                    Game: {formattedLeg.gameDateTime}
                                                  </span>
                                                )}
                                              </div>
                                              
                                              {/* Player name if available */}
                                              {leg.player_name && (
                                                <div className="text-xs">
                                                  <span className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                                                    Player: {leg.player_name}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
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
