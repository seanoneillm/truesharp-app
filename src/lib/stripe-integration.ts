'use client'

// import { stripe } from './stripe'

// Types for Stripe data
export interface StripeSellerData {
  totalRevenue: number
  subscriberCount: number
  activeSubscriptions: StripeSubscriptionData[]
  pendingPayments: number
  strategyMetrics: Record<string, {
    subscribers: number
    revenue: number
    tiers: string[]
  }>
}

export interface StripeSubscriptionData {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  customer: {
    id: string
    email: string
    name?: string
  }
  items: {
    price: {
      id: string
      unit_amount: number
      recurring: {
        interval: string
      }
    }
    product: {
      id: string
      name: string
      metadata: {
        strategy_id?: string
        seller_id?: string
      }
    }
  }[]
}

export interface StripeCustomerSubscription {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  items: {
    price: {
      id: string
      unit_amount: number
      recurring: {
        interval: string
      }
    }
    product: {
      id: string
      name: string
      metadata: {
        strategy_id?: string
        seller_id?: string
        type?: string
      }
    }
  }[]
}

/**
 * Fetches seller data from Stripe for the dashboard
 */
export async function fetchSellerStripeData(sellerId: string): Promise<StripeSellerData> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('/api/stripe/seller-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sellerId }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Validate response structure
    if (typeof data.totalRevenue !== 'number' || typeof data.subscriberCount !== 'number') {
      throw new Error('Invalid response format from Stripe API')
    }
    
    return data
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Stripe API request timed out')
      } else {
        console.error('Failed to fetch seller Stripe data:', error.message)
      }
    } else {
      console.error('Unknown error fetching seller Stripe data:', error)
    }
    
    // Return safe fallback data
    return {
      totalRevenue: 0,
      subscriberCount: 0,
      activeSubscriptions: [],
      pendingPayments: 0,
      strategyMetrics: {},
    }
  }
}

/**
 * Fetches subscriber data from Stripe for the settings page
 */
export async function fetchSubscriberStripeData(customerId?: string): Promise<StripeCustomerSubscription[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('/api/stripe/subscriber-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Validate response structure
    if (!Array.isArray(data.subscriptions)) {
      throw new Error('Invalid response format from Stripe subscriber API')
    }
    
    return data.subscriptions || []
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Stripe subscriber API request timed out')
      } else {
        console.error('Failed to fetch subscriber Stripe data:', error.message)
      }
    } else {
      console.error('Unknown error fetching subscriber Stripe data:', error)
    }
    
    return []
  }
}

/**
 * Format currency amount from Stripe (cents) to dollars
 */
export function formatStripeAmount(amountInCents: number): number {
  return amountInCents / 100
}

/**
 * Format Stripe subscription interval to user-friendly text
 */
export function formatSubscriptionInterval(interval: string): string {
  switch (interval) {
    case 'week':
      return 'weekly'
    case 'month':
      return 'monthly'
    case 'year':
      return 'yearly'
    default:
      return interval
  }
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status.toLowerCase())
}

/**
 * Get next billing date from Stripe subscription
 */
export function getNextBillingDate(currentPeriodEnd: number): Date {
  return new Date(currentPeriodEnd * 1000)
}

/**
 * Calculate monthly revenue from subscription data
 */
export function calculateMonthlyRevenue(subscriptions: StripeSubscriptionData[]): number {
  return subscriptions.reduce((total, sub) => {
    if (!isSubscriptionActive(sub.status)) return total
    
    return total + sub.items.reduce((itemTotal, item) => {
      const monthlyAmount = item.price.recurring.interval === 'year' 
        ? formatStripeAmount(item.price.unit_amount) / 12
        : item.price.recurring.interval === 'week'
        ? formatStripeAmount(item.price.unit_amount) * 4.33
        : formatStripeAmount(item.price.unit_amount)
      
      return itemTotal + monthlyAmount
    }, 0)
  }, 0)
}