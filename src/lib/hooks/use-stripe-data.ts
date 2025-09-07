import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { useProfile } from './use-profile'

export interface StripeSellerData {
  totalRevenue: number
  subscriberCount: number
  pendingPayments: number
  strategyMetrics: Record<string, {
    subscribers: number
    revenue: number
    tiers: string[]
  }>
  subscriptions: Array<{
    id: string
    status: string
    customer_email: string | null
    amount: number
    interval: string
    current_period_start: number
    current_period_end: number
    strategy_id: string | null
    product_name: string
  }>
  hasStripeAccount?: boolean
  message?: string
}

export interface StripeSubscriberData {
  subscriptions: Array<{
    id: string
    status: string
    items: Array<{
      id: string
      price: {
        id: string
        unit_amount: number
        currency: string
        recurring: {
          interval: string
          interval_count: number
        } | null
      }
      product: {
        id: string
        name: string
        description: string | null
        metadata: Record<string, string>
      }
    }>
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    canceled_at: number | null
    metadata: Record<string, string>
    created: number
  }>
}

export interface StripeInvoiceData {
  invoices: Array<{
    id: string
    status: string
    amount_paid: number
    amount_due: number
    currency: string
    created: number
    due_date: number | null
    hosted_invoice_url: string | null
    invoice_pdf: string | null
    number: string | null
    paid: boolean
    lines: Array<{
      id: string
      amount: number
      currency: string
      description: string | null
      period: {
        start: number
        end: number
      } | null
    }>
  }>
}

export function useStripeSellerData() {
  const { user } = useAuth()
  const [data, setData] = useState<StripeSellerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user?.id) {
      console.log('🔍 Hook - No user ID, skipping Stripe fetch')
      return
    }

    console.log('🔍 Hook - Starting Stripe seller data fetch for user:', user.id)

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stripe/seller/${user.id}`)
      console.log('🔍 Hook - Fetch response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('🔍 Hook - Fetch result:', result)
      setData(result)
    } catch (err) {
      console.error('Error fetching Stripe seller data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch seller data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Hook useEffect - User ID changed to:', user?.id)
    fetchData()
  }, [user?.id])

  return { data, loading, error, refetch: fetchData }
}

export function useStripeSubscriberData() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [data, setData] = useState<StripeSubscriberData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user?.id || !(profile as any)?.stripe_customer_id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stripe/subscriber/${(profile as any).stripe_customer_id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching Stripe subscriber data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriber data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if ((profile as any)?.stripe_customer_id) {
      fetchData()
    }
  }, [user?.id, (profile as any)?.stripe_customer_id])

  return { data, loading, error, refetch: fetchData }
}

export function useStripeInvoices(limit = 10) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [data, setData] = useState<StripeInvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user?.id || !(profile as any)?.stripe_customer_id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stripe/subscriber/invoices/${(profile as any).stripe_customer_id}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching Stripe invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if ((profile as any)?.stripe_customer_id) {
      fetchData()
    }
  }, [user?.id, (profile as any)?.stripe_customer_id, limit])

  return { data, loading, error, refetch: fetchData }
}

// Utility functions for formatting Stripe data
export function formatStripeAmount(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2)
}

export function formatSubscriptionInterval(interval: string): string {
  switch (interval) {
    case 'day':
      return 'day'
    case 'week':
      return 'week'
    case 'month':
      return 'month'
    case 'year':
      return 'year'
    default:
      return interval
  }
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status)
}

export function getNextBillingDate(periodEnd: number): Date {
  return new Date(periodEnd * 1000)
}