'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import { BarChart3, TrendingUp, TrendingDown, Target, Trophy, Activity, PieChart, LineChart, Calendar, Star, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  sportBreakdown: Record<string, {
    bets: number
    roi: number
    win_rate: number
  }>
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
    monthlyTrends: []
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
        .select(`
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
        `)
        .eq('user_id', user.id)
        .order('roi_percentage', { ascending: false })

      if (leaderboardError) {
        console.error('Error fetching analytics:', leaderboardError)
        return
      }

      // Get subscriber counts for each strategy
      const { data: subscriptionCounts, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          strategy_id,
          status,
          strategies!inner (
            user_id
          )
        `)
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
        subscriber_count: subscriberCountMap.get(strategy.strategy_id) || 0
      }))

      setStrategies(processedStrategies)

      // Calculate overall metrics
      const totalBets = processedStrategies.reduce((sum, s) => sum + s.total_bets, 0)
      const totalWinningBets = processedStrategies.reduce((sum, s) => sum + s.winning_bets, 0)
      const weightedROI = processedStrategies.reduce((sum, s) => sum + (s.roi_percentage * s.total_bets), 0)
      
      const overallROI = totalBets > 0 ? weightedROI / totalBets : 0
      const overallWinRate = totalBets > 0 ? (totalWinningBets / totalBets) * 100 : 0

      // Find best and worst performing strategies
      const monetizedStrategies = processedStrategies.filter(s => s.is_monetized && s.total_bets >= 10)
      const bestPerforming = monetizedStrategies.length > 0 ? 
        monetizedStrategies.reduce((best, current) => 
          current.roi_percentage > best.roi_percentage ? current : best
        ) : null

      const worstPerforming = monetizedStrategies.length > 1 ?
        monetizedStrategies.reduce((worst, current) =>
          current.roi_percentage < worst.roi_percentage ? current : worst
        ) : null

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
        if (data.bets > 0) {
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
          win_rate: overallWinRate * (0.8 + Math.random() * 0.4)
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
        monthlyTrends
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
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Verified</Badge>
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unverified</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Overall ROI</p>
              <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(metrics.overallROI)}`}>
                {formatPercentage(metrics.overallROI)}
              </p>
              <p className="text-xs text-green-600">Across all strategies</p>
            </div>
            <div className="p-2 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Win Rate</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{metrics.overallWinRate.toFixed(1)}%</p>
              <p className="text-xs text-blue-600">{metrics.totalWinnings} of {metrics.totalBets} bets</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Bets</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{metrics.totalBets.toLocaleString()}</p>
              <p className="text-xs text-purple-600">Across {strategies.length} strategies</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-xl">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Active Strategies</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{strategies.filter(s => s.is_monetized).length}</p>
              <p className="text-xs text-orange-600">of {strategies.length} total</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-xl">
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Top Performers
          </h3>
          <div className="space-y-4">
            {metrics.bestPerformingStrategy && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-900">Best Strategy</h4>
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">{metrics.bestPerformingStrategy.strategy_name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="text-green-700">ROI: {formatPercentage(metrics.bestPerformingStrategy.roi_percentage)}</span>
                  <span className="text-blue-700">Win Rate: {metrics.bestPerformingStrategy.win_rate.toFixed(1)}%</span>
                  <span className="text-purple-700">{metrics.bestPerformingStrategy.total_bets} bets</span>
                </div>
              </div>
            )}

            {metrics.worstPerformingStrategy && metrics.worstPerformingStrategy !== metrics.bestPerformingStrategy && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-900">Needs Improvement</h4>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <p className="font-medium text-gray-900">{metrics.worstPerformingStrategy.strategy_name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="text-red-700">ROI: {formatPercentage(metrics.worstPerformingStrategy.roi_percentage)}</span>
                  <span className="text-blue-700">Win Rate: {metrics.worstPerformingStrategy.win_rate.toFixed(1)}%</span>
                  <span className="text-purple-700">{metrics.worstPerformingStrategy.total_bets} bets</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Sport Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Performance by Sport
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.sportBreakdown).map(([sport, data]) => (
              <div key={sport} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
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
              <p className="text-gray-500 text-center py-4">No sport data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Strategy Performance Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Strategy Performance
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            {[
              { key: 'roi', label: 'ROI' },
              { key: 'win_rate', label: 'Win Rate' },
              { key: 'total_bets', label: 'Total Bets' },
              { key: 'subscribers', label: 'Subscribers' }
            ].map((sort) => (
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
          {sortedStrategies.map((strategy) => (
            <div key={strategy.strategy_id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {strategy.strategy_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{strategy.strategy_name}</h4>
                      {getVerificationBadge(strategy.verification_status)}
                      {strategy.is_monetized && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Zap className="h-3 w-3 mr-1" />
                          Monetized
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {strategy.primary_sport || 'Multi-sport'} • {strategy.subscriber_count} subscribers
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
                    <p className="font-bold text-gray-900 text-sm">
                      {strategy.winning_bets}-{strategy.losing_bets}-{strategy.push_bets}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {strategies.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
            <p className="text-gray-600">Create strategies and place bets to see your performance analytics</p>
          </div>
        )}
      </Card>
    </div>
  )
}