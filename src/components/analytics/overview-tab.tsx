'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, DollarSign, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

interface AnalyticsData {
  roiOverTime: { day: string; net_profit: number; stake: number; roi_pct: number; bets: number }[]
}

interface OverviewTabProps {
  recentBets: Bet[]
  chartData: ChartDataPoint[]
  selectedTimePeriod: string
  onTimePeriodChange: (period: string) => void
  totalProfit: number
  isLoading?: boolean
  analyticsData?: AnalyticsData
}

const TIME_PERIODS = ['This Week', 'This Month', 'This Year']

export function OverviewTab({
  recentBets,
  chartData,
  selectedTimePeriod,
  onTimePeriodChange,
  totalProfit,
  isLoading = false,
  analyticsData,
}: OverviewTabProps) {
  // Independent time period state for this chart only
  const [chartTimePeriod, setChartTimePeriod] = useState<'week' | 'month' | 'year'>('month')

  // Process data using chart's own time period but respect other page filters through recentBets
  const getProfitChartData = () => {
    if (!analyticsData?.roiOverTime) return []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    let start: Date, end: Date
    switch (chartTimePeriod) {
      case 'week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        start = startOfWeek
        end = new Date()
        break
      case 'month':
        start = new Date(currentYear, currentMonth, 1)
        end = new Date(currentYear, currentMonth + 1, 0)
        break
      case 'year':
        start = new Date(currentYear, 0, 1)
        end = new Date(currentYear, 11, 31)
        break
    }

    // Filter data by time period
    const sourceData = analyticsData.roiOverTime
      .filter(item => {
        const itemDate = new Date(item.day)
        return itemDate >= start && itemDate <= end
      })
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())

    if (sourceData.length === 0) return []

    // Calculate cumulative profit over time
    let cumulativeProfit = 0

    if (chartTimePeriod === 'week' || chartTimePeriod === 'month') {
      // Daily view with cumulative profit
      return sourceData.map(item => {
        cumulativeProfit += item.net_profit
        return {
          dateLabel: new Date(item.day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          profit: cumulativeProfit,
        }
      })
    } else {
      // Monthly view with cumulative profit
      const monthlyData: { [key: string]: { dateLabel: string; dailyProfits: number[] } } = {}

      sourceData.forEach(item => {
        const date = new Date(item.day)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            dateLabel: date.toLocaleDateString('en-US', {
              month: 'short',
            }),
            dailyProfits: [],
          }
        }

        monthlyData[monthKey].dailyProfits.push(item.net_profit)
      })

      // Convert to cumulative monthly totals
      return Object.keys(monthlyData)
        .sort()
        .map(monthKey => {
          const monthProfit = monthlyData[monthKey].dailyProfits.reduce(
            (sum, profit) => sum + profit,
            0
          )
          cumulativeProfit += monthProfit
          return {
            dateLabel: monthlyData[monthKey].dateLabel,
            profit: cumulativeProfit,
          }
        })
    }
  }
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
          <div className="mb-4 h-8 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-96 rounded bg-gray-200"></div>
            </div>
            <div>
              <div className="h-96 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profit Chart */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Total Profit Over Time
                      </h3>
                      <p className="text-sm text-gray-500">{`cumulative profit tracking`}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                      {['This Week', 'This Month', 'This Year'].map(period => {
                        const periodKey = period.includes('Week')
                          ? 'week'
                          : period.includes('Month')
                            ? 'month'
                            : 'year'
                        return (
                          <button
                            key={period}
                            onClick={() => setChartTimePeriod(periodKey)}
                            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                              chartTimePeriod === periodKey
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            {period.replace('This ', '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getProfitChartData()}>
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke="#e2e8f0"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    angle={chartTimePeriod === 'month' ? -45 : 0}
                    textAnchor={chartTimePeriod === 'month' ? 'end' : 'middle'}
                    height={chartTimePeriod === 'month' ? 60 : 30}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value =>
                      `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [
                      `$${value >= 0 ? '+' : ''}${value.toFixed(2)}`,
                      'Total Profit',
                    ]}
                    labelFormatter={value => value}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 1.5, fill: '#059669', strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
                    name="Total Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
              {getProfitChartData().length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <TrendingUp className="mx-auto mb-4 h-16 w-16 opacity-30" />
                  <p className="text-lg font-medium">No profit data available</p>
                  <p className="text-sm">{`No data available for this ${chartTimePeriod}`}</p>
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

                        <p className="line-clamp-2 text-sm font-medium">
                          {bet.bet_description || bet.description}
                        </p>

                        {/* Parlay legs display */}
                        {bet.is_parlay && bet.legs && bet.legs.length > 0 && (
                          <div className="mt-2 space-y-1 border-l-2 border-gray-200 pl-2">
                            {bet.legs.slice(0, 3).map(leg => (
                              <div key={leg.id} className="text-xs text-gray-600">
                                <span className="font-medium">{leg.sport}:</span>{' '}
                                {leg.bet_description} ({formatOdds(leg.odds)})
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
                          <div
                            className={`text-sm font-medium ${bet.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
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
                          {bet.sportsbook && <span>{bet.sportsbook}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="mb-2">No recent bets</p>
                  <p className="text-sm">Your recent betting activity will appear here</p>
                  <Link href="/games">
                    <Button size="sm" className="mt-4">
                      Browse Games
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const lastTwo = chartData.slice(-2)
                    if (lastTwo.length === 2 && lastTwo[1]!.cumulative > lastTwo[0]!.cumulative) {
                      return 'Improving'
                    }
                    return 'Declining'
                  })()}
                </p>
              </div>
              {(() => {
                const lastTwo = chartData.slice(-2)
                if (lastTwo.length === 2 && lastTwo[1]!.cumulative > lastTwo[0]!.cumulative) {
                  return <TrendingUp className="h-8 w-8 text-green-500" />
                }
                return <TrendingDown className="h-8 w-8 text-red-500" />
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <DollarSign className="h-4 w-4 text-yellow-600" />
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
                  {
                    recentBets.filter(bet => {
                      const betDate = new Date(bet.placed_at)
                      const sevenDaysAgo = new Date()
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                      return betDate >= sevenDaysAgo
                    }).length
                  }{' '}
                  bets
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
