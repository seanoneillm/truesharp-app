'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { CreditCard, ExternalLink, Heart, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Subscription {
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
  seller_profile?:
    | {
        username: string
        is_verified_seller: boolean
      }
    | undefined
}

export default function SubscriptionsPreview() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchSubscriptions = useCallback(async () => {
    if (!user || fetchingRef.current) return

    console.log('🔍 Dashboard Subscriptions Preview - Fetching for user:', user.id)

    try {
      fetchingRef.current = true
      setError(null)

      // Use the same API approach as the subscriptions page
      const response = await fetch('/api/subscriptions', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`)
      }

      const data = await response.json()

      console.log('🔍 Dashboard Subscriptions Preview - API response:', {
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

      // Filter for active subscriptions only for the dashboard preview
      const activeSubscriptions = subscriptionData.filter((sub: any) => sub.status === 'active')
      
      console.log('🔍 Dashboard Subscriptions Preview - Found', activeSubscriptions.length, 'active subscriptions')
      setSubscriptions(activeSubscriptions)
    } catch (err) {
      console.error('Error fetching subscriptions for dashboard:', err)
      setError('Failed to load subscriptions')
      setSubscriptions([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    }
  }, [user, fetchSubscriptions])

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return '/week'
      case 'monthly':
        return '/month'
      case 'yearly':
        return '/year'
      default:
        return '/month'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-orange-100 text-orange-800'
      case 'monthly':
        return 'bg-blue-100 text-blue-800'
      case 'yearly':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-pink-100 p-2">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
              <p className="text-sm text-gray-500">Loading your subscriptions...</p>
            </div>
          </div>
          <div className="text-right">
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-red-100 p-2">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Subscription Error</h2>
              <p className="text-sm text-red-600">Failed to load subscriptions</p>
            </div>
          </div>
        </div>
        <div className="py-4 text-center">
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-pink-100 p-2">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
            <p className="text-sm text-gray-500">Your strategy subscriptions</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{subscriptions.length}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="py-8 text-center">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-sm font-medium text-gray-900">No active subscriptions</h3>
          <p className="mb-4 text-sm text-gray-500">
            Discover winning strategies from top bettors in our marketplace.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.slice(0, 3).map(subscription => (
            <div
              key={subscription.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {subscription.strategy_name || 'Strategy'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    by @{subscription.seller_username || subscription.seller_display_name || 'Unknown'}
                  </p>
                  {subscription.next_billing_date && (
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-400">
                        Next: {new Date(subscription.next_billing_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${getFrequencyColor(subscription.frequency)}`}
                  >
                    ${subscription.price || 0}
                    {getFrequencyLabel(subscription.frequency)}
                  </span>
                  <Link
                    href={`/marketplace/${subscription.seller_username || subscription.seller_display_name || ''}`}
                    className="text-blue-600 hover:text-blue-500 transition-colors p-1"
                    title="View strategy details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {subscriptions.length > 3 && (
            <div className="pt-4 text-center">
              <Link
                href="/subscriptions"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all subscriptions →
              </Link>
            </div>
          )}

          {/* Total Monthly Cost */}
          <div className="mt-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Monthly Spend:</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                $
                {subscriptions
                  .reduce((total, sub) => {
                    const price = sub.price || 0
                    // Convert all frequencies to monthly cost
                    switch (sub.frequency) {
                      case 'weekly':
                        return total + price * 4.33 // Average weeks per month
                      case 'monthly':
                        return total + price
                      case 'yearly':
                        return total + price / 12
                      default:
                        return total + price
                    }
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Across {subscriptions.length} active {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
