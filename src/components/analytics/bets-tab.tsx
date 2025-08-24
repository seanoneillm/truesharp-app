'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    ArrowUpDown,
    Calendar,
    ChevronDown,
    ChevronUp,
    DollarSign,
    ExternalLink,
    Filter,
    TrendingUp
} from "lucide-react"
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
  onSort
}: BetsTabProps) {
  const [sortField, setSortField] = useState<SortField>('placed_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleSort = (field: SortField) => {
    const newDirection = 
      sortField === field && sortDirection === 'desc' ? 'asc' : 'desc'
    
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
        return <Badge className="bg-green-100 text-green-800 border-green-300">Won</Badge>
      case 'lost':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Lost</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
      case 'void':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Void</Badge>
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
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  if (isLoading && bets.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
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
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
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
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Stake</p>
                <p className="text-xl font-bold">
                  ${(bets.reduce((sum, bet) => sum + bet.stake, 0) / Math.max(bets.length, 1)).toFixed(0)}
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
                    {bets.map((bet) => (
                      <>
                        <TableRow key={bet.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(bet.id)}
                              className="w-8 h-8 p-0"
                            >
                              {expandedRows.has(bet.id) ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                              }
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
                              <p className="font-medium line-clamp-2">{bet.bet_description}</p>
                              
                              {/* Parlay legs preview */}
                              {bet.is_parlay && bet.legs && bet.legs.length > 0 && (
                                <div className="text-xs text-gray-600 space-y-1 pl-2 border-l-2 border-gray-200">
                                  {bet.legs.slice(0, 2).map((leg) => (
                                    <div key={leg.id}>
                                      <span className="font-medium">{leg.sport}:</span> {leg.bet_description} ({formatOdds(leg.odds)})
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
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <p className="font-medium">${bet.stake.toFixed(2)}</p>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusBadge(bet.status)}
                          </TableCell>
                          
                          <TableCell>
                            {bet.status === 'pending' ? (
                              <div className="text-sm">
                                <p className="text-blue-600">
                                  To Win: {formatCurrency(bet.potential_payout - bet.stake)}
                                </p>
                              </div>
                            ) : bet.profit !== undefined ? (
                              <p className={`font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                    <p className="font-medium text-gray-700 mb-3">Parlay Legs ({bet.legs.length})</p>
                                    <div className="space-y-2">
                                      {bet.legs.map((leg, index) => (
                                        <div key={leg.id} className="bg-white p-3 rounded border">
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                  {leg.sport}
                                                </Badge>
                                                <span className="text-xs text-gray-500">Leg {index + 1}</span>
                                              </div>
                                              <p className="font-medium text-sm">{leg.bet_description}</p>
                                              {leg.home_team && leg.away_team && (
                                                <p className="text-xs text-gray-600">{leg.away_team} @ {leg.home_team}</p>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">{formatOdds(leg.odds)}</p>
                                              {leg.line_value && (
                                                <p className="text-xs text-gray-600">
                                                  Line: {leg.line_value > 0 ? '+' : ''}{leg.line_value}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm border-t pt-4">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  {bet.home_team && bet.away_team && (
                                    <div>
                                      <p className="font-medium text-gray-700">Matchup</p>
                                      <p>{bet.away_team} @ {bet.home_team}</p>
                                    </div>
                                  )}
                                  
                                  {bet.line_value && (
                                    <div>
                                      <p className="font-medium text-gray-700">Line</p>
                                      <p>{bet.line_value > 0 ? '+' : ''}{bet.line_value}</p>
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
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {hasMore && (
                <div className="p-6 text-center border-t bg-gray-50">
                  <Button 
                    onClick={onLoadMore}
                    disabled={isLoading}
                    variant="default"
                    size="lg"
                    className="w-full sm:w-auto min-w-48"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading More Bets...
                      </>
                    ) : (
                      <>
                        Show 10 More Bets
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Showing {bets.length} of {totalBets.toLocaleString()} total bets
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click above to load 10 more recent bets
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bets found</h3>
              <p className="text-gray-600 mb-6">
                {totalBets === 0 
                  ? "You haven't placed any bets yet. Start tracking your betting performance!"
                  : "No bets match your current filters. Try adjusting your filter criteria."
                }
              </p>
              <Link href="/games">
                <Button>
                  Browse Games
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}