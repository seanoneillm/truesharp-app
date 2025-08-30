'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, PieChart, BarChart3, Wallet, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RevenueData {
  date: string
  gross_revenue: number
  net_revenue: number
  platform_fee: number
  subscriber_count: number
}

interface FinancialMetrics {
  totalGrossRevenue: number
  totalNetRevenue: number
  totalPlatformFees: number
  monthlyGrowthRate: number
  averageRevenuePerUser: number
  totalSubscribers: number
  revenueByFrequency: {
    weekly: number
    monthly: number
    yearly: number
  }
  topPerformingStrategies: Array<{
    strategy_name: string
    revenue: number
    subscriber_count: number
  }>
}

export function FinancialsTab() {
  const { user } = useAuth()
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalGrossRevenue: 0,
    totalNetRevenue: 0,
    totalPlatformFees: 0,
    monthlyGrowthRate: 0,
    averageRevenuePerUser: 0,
    totalSubscribers: 0,
    revenueByFrequency: {
      weekly: 0,
      monthly: 0,
      yearly: 0
    },
    topPerformingStrategies: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const loadFinancialData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Get subscription data for financial analysis
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          strategy_id,
          frequency,
          price,
          status,
          created_at,
          updated_at,
          strategies!inner (
            name,
            user_id
          )
        `)
        .eq('strategies.user_id', user.id)
        .eq('status', 'active')

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError)
        return
      }

      const subscriptions = subscriptionsData || []

      // Calculate metrics
      let totalGrossRevenue = 0
      let revenueByFrequency = { weekly: 0, monthly: 0, yearly: 0 }
      const strategyRevenue = new Map()

      subscriptions.forEach(sub => {
        const monthlyPrice = sub.frequency === 'weekly' ? sub.price * 4.33 :
                           sub.frequency === 'yearly' ? sub.price / 12 :
                           sub.price

        totalGrossRevenue += monthlyPrice
        revenueByFrequency[sub.frequency] += monthlyPrice

        // Track strategy performance
        const strategyName = sub.strategies?.name || 'Unknown Strategy'
        const current = strategyRevenue.get(strategyName) || { revenue: 0, subscriber_count: 0 }
        strategyRevenue.set(strategyName, {
          strategy_name: strategyName,
          revenue: current.revenue + monthlyPrice,
          subscriber_count: current.subscriber_count + 1
        })
      })

      const totalPlatformFees = totalGrossRevenue * 0.18 // 18% platform fee
      const totalNetRevenue = totalGrossRevenue * 0.82

      // Get top performing strategies
      const topPerformingStrategies = Array.from(strategyRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate growth rate (mock data for now - would need historical data)
      const monthlyGrowthRate = subscriptions.length > 0 ? 12.5 : 0

      // Generate mock historical data for the chart
      const generateRevenueData = () => {
        const data: RevenueData[] = []
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        const baseRevenue = totalGrossRevenue / 30 // Daily average
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          
          // Add some realistic variation
          const variation = (Math.random() - 0.5) * 0.3 + 1
          const dailyGross = baseRevenue * variation
          const dailyNet = dailyGross * 0.82
          const platformFee = dailyGross * 0.18
          
          data.push({
            date: date.toISOString().split('T')[0],
            gross_revenue: dailyGross,
            net_revenue: dailyNet,
            platform_fee: platformFee,
            subscriber_count: subscriptions.length
          })
        }
        
        return data
      }

      setRevenueData(generateRevenueData())
      setMetrics({
        totalGrossRevenue,
        totalNetRevenue,
        totalPlatformFees,
        monthlyGrowthRate,
        averageRevenuePerUser: subscriptions.length > 0 ? totalNetRevenue / subscriptions.length : 0,
        totalSubscribers: subscriptions.length,
        revenueByFrequency,
        topPerformingStrategies
      })

    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, timeRange])

  useEffect(() => {
    loadFinancialData()
  }, [loadFinancialData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
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
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Net Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{formatCurrency(metrics.totalNetRevenue)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {formatPercentage(metrics.monthlyGrowthRate)} this month
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Gross Revenue</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{formatCurrency(metrics.totalGrossRevenue)}</p>
              <p className="text-xs text-blue-600">Before platform fees</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">ARPU</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{formatCurrency(metrics.averageRevenuePerUser)}</p>
              <p className="text-xs text-purple-600">Average revenue per user</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Platform Fees</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{formatCurrency(metrics.totalPlatformFees)}</p>
              <p className="text-xs text-orange-600">18% of gross revenue</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Time Range Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="flex items-center space-x-2">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: '1y', label: '1 Year' }
            ].map((range) => (
              <Button
                key={range.key}
                variant={timeRange === range.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.key as typeof timeRange)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Revenue by Frequency
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics.revenueByFrequency).map(([frequency, revenue]) => (
              <div key={frequency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    frequency === 'weekly' ? 'bg-blue-500' :
                    frequency === 'monthly' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <span className="font-medium capitalize">{frequency}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(revenue)}</p>
                  <p className="text-sm text-gray-500">
                    {metrics.totalGrossRevenue > 0 ? 
                      Math.round((revenue / metrics.totalGrossRevenue) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Strategies */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Top Performing Strategies
          </h3>
          <div className="space-y-4">
            {metrics.topPerformingStrategies.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No strategy data available</p>
            ) : (
              metrics.topPerformingStrategies.map((strategy, index) => (
                <div key={strategy.strategy_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{strategy.strategy_name}</p>
                      <p className="text-sm text-gray-500">{strategy.subscriber_count} subscribers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(strategy.revenue)}</p>
                    <p className="text-xs text-gray-500">monthly</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          Revenue Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Monthly Net Revenue</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalNetRevenue)}</p>
            <p className="text-sm text-green-600">After 18% platform fee</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Active Subscribers</span>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{metrics.totalSubscribers}</p>
            <p className="text-sm text-blue-600">Paying customers</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Growth Rate</span>
              <ArrowUpRight className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatPercentage(metrics.monthlyGrowthRate)}</p>
            <p className="text-sm text-purple-600">Month over month</p>
          </div>
        </div>
      </Card>
    </div>
  )
}