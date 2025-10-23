'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ResponsiveContainer, 
  ComposedChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  Bar
} from 'recharts'
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  Link,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Building2,
  GitBranch,
  Eye
} from 'lucide-react'

interface UnsettledBet {
  id: string
  bet_description: string
  sport: string
  league: string
  bet_type: string
  stake: number
  odds: number
  placed_at: string
  oddid: string | null
  home_team: string | null
  away_team: string | null
  player_name: string | null
  line_value: number | null
  parlay_id: string | null
  is_parlay: boolean
}

interface UnmatchedBetDescription {
  bet_description: string
  count: number
  sport: string
  league: string
  bet_type: string
  latest_occurrence: string
}

interface BetsAnalytics {
  // Core metrics from bets table
  totalBets: number
  totalStakes: number
  totalPotentialPayout: number
  totalProfit: number
  averageStake: number
  averageOdds: number
  
  // Status breakdown from bets table
  pendingBets: number
  wonBets: number
  lostBets: number
  voidBets: number
  cancelledBets: number
  winRate: number
  
  // CRITICAL: Oddid mapping from bets table
  betsWithOddids: number
  betsWithoutOddids: number
  oddidMappingPercentage: number
  
  // Bet source breakdown from bets table
  manualBets: number
  sharpsportsBets: number
  copyBets: number
  
  // TrueSharp specific analytics
  trueSharpStats: {
    totalBets: number
    settledBets: number
    unsettledBets: number
    totalStakes: number
    totalProfit: number
    winRate: number
    settlementRate: number
  }
  
  // Parlay-aware bet counting
  trueBetCount: number // Count parlays as single bets
  parlayStats: {
    totalParlays: number
    totalParlaylegs: number
    averageLegsPerParlay: number
  }
  
  // Unsettled bets with oddid
  unsettledBetsWithOddid: UnsettledBet[]
  
  // Sharpsports bet matches analytics
  sharpSportsMatching: {
    totalNonTrueSharpBets: number
    matchedBets: number
    unmatchedBets: number
    matchingRate: number
    matchesOverTime: Array<{
      date: string
      dateLabel: string
      totalBets: number
      matchedBets: number
      matchingRate: number
    }>
    unmatchedDescriptions: UnmatchedBetDescription[]
  }
  
  // Sport/League breakdown from bets table
  betsBySport: Array<{sport: string, count: number, mappedCount: number, mappingRate: number}>
  betsByLeague: Array<{league: string, count: number, mappedCount: number, mappingRate: number}>
  betsByType: Array<{type: string, count: number, mappedCount: number, mappingRate: number}>
  
  // Time series from bets table (placed_at)
  betsPerDayData: Array<{
    date: string
    dateLabel: string
    totalBets: number
    trueBetCount: number // Parlay-aware count
    mappedBets: number
    mappingPercentage: number
    totalStakes: number
    totalProfit: number
  }>
  
  // Recent trends from bets table
  last7DaysData: {
    totalBets: number
    trueBetCount: number
    mappedBets: number
    mappingRate: number
    totalStakes: number
    totalProfit: number
  }
  
  last30DaysData: {
    totalBets: number
    trueBetCount: number
    mappedBets: number
    mappingRate: number
    totalStakes: number
    totalProfit: number
  }
}

interface CleanBetsTabProps {
  className?: string
}

export function CleanBetsTab({ className }: CleanBetsTabProps) {
  const [analytics, setAnalytics] = useState<BetsAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/bets-analytics')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAnalytics(result.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Error fetching bets analytics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  const getMappingStatus = (percentage: number) => {
    if (percentage >= 90) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
    if (percentage >= 75) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
    if (percentage >= 50) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' }
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
    return `$${value.toFixed(0)}`
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error loading bets analytics</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchAnalytics} 
              variant="outline" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All-Time Betting Analytics</h1>
          <p className="text-gray-600">
            Complete historical data • {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && !analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Critical Oddid Mapping Status */}
          <Card className={`border-2 ${getMappingStatus(analytics.oddidMappingPercentage).bg}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-purple-600" />
                Oddid Mapping Status
                <Badge variant="outline" className={getMappingStatus(analytics.oddidMappingPercentage).color}>
                  {getMappingStatus(analytics.oddidMappingPercentage).status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.oddidMappingPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Overall Mapping Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">
                    {analytics.betsWithOddids.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Bets with Oddids</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">
                    {analytics.betsWithoutOddids.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Bets without Oddids</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-blue-600">
                    {analytics.last7DaysData.mappingRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Last 7 Days Mapping</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TrueSharp Analytics */}
          <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                TrueSharp Sportsbook Analytics
                <Badge variant="outline" className="text-blue-600">
                  Primary Platform
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics.trueSharpStats.totalBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total TrueSharp Bets</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.trueSharpStats.settledBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Settled Bets</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-orange-600">
                    {analytics.trueSharpStats.unsettledBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Unsettled Bets</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.trueSharpStats.settlementRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Settlement Rate</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.trueSharpStats.totalStakes)}
                  </p>
                  <p className="text-sm text-gray-600">Total Stakes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className={`text-2xl font-bold ${
                    analytics.trueSharpStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.trueSharpStats.totalProfit >= 0 ? '+' : ''}{formatCurrency(analytics.trueSharpStats.totalProfit)}
                  </p>
                  <p className="text-sm text-gray-600">Total Profit</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.trueSharpStats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bets (All-Time)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.totalBets.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.trueBetCount.toLocaleString()} true bets (parlay-aware)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Stakes (All-Time)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalStakes)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {formatCurrency(analytics.averageStake)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Win Rate (All-Time)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.parlayStats.totalParlays} parlays, {analytics.parlayStats.averageLegsPerParlay} avg legs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    analytics.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      analytics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profit (All-Time)</p>
                    <p className={`text-2xl font-bold ${
                      analytics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analytics.totalProfit >= 0 ? '+' : ''}{formatCurrency(analytics.totalProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bet Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Daily Bet Volume & Mapping Trends (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={analytics.betsPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="percentage"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={value => `${value}%`}
                  />
                  <YAxis 
                    yAxisId="count"
                    orientation="left"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'mappingPercentage' ? `${value}%` : value,
                      name === 'mappingPercentage' ? 'Mapping %' : 
                      name === 'totalBets' ? 'Total Bets' : 
                      name === 'trueBetCount' ? 'True Bets (Parlay-aware)' : 
                      name === 'mappedBets' ? 'Mapped Bets' : name
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="count"
                    dataKey="totalBets" 
                    fill="#e2e8f0" 
                    name="Total Bets"
                    opacity={0.5}
                  />
                  <Bar 
                    yAxisId="count"
                    dataKey="trueBetCount" 
                    fill="#3b82f6" 
                    name="True Bets (Parlay-aware)"
                    opacity={0.8}
                  />
                  <Bar 
                    yAxisId="count"
                    dataKey="mappedBets" 
                    fill="#8b5cf6" 
                    name="Mapped Bets"
                  />
                  <Line
                    yAxisId="percentage"
                    type="monotone"
                    dataKey="mappingPercentage"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="Mapping %"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bet Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Bet Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Manual</p>
                    <p className="text-sm text-gray-600">
                      {analytics.manualBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline">
                    {analytics.totalBets > 0 ? ((analytics.manualBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">SharpSports</p>
                    <p className="text-sm text-gray-600">
                      {analytics.sharpsportsBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline">
                    {analytics.totalBets > 0 ? ((analytics.sharpsportsBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Copy Bets</p>
                    <p className="text-sm text-gray-600">
                      {analytics.copyBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline">
                    {analytics.totalBets > 0 ? ((analytics.copyBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bet Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Bet Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Pending</p>
                    <p className="text-sm text-gray-600">
                      {analytics.pendingBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline">
                    {analytics.totalBets > 0 ? ((analytics.pendingBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Won</p>
                    <p className="text-sm text-gray-600">
                      {analytics.wonBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {analytics.totalBets > 0 ? ((analytics.wonBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Lost</p>
                    <p className="text-sm text-gray-600">
                      {analytics.lostBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline" className="text-red-600">
                    {analytics.totalBets > 0 ? ((analytics.lostBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Cancelled</p>
                    <p className="text-sm text-gray-600">
                      {analytics.cancelledBets.toLocaleString()} bets
                    </p>
                  </div>
                  <Badge variant="outline">
                    {analytics.totalBets > 0 ? ((analytics.cancelledBets / analytics.totalBets) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unsettled Bets with Oddid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-600" />
                Unsettled Bets with Oddid
                <Badge variant="outline">
                  {analytics.unsettledBetsWithOddid.length} bets
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.unsettledBetsWithOddid.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unsettled bets with oddid found</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {analytics.unsettledBetsWithOddid.slice(0, 50).map((bet) => (
                      <div key={bet.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {bet.bet_description}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>{bet.sport} • {bet.league}</span>
                              <span>{bet.bet_type}</span>
                              <span>${bet.stake}</span>
                              <span>{bet.odds > 0 ? '+' : ''}{bet.odds}</span>
                              {bet.parlay_id && (
                                <Badge variant="outline" className="text-xs">
                                  Parlay
                                </Badge>
                              )}
                            </div>
                            {(bet.home_team && bet.away_team) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {bet.away_team} @ {bet.home_team}
                              </p>
                            )}
                            {bet.player_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                Player: {bet.player_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs">
                            <p className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                              {bet.oddid}
                            </p>
                            <p className="text-gray-500 mt-1">
                              {new Date(bet.placed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {analytics.unsettledBetsWithOddid.length > 50 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      Showing first 50 of {analytics.unsettledBetsWithOddid.length} unsettled bets
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SharpSports Matching Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-green-600" />
                SharpSports Bet Matching Analytics
                <Badge variant="outline" className="text-green-600">
                  {analytics.sharpSportsMatching.matchingRate.toFixed(1)}% Match Rate
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.sharpSportsMatching.totalNonTrueSharpBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Non-TrueSharp Bets</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.sharpSportsMatching.matchedBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Matched Bets</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.sharpSportsMatching.unmatchedBets.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Unmatched Bets</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.sharpSportsMatching.matchingRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Matching Rate</p>
                </div>
              </div>

              {/* Matching Over Time Chart */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Daily Matching Rate (Last 30 Days)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={analytics.sharpSportsMatching.matchesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="dateLabel" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="percentage"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={value => `${value}%`}
                    />
                    <YAxis 
                      yAxisId="count"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'matchingRate' ? `${value}%` : value,
                        name === 'matchingRate' ? 'Matching Rate' : 
                        name === 'totalBets' ? 'Total Bets' : 'Matched Bets'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="count"
                      dataKey="totalBets" 
                      fill="#e2e8f0" 
                      name="Total Bets"
                      opacity={0.7}
                    />
                    <Bar 
                      yAxisId="count"
                      dataKey="matchedBets" 
                      fill="#10b981" 
                      name="Matched Bets"
                    />
                    <Line
                      yAxisId="percentage"
                      type="monotone"
                      dataKey="matchingRate"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Matching Rate"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Unmatched Bet Descriptions */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Most Common Unmatched Bet Descriptions (All-Time)</h4>
                {analytics.sharpSportsMatching.unmatchedDescriptions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No unmatched bet descriptions found</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {analytics.sharpSportsMatching.unmatchedDescriptions.slice(0, 50).map((desc, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {desc.bet_description}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                <span>{desc.sport} • {desc.league}</span>
                                <span>{desc.bet_type}</span>
                                <span>Latest: {new Date(desc.latest_occurrence).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-red-600">
                                {desc.count} unmatched
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {analytics.sharpSportsMatching.unmatchedDescriptions.length > 50 && (
                      <p className="text-center text-gray-500 text-sm mt-4">
                        Showing top 50 of {analytics.sharpSportsMatching.unmatchedDescriptions.length} unmatched descriptions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sport Performance */}
          {analytics.betsBySport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Sport Mapping Performance (All-Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.betsBySport.slice(0, 6).map((sport) => (
                    <div key={sport.sport} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900 uppercase">{sport.sport}</p>
                        <Badge 
                          variant="outline"
                          className={getMappingStatus(sport.mappingRate).color}
                        >
                          {sport.mappingRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {sport.count.toLocaleString()} bets
                      </p>
                      <p className="text-xs text-gray-500">
                        {sport.mappedCount} mapped
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}