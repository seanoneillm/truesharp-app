"use client"

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
// Note: Using API endpoint /api/subscriptions-open-bets instead of direct query
import { SubscriberOpenBetsDisplay } from '@/components/shared/subscriber-open-bets-display'
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Edit,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  X,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Enhanced interfaces for subscription data
interface SubscriptionData {
  id: string
  subscriber_id: string
  seller_id: string
  strategy_id: string
  status: 'active' | 'cancelled' | 'past_due'
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  currency: string
  created_at: string
  updated_at: string
  cancelled_at?: string
  current_period_start?: string
  current_period_end?: string
  next_billing_date?: string
  stripe_subscription_id?: string
  // Joined data from other tables
  strategy_name?: string
  strategy_description?: string
  seller_username?: string
  seller_display_name?: string
  strategy_performance_roi?: number
  strategy_performance_win_rate?: number
  strategy_performance_total_bets?: number
  // Open bets data
  open_bets?: any[]
  open_bets_count?: number
}

// Shield SVG Component
const TrueSharpShield = ({ className = "h-6 w-6", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill={`url(#shieldGradient-${variant})`} 
      stroke={variant === "light" ? "#60a5fa" : "#3b82f6"} 
      strokeWidth="2"
    />
    <path 
      d="M35 45 L45 55 L65 35" 
      stroke="white" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    />
  </svg>
)

// Enhanced Subscription Card Component
const SubscriptionCard = ({ subscription, onRefresh }: { 
  subscription: SubscriptionData, 
  onRefresh: () => void 
}) => {
  const [cancelling, setCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      // TODO: Implement Stripe cancellation
      console.log('Cancelling subscription:', subscription.id)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      onRefresh()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
    } finally {
      setCancelling(false)
    }
  }

  const formatCurrency = (amount: number) => {
    try {
      const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: subscription.currency || 'USD',
        minimumFractionDigits: 0
      }).format(validAmount)
    } catch (error) {
      return `$${amount || 0}`
    }
  }

  const formatFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">✓ Active</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300 font-medium">✗ Cancelled</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium">⚠ Past Due</Badge>
      default:
        return <Badge variant="outline" className="font-medium">{status}</Badge>
    }
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <TrueSharpShield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {subscription.strategy_name || 'Strategy'}
                </h3>
                <p className="text-sm text-gray-600">
                  by @{subscription.seller_username || subscription.seller_display_name || 'Unknown'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {subscription.strategy_description || 'No description available'}
            </p>
            <div className="flex items-center space-x-3">
              {getStatusBadge(subscription.status)}
              <span className="inline-flex items-center px-3 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-medium">
                <Calendar className="h-3 w-3 mr-1" />
                Since {new Date(subscription.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
          Performance Metrics
        </h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <p className="text-xs font-medium text-green-700 mb-1">ROI</p>
              <p className={`text-xl font-bold ${
                (subscription.strategy_performance_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(subscription.strategy_performance_roi)}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-blue-600">
                {subscription.strategy_performance_win_rate !== null ? 
                  `${subscription.strategy_performance_win_rate.toFixed(1)}%` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <p className="text-xs font-medium text-purple-700 mb-1">Total Bets</p>
              <p className="text-xl font-bold text-purple-600">
                {subscription.strategy_performance_total_bets || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Bets Display */}
      {subscription.open_bets && subscription.open_bets.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
          <SubscriberOpenBetsDisplay 
            bets={subscription.open_bets} 
            title="Current Open Picks"
            maxBets={5}
          />
        </div>
      )}


      {/* Subscription Details & Pricing */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-700 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Subscription Details
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price</span>
                <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-full border">
                  {formatCurrency(subscription.price)} / {formatFrequency(subscription.frequency)}
                </span>
              </div>
              {subscription.status === 'active' && subscription.next_billing_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Billing</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(subscription.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {subscription.status === 'active' && (
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700">Actions</h5>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {subscription.status === 'cancelled' && subscription.cancelled_at && (
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700">Status</h5>
              <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-red-500" />
                  Cancelled on {new Date(subscription.cancelled_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fetchingRef = useRef(false)
  const [stableSubscriptions, setStableSubscriptions] = useState<SubscriptionData[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchSubscriptions = useCallback(async () => {
    if (!user || fetchingRef.current) return
    
    console.log('🔍 Subscriptions - Fetching subscriptions for user:', user.id)
    console.log('🔍 Subscriptions - Using API URL:', '/api/subscriptions')
    
    try {
      fetchingRef.current = true
      setError(null)

      // Use the same API approach as the marketplace
      const response = await fetch('/api/subscriptions', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log('🔍 Subscriptions - API response:', {
        success: data.success,
        subscriptionsCount: data.subscriptions?.length || 0,
        error: data.error
      })

      if (!data.success) {
        setError(data.error || 'Failed to load subscriptions')
        setSubscriptions([])
        return
      }

      const subscriptionData = data.subscriptions || []
      
      if (subscriptionData.length === 0) {
        console.log('🔍 Subscriptions - No subscription data found')
        setSubscriptions([])
        return
      }

      console.log('🔍 Subscriptions - Found', subscriptionData.length, 'subscriptions')

      // Enhance subscriptions with open bets data using API endpoint
      try {
        console.log('🎯 Subscriptions - Fetching open bets via API endpoint')
        
        // Fetch open bets via API endpoint (uses service role)
        const openBetsResponse = await fetch('/api/subscriptions-open-bets', {
          credentials: 'include'
        })
        
        if (openBetsResponse.ok) {
          const openBetsData = await openBetsResponse.json()
          console.log('🎯 Subscriptions - Open bets API response:', openBetsData)
          
          if (openBetsData.success && openBetsData.openBetsByStrategy) {
            const openBetsByStrategy = openBetsData.openBetsByStrategy
            
            // Map open bets to subscriptions
            const enhancedSubscriptions = subscriptionData.map(sub => {
              const openBets = openBetsByStrategy[sub.strategy_id] || []
              
              return {
                ...sub,
                open_bets: openBets,
                open_bets_count: openBets.length
              }
            })
            
            // Log summary of open bets found
            const totalOpenBets = enhancedSubscriptions.reduce((sum, sub) => sum + (sub.open_bets_count || 0), 0)
            console.log('🎯 Subscriptions - Summary: Found', totalOpenBets, 'total open bets across all subscriptions')

            // Update subscriptions with open bets data
            setSubscriptions(prevSubscriptions => {
              const hasChanged = JSON.stringify(prevSubscriptions) !== JSON.stringify(enhancedSubscriptions)
              return hasChanged ? enhancedSubscriptions : prevSubscriptions
            })
          } else {
            console.log('🎯 Subscriptions - No open bets found or API error')
            // Use subscriptions without open bets
            setSubscriptions(subscriptionData)
          }
        } else {
          console.warn('🎯 Subscriptions - Open bets API failed:', openBetsResponse.statusText)
          // Fallback to subscriptions without open bets
          setSubscriptions(subscriptionData)
        }
      } catch (openBetsError) {
        console.warn('Failed to fetch open bets via API, using regular subscription data:', openBetsError)
        // Fallback to original subscriptions without open bets
        setSubscriptions(subscriptionData)
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      setError('Failed to load subscriptions')
      setSubscriptions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
      fetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (mounted && user) {
      fetchSubscriptions()
    }
  }, [user, fetchSubscriptions, mounted])

  // Debounced stable subscriptions update
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableSubscriptions(subscriptions)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [subscriptions])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubscriptions()
  }

  const activeSubscriptions = useMemo(() => {
    if (!Array.isArray(stableSubscriptions)) {
      return []
    }
    return stableSubscriptions.filter(sub => sub && sub.status === 'active')
  }, [stableSubscriptions])
  
  const cancelledSubscriptions = useMemo(() => {
    if (!Array.isArray(stableSubscriptions)) {
      return []
    }
    return stableSubscriptions.filter(sub => sub && sub.status === 'cancelled')
  }, [stableSubscriptions])

  const totalMonthlySpend = useMemo(() => {
    if (!Array.isArray(activeSubscriptions) || activeSubscriptions.length === 0) {
      return 0
    }
    
    return activeSubscriptions.reduce((total, sub) => {
      if (!sub || typeof sub.price !== 'number') {
        return total
      }
      
      const monthlyPrice = sub.frequency === 'weekly' ? sub.price * 4.33 :
                         sub.frequency === 'yearly' ? sub.price / 12 :
                         sub.price
      return total + (monthlyPrice || 0)
    }, 0)
  }, [activeSubscriptions])

  if (authLoading || !mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <TrueSharpShield className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  My Subscriptions
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Track performance and manage your strategy subscriptions
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              Browse Strategies
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-white border border-slate-200 p-2 rounded-xl w-fit shadow-sm">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'billing', label: 'Billing' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Subscriptions</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </Card>
            ) : activeSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No subscriptions yet</h3>
                <p className="text-slate-600 mb-6">
                  Start following top-performing strategies from verified sellers
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                >
                  Browse Strategies
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Active Subscriptions</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">
                          {activeSubscriptions.length}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {activeSubscriptions.length === 1 ? 'strategy' : 'strategies'}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Monthly Spend</p>
                        <p className="text-3xl font-bold text-green-900 mt-1">
                          ${totalMonthlySpend.toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          across all subscriptions
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Avg Performance</p>
                        <p className="text-3xl font-bold text-purple-900 mt-1">
                          {activeSubscriptions.length > 0 ? 
                            `+${(activeSubscriptions.reduce((sum, sub) => {
                              const roi = sub?.strategy_performance_roi || 0
                              return sum + (typeof roi === 'number' ? roi : 0)
                            }, 0) / activeSubscriptions.length).toFixed(1)}%` : 
                            '0%'
                          }
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          average ROI
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Active Subscriptions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Active Subscriptions</h2>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {activeSubscriptions.length} active
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {activeSubscriptions.map((subscription) => (
                      <SubscriptionCard key={subscription.id} subscription={subscription} onRefresh={fetchSubscriptions} />
                    ))}
                  </div>
                </div>

                {/* Cancelled Subscriptions */}
                {cancelledSubscriptions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-900">Past Subscriptions</h2>
                      <Badge variant="outline" className="text-gray-600">
                        {cancelledSubscriptions.length} cancelled
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {cancelledSubscriptions.map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} onRefresh={fetchSubscriptions} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Method</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-900">No payment method on file</p>
                      <p className="text-sm text-slate-500">Add a payment method to subscribe</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription History */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Subscription History</h2>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {stableSubscriptions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Strategy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Started
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stableSubscriptions.map((subscription) => (
                          <tr key={subscription.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <TrueSharpShield className="h-5 w-5 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {subscription.strategy_name || 'Strategy'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{subscription.seller_username || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subscription.status === 'active' ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                              ) : subscription.status === 'cancelled' ? (
                                <Badge className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>
                              ) : (
                                <Badge variant="outline">{subscription.status}</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${subscription.price.toFixed(2)} / {subscription.frequency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/marketplace/${subscription.seller_username}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No subscription history</h3>
                    <p className="text-slate-600">Your subscription history will appear here once you subscribe to strategies</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
