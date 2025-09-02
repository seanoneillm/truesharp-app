'use client'

import { createBrowserClient } from '@/lib/auth/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { CreditCard, ExternalLink, Heart, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Subscription {
  id: string
  seller_id: string
  strategy_id: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  status: string
  created_at: string
  seller_username?: string
  strategy_name?: string
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

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        // Fetch user's active subscriptions with strategy information
        const { data, error } = await supabase
          .from('subscriptions')
          .select(
            `
            id,
            seller_id,
            strategy_id,
            frequency,
            price,
            status,
            created_at,
            current_period_start,
            current_period_end
          `
          )
          .eq('subscriber_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching subscriptions:', error?.message || error)
          setLoading(false)
          return
        }

        if (data && data.length > 0) {
          // Fetch seller profile information and strategy names
          const sellerIds = data.map(sub => sub.seller_id)
          const strategyIds = data.map(sub => sub.strategy_id)

          const [sellerProfilesResult, strategiesResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, username, is_verified_seller')
              .in('id', sellerIds),
            supabase.from('strategies').select('id, name').in('id', strategyIds),
          ])

          const { data: sellerProfiles, error: profileError } = sellerProfilesResult
          const { data: strategies, error: strategiesError } = strategiesResult

          if (!profileError && !strategiesError && sellerProfiles && strategies) {
            // Combine subscription data with seller profiles and strategy names
            const transformedData = data.map(sub => {
              const sellerProfile = sellerProfiles.find(p => p.id === sub.seller_id)
              const strategy = strategies.find(s => s.id === sub.strategy_id)
              return {
                ...sub,
                seller_username: sellerProfile?.username || `Seller${sub.seller_id.slice(-4)}`,
                strategy_name: strategy?.name || 'Strategy',
                seller_profile: sellerProfile,
              }
            })
            setSubscriptions(transformedData)
          } else {
            // If we can't get profiles or strategies, still show subscription data
            const transformedData = data.map(sub => ({
              ...sub,
              seller_username: `Seller${sub.seller_id.slice(-4)}`,
              strategy_name: 'Strategy',
              seller_profile: undefined,
            }))
            setSubscriptions(transformedData)
          }
        } else {
          setSubscriptions([])
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

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
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Active Subscriptions</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded bg-gray-200"></div>
          ))}
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
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{subscription.strategy_name}</p>
                  <p className="text-xs text-gray-500">by @{subscription.seller_username}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getFrequencyColor(subscription.frequency)}`}
                  >
                    ${subscription.price}
                    {getFrequencyLabel(subscription.frequency)}
                  </span>
                  <Link
                    href={`/marketplace/${subscription.seller_username}`}
                    className="text-blue-600 hover:text-blue-500"
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
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Monthly Cost:</span>
              <span className="text-sm font-bold text-gray-900">
                $
                {subscriptions
                  .reduce((total, sub) => {
                    // Convert all frequencies to monthly cost
                    switch (sub.frequency) {
                      case 'weekly':
                        return total + sub.price * 4.33 // Average weeks per month
                      case 'monthly':
                        return total + sub.price
                      case 'yearly':
                        return total + sub.price / 12
                      default:
                        return total + sub.price
                    }
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
