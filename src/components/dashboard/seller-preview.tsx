'use client'

import { createBrowserClient } from '@/lib/auth/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { DollarSign, Store, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SellerData {
  totalRevenue: number
  subscriberCount: number
  strategiesCount: number
  hasStrategies: boolean
  averageROI: number
  averageWinRate: number
  totalBets: number
}

interface Profile {
  id: string
  username?: string
  email?: string
  pro?: string
  is_seller?: boolean
}

interface SellerPreviewProps {
  profile?: Profile | null
}

export default function SellerPreview({ profile }: SellerPreviewProps) {
  const { user } = useAuth()
  const [sellerData, setSellerData] = useState<SellerData>({
    totalRevenue: 0,
    subscriberCount: 0,
    strategiesCount: 0,
    hasStrategies: false,
    averageROI: 0,
    averageWinRate: 0,
    totalBets: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSellerData() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()
        
        // Check if user is a seller first
        if (!profile?.is_seller) {
          setSellerData({
            totalRevenue: 0,
            subscriberCount: 0,
            strategiesCount: 0,
            hasStrategies: false,
            averageROI: 0,
            averageWinRate: 0,
            totalBets: 0
          })
          setLoading(false)
          return
        }

        // Fetch strategies created by this user
        const { data: strategies, error: strategiesError } = await supabase
          .from('strategies')
          .select(`
            id, 
            name, 
            monetized, 
            pricing_monthly, 
            pricing_weekly, 
            pricing_yearly,
            performance_roi,
            performance_win_rate,
            performance_total_bets
          `)
          .eq('user_id', user.id)

        if (strategiesError) {
          console.error('Error fetching strategies:', strategiesError)
        }

        // Fetch active subscriptions for this seller
        const { data: subscriptions, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            strategy_id,
            frequency,
            price,
            status
          `)
          .eq('seller_id', user.id)
          .eq('status', 'active')

        if (subscriptionsError) {
          console.error('Error fetching subscriptions:', subscriptionsError)
        }

        // Calculate revenue and subscriber count from actual subscriptions
        let totalMonthlyRevenue = 0
        let totalSubscribers = 0
        let strategiesCount = 0
        let totalPerformanceMetrics = { roi: 0, winRate: 0, totalBets: 0, strategiesWithData: 0 }

        console.log('Seller Preview Debug:', {
          strategiesCount: strategies?.length || 0,
          monetizedStrategies: strategies?.filter(s => s.monetized).length || 0,
          subscriptionsCount: subscriptions?.length || 0,
          strategies: strategies?.map(s => ({ 
            id: s.id, 
            name: s.name, 
            monetized: s.monetized,
            pricing_monthly: s.pricing_monthly,
            pricing_weekly: s.pricing_weekly,
            pricing_yearly: s.pricing_yearly
          })),
          subscriptions: subscriptions?.map(s => ({ 
            strategy_id: s.strategy_id, 
            price: s.price, 
            frequency: s.frequency 
          }))
        })

        if (strategies) {
          // Count all strategies (not just monetized ones)
          strategiesCount = strategies.length
          const monetizedStrategies = strategies.filter(s => s.monetized)
          
          // Calculate subscriber count and revenue from subscriptions
          if (subscriptions && subscriptions.length > 0) {
            // Calculate total subscribers (count of active subscriptions)
            totalSubscribers = subscriptions.length

            // Group subscriptions by strategy to calculate revenue per strategy
            const subscriptionsByStrategy = subscriptions.reduce((acc, subscription) => {
              const strategyId = subscription.strategy_id
              if (!acc[strategyId]) {
                acc[strategyId] = []
              }
              acc[strategyId]!.push(subscription)
              return acc
            }, {} as Record<string, typeof subscriptions>)

            // Calculate revenue for each strategy and sum them up
            totalMonthlyRevenue = Object.entries(subscriptionsByStrategy).reduce((total, [strategyId, strategySubscriptions]) => {
              // Find the strategy to get its pricing
              const strategy = strategies.find(s => s.id === strategyId)
              if (!strategy) return total

              // Count subscribers for this strategy
              const subscriberCount = strategySubscriptions.length
              
              // Get the monthly price for this strategy from strategies table
              let monthlyPrice = 0
              if (strategy.pricing_monthly) {
                monthlyPrice = Number(strategy.pricing_monthly)
              } else if (strategy.pricing_weekly) {
                monthlyPrice = Number(strategy.pricing_weekly) * 4.33 // Average weeks per month
              } else if (strategy.pricing_yearly) {
                monthlyPrice = Number(strategy.pricing_yearly) / 12
              }

              // Calculate revenue for this strategy: subscribers × price × rake factor
              const strategyRevenue = subscriberCount * monthlyPrice * 0.82
              
              console.log(`Strategy ${strategy.name}: ${subscriberCount} subscribers × $${monthlyPrice.toFixed(2)}/month × 0.82 = $${strategyRevenue.toFixed(2)}`)
              
              return total + strategyRevenue
            }, 0)
            
            console.log(`Total Monthly Revenue: $${totalMonthlyRevenue.toFixed(2)} from ${totalSubscribers} subscriptions across ${Object.keys(subscriptionsByStrategy).length} strategies`)
          }

          // Calculate average performance metrics across monetized strategies
          totalPerformanceMetrics = monetizedStrategies.reduce((acc, strategy) => {
            if (strategy.performance_roi !== null && strategy.performance_win_rate !== null && strategy.performance_total_bets) {
              acc.roi += strategy.performance_roi || 0
              acc.winRate += strategy.performance_win_rate || 0
              acc.totalBets += strategy.performance_total_bets || 0
              acc.strategiesWithData++
            }
            return acc
          }, { roi: 0, winRate: 0, totalBets: 0, strategiesWithData: 0 })
        }

        setSellerData({
          totalRevenue: totalMonthlyRevenue,
          subscriberCount: totalSubscribers,
          strategiesCount: strategiesCount,
          hasStrategies: strategiesCount > 0,
          averageROI: totalPerformanceMetrics.strategiesWithData > 0 ? totalPerformanceMetrics.roi / totalPerformanceMetrics.strategiesWithData : 0,
          averageWinRate: totalPerformanceMetrics.strategiesWithData > 0 ? totalPerformanceMetrics.winRate / totalPerformanceMetrics.strategiesWithData : 0,
          totalBets: totalPerformanceMetrics.totalBets
        })

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerData()
  }, [user, profile])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Seller Overview</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Store className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Seller Overview</h2>
            <p className="text-sm text-gray-500">Your selling performance</p>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Monthly Revenue */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Monthly Revenue</p>
                <p className="text-xs text-green-600">Current month estimate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">
                ${sellerData.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-green-600">+12% vs last month</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Subscriber Count */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="text-center">
              <div className="p-2 bg-blue-200 rounded-lg w-fit mx-auto mb-2">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-blue-700 mb-1">
                {sellerData.subscriberCount}
              </p>
              <p className="text-xs font-medium text-blue-600">Subscribers</p>
            </div>
          </div>

          {/* Monetized Strategies */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="text-center">
              <div className="p-2 bg-purple-200 rounded-lg w-fit mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
              <p className="text-2xl font-bold text-purple-700 mb-1">
                {sellerData.strategiesCount}
              </p>
              <p className="text-xs font-medium text-purple-600">Strategies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        {sellerData.hasStrategies ? (
          <Link
            href="/sell"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go to Seller Dashboard
          </Link>
        ) : (
          <Link
            href="/sell"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Selling Your Strategies
          </Link>
        )}
      </div>
    </div>
  )
}
