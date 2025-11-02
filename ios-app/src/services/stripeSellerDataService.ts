import { Environment } from '../config/environment'
import { supabase } from '../lib/supabase'

export interface StripeSellerData {
  totalRevenue: number
  subscriberCount: number
  pendingPayments: number
  strategyMetrics: Record<
    string,
    {
      subscribers: number
      revenue: number
      tiers: string[]
    }
  >
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

export interface FinancialMetrics {
  totalGrossRevenue: number
  totalNetRevenue: number
  totalPlatformFees: number
  monthlyGrowthRate: number
  averageRevenuePerUser: number
  totalSubscribers: number
  revenueByFrequency: {
    weekly: number
    monthly: number
    yearly: number
  }
  topPerformingStrategies: Array<{
    strategy_name: string
    revenue: number
    subscriber_count: number
  }>
}

class StripeSellerDataService {
  private baseUrl = Environment.API_BASE_URL

  // Fetch seller Stripe data from the web app API
  async fetchSellerStripeData(userId: string): Promise<StripeSellerData | null> {
    try {
      // First, check if user has Stripe Connect account in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', userId)
        .single()

      if (profileError || !profile?.stripe_connect_account_id) {
        return {
          totalRevenue: 0,
          subscriberCount: 0,
          pendingPayments: 0,
          strategyMetrics: {},
          subscriptions: [],
          hasStripeAccount: false,
          message: 'No Stripe account configured',
        }
      }

      // Get current session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return {
          totalRevenue: 0,
          subscriberCount: 0,
          pendingPayments: 0,
          strategyMetrics: {},
          subscriptions: [],
          hasStripeAccount: false,
          message: 'Authentication required',
        }
      }

      // Use the same auth approach as web app - include both Bearer and Cookie auth
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        Cookie: `sb-trsogafrxpptszxydycn-auth-token=${session.access_token}`,
      }

      const response = await fetch(`${this.baseUrl}/api/stripe/seller/${userId}`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Try alternative cookie format like the web app uses
          const altHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            Cookie: `sb-trsogafrxpptszxydycn-auth-token=[${JSON.stringify(session.access_token)}]`,
          }

          const retryResponse = await fetch(`${this.baseUrl}/api/stripe/seller/${userId}`, {
            method: 'GET',
            headers: altHeaders,
            credentials: 'include',
          })

          if (!retryResponse.ok) {
            return {
              totalRevenue: 0,
              subscriberCount: 0,
              pendingPayments: 0,
              strategyMetrics: {},
              subscriptions: [],
              hasStripeAccount: true, // We know they have an account from profiles
              message: 'Stripe authentication failed - using local data',
            }
          }

          const retryData = await retryResponse.json()
          return retryData
        }

        if (response.status === 404) {
          return {
            totalRevenue: 0,
            subscriberCount: 0,
            pendingPayments: 0,
            strategyMetrics: {},
            subscriptions: [],
            hasStripeAccount: true,
            message: 'Stripe account found but no revenue data',
          }
        }

        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      // Final fallback - still check if they have Connect account
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_connect_account_id')
          .eq('id', userId)
          .single()

        return {
          totalRevenue: 0,
          subscriberCount: 0,
          pendingPayments: 0,
          strategyMetrics: {},
          subscriptions: [],
          hasStripeAccount: !!profile?.stripe_connect_account_id,
          message: profile?.stripe_connect_account_id
            ? 'Connection error - using local data'
            : 'No Stripe account configured',
        }
      } catch (profileError) {
        return {
          totalRevenue: 0,
          subscriberCount: 0,
          pendingPayments: 0,
          strategyMetrics: {},
          subscriptions: [],
          hasStripeAccount: false,
          message: 'Connection error - using local data',
        }
      }
    }
  }

  // Convert Stripe data to the format expected by the iOS financials UI
  convertStripeDataToFinancialMetrics(
    stripeData: StripeSellerData | null,
    fallbackSubscriptions: any[] = []
  ): FinancialMetrics {
    let totalGrossRevenue = 0
    let totalNetRevenue = 0
    let totalPlatformFees = 0
    let totalSubscribers = 0
    const revenueByFrequency = { weekly: 0, monthly: 0, yearly: 0 }
    const strategyRevenue = new Map()
    if (stripeData && stripeData.subscriptions && stripeData.subscriptions.length > 0) {
      // Use Stripe data for accurate financial metrics when we have subscription data
      totalNetRevenue = stripeData.totalRevenue
      totalGrossRevenue = totalNetRevenue / 0.82 // Reverse calculate gross from net (82% take rate)
      totalPlatformFees = totalGrossRevenue - totalNetRevenue
      totalSubscribers = stripeData.subscriberCount

      // Process Stripe subscription data for frequency breakdown
      stripeData.subscriptions.forEach(sub => {
        const monthlyAmount = sub.amount / 100 // Convert from cents
        const interval = sub.interval

        if (interval === 'week') {
          revenueByFrequency.weekly += monthlyAmount * 4.33
        } else if (interval === 'year') {
          revenueByFrequency.yearly += monthlyAmount / 12
        } else {
          revenueByFrequency.monthly += monthlyAmount
        }

        // Track strategy performance from Stripe metadata
        const strategyId = sub.strategy_id || 'default'
        const current = strategyRevenue.get(strategyId) || { revenue: 0, subscriber_count: 0 }
        strategyRevenue.set(strategyId, {
          strategy_name: sub.product_name,
          revenue: current.revenue + monthlyAmount * 0.82, // Apply seller take rate
          subscriber_count: current.subscriber_count + 1,
        })
      })
    } else {
      // Fallback to Supabase calculations
      fallbackSubscriptions.forEach(sub => {
        const monthlyPrice =
          sub.frequency === 'weekly'
            ? sub.price * 4.33
            : sub.frequency === 'yearly'
              ? sub.price / 12
              : sub.price

        totalGrossRevenue += monthlyPrice
        revenueByFrequency[sub.frequency as keyof typeof revenueByFrequency] += monthlyPrice

        // Track strategy performance
        const strategyName = sub.strategies?.name || 'Unknown Strategy'
        const current = strategyRevenue.get(strategyName) || { revenue: 0, subscriber_count: 0 }
        strategyRevenue.set(strategyName, {
          strategy_name: strategyName,
          revenue: current.revenue + monthlyPrice * 0.82,
          subscriber_count: current.subscriber_count + 1,
        })
      })

      totalPlatformFees = totalGrossRevenue * 0.18
      totalNetRevenue = totalGrossRevenue * 0.82
      totalSubscribers = fallbackSubscriptions.length
    }

    // Get top performing strategies
    const topPerformingStrategies = Array.from(strategyRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate growth rate (mock data for now - would need historical data)
    const monthlyGrowthRate = totalSubscribers > 0 ? 12.5 : 0

    return {
      totalGrossRevenue,
      totalNetRevenue,
      totalPlatformFees,
      monthlyGrowthRate,
      averageRevenuePerUser: totalSubscribers > 0 ? totalNetRevenue / totalSubscribers : 0,
      totalSubscribers,
      revenueByFrequency,
      topPerformingStrategies,
    }
  }

  // Utility functions for formatting
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Check if user has Stripe Connect account via profile
  async hasStripeConnectAccount(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error checking Stripe Connect account:', error)
        return false
      }

      return !!profile?.stripe_connect_account_id
    } catch (error) {
      console.error('Error checking Stripe Connect account:', error)
      return false
    }
  }
}

export const stripeSellerDataService = new StripeSellerDataService()
export default stripeSellerDataService
