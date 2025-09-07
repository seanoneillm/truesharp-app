'use client'

import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { useStripeSellerData, type StripeSellerData } from '@/lib/hooks/use-stripe-data'
import { DollarSign, Store, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState, useRef } from 'react'

interface SellerData {
  totalRevenue: number
  subscriberCount: number
  strategiesCount: number
  hasStrategies: boolean
  averageROI: number
  averageWinRate: number
  totalBets: number
  stripeData?: StripeSellerData | undefined
  pendingPayments?: number | undefined
  monetizedStrategiesCount: number
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
    totalBets: 0,
    // stripeData: undefined,
    pendingPayments: 0,
    monetizedStrategiesCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  
  // Hook for Stripe seller data
  const { data: stripeSellerData, error: stripeError } = useStripeSellerData()

  const fetchSellerData = useCallback(async () => {
    if (!user || fetchingRef.current) {
      return
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      
      // Check if user is a seller first
      if (!profile?.is_seller) {
        setSellerData({
          totalRevenue: 0,
          subscriberCount: 0,
          strategiesCount: 0,
          hasStrategies: false,
          averageROI: 0,
          averageWinRate: 0,
          totalBets: 0,
          // stripeData: undefined,
          pendingPayments: 0,
          monetizedStrategiesCount: 0,
        })
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Fetch strategies created by this user with fallback
      let strategies: any[] = []
      try {
        const { data, error: strategiesError } = await supabase
          .from('strategies')
          .select(
            `
            id, 
            name, 
            monetized, 
            pricing_monthly, 
            pricing_weekly, 
            pricing_yearly,
            performance_roi,
            performance_win_rate,
            performance_total_bets
          `
          )
          .eq('user_id', user.id)

        if (strategiesError) {
          console.warn('Strategies fetch failed, using empty array:', strategiesError.message)
          strategies = []
        } else {
          strategies = data || []
        }
      } catch (strategiesNetworkError) {
        console.warn('Network error fetching strategies, using empty array')
        strategies = []
      }

      // Fetch active subscriptions for this seller with fallback
      let subscriptions: any[] = []
      try {
        const { data, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select(
            `
            id,
            strategy_id,
            frequency,
            price,
            status
          `
          )
          .eq('seller_id', user.id)
          .eq('status', 'active')

        if (subscriptionsError) {
          console.warn('Subscriptions fetch failed, using empty array:', subscriptionsError.message)
          subscriptions = []
        } else {
          subscriptions = data || []
        }
      } catch (subscriptionsNetworkError) {
        console.warn('Network error fetching subscriptions, using empty array')
        subscriptions = []
      }

      // Use Stripe data from hook if available
      const stripeData = stripeSellerData
      
      // Debug logging for dashboard
      console.log('🔍 Dashboard Preview - Stripe data available:', !!stripeData)
      if (stripeData && stripeData.totalRevenue > 0) {
        console.log('✅ Dashboard Preview - Using Stripe seller data - Revenue:', stripeData.totalRevenue, 'Subscribers:', stripeData.subscriberCount)
      } else if (stripeError) {
        console.warn('⚠️ Dashboard Preview - Stripe data hook error, using fallback calculations:', stripeError)
      } else if (stripeData) {
        if (stripeData.hasStripeAccount === false) {
          console.log('⚠️ Dashboard Preview - Seller has no Stripe Connect account configured')
        } else {
          console.log('ℹ️ Dashboard Preview - Stripe data exists but revenue is 0 (no active subscriptions):', stripeData)
        }
      } else {
        console.log('ℹ️ Dashboard Preview - No Stripe data available, using fallback')
      }

      // Calculate seller metrics (use Stripe data when available, fallback to Supabase)
      let totalMonthlyRevenue = stripeData?.totalRevenue || 0
      let totalSubscribers = stripeData?.subscriberCount || 0
      let strategiesCount = 0
      let monetizedStrategiesCount = 0
      let totalPerformanceMetrics = { roi: 0, winRate: 0, totalBets: 0, strategiesWithData: 0 }

      if (strategies) {
        strategiesCount = strategies.length
        const monetizedStrategies = strategies.filter(s => s.monetized)
        monetizedStrategiesCount = monetizedStrategies.length

        // Fallback to Supabase data only if Stripe data is not available
        if (!stripeData && subscriptions && subscriptions.length > 0) {
          totalSubscribers = subscriptions.length

          // Simplified revenue calculation using subscription price directly
          totalMonthlyRevenue = subscriptions.reduce((total, subscription) => {
            const price = Number(subscription.price || 0)
            const monthlyPrice =
              subscription.frequency === 'weekly'
                ? price * 4.33
                : subscription.frequency === 'yearly'
                  ? price / 12
                  : price // monthly
            return total + monthlyPrice * 0.82 // Apply rake factor
          }, 0)
        }

        // Calculate average performance metrics across monetized strategies
        totalPerformanceMetrics = monetizedStrategies.reduce(
          (acc, strategy) => {
            if (
              strategy.performance_roi !== null &&
              strategy.performance_win_rate !== null &&
              strategy.performance_total_bets
            ) {
              acc.roi += strategy.performance_roi || 0
              acc.winRate += strategy.performance_win_rate || 0
              acc.totalBets += strategy.performance_total_bets || 0
              acc.strategiesWithData++
            }
            return acc
          },
          { roi: 0, winRate: 0, totalBets: 0, strategiesWithData: 0 }
        )
      }

      // Create new data object
      const newSellerData = {
        totalRevenue: Number(totalMonthlyRevenue.toFixed(2)),
        subscriberCount: totalSubscribers,
        strategiesCount: strategiesCount,
        hasStrategies: strategiesCount > 0,
        averageROI:
          totalPerformanceMetrics.strategiesWithData > 0
            ? Number(
                (totalPerformanceMetrics.roi / totalPerformanceMetrics.strategiesWithData).toFixed(
                  2
                )
              )
            : 0,
        averageWinRate:
          totalPerformanceMetrics.strategiesWithData > 0
            ? Number(
                (
                  totalPerformanceMetrics.winRate / totalPerformanceMetrics.strategiesWithData
                ).toFixed(2)
              )
            : 0,
        totalBets: totalPerformanceMetrics.totalBets,
        stripeData,
        pendingPayments: stripeData?.pendingPayments || 0,
        monetizedStrategiesCount,
      }

      console.log('🔍 Dashboard Preview - Final calculated seller data:', newSellerData)

      // Only update if data actually changed (prevents unnecessary re-renders)
      setSellerData(prevData => {
        const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newSellerData)
        return hasChanged ? (newSellerData as SellerData) : prevData
      })
    } catch (error) {
      console.error('Dashboard Preview - Error:', error)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user, profile, stripeSellerData, stripeError])

  useEffect(() => {
    fetchSellerData()
  }, [user, profile, fetchSellerData])

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Seller Overview</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded bg-gray-200"></div>
          <div className="h-12 rounded bg-gray-200"></div>
          <div className="h-12 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-green-100 p-2">
            <Store className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Seller Overview</h2>
            <p className="text-sm text-gray-500">Your selling performance</p>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4">
        {/* Monthly Revenue */}
        <div className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="rounded-lg bg-green-200 p-2 flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">Monthly Revenue</p>
                <p className="text-xs text-green-600">Current month estimate</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl sm:text-2xl font-bold text-green-700 break-words">
                ${sellerData.totalRevenue >= 1000 ? 
                  (sellerData.totalRevenue / 1000).toFixed(1) + 'k' : 
                  sellerData.totalRevenue.toFixed(2)}
              </p>
              <div className="text-xs text-green-600 space-y-1">
                {sellerData.pendingPayments && sellerData.pendingPayments > 0 && (
                  <div className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                    ${sellerData.pendingPayments} pending
                  </div>
                )}
                {sellerData.stripeData?.hasStripeAccount === false && (
                  <div className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                    No Stripe Connect
                  </div>
                )}
                {sellerData.stripeData?.hasStripeAccount && (
                  <div className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    Live Stripe data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subscriber Count */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
            <div className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-lg bg-blue-200 p-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
              <p className="mb-1 text-xl sm:text-2xl font-bold text-blue-700 break-words">
                {sellerData.subscriberCount >= 1000 ? 
                  (sellerData.subscriberCount / 1000).toFixed(1) + 'k' : 
                  sellerData.subscriberCount}
              </p>
              <p className="text-xs font-medium text-blue-600">
                Subscribers
                {sellerData.stripeData && (
                  <span className="ml-1 text-blue-500">(via Stripe)</span>
                )}
              </p>
            </div>
          </div>

          {/* Monetized Strategies */}
          <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
            <div className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-lg bg-purple-200 p-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
              <p className="mb-1 text-xl sm:text-2xl font-bold text-purple-700 break-words">
                {sellerData.monetizedStrategiesCount}
              </p>
              <p className="text-xs font-medium text-purple-600">
                Monetized ({sellerData.strategiesCount} total)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        {sellerData.hasStrategies ? (
          <Link
            href="/sell"
            className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
          >
            Go to Seller Dashboard
          </Link>
        ) : (
          <Link
            href="/sell"
            className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
          >
            Start Selling Your Strategies
          </Link>
        )}
      </div>
    </div>
  )
}
