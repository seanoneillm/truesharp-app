'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
// Note: Using API endpoint /api/subscriptions-open-bets instead of direct query
import { SubscriberOpenBetsDisplay } from '@/components/shared/subscriber-open-bets-display'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
const TrueSharpShield = ({ className = 'h-6 w-6', variant = 'default' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
        <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill={`url(#shieldGradient-${variant})`}
      stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
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
const SubscriptionCard = ({
  subscription,
  onRefresh,
}: {
  subscription: SubscriptionData
  onRefresh: () => void
}) => {
  const [cancelling, setCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    if (
      !confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')
    ) {
      return
    }

    setCancelling(true)
    try {
      console.log('Cancelling subscription:', subscription.id)

      const response = await fetch(`/api/subscriptions/cancel/${subscription.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      const result = await response.json()
      console.log('Subscription cancelled successfully:', result)

      // Show success message and refresh
      alert('Subscription cancelled successfully')
      onRefresh()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
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
        minimumFractionDigits: 0,
      }).format(validAmount)
    } catch (error) {
      return `$${amount || 0}`
    }
  }

  const formatFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="border-green-300 bg-green-100 font-medium text-green-800">
            ✓ Active
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="border-red-300 bg-red-100 font-medium text-red-800">✗ Cancelled</Badge>
        )
      case 'past_due':
        return (
          <Badge className="border-yellow-300 bg-yellow-100 font-medium text-yellow-800">
            ⚠ Past Due
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-medium">
            {status}
          </Badge>
        )
    }
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Header Section */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center space-x-3">
              <div className="rounded-xl bg-blue-100 p-2">
                <TrueSharpShield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-1 text-xl font-bold text-gray-900">
                  {subscription.strategy_name || 'Strategy'}
                </h3>
                <p className="text-sm text-gray-600">
                  by @
                  {subscription.seller_username || subscription.seller_display_name || 'Unknown'}
                </p>
              </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              {subscription.strategy_description || 'No description available'}
            </p>
            <div className="flex items-center space-x-3">
              {getStatusBadge(subscription.status)}
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Calendar className="mr-1 h-3 w-3" />
                Since{' '}
                {new Date(subscription.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="border-b border-gray-100 p-6">
        <h4 className="mb-4 flex items-center text-sm font-semibold text-gray-700">
          <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
          Performance Metrics
        </h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
              <p className="mb-1 text-xs font-medium text-green-700">ROI</p>
              <p
                className={`text-xl font-bold ${
                  (subscription.strategy_performance_roi || 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatPercentage(subscription.strategy_performance_roi)}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
              <p className="mb-1 text-xs font-medium text-blue-700">Win Rate</p>
              <p className="text-xl font-bold text-blue-600">
                {subscription.strategy_performance_win_rate !== null &&
                subscription.strategy_performance_win_rate !== undefined
                  ? `${subscription.strategy_performance_win_rate.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-4">
              <p className="mb-1 text-xs font-medium text-purple-700">Total Bets</p>
              <p className="text-xl font-bold text-purple-600">
                {subscription.strategy_performance_total_bets || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Bets Display */}
      {subscription.open_bets && subscription.open_bets.length > 0 && (
        <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 p-6">
          <SubscriberOpenBetsDisplay bets={subscription.open_bets} title="Current Open Picks" />
        </div>
      )}

      {/* Subscription Details & Pricing */}
      <div className="bg-gray-50 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="flex items-center text-sm font-semibold text-gray-700">
              <DollarSign className="mr-2 h-4 w-4 text-green-600" />
              Subscription Details
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price</span>
                <span className="rounded-full border bg-white px-3 py-1 text-sm font-semibold text-gray-900">
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
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/billing-portal', {
                        method: 'POST',
                      })
                      if (response.ok) {
                        const data = await response.json()
                        if (data.url) {
                          window.location.href = data.url
                        }
                      } else {
                        const errorData = await response.json()
                        alert(errorData.error || 'Failed to open billing portal')
                      }
                    } catch (error) {
                      console.error('Error opening billing portal:', error)
                      alert('Failed to open billing portal')
                    }
                  }}
                  className="w-full border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {cancelling ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-red-600"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
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
              <div className="rounded-lg border bg-white p-3 text-sm text-gray-600">
                <p className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-red-500" />
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
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('🔍 Subscriptions - API response:', {
        success: data.success,
        subscriptionsCount: data.subscriptions?.length || 0,
        error: data.error,
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
          credentials: 'include',
        })

        if (openBetsResponse.ok) {
          const openBetsData = await openBetsResponse.json()
          console.log('🎯 Subscriptions - Open bets API response:', openBetsData)

          if (openBetsData.success && openBetsData.openBetsByStrategy) {
            const openBetsByStrategy = openBetsData.openBetsByStrategy

            // Map open bets to subscriptions
            const enhancedSubscriptions = subscriptionData.map((sub: any) => {
              const openBets = openBetsByStrategy[sub.strategy_id] || []

              return {
                ...sub,
                open_bets: openBets,
                open_bets_count: openBets.length,
              }
            })

            // Log summary of open bets found
            const totalOpenBets = enhancedSubscriptions.reduce(
              (sum: number, sub: any) => sum + (sub.open_bets_count || 0),
              0
            )
            console.log(
              '🎯 Subscriptions - Summary: Found',
              totalOpenBets,
              'total open bets across all subscriptions'
            )

            // Update subscriptions with open bets data
            setSubscriptions(prevSubscriptions => {
              const hasChanged =
                JSON.stringify(prevSubscriptions) !== JSON.stringify(enhancedSubscriptions)
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
        console.warn(
          'Failed to fetch open bets via API, using regular subscription data:',
          openBetsError
        )
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

      const monthlyPrice =
        sub.frequency === 'weekly'
          ? sub.price * 4.33
          : sub.frequency === 'yearly'
            ? sub.price / 12
            : sub.price
      return total + (monthlyPrice || 0)
    }, 0)
  }, [activeSubscriptions])

  if (authLoading || !mounted) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <TrueSharpShield className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My Subscriptions</h1>
                <p className="mt-1 text-lg text-slate-600">
                  Track performance and manage your strategy subscriptions
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:bg-blue-700"
            >
              Browse Strategies
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-fit space-x-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'billing', label: 'Billing' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-6 py-3 text-sm font-medium capitalize transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse p-6">
                    <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-8 w-1/2 rounded bg-gray-200"></div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-medium text-red-900">
                  Error Loading Subscriptions
                </h3>
                <p className="mb-6 text-red-600">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </button>
              </Card>
            ) : activeSubscriptions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <CreditCard className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-900">No subscriptions yet</h3>
                <p className="mb-6 text-slate-600">
                  Start following top-performing strategies from verified sellers
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700"
                >
                  Browse Strategies
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Active Subscriptions</p>
                        <p className="mt-1 text-3xl font-bold text-blue-900">
                          {activeSubscriptions.length}
                        </p>
                        <p className="mt-1 text-sm text-blue-600">
                          {activeSubscriptions.length === 1 ? 'strategy' : 'strategies'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-100 p-3">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Monthly Spend</p>
                        <p className="mt-1 text-3xl font-bold text-green-900">
                          ${totalMonthlySpend.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-green-600">across all subscriptions</p>
                      </div>
                      <div className="rounded-xl bg-green-100 p-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Avg Performance</p>
                        <p className="mt-1 text-3xl font-bold text-purple-900">
                          {activeSubscriptions.length > 0
                            ? `+${(
                                activeSubscriptions.reduce((sum, sub) => {
                                  const roi = sub?.strategy_performance_roi || 0
                                  return sum + (typeof roi === 'number' ? roi : 0)
                                }, 0) / activeSubscriptions.length
                              ).toFixed(1)}%`
                            : '0%'}
                        </p>
                        <p className="mt-1 text-sm text-purple-600">average ROI</p>
                      </div>
                      <div className="rounded-xl bg-purple-100 p-3">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Active Subscriptions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Active Subscriptions</h2>
                    <Badge className="border-green-300 bg-green-100 text-green-800">
                      {activeSubscriptions.length} active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                    {activeSubscriptions.map(subscription => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onRefresh={fetchSubscriptions}
                      />
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

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                      {cancelledSubscriptions.map(subscription => (
                        <SubscriptionCard
                          key={subscription.id}
                          subscription={subscription}
                          onRefresh={fetchSubscriptions}
                        />
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
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment Method</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-600">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-900">
                        No payment method on file
                      </p>
                      <p className="text-sm text-slate-500">Add a payment method to subscribe</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <Edit className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription History */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Subscription History</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {stableSubscriptions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Strategy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Started
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {stableSubscriptions.map(subscription => (
                          <tr key={subscription.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center">
                                <TrueSharpShield className="mr-3 h-5 w-5" />
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
                            <td className="whitespace-nowrap px-6 py-4">
                              {subscription.status === 'active' ? (
                                <Badge className="border-green-300 bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              ) : subscription.status === 'cancelled' ? (
                                <Badge className="border-red-300 bg-red-100 text-red-800">
                                  Cancelled
                                </Badge>
                              ) : (
                                <Badge variant="outline">{subscription.status}</Badge>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              ${subscription.price.toFixed(2)} / {subscription.frequency}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
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
                    <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                    <h3 className="mb-2 text-lg font-medium text-slate-900">
                      No subscription history
                    </h3>
                    <p className="text-slate-600">
                      Your subscription history will appear here once you subscribe to strategies
                    </p>
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
