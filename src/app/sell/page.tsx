'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToastProvider } from '@/components/ui/toast'
import { createBrowserClient } from '@/lib/auth/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import StrategiesTab from '@/components/seller/strategies-tab'
import {
    DollarSign,
    Plus,
    RefreshCw,
    Settings,
    Store,
    Target,
    TrendingUp,
    Trophy,
    Users
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
  const { user, loading: authLoading } = useAuth()
  const [sellerData, setSellerData] = useState<SellerData>({
    totalRevenue: 0,
    subscriberCount: 0,
    strategiesCount: 0,
    monetizedStrategiesCount: 0,
    averageROI: 0,
    averageWinRate: 0,
    totalBets: 0
  })
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const [openBets, setOpenBets] = useState<Array<{
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
  }>>([])
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
      return sum + Math.max(((bet?.potential_payout || 0) - (bet?.stake || 0)), 0)
    }, 0)
    
    return {
      count: openBets.length,
      totalProfit: totalProfit
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
      totalBets: Number(sellerData?.totalBets || 0)
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
      const supabase = createBrowserClient()

      const { data: bets, error } = await supabase
        .from('bets')
        .select(`
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
        `)
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
      const supabase = createBrowserClient()

      // Fetch open bets alongside seller data - call directly to avoid dependency issue
      if (user) {
        try {
          setOpenBetsLoading(true)
          const { data: bets, error } = await supabase
            .from('bets')
            .select(`
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
            `)
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
            const monthlyPrice = subscription.frequency === 'weekly' ? price * 4.33 :
                               subscription.frequency === 'yearly' ? price / 12 :
                               price // monthly
            return total + (monthlyPrice * 0.82) // Apply rake factor
          }, 0)
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

      // Create new data object
      const newSellerData = {
        totalRevenue: Number(totalMonthlyRevenue.toFixed(2)),
        subscriberCount: totalSubscribers,
        strategiesCount: strategiesCount,
        monetizedStrategiesCount: monetizedStrategiesCount,
        averageROI: totalPerformanceMetrics.strategiesWithData > 0 ? 
          Number((totalPerformanceMetrics.roi / totalPerformanceMetrics.strategiesWithData).toFixed(2)) : 0,
        averageWinRate: totalPerformanceMetrics.strategiesWithData > 0 ? 
          Number((totalPerformanceMetrics.winRate / totalPerformanceMetrics.strategiesWithData).toFixed(2)) : 0,
        totalBets: totalPerformanceMetrics.totalBets
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
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (authLoading || !mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
                <h1 className="text-3xl font-bold text-slate-900">
                  Seller Dashboard
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Manage your strategies, picks, and revenue
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="text-sm border-gray-300 text-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/games">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Pick
              </Button>
            </Link>
          </div>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Net Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(sellerData.totalRevenue)}
                </p>
                <p className="text-xs text-green-600">
                  From {sellerData.subscriberCount} active subscribers
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Total Subscribers</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {sellerData.subscriberCount}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {sellerData.subscriberCount} active, +0 this month
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">Avg ROI</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {sellerData.averageROI > 0 ? '+' : ''}{sellerData.averageROI.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  across {sellerData.monetizedStrategiesCount} monetized strategies
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700">Monetized Strategies</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {sellerData.monetizedStrategiesCount}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  of {sellerData.strategiesCount} total
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-xl">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', name: 'Overview', icon: Store },
              { id: 'strategies', name: 'Strategies', icon: Target },
              { id: 'subscribers', name: 'Subscribers', icon: Users },
              { id: 'financials', name: 'Financials', icon: DollarSign },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Open Bets Section */}
            <Card>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Open Bets</h2>
                    <p className="text-blue-100">
                      {openBetsSummary.count} pending bets • ${openBetsSummary.totalProfit.toFixed(2)} potential profit
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Trophy className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[200px]">
                {(openBetsLoading && openBets.length === 0) ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(openBets) && openBets.length > 0 ? (
                  <div className="space-y-4">
                    {openBets.map((bet) => (
                      <div key={bet?.id || Math.random()} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {bet?.sport || 'Unknown'}
                              </span>
                              {bet?.sportsbook && (
                                <span className="text-xs text-gray-500">{bet.sportsbook}</span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">{bet?.bet_description || 'No description'}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Odds: {typeof bet?.odds === 'number' && bet.odds > 0 ? '+' : ''}{bet?.odds || 'N/A'}</span>
                              <span>Stake: ${Number(bet?.stake || 0).toFixed(2)}</span>
                              {bet?.game_date && (
                                <span>Game: {new Date(bet.game_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              +${Math.max(((bet?.potential_payout || 0) - (bet?.stake || 0)), 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">potential profit</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Bets</h3>
                    <p className="text-gray-600 mb-6">
                      You don&apos;t have any pending bets at the moment.
                    </p>
                    <Link href="/games">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Place a Bet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Business Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Breakdown */}
              <Card className="p-6 min-h-[300px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Revenue Breakdown</h3>
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg min-h-[60px]">
                    <div>
                      <p className="font-medium text-green-900">Monthly Revenue</p>
                      <p className="text-sm text-green-700">From active subscriptions</p>
                    </div>
                    <p className="text-xl font-bold text-green-900">
                      {loading ? (
                        <span className="inline-block h-6 w-16 bg-green-200 animate-pulse rounded"></span>
                      ) : (
                        formatCurrency(debouncedSellerData.totalRevenue)
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg min-h-[60px]">
                    <div>
                      <p className="font-medium text-blue-900">Subscribers</p>
                      <p className="text-sm text-blue-700">Total active subscribers</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900">
                      {loading ? (
                        <span className="inline-block h-6 w-12 bg-blue-200 animate-pulse rounded"></span>
                      ) : (
                        debouncedSellerData.subscriberCount
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg min-h-[60px]">
                    <div>
                      <p className="font-medium text-purple-900">Avg. ROI</p>
                      <p className="text-sm text-purple-700">Strategy performance</p>
                    </div>
                    <p className="text-xl font-bold text-purple-900">
                      {loading ? (
                        <span className="inline-block h-6 w-16 bg-purple-200 animate-pulse rounded"></span>
                      ) : (
                        `${debouncedSellerData.averageROI > 0 ? '+' : ''}${debouncedSellerData.averageROI.toFixed(1)}%`
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Strategy Performance */}
              <Card className="p-6 min-h-[300px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Strategy Overview</h3>
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[60px]">
                    <div>
                      <p className="font-medium text-gray-900">Total Strategies</p>
                      <p className="text-sm text-gray-600">Created strategies</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {stableSellerData.strategiesCount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg min-h-[60px]">
                    <div>
                      <p className="font-medium text-orange-900">Monetized</p>
                      <p className="text-sm text-orange-700">Earning revenue</p>
                    </div>
                    <p className="text-xl font-bold text-orange-900">
                      {stableSellerData.monetizedStrategiesCount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg min-h-[60px]">
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setActiveTab('strategies')}
                  className="h-16 bg-blue-600 hover:bg-blue-700 flex-col space-y-2"
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

        {activeTab === 'strategies' && (
          <StrategiesTab />
        )}

        {activeTab === 'subscribers' && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers yet</h3>
            <p className="text-gray-600 mb-4">Monetize your strategies to start attracting subscribers</p>
            <Button 
              onClick={() => setActiveTab('strategies')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Setup Pricing
            </Button>
          </Card>
        )}

        {activeTab === 'financials' && (
          <Card className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue yet</h3>
            <p className="text-gray-600 mb-4">Start earning revenue by monetizing your strategies</p>
            <Button 
              onClick={() => setActiveTab('strategies')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Create Strategy
            </Button>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics yet</h3>
            <p className="text-gray-600 mb-4">Analytics will appear once you have active strategies and picks</p>
            <Button 
              onClick={() => setActiveTab('strategies')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </Card>
        )}
        </div>
      </DashboardLayout>
    </ToastProvider>
  )
}
