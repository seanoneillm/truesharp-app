'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface Subscription {
  id: string
  subscriber_id: string
  seller_id: string
  strategy_id: string
  status: string
  price: number
  frequency: string
  currency: string
  current_period_start: string
  current_period_end: string
  next_billing_date: string
  created_at: string
  updated_at: string
}

interface SubscribeParams {
  strategyId: string
  sellerId: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  currency?: string
}

interface UseSubscribeReturn {
  subscribe: (params: SubscribeParams) => Promise<{ success: boolean; subscription?: Subscription; error?: string }>
  unsubscribe: (subscriptionId: string) => Promise<{ success: boolean; error?: string }>
  checkSubscription: (strategyId: string) => Promise<{ isSubscribed: boolean; subscription?: Subscription }>
  isLoading: boolean
  error: string | null
}

export function useSubscribe(): UseSubscribeReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const subscribe = useCallback(async (params: SubscribeParams) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to subscribe')
        return { success: false, error: data.error }
      }

      return { 
        success: true, 
        subscription: data.subscription 
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async (subscriptionId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Update subscription status to cancelled
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (updateError) {
        setError('Failed to cancel subscription')
        return { success: false, error: 'Failed to cancel subscription' }
      }

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const checkSubscription = useCallback(async (strategyId: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/subscribe?strategyId=${strategyId}`, {
        credentials: 'include' // Include cookies in the request
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check subscription')
      }

      return {
        isSubscribed: data.isSubscribed,
        subscription: data.subscription
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription'
      setError(errorMessage)
      return { isSubscribed: false }
    }
  }, [])

  return {
    subscribe,
    unsubscribe,
    checkSubscription,
    isLoading,
    error
  }
}