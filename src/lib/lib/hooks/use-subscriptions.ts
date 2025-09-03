// FILE: src/lib/hooks/use-subscriptions.ts
// Subscription data hook for managing user subscriptions

import { authenticatedRequest, supabaseDirect } from '@/lib/api/client'
import { Subscription } from '@/lib/auth/supabase'
import { useCallback, useEffect, useState } from 'react'

interface SubscriptionWithSeller extends Subscription {
  seller: {
    username: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  seller_settings: {
    bronze_price: number
    silver_price: number
    premium_price: number
    specialization: string[]
  } | null
  performance: {
    total_picks: number
    win_rate: number
    roi: number
    recent_picks: number
  }
}

interface UseSubscriptionsReturn {
  subscriptions: SubscriptionWithSeller[]
  isLoading: boolean
  error: string | null
  subscribe: (sellerId: string, tier: 'bronze' | 'silver' | 'premium') => Promise<boolean>
  cancelSubscription: (subscriptionId: string) => Promise<boolean>
  pauseSubscription: (subscriptionId: string) => Promise<boolean>
  resumeSubscription: (subscriptionId: string) => Promise<boolean>
  upgradeSubscription: (
    subscriptionId: string,
    newTier: 'bronze' | 'silver' | 'premium'
  ) => Promise<boolean>
  refresh: () => Promise<void>
  getSubscriptionBySeller: (sellerId: string) => SubscriptionWithSeller | null
  isSubscribedTo: (sellerId: string) => boolean
  canAccessTier: (sellerId: string, tier: 'free' | 'bronze' | 'silver' | 'premium') => boolean
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabaseDirect.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabaseDirect
        .from('subscriptions')
        .select(
          `
          *,
          seller:profiles!seller_id (
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          seller_settings!seller_id (
            bronze_price,
            silver_price,
            premium_price,
            specialization
          )
        `
        )
        .eq('subscriber_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get performance data for each seller
      const subscriptionsWithPerformance = await Promise.all(
        (data || []).map(async sub => {
          // Get recent pick count
          const { count: recentPickCount } = await supabaseDirect
            .from('pick_posts')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', sub.seller_id)
            .gte('posted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

          // Get performance cache
          const { data: performance } = await supabaseDirect
            .from('user_performance_cache')
            .select('total_bets, win_rate, roi')
            .eq('user_id', sub.seller_id)
            .single()

          return {
            ...sub,
            seller: sub.seller || {
              username: 'unknown',
              display_name: 'Unknown User',
              avatar_url: null,
              is_verified: false,
            },
            seller_settings: sub.seller_settings?.[0] || null,
            performance: {
              total_picks: performance?.total_bets || 0,
              win_rate: performance?.win_rate || 0,
              roi: performance?.roi || 0,
              recent_picks: recentPickCount || 0,
            },
          }
        })
      )

      setSubscriptions(subscriptionsWithPerformance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to a seller
  const subscribe = useCallback(
    async (sellerId: string, tier: 'bronze' | 'silver' | 'premium'): Promise<boolean> => {
      const response = await authenticatedRequest(async currentUserId => {
        // First, get the seller's pricing
        const { data: sellerSettings, error: settingsError } = await supabaseDirect
          .from('seller_settings')
          .select('bronze_price, silver_price, premium_price')
          .eq('user_id', sellerId)
          .single()

        if (settingsError) throw new Error('Seller not found or not enabled')

        const price =
          tier === 'bronze'
            ? sellerSettings.bronze_price
            : tier === 'silver'
              ? sellerSettings.silver_price
              : sellerSettings.premium_price

        // Create subscription
        return await supabaseDirect
          .from('subscriptions')
          .insert({
            subscriber_id: currentUserId,
            seller_id: sellerId,
            tier,
            price,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          })
          .select(
            `
          *,
          seller:profiles!seller_id (
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          seller_settings!seller_id (
            bronze_price,
            silver_price,
            premium_price,
            specialization
          )
        `
          )
          .single()
      })

      if (response.success && response.data) {
        const data = response.data as any
        const newSubscription = {
          ...(data && typeof data === 'object' ? data : {}),
          seller: data?.seller || {
            username: 'unknown',
            display_name: 'Unknown User',
            avatar_url: null,
            is_verified: false,
          },
          seller_settings: data?.seller_settings?.[0] || null,
          performance: {
            total_picks: 0,
            win_rate: 0,
            roi: 0,
            recent_picks: 0,
          },
        }

        setSubscriptions(prev => [newSubscription, ...prev])
        return true
      } else {
        setError(response.error || 'Failed to create subscription')
        return false
      }
    },
    []
  )

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async currentUserId => {
      return await supabaseDirect
        .from('subscriptions')
        .update({
          status: 'cancelled',
          expires_at: new Date().toISOString(), // Expire immediately
        })
        .eq('id', subscriptionId)
        .eq('subscriber_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, status: 'cancelled', expires_at: new Date().toISOString() }
            : sub
        )
      )
      return true
    } else {
      setError(response.error || 'Failed to cancel subscription')
      return false
    }
  }, [])

  // Pause subscription
  const pauseSubscription = useCallback(async (subscriptionId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async currentUserId => {
      return await supabaseDirect
        .from('subscriptions')
        .update({ status: 'paused' })
        .eq('id', subscriptionId)
        .eq('subscriber_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setSubscriptions(prev =>
        prev.map(sub => (sub.id === subscriptionId ? { ...sub, status: 'paused' } : sub))
      )
      return true
    } else {
      setError(response.error || 'Failed to pause subscription')
      return false
    }
  }, [])

  // Resume subscription
  const resumeSubscription = useCallback(async (subscriptionId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async currentUserId => {
      return await supabaseDirect
        .from('subscriptions')
        .update({
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Extend 30 days
        })
        .eq('id', subscriptionId)
        .eq('subscriber_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? {
                ...sub,
                status: 'active',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : sub
        )
      )
      return true
    } else {
      setError(response.error || 'Failed to resume subscription')
      return false
    }
  }, [])

  // Upgrade subscription
  const upgradeSubscription = useCallback(
    async (subscriptionId: string, newTier: 'bronze' | 'silver' | 'premium'): Promise<boolean> => {
      const response = await authenticatedRequest(async currentUserId => {
        // Get the subscription to find seller and current pricing
        const { data: currentSub, error: subError } = await supabaseDirect
          .from('subscriptions')
          .select('seller_id')
          .eq('id', subscriptionId)
          .eq('subscriber_id', currentUserId)
          .single()

        if (subError) throw subError

        // Get new pricing
        const { data: sellerSettings, error: settingsError } = await supabaseDirect
          .from('seller_settings')
          .select('bronze_price, silver_price, premium_price')
          .eq('user_id', currentSub.seller_id)
          .single()

        if (settingsError) throw settingsError

        const newPrice =
          newTier === 'bronze'
            ? sellerSettings.bronze_price
            : newTier === 'silver'
              ? sellerSettings.silver_price
              : sellerSettings.premium_price

        return await supabaseDirect
          .from('subscriptions')
          .update({
            tier: newTier,
            price: newPrice,
          })
          .eq('id', subscriptionId)
          .eq('subscriber_id', currentUserId)
          .select()
          .single()
      })

      if (response.success) {
        setSubscriptions(prev =>
          prev.map((sub: SubscriptionWithSeller) =>
            sub.id === subscriptionId
              ? {
                  ...sub,
                  tier: newTier,
                  price: (response.data as unknown as { price?: number })?.price ?? sub.price,
                }
              : sub
          )
        )
        return true
      } else {
        setError(response.error || 'Failed to upgrade subscription')
        return false
      }
    },
    []
  )

  // Refresh subscriptions
  const refresh = useCallback(async () => {
    await fetchSubscriptions()
  }, [fetchSubscriptions])

  // Get subscription by seller ID
  const getSubscriptionBySeller = useCallback(
    (sellerId: string): SubscriptionWithSeller | null => {
      return (
        subscriptions.find(sub => sub.seller_id === sellerId && sub.status === 'active') || null
      )
    },
    [subscriptions]
  )

  // Check if subscribed to a seller
  const isSubscribedTo = useCallback(
    (sellerId: string): boolean => {
      return subscriptions.some(sub => sub.seller_id === sellerId && sub.status === 'active')
    },
    [subscriptions]
  )

  // Check if can access a specific tier
  const canAccessTier = useCallback(
    (sellerId: string, tier: 'free' | 'bronze' | 'silver' | 'premium'): boolean => {
      if (tier === 'free') return true

      const subscription = getSubscriptionBySeller(sellerId)
      if (!subscription) return false

      const tierHierarchy = { bronze: 1, silver: 2, premium: 3 }
      const userTierLevel = tierHierarchy[subscription.tier]
      const requiredTierLevel = tierHierarchy[tier]

      return userTierLevel >= requiredTierLevel
    },
    [getSubscriptionBySeller]
  )

  // Initial load
  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Set up real-time subscription for subscription changes
  useEffect(() => {
    supabaseDirect.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const channel = supabaseDirect
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `subscriber_id=eq.${user.id}`,
          },
          payload => {
            if (payload.eventType === 'INSERT') {
              // Refresh to get full data with seller info
              fetchSubscriptions()
            } else if (payload.eventType === 'UPDATE') {
              setSubscriptions(prev =>
                prev.map(sub => (sub.id === payload.new.id ? { ...sub, ...payload.new } : sub))
              )
            } else if (payload.eventType === 'DELETE') {
              setSubscriptions(prev => prev.filter(sub => sub.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      // Cleanup function for useEffect
      return () => {
        supabaseDirect.removeChannel(channel)
      }
    })
  }, [fetchSubscriptions])

  return {
    subscriptions,
    isLoading,
    error,
    subscribe,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    upgradeSubscription,
    refresh,
    getSubscriptionBySeller,
    isSubscribedTo,
    canAccessTier,
  }
}
