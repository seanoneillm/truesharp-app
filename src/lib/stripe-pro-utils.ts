import { STRIPE_CONFIG } from './stripe'
import { PRO_FEATURES } from './constants'

/**
 * Utility functions for TrueSharp Pro Stripe integration
 */

export interface ProPlan {
  id: 'monthly' | 'yearly'
  name: string
  priceId: string
  price: number
  currency: string
  interval: 'month' | 'year'
  intervalCount: 1
  productId: string
}

/**
 * Get Pro plan configuration by plan type
 */
export function getProPlan(planType: 'monthly' | 'yearly'): ProPlan {
  const baseConfig = {
    productId: STRIPE_CONFIG.truesharpPro.productId,
    currency: 'usd',
    intervalCount: 1 as const,
  }

  if (planType === 'monthly') {
    return {
      ...baseConfig,
      id: 'monthly',
      name: 'TrueSharp Pro Monthly',
      priceId: STRIPE_CONFIG.truesharpPro.monthlyPriceId,
      price: PRO_FEATURES.price.monthly,
      interval: 'month',
    }
  } else {
    return {
      ...baseConfig,
      id: 'yearly',
      name: 'TrueSharp Pro Annual',
      priceId: STRIPE_CONFIG.truesharpPro.yearlyPriceId,
      price: PRO_FEATURES.price.yearly,
      interval: 'year',
    }
  }
}

/**
 * Validate if a price ID belongs to TrueSharp Pro
 */
export function isProPriceId(priceId: string): boolean {
  return (
    priceId === STRIPE_CONFIG.truesharpPro.monthlyPriceId ||
    priceId === STRIPE_CONFIG.truesharpPro.yearlyPriceId
  )
}

/**
 * Get plan type from price ID
 */
export function getPlanTypeFromPriceId(priceId: string): 'monthly' | 'yearly' | null {
  if (priceId === STRIPE_CONFIG.truesharpPro.monthlyPriceId) {
    return 'monthly'
  } else if (priceId === STRIPE_CONFIG.truesharpPro.yearlyPriceId) {
    return 'yearly'
  }
  return null
}

/**
 * Validate if a product ID is the TrueSharp Pro product
 */
export function isProProductId(productId: string): boolean {
  return productId === STRIPE_CONFIG.truesharpPro.productId
}

/**
 * Get all Pro plans
 */
export function getAllProPlans(): ProPlan[] {
  return [
    getProPlan('monthly'),
    getProPlan('yearly'),
  ]
}

/**
 * Calculate savings for yearly plan vs monthly
 */
export function calculateYearlySavings(): {
  monthlyTotal: number
  yearlyPrice: number
  savings: number
  savingsPercentage: number
} {
  const monthlyTotal = PRO_FEATURES.price.monthly * 12
  const yearlyPrice = PRO_FEATURES.price.yearly
  const savings = monthlyTotal - yearlyPrice
  const savingsPercentage = Math.round((savings / monthlyTotal) * 100)

  return {
    monthlyTotal,
    yearlyPrice,
    savings,
    savingsPercentage,
  }
}