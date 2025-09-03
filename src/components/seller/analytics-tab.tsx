'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import {
  Activity,
  // LineChart, // TS6133: unused import
  // Calendar, // TS6133: unused import
  // Star, // TS6133: unused import
  Award,
  BarChart3,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface StrategyAnalytics {
  strategy_id: string
  strategy_name: string
  total_bets: number
  winning_bets: number
  losing_bets: number
  push_bets: number
  roi_percentage: number
  win_rate: number
  is_monetized: boolean
  subscriber_count: number
  primary_sport: string
  verification_status: string
  start_date: string
  last_calculated_at: string
}

interface PerformanceMetrics {
  overallROI: number
  overallWinRate: number
  totalBets: number
  totalWinnings: number
  bestPerformingStrategy: StrategyAnalytics | null
  worstPerformingStrategy: StrategyAnalytics | null
  sportBreakdown: Record<
    string,
    {
      bets: number
      roi: number
      win_rate: number
    }
  >
  monthlyTrends: Array<{
    month: string
    bets: number
    roi: number
    win_rate: number
  }>
}

export function AnalyticsTab() {
  const { user } = useAuth()
  const [strategies, setStrategies] = useState<StrategyAnalytics[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    overallROI: 0,
    overallWinRate: 0,
    totalBets: 0,
    totalWinnings: 0,
    bestPerformingStrategy: null,
    worstPerformingStrategy: null,
    sportBreakdown: {},
    monthlyTrends: [],
  })
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'roi' | 'win_rate' | 'total_bets' | 'subscribers'>('roi')

  const loadAnalyticsData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Get analytics data from strategy_leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('strategy_leaderboard')
        .select(
          `
          strategy_id,
          strategy_name,
          total_bets,
          winning_bets,
          losing_bets,
          push_bets,
          roi_percentage,
          win_rate,
          is_monetized,
          primary_sport,
          verification_status,
          start_date,
          last_calculated_at
        `
        )
        .eq('user_id', user.id)
        .order('roi_percentage', { ascending: false })

      if (leaderboardError) {
        console.error('Error fetching analytics:', leaderboardError)
        return
      }

      // Get subscriber counts for each strategy
      const { data: subscriptionCounts } = await supabase // TS6133: remove unused subscriptionError
        .from('subscriptions')
        .select(
          `
          strategy_id,
          status,
          strategies!inner (
            user_id
          )
        `
        )
        .eq('strategies.user_id', user.id)
        .eq('status', 'active')

      const subscriberCountMap = new Map()
      subscriptionCounts?.forEach(sub => {
        const current = subscriberCountMap.get(sub.strategy_id) || 0
        subscriberCountMap.set(sub.strategy_id, current + 1)
      })

      // Process analytics data
      const processedStrategies: StrategyAnalytics[] = (leaderboardData || []).map(strategy => ({
        ...strategy,
        win_rate: strategy.win_rate * 100, // Convert to percentage
        subscriber_count: subscriberCountMap.get(strategy.strategy_id) || 0,
      }))

      setStrategies(processedStrategies)

      // Calculate overall metrics
      const totalBets = processedStrategies.reduce((sum, s) => sum + s.total_bets, 0)
      const totalWinningBets = processedStrategies.reduce((sum, s) => sum + s.winning_bets, 0)
      const weightedROI = processedStrategies.reduce(
        (sum, s) => sum + s.roi_percentage * s.total_bets,
        0
      )

      const overallROI = totalBets > 0 ? weightedROI / totalBets : 0
      const overallWinRate = totalBets > 0 ? (totalWinningBets / totalBets) * 100 : 0

      // Find best and worst performing strategies
      const monetizedStrategies = processedStrategies.filter(
        s => s.is_monetized && s.total_bets >= 10
      )
      const bestPerforming =
        monetizedStrategies.length > 0
          ? monetizedStrategies.reduce((best, current) =>
              current.roi_percentage > best.roi_percentage ? current : best
            )
          : null

      const worstPerforming =
        monetizedStrategies.length > 1
          ? monetizedStrategies.reduce((worst, current) =>
              current.roi_percentage < worst.roi_percentage ? current : worst
            )
          : null

      // Calculate sport breakdown
      const sportBreakdown: Record<string, { bets: number; roi: number; win_rate: number }> = {}
      processedStrategies.forEach(strategy => {
        if (strategy.primary_sport) {
          const sport = strategy.primary_sport
          if (!sportBreakdown[sport]) {
            sportBreakdown[sport] = { bets: 0, roi: 0, win_rate: 0 }
          }
          sportBreakdown[sport].bets += strategy.total_bets
          sportBreakdown[sport].roi += strategy.roi_percentage * strategy.total_bets
          sportBreakdown[sport].win_rate += strategy.win_rate * strategy.total_bets
        }
      })

      // Normalize sport breakdown
      Object.keys(sportBreakdown).forEach(sport => {
        const data = sportBreakdown[sport]
        if (data && data.bets > 0) {
          // TS18048: Add null check
          data.roi = data.roi / data.bets
          data.win_rate = data.win_rate / data.bets
        }
      })

      // Generate mock monthly trends (would use historical data in production)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        const variation = (Math.random() - 0.5) * 10 + 1

        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          bets: Math.floor((totalBets / 6) * variation),
          roi: overallROI * variation,
          win_rate: overallWinRate * (0.8 + Math.random() * 0.4),
        }
      })

      setMetrics({
        overallROI,
        overallWinRate,
        totalBets,
        totalWinnings: totalWinningBets,
        bestPerformingStrategy: bestPerforming,
        worstPerformingStrategy: worstPerforming,
        sportBreakdown,
        monthlyTrends,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  const sortedStrategies = [...strategies].sort((a, b) => {
    switch (sortBy) {
      case 'roi':
        return b.roi_percentage - a.roi_percentage
      case 'win_rate':
        return b.win_rate - a.win_rate
      case 'total_bets':
        return b.total_bets - a.total_bets
      case 'subscribers':
        return b.subscriber_count - a.subscriber_count
      default:
        return b.roi_percentage - a.roi_percentage
    }
  })

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Verified</Badge>
      case 'premium':
        return <Badge className="border-purple-200 bg-purple-100 text-purple-800">Premium</Badge>
      default:
        return <Badge className="border-gray-200 bg-gray-100 text-gray-800">Unverified</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-8 w-1/2 rounded bg-gray-200"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Overall ROI</p>
              <p className={`mt-1 text-3xl font-bold ${getPerformanceColor(metrics.overallROI)}`}>
                {formatPercentage(metrics.overallROI)}
              </p>
              <p className="text-xs text-green-600">Across all strategies</p>
            </div>
            <div className="rounded-xl bg-green-100 p-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Win Rate</p>
              <p className="mt-1 text-3xl font-bold text-blue-900">
                {metrics.overallWinRate.toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600">
                {metrics.totalWinnings} of {metrics.totalBets} bets
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-2">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Bets</p>
              <p className="mt-1 text-3xl font-bold text-purple-900">
                {metrics.totalBets.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600">Across {strategies.length} strategies</p>
            </div>
            <div className="rounded-xl bg-purple-100 p-2">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Active Strategies</p>
              <p className="mt-1 text-3xl font-bold text-orange-900">
                {strategies.filter(s => s.is_monetized).length}
              </p>
              <p className="text-xs text-orange-600">of {strategies.length} total</p>
            </div>
            <div className="rounded-xl bg-orange-100 p-2">
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Award className="mr-2 h-5 w-5" />
            Top Performers
          </h3>
          <div className="space-y-4">
            {metrics.bestPerformingStrategy && (
              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-green-900">Best Strategy</h4>
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">
                  {metrics.bestPerformingStrategy.strategy_name}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-green-700">
                    ROI: {formatPercentage(metrics.bestPerformingStrategy.roi_percentage)}
                  </span>
                  <span className="text-blue-700">
                    Win Rate: {metrics.bestPerformingStrategy.win_rate.toFixed(1)}%
                  </span>
                  <span className="text-purple-700">
                    {metrics.bestPerformingStrategy.total_bets} bets
                  </span>
                </div>
              </div>
            )}

            {metrics.worstPerformingStrategy &&
              metrics.worstPerformingStrategy !== metrics.bestPerformingStrategy && (
                <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-red-900">Needs Improvement</h4>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="font-medium text-gray-900">
                    {metrics.worstPerformingStrategy.strategy_name}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-red-700">
                      ROI: {formatPercentage(metrics.worstPerformingStrategy.roi_percentage)}
                    </span>
                    <span className="text-blue-700">
                      Win Rate: {metrics.worstPerformingStrategy.win_rate.toFixed(1)}%
                    </span>
                    <span className="text-purple-700">
                      {metrics.worstPerformingStrategy.total_bets} bets
                    </span>
                  </div>
                </div>
              )}
          </div>
        </Card>

        {/* Sport Breakdown */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <PieChart className="mr-2 h-5 w-5" />
            Performance by Sport
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.sportBreakdown).map(([sport, data]) => (
              <div
                key={sport}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center">
                  <div className="mr-3 h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">{sport}</span>
                </div>
                <div className="text-right text-sm">
                  <p className={`font-semibold ${getPerformanceColor(data.roi)}`}>
                    {formatPercentage(data.roi)}
                  </p>
                  <p className="text-gray-600">{data.bets} bets</p>
                </div>
              </div>
            ))}
            {Object.keys(metrics.sportBreakdown).length === 0 && (
              <p className="py-4 text-center text-gray-500">No sport data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Strategy Performance Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <BarChart3 className="mr-2 h-5 w-5" />
            Strategy Performance
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            {[
              { key: 'roi', label: 'ROI' },
              { key: 'win_rate', label: 'Win Rate' },
              { key: 'total_bets', label: 'Total Bets' },
              { key: 'subscribers', label: 'Subscribers' },
            ].map(sort => (
              <Button
                key={sort.key}
                variant={sortBy === sort.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sort.key as typeof sortBy)}
              >
                {sort.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {sortedStrategies.map(strategy => (
            <div
              key={strategy.strategy_id}
              className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-white">
                    {strategy.strategy_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{strategy.strategy_name}</h4>
                      {getVerificationBadge(strategy.verification_status)}
                      {strategy.is_monetized && (
                        <Badge className="border-green-200 bg-green-100 text-green-800">
                          <Zap className="mr-1 h-3 w-3" />
                          Monetized
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {strategy.primary_sport || 'Multi-sport'} • {strategy.subscriber_count}{' '}
                      subscribers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">ROI</p>
                    <p className={`font-bold ${getPerformanceColor(strategy.roi_percentage)}`}>
                      {formatPercentage(strategy.roi_percentage)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="font-bold text-gray-900">{strategy.win_rate.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Bets</p>
                    <p className="font-bold text-gray-900">{strategy.total_bets}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">W-L-P</p>
                    <p className="text-sm font-bold text-gray-900">
                      {strategy.winning_bets}-{strategy.losing_bets}-{strategy.push_bets}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {strategies.length === 0 && (
          <div className="py-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No analytics data</h3>
            <p className="text-gray-600">
              Create strategies and place bets to see your performance analytics
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
