'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Subscription {
  id: string
  subscriber_id: string
  strategy_id: string
  seller_id: string
  status: string
  frequency: string
  price: number
  current_period_start: string
  current_period_end: string
  created_at: string
}

export function useStrategySubscription() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch user's subscriptions
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSubscriptions([])
        return
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', user.id)
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching subscriptions:', error)
        setError(error.message)
      } else {
        setSubscriptions(data || [])
      }
    } catch (err) {
      console.error('Subscription fetch error:', err)
      setError('Failed to load subscriptions')
    } finally {
      setIsLoading(false)
    }
  }

  // Subscribe to a strategy
  const subscribeToSeller = async (strategyId: string, frequency: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Here you would integrate with Stripe to create a subscription
      // For now, we'll simulate the subscription process
      console.log(`Subscribing to strategy ${strategyId} with frequency ${frequency}`)
      
      // Simulate API call to create subscription
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Refresh subscriptions after successful subscription
      await fetchSubscriptions()
      
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is subscribed to a specific strategy
  const isSubscribedToStrategy = (strategyId: string): boolean => {
    return subscriptions.some(sub => 
      sub.status === 'active' && 
      sub.strategy_id === strategyId
    )
  }

  // Get subscription for a specific strategy
  const getSubscriptionToStrategy = (strategyId: string): Subscription | null => {
    return subscriptions.find(sub => 
      sub.status === 'active' && 
      sub.strategy_id === strategyId
    ) || null
  }

  // Cancel a subscription
  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Here you would call Stripe to cancel the subscription
      console.log(`Cancelling subscription ${subscriptionId}`)
      
      // Update local state
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscriptionId)

      if (error) {
        throw error
      }

      // Refresh subscriptions
      await fetchSubscriptions()
      
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Load subscriptions on mount
  useEffect(() => {
    fetchSubscriptions()
  }, [])

  return {
    subscriptions,
    isLoading,
    error,
    subscribeToSeller,
    isSubscribedToStrategy,
    getSubscriptionToStrategy,
    cancelSubscription,
    fetchSubscriptions
  }
}