'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, DollarSign, ExternalLink, TrendingDown, TrendingUp } from "lucide-react"
import Link from 'next/link'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
  bet_description: string
  description?: string
  odds: string
  stake: number
  potential_payout: number
  status: 'pending' | 'won' | 'lost' | 'void'
  profit?: number
  placed_at: string
  sportsbook?: string
  home_team?: string
  away_team?: string
  bet_type?: string
  is_parlay?: boolean
  parlay_id?: string
  legs?: BetLeg[]
}

interface ChartDataPoint {
  date: string
  profit: number
  cumulative: number
}

interface OverviewTabProps {
  recentBets: Bet[]
  chartData: ChartDataPoint[]
  selectedTimePeriod: string
  onTimePeriodChange: (period: string) => void
  totalProfit: number
  isLoading?: boolean
}

const TIME_PERIODS = ['This Week', 'This Month', 'This Year']

export function OverviewTab({
  recentBets,
  chartData,
  selectedTimePeriod,
  onTimePeriodChange,
  totalProfit,
  isLoading = false
}: OverviewTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="bg-green-100 text-green-800">Won</Badge>
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'void':
        return <Badge className="bg-gray-100 text-gray-800">Void</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00'
    }
    return `$${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
  }

  const formatOdds = (odds: string | number) => {
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds
    return numericOdds > 0 ? `+${numericOdds}` : `${numericOdds}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Profit Over Time</span>
                </CardTitle>
                <div className="flex space-x-2">
                  {TIME_PERIODS.map(period => (
                    <Button
                      key={period}
                      variant={selectedTimePeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => onTimePeriodChange(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </div>
                <p className="text-sm text-gray-600">Total profit for {selectedTimePeriod.toLowerCase()}</p>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `$${value.toFixed(2)}`,
                        name === 'cumulative' ? 'Cumulative Profit' : 'Daily Profit'
                      ]}
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke={totalProfit >= 0 ? "#10B981" : "#EF4444"}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No betting data available for this time period</p>
                    <Link href="/games">
                      <Button className="mt-4">
                        Place Your First Bet
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bets */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Bets</span>
                <Badge variant="outline">{recentBets.length} bets</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentBets.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {recentBets.map((bet, index) => (
                    <div 
                      key={bet.id}
                      className={`p-4 ${index !== recentBets.length - 1 ? 'border-b' : ''}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {bet.sport}
                          </Badge>
                          {getStatusBadge(bet.status)}
                        </div>
                        
                        <p className="text-sm font-medium line-clamp-2">
                          {bet.bet_description || bet.description}
                        </p>
                        
                        {/* Parlay legs display */}
                        {bet.is_parlay && bet.legs && bet.legs.length > 0 && (
                          <div className="space-y-1 mt-2 pl-2 border-l-2 border-gray-200">
                            {bet.legs.slice(0, 3).map((leg) => (
                              <div key={leg.id} className="text-xs text-gray-600">
                                <span className="font-medium">{leg.sport}:</span> {leg.bet_description} ({formatOdds(leg.odds)})
                              </div>
                            ))}
                            {bet.legs.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{bet.legs.length - 3} more legs
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{formatOdds(bet.odds)}</span>
                          <span>${bet.stake.toFixed(2)}</span>
                        </div>
                        
                        {bet.status !== 'pending' && bet.profit !== undefined && (
                          <div className={`text-sm font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(bet.profit)}
                          </div>
                        )}
                        
                        {bet.status === 'pending' && (
                          <div className="text-sm text-blue-600">
                            Potential: {formatCurrency(bet.potential_payout - bet.stake)}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(bet.placed_at).toLocaleDateString()}</span>
                          {bet.sportsbook && (
                            <span>{bet.sportsbook}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">No recent bets</p>
                  <p className="text-sm">Your recent betting activity will appear here</p>
                  <Link href="/games">
                    <Button size="sm" className="mt-4">
                      Browse Games
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const lastTwo = chartData.slice(-2)
                    if (lastTwo.length === 2 && lastTwo[1]!.cumulative > lastTwo[0]!.cumulative) {
                      return "Improving"
                    }
                    return "Declining"
                  })()}
                </p>
              </div>
              {(() => {
                const lastTwo = chartData.slice(-2)
                if (lastTwo.length === 2 && lastTwo[1]!.cumulative > lastTwo[0]!.cumulative) {
                  return <TrendingUp className="w-8 h-8 text-green-500" />
                }
                return <TrendingDown className="w-8 h-8 text-red-500" />
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Bets</p>
                <p className="text-lg font-semibold">
                  {recentBets.filter(bet => bet.status === 'pending').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 7 Days</p>
                <p className="text-lg font-semibold">
                  {recentBets.filter(bet => {
                    const betDate = new Date(bet.placed_at)
                    const sevenDaysAgo = new Date()
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                    return betDate >= sevenDaysAgo
                  }).length} bets
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}