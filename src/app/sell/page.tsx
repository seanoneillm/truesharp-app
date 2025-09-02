'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToastProvider } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { SellerProfileEditor } from '@/components/seller/seller-profile-editor'
import StrategiesTab from '@/components/seller/strategies-tab'
import { SubscribersTab } from '@/components/seller/subscribers-tab'
import { FinancialsTab } from '@/components/seller/financials-tab'
import { AnalyticsTab } from '@/components/seller/analytics-tab'
import { EnhancedOpenBets } from '@/components/seller/enhanced-open-bets'
import { getSellerStrategiesWithOpenBets } from '@/lib/queries/open-bets'
import {
  DollarSign,
  Plus,
  RefreshCw,
  Settings,
  Store,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'

interface SellerData {
  totalRevenue: number
  subscriberCount: number
  strategiesCount: number
  monetizedStrategiesCount: number
  averageROI: number
  averageWinRate: number
  totalBets: number
}

export default function SellPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const { user, loading: authLoading } = useAuth()

  // Debug logging
  useEffect(() => {
    console.log(
      '💰 Sell - Current user:',
      user?.id || 'No user',
      'Email:',
      user?.email || 'No email'
    )
  }, [user])
  const [sellerData, setSellerData] = useState<SellerData>({
    totalRevenue: 0,
    subscriberCount: 0,
    strategiesCount: 0,
    monetizedStrategiesCount: 0,
    averageROI: 0,
    averageWinRate: 0,
    totalBets: 0,
  })
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const [openBets, setOpenBets] = useState<
    Array<{
      id: string
      sport: string
      league?: string
      home_team?: string
      away_team?: string
      bet_type?: string
      bet_description: string
      odds: string | number
      stake: number
      potential_payout: number
      status: string
      placed_at: string
      game_date?: string
      sportsbook?: string
    }>
  >([])
  const [openBetsLoading, setOpenBetsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoized calculations to prevent unnecessary re-renders
  const openBetsSummary = useMemo(() => {
    if (!Array.isArray(openBets)) {
      return { count: 0, totalProfit: 0 }
    }

    const totalProfit = openBets.reduce((sum, bet) => {
      return sum + Math.max((bet?.potential_payout || 0) - (bet?.stake || 0), 0)
    }, 0)

    return {
      count: openBets.length,
      totalProfit: totalProfit,
    }
  }, [openBets])

  // Memoize seller data to prevent glitchy recalculations
  const stableSellerData = useMemo(() => {
    return {
      totalRevenue: Number(sellerData?.totalRevenue || 0),
      subscriberCount: Number(sellerData?.subscriberCount || 0),
      strategiesCount: Number(sellerData?.strategiesCount || 0),
      monetizedStrategiesCount: Number(sellerData?.monetizedStrategiesCount || 0),
      averageROI: Number(sellerData?.averageROI || 0),
      averageWinRate: Number(sellerData?.averageWinRate || 0),
      totalBets: Number(sellerData?.totalBets || 0),
    }
  }, [sellerData])

  // Extra stable data with debounced updates for the revenue section
  const [debouncedSellerData, setDebouncedSellerData] = useState(stableSellerData)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSellerData(stableSellerData)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [stableSellerData])

  const fetchOpenBets = useCallback(async () => {
    if (!user) return

    try {
      setOpenBetsLoading(true)
      const supabase = createClient()

      const { data: bets, error } = await supabase
        .from('bets')
        .select(
          `
          id,
          sport,
          league,
          home_team,
          away_team,
          bet_type,
          bet_description,
          odds,
          stake,
          potential_payout,
          status,
          placed_at,
          game_date,
          sportsbook
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('placed_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching open bets:', error)
      } else {
        setOpenBets(bets || [])
      }
    } catch (error) {
      console.error('Error fetching open bets:', error)
    } finally {
      setOpenBetsLoading(false)
    }
  }, [user])

  const fetchSellerData = useCallback(async () => {
    if (!user || fetchingRef.current) {
      return
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      const supabase = createClient()

      // Fetch open bets alongside seller data - call directly to avoid dependency issue
      if (user) {
        try {
          setOpenBetsLoading(true)
          const { data: bets, error } = await supabase
            .from('bets')
            .select(
              `
              id,
              sport,
              league,
              home_team,
              away_team,
              bet_type,
              bet_description,
              odds,
              stake,
              potential_payout,
              status,
              placed_at,
              game_date,
              sportsbook
            `
            )
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('placed_at', { ascending: false })
            .limit(10)

          if (error) {
            console.warn('Open bets fetch failed, using empty array:', error.message)
            setOpenBets([])
          } else {
            setOpenBets(bets || [])
          }
        } catch (error) {
          console.warn('Network error fetching open bets, using empty array')
          setOpenBets([])
        } finally {
          setOpenBetsLoading(false)
        }
      }

      // Fetch strategies created by this user with fallback
      let strategies = []
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
      let subscriptions = []
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

      // Calculate seller metrics
      let totalMonthlyRevenue = 0
      let totalSubscribers = 0
      let strategiesCount = 0
      let monetizedStrategiesCount = 0
      let totalPerformanceMetrics = { roi: 0, winRate: 0, totalBets: 0, strategiesWithData: 0 }

      if (strategies) {
        strategiesCount = strategies.length
        const monetizedStrategies = strategies.filter(s => s.monetized)
        monetizedStrategiesCount = monetizedStrategies.length

        // Calculate subscriber count and revenue from subscriptions
        if (subscriptions && subscriptions.length > 0) {
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
        monetizedStrategiesCount: monetizedStrategiesCount,
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
      }

      // Only update if data actually changed (prevents unnecessary re-renders)
      setSellerData(prevData => {
        const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newSellerData)
        return hasChanged ? newSellerData : prevData
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (mounted) {
      fetchSellerData()
    }
  }, [user, fetchSellerData, mounted])

  const refreshData = () => {
    fetchSellerData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (authLoading || !mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse p-6">
                <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }
  return (
    <ToastProvider>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Professional Dashboard Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Store className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Seller Dashboard</h1>
                  <p className="mt-1 text-lg text-slate-600">
                    Manage your strategies, picks, and revenue
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setProfileEditorOpen(true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-sm text-blue-700 hover:bg-blue-50"
              >
                <User className="mr-2 h-4 w-4" />
                Customize Profile
              </Button>
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-gray-300 text-sm text-gray-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => setProfileEditorOpen(true)}
                variant="outline"
                size="sm"
                className="border-purple-300 text-sm text-purple-600 hover:bg-purple-50"
              >
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Link href="/games">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Pick
                </Button>
              </Link>
            </div>
          </div>

          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Net Monthly Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-green-900">
                    {formatCurrency(sellerData.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600">
                    From {sellerData.subscriberCount} active subscribers
                  </p>
                </div>
                <div className="rounded-xl bg-green-100 p-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Subscribers</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {sellerData.subscriberCount}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    {sellerData.subscriberCount} active, +0 this month
                  </p>
                </div>
                <div className="rounded-xl bg-blue-100 p-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Avg ROI</p>
                  <p className="mt-1 text-2xl font-bold text-purple-900">
                    {sellerData.averageROI > 0 ? '+' : ''}
                    {sellerData.averageROI.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs text-purple-600">
                    across {sellerData.monetizedStrategiesCount} monetized strategies
                  </p>
                </div>
                <div className="rounded-xl bg-purple-100 p-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Monetized Strategies</p>
                  <p className="mt-1 text-2xl font-bold text-orange-900">
                    {sellerData.monetizedStrategiesCount}
                  </p>
                  <p className="mt-1 text-xs text-orange-600">
                    of {sellerData.strategiesCount} total
                  </p>
                </div>
                <div className="rounded-xl bg-orange-100 p-2">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <nav className="flex space-x-1">
              {[
                { id: 'overview', name: 'Overview', icon: Store },
                { id: 'strategies', name: 'Strategies', icon: Target },
                { id: 'subscribers', name: 'Subscribers', icon: Users },
                { id: 'financials', name: 'Financials', icon: DollarSign },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'scale-105 transform bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Enhanced Open Bets Section */}
              <EnhancedOpenBets
                openBets={openBets}
                loading={openBetsLoading}
                onRefresh={refreshData}
              />

              {/* Business Insights Grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Revenue Breakdown */}
                <Card className="min-h-[300px] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Revenue Breakdown</h3>
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-green-50 p-3">
                      <div>
                        <p className="font-medium text-green-900">Monthly Revenue</p>
                        <p className="text-sm text-green-700">From active subscriptions</p>
                      </div>
                      <p className="text-xl font-bold text-green-900">
                        {loading ? (
                          <span className="inline-block h-6 w-16 animate-pulse rounded bg-green-200"></span>
                        ) : (
                          formatCurrency(debouncedSellerData.totalRevenue)
                        )}
                      </p>
                    </div>
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-blue-50 p-3">
                      <div>
                        <p className="font-medium text-blue-900">Subscribers</p>
                        <p className="text-sm text-blue-700">Total active subscribers</p>
                      </div>
                      <p className="text-xl font-bold text-blue-900">
                        {loading ? (
                          <span className="inline-block h-6 w-12 animate-pulse rounded bg-blue-200"></span>
                        ) : (
                          debouncedSellerData.subscriberCount
                        )}
                      </p>
                    </div>
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-purple-50 p-3">
                      <div>
                        <p className="font-medium text-purple-900">Avg. ROI</p>
                        <p className="text-sm text-purple-700">Strategy performance</p>
                      </div>
                      <p className="text-xl font-bold text-purple-900">
                        {loading ? (
                          <span className="inline-block h-6 w-16 animate-pulse rounded bg-purple-200"></span>
                        ) : (
                          `${debouncedSellerData.averageROI > 0 ? '+' : ''}${debouncedSellerData.averageROI.toFixed(1)}%`
                        )}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Strategy Performance */}
                <Card className="min-h-[300px] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Strategy Overview</h3>
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-gray-50 p-3">
                      <div>
                        <p className="font-medium text-gray-900">Total Strategies</p>
                        <p className="text-sm text-gray-600">Created strategies</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {stableSellerData.strategiesCount}
                      </p>
                    </div>
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-orange-50 p-3">
                      <div>
                        <p className="font-medium text-orange-900">Monetized</p>
                        <p className="text-sm text-orange-700">Earning revenue</p>
                      </div>
                      <p className="text-xl font-bold text-orange-900">
                        {stableSellerData.monetizedStrategiesCount}
                      </p>
                    </div>
                    <div className="flex min-h-[60px] items-center justify-between rounded-lg bg-indigo-50 p-3">
                      <div>
                        <p className="font-medium text-indigo-900">Win Rate</p>
                        <p className="text-sm text-indigo-700">Average across strategies</p>
                      </div>
                      <p className="text-xl font-bold text-indigo-900">
                        {stableSellerData.averageWinRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="mb-6 text-xl font-bold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Button
                    onClick={() => setActiveTab('strategies')}
                    className="h-16 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Target className="h-6 w-6" />
                    <span>Create Strategy</span>
                  </Button>
                  <Link href="/games">
                    <Button
                      variant="outline"
                      className="h-16 w-full flex-col space-y-2 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-6 w-6" />
                      <span>Add Picks</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setActiveTab('subscribers')}
                    variant="outline"
                    className="h-16 flex-col space-y-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Subscribers</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'strategies' && <StrategiesTab />}

          {activeTab === 'subscribers' && <SubscribersTab />}

          {activeTab === 'financials' && <FinancialsTab />}

          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>

        {/* Seller Profile Editor Modal */}
        <SellerProfileEditor
          isOpen={profileEditorOpen}
          onClose={() => setProfileEditorOpen(false)}
          onSuccess={() => {
            // Could add a refresh callback here if needed
          }}
        />
      </DashboardLayout>
    </ToastProvider>
  )
}
