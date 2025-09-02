import { BillingHistory, BillingTransaction, SubscriptionManagement } from '@/types/subscriptions'

export interface StripeCustomerPortalOptions {
  return_url?: string
  configuration?: string
  flow_data?: {
    type: 'payment_method_update' | 'subscription_cancel' | 'subscription_update'
    subscription?: string
  }
}

export interface PaymentMethodInfo {
  id: string
  type: 'card' | 'bank_account' | 'paypal'
  brand?: string
  last4: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  created_at: string
}

export interface InvoiceData {
  id: string
  subscription_id: string
  amount_paid: number
  amount_due: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'draft' | 'uncollectible'
  created: number
  due_date?: number
  hosted_invoice_url?: string
  invoice_pdf?: string
  period_start: number
  period_end: number
  description?: string
}

export interface BillingManagementOptions {
  allowCancellation: boolean
  allowModification: boolean
  allowPause: boolean
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice'
}

export class SubscriptionBillingManager {
  private apiBaseUrl: string

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl
  }

  async getBillingHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<BillingHistory> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/billing/history?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch billing history')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching billing history:', error)
      throw error
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethodInfo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/billing/payment-methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }

      const data = await response.json()
      return data.payment_methods || []
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw error
    }
  }

  async createCustomerPortalSession(
    customerId: string,
    options: StripeCustomerPortalOptions = {}
  ): Promise<{ url: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/billing/portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          return_url: options.return_url || `${window.location.origin}/subscriptions`,
          configuration: options.configuration,
          flow_data: options.flow_data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create customer portal session')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      throw error
    }
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/billing/invoice/${invoiceId}/download`, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download invoice')
      }

      return await response.blob()
    } catch (error) {
      console.error('Error downloading invoice:', error)
      throw error
    }
  }

  async getUpcomingInvoice(subscriptionId: string): Promise<InvoiceData | null> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/billing/upcoming-invoice?subscription_id=${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null // No upcoming invoice
        }
        throw new Error('Failed to fetch upcoming invoice')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching upcoming invoice:', error)
      throw error
    }
  }

  async updateSubscriptionBilling(
    subscriptionId: string,
    updates: {
      payment_method_id?: string
      billing_cycle_anchor?: number
      proration_behavior?: 'create_prorations' | 'none' | 'always_invoice'
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscriptions/${subscriptionId}/billing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update subscription billing')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating subscription billing:', error)
      throw error
    }
  }
}

export function calculateProrationAmount(
  currentPrice: number,
  newPrice: number,
  daysRemaining: number,
  totalDaysInPeriod: number
): {
  prorationAmount: number
  immediateCharge: number
  nextPeriodAmount: number
  description: string
} {
  const dailyCurrentRate = currentPrice / totalDaysInPeriod
  const dailyNewRate = newPrice / totalDaysInPeriod

  const remainingCurrentValue = dailyCurrentRate * daysRemaining
  const remainingNewValue = dailyNewRate * daysRemaining

  const prorationAmount = remainingNewValue - remainingCurrentValue
  const immediateCharge = Math.max(0, prorationAmount)
  const nextPeriodAmount = newPrice

  let description = ''
  if (prorationAmount > 0) {
    description = `You'll be charged $${immediateCharge.toFixed(2)} today for the upgrade, then $${nextPeriodAmount.toFixed(2)} on your next billing cycle.`
  } else if (prorationAmount < 0) {
    description = `You'll receive a $${Math.abs(prorationAmount).toFixed(2)} credit applied to your next bill of $${nextPeriodAmount.toFixed(2)}.`
  } else {
    description = `No immediate charge. Your next bill will be $${nextPeriodAmount.toFixed(2)}.`
  }

  return {
    prorationAmount,
    immediateCharge,
    nextPeriodAmount,
    description,
  }
}

export function calculateRefundAmount(
  subscriptionPrice: number,
  frequency: 'weekly' | 'monthly' | 'yearly',
  subscriptionStartDate: Date,
  cancellationDate: Date = new Date()
): {
  refundAmount: number
  isEligible: boolean
  reason: string
  daysUsed: number
  totalDays: number
} {
  const msPerDay = 24 * 60 * 60 * 1000
  const daysUsed = Math.ceil(
    (cancellationDate.getTime() - subscriptionStartDate.getTime()) / msPerDay
  )

  let totalDays: number
  switch (frequency) {
    case 'weekly':
      totalDays = 7
      break
    case 'monthly':
      totalDays = 30
      break
    case 'yearly':
      totalDays = 365
      break
    default:
      totalDays = 30
  }

  // Refund policy: Full refund within 3 days, prorated refund within first week
  let refundAmount = 0
  let isEligible = false
  let reason = ''

  if (daysUsed <= 3) {
    // Full refund within 3 days
    refundAmount = subscriptionPrice
    isEligible = true
    reason = 'Full refund eligible - cancelled within 3 days'
  } else if (daysUsed <= 7 && frequency !== 'weekly') {
    // Prorated refund within first week (except for weekly subscriptions)
    const usagePercentage = daysUsed / totalDays
    refundAmount = subscriptionPrice * (1 - usagePercentage)
    isEligible = refundAmount > 0
    reason = isEligible
      ? 'Prorated refund eligible - cancelled within first week'
      : 'No refund - usage period exceeded'
  } else {
    reason = 'No refund available - outside refund window'
  }

  return {
    refundAmount: Math.max(0, refundAmount),
    isEligible,
    reason,
    daysUsed,
    totalDays,
  }
}

export function formatBillingPeriod(
  periodStart: number,
  periodEnd: number,
  frequency: 'weekly' | 'monthly' | 'yearly'
): string {
  const start = new Date(periodStart * 1000)
  const end = new Date(periodEnd * 1000)

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
  }

  if (frequency === 'weekly') {
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`
  } else if (frequency === 'monthly') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else {
    return `${start.getFullYear()} Annual Subscription`
  }
}

export function getNextBillingDate(
  currentPeriodEnd: string,
  frequency: 'weekly' | 'monthly' | 'yearly',
  isCancelled: boolean = false
): Date | null {
  if (isCancelled) return null

  const currentEnd = new Date(currentPeriodEnd)

  switch (frequency) {
    case 'weekly':
      return new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly':
      const nextMonth = new Date(currentEnd)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    case 'yearly':
      const nextYear = new Date(currentEnd)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      return nextYear
    default:
      return null
  }
}

export function calculateAnnualSavings(
  monthlyPrice: number,
  yearlyPrice: number
): {
  savings: number
  savingsPercentage: number
  description: string
} {
  const annualMonthlyEquivalent = monthlyPrice * 12
  const savings = annualMonthlyEquivalent - yearlyPrice
  const savingsPercentage = (savings / annualMonthlyEquivalent) * 100

  return {
    savings,
    savingsPercentage,
    description: `Save $${savings.toFixed(2)} (${savingsPercentage.toFixed(0)}%) with annual billing`,
  }
}

export async function handleInvoiceDownload(invoiceId: string, filename?: string): Promise<void> {
  const billingManager = new SubscriptionBillingManager()

  try {
    const blob = await billingManager.downloadInvoice(invoiceId)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `invoice-${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download invoice:', error)
    throw new Error('Failed to download invoice. Please try again.')
  }
}

export function validateSubscriptionModification(
  currentTier: string,
  newTier: string,
  currentPrice: number,
  newPrice: number
): {
  isValid: boolean
  type: 'upgrade' | 'downgrade' | 'same'
  restrictions: string[]
  recommendations: string[]
} {
  const isValid = currentTier !== newTier
  const type = newPrice > currentPrice ? 'upgrade' : newPrice < currentPrice ? 'downgrade' : 'same'
  const restrictions: string[] = []
  const recommendations: string[] = []

  if (!isValid) {
    restrictions.push('Cannot modify to the same tier')
  }

  if (type === 'downgrade') {
    restrictions.push('Downgrades take effect at the next billing cycle')
    recommendations.push(
      'Consider waiting until near your billing date to minimize unused benefits'
    )
  }

  if (type === 'upgrade') {
    recommendations.push('Upgrades take effect immediately with prorated billing')
    recommendations.push("You'll have immediate access to all new features")
  }

  return {
    isValid,
    type,
    restrictions,
    recommendations,
  }
}
