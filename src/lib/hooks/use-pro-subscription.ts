'use client'

import { useState, useCallback } from 'react'

interface ProSubscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'cancelled' | 'incomplete'
  plan: 'monthly' | 'yearly'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
  price_id: string
}

interface SubscribeProParams {
  plan: 'monthly' | 'yearly'
}

interface UseProSubscriptionReturn {
  subscribeToPro: (
    params: SubscribeProParams
  ) => Promise<{ success: boolean; checkout_url?: string; error?: string }>
  checkProStatus: () => Promise<{ isPro: boolean; subscription?: ProSubscription }>
  isLoading: boolean
  error: string | null
}

export function useProSubscription(): UseProSubscriptionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribeToPro = useCallback(async (params: SubscribeProParams) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/subscribe-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to subscribe to Pro')
        return { success: false, error: data.error }
      }

      // If we got a checkout URL, redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return { success: true, checkout_url: data.checkout_url }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to Pro'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkProStatus = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch('/api/subscribe-pro', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check Pro status')
      }

      return {
        isPro: data.isPro,
        subscription: data.subscription,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check Pro status'
      setError(errorMessage)
      return { isPro: false }
    }
  }, [])

  return {
    subscribeToPro,
    checkProStatus,
    isLoading,
    error,
  }
}