import { Linking } from 'react-native'
import { API_ENDPOINTS } from '../config/environment'
import { API_URLS, STRIPE_CONFIG } from '../config/stripe'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

export interface StripeConnectAccount {
  id: string
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements_due: string[]
}

export interface StripeConnectResponse {
  success: boolean
  account_id: string
  onboarding_url: string
}

export interface StrategyMonetizationData {
  id: string
  name?: string
  description?: string
  monetized?: boolean
  pricing_weekly?: number | null
  pricing_monthly?: number | null
  pricing_yearly?: number | null
}

export interface MonetizationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiresStripeConnect: boolean
}

class StripeService {
  private baseUrl = API_ENDPOINTS.strategies

  // Check if user has Stripe Connect account setup
  async checkSellerStatus(userId: string): Promise<{
    hasStripeAccount: boolean
    accountReady: boolean
    account?: StripeConnectAccount
    errors?: string[]
  }> {
    try {
      // Get current session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return {
          hasStripeAccount: false,
          accountReady: false,
          errors: ['Authentication required'],
        }
      }

      const response = await fetch(`${API_URLS.stripeConnect}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=${JSON.stringify([session.access_token])}`,
        },
      })

      if (response.status === 404) {
        // No Stripe Connect account found
        return {
          hasStripeAccount: false,
          accountReady: false,
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return {
          hasStripeAccount: false,
          accountReady: false,
          errors: [errorData.error || 'Failed to check Stripe account status'],
        }
      }

      const data = await response.json()
      const account = data.account

      return {
        hasStripeAccount: true,
        accountReady: account.details_submitted && account.charges_enabled,
        account,
      }
    } catch (error) {
      logger.error('Error checking seller status:', error)
      return {
        hasStripeAccount: false,
        accountReady: false,
        errors: ['Network error checking Stripe account'],
      }
    }
  }

  // Create Stripe Connect account for seller
  async createStripeConnectAccount(): Promise<StripeConnectResponse | { error: string }> {
    try {
      // Get current session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        logger.error('No access token available for Stripe Connect account creation');
        return { error: 'Authentication required' }
      }
      const response = await fetch(`${API_URLS.stripeConnect}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          // Add cookie that the server expects
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=${JSON.stringify([session.access_token])}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        logger.error('Stripe Connect account creation failed:', errorData)
        return { error: errorData.error || 'Failed to create Stripe account' }
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Error creating Stripe Connect account:', error)
      return { error: 'Network error creating Stripe account' }
    }
  }

  // Create onboarding link for existing Stripe Connect account
  async createOnboardingLink(
    accountId: string
  ): Promise<StripeConnectResponse | { error: string }> {
    try {
      // Get current session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return { error: 'Authentication required' }
      }

      // Use dedicated onboarding endpoint instead of main connect endpoint
      const response = await fetch(`${API_URLS.stripeConnect}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          // Add cookie that the server expects
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=${JSON.stringify([session.access_token])}`,
        },
        // Send the account_id to the onboarding endpoint to ensure it uses the correct account
        body: JSON.stringify({
          account_id: accountId,
          refresh_url: 'truesharp://onboarding/refresh',
          return_url: 'truesharp://onboarding/complete',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        logger.error('Onboarding link creation failed:', errorData)
        return { error: errorData.error || 'Failed to create onboarding link' }
      }

      const data = await response.json()
      return {
        success: data.success,
        account_id: accountId, // Keep the account_id for consistency
        onboarding_url: data.onboarding_url,
      }
    } catch (error) {
      logger.error('Error creating onboarding link:', error)
      return { error: 'Network error creating onboarding link' }
    }
  }

  // Validate strategy for monetization
  validateStrategyForMonetization(
    strategyData: StrategyMonetizationData,
    hasStripeAccount: boolean,
    accountReady: boolean
  ): MonetizationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check Stripe Connect account
    if (!hasStripeAccount) {
      errors.push('Stripe Connect account required to monetize strategies')
    } else if (!accountReady) {
      errors.push('Complete your Stripe onboarding process to enable monetization')
    }

    // Check strategy name
    if (!strategyData.name || strategyData.name.trim().length < 1) {
      errors.push('Strategy name is required')
    } else if (strategyData.name.length > 100) {
      errors.push('Strategy name must be 100 characters or less')
    }

    // Check pricing when monetization is enabled
    if (strategyData.monetized) {
      const hasWeeklyPrice = strategyData.pricing_weekly && strategyData.pricing_weekly > 0
      const hasMonthlyPrice = strategyData.pricing_monthly && strategyData.pricing_monthly > 0
      const hasYearlyPrice = strategyData.pricing_yearly && strategyData.pricing_yearly > 0

      if (!hasWeeklyPrice && !hasMonthlyPrice && !hasYearlyPrice) {
        errors.push(
          'At least one pricing option (weekly, monthly, or yearly) is required for monetization'
        )
      }

      // Validate price values
      if (strategyData.pricing_weekly !== null && strategyData.pricing_weekly !== undefined) {
        if (strategyData.pricing_weekly < 0) {
          errors.push('Weekly price cannot be negative')
        } else if (strategyData.pricing_weekly > 0 && strategyData.pricing_weekly < 1) {
          warnings.push('Weekly price below $1 may not attract subscribers')
        }
      }

      if (strategyData.pricing_monthly !== null && strategyData.pricing_monthly !== undefined) {
        if (strategyData.pricing_monthly < 0) {
          errors.push('Monthly price cannot be negative')
        } else if (strategyData.pricing_monthly > 0 && strategyData.pricing_monthly < 5) {
          warnings.push('Monthly price below $5 may not attract subscribers')
        }
      }

      if (strategyData.pricing_yearly !== null && strategyData.pricing_yearly !== undefined) {
        if (strategyData.pricing_yearly < 0) {
          errors.push('Yearly price cannot be negative')
        } else if (strategyData.pricing_yearly > 0 && strategyData.pricing_yearly < 50) {
          warnings.push('Yearly price below $50 may not attract subscribers')
        }
      }

      // Pricing relationship warnings
      if (hasMonthlyPrice && hasYearlyPrice) {
        const monthlyAnnual = (strategyData.pricing_monthly || 0) * 12
        const yearly = strategyData.pricing_yearly || 0
        if (yearly >= monthlyAnnual) {
          warnings.push(
            'Yearly price should be lower than 12x monthly price to incentivize annual subscriptions'
          )
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresStripeConnect: !hasStripeAccount || !accountReady,
    }
  }

  // Monetize strategy - calls web app API
  async monetizeStrategy(strategyData: StrategyMonetizationData): Promise<{
    success: boolean
    error?: string
    details?: string
  }> {
    try {
      // Get current session to verify authentication
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return {
          success: false,
          error: 'Authentication required',
          details: 'User must be logged in to monetize strategies',
        }
      }
      // First, get the current strategy to check ownership and get existing Stripe IDs
      const { data: currentStrategy, error: fetchError } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', strategyData.id)
        .eq('user_id', session.user.id)
        .single()

      if (fetchError || !currentStrategy) {
        return {
          success: false,
          error: 'Strategy not found or access denied',
          details: 'You can only monetize your own strategies',
        }
      }

      let stripeProductId = currentStrategy.stripe_product_id
      let stripePriceWeeklyId = currentStrategy.stripe_price_weekly_id
      let stripePriceMonthlyId = currentStrategy.stripe_price_monthly_id
      let stripePriceYearlyId = currentStrategy.stripe_price_yearly_id

      // Get user profile for Stripe Connect account info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', session.user.id)
        .single()

      // If monetizing and we don't have Stripe products, create them
      if (strategyData.monetized && !stripeProductId) {
        if (!userProfile?.stripe_connect_account_id) {
          // Only create account if they don't have one
          const connectResult = await this.createStripeConnectAccount()
          if ('error' in connectResult) {
            return {
              success: false,
              error: 'Stripe Connect account required',
              details: connectResult.error,
            }
          }
        } else {
        }

        // Call the web API to create Stripe product and prices (proper backend approach)
        try {
          // Call the web API using cookie-based authentication
          const response = await fetch(`${this.baseUrl}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              // Include session cookie for authentication
              Cookie: `sb-trsogafrxpptszxydycn-auth-token=${session.access_token}`,
            },
            body: JSON.stringify({
              id: strategyData.id,
              name: strategyData.name,
              description: strategyData.description,
              monetized: strategyData.monetized,
              pricing_weekly: strategyData.pricing_weekly,
              pricing_monthly: strategyData.pricing_monthly,
              pricing_yearly: strategyData.pricing_yearly,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            logger.error('Web API product creation failed:', errorData)

            // If auth fails, try a different approach
            if (response.status === 401) {
              // Try with Authorization header as well
              const retryResponse = await fetch(`${this.baseUrl}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                  Cookie: `sb-trsogafrxpptszxydycn-auth-token=[${JSON.stringify(session.access_token)}]`,
                },
                body: JSON.stringify({
                  id: strategyData.id,
                  name: strategyData.name,
                  description: strategyData.description,
                  monetized: strategyData.monetized,
                  pricing_weekly: strategyData.pricing_weekly,
                  pricing_monthly: strategyData.pricing_monthly,
                  pricing_yearly: strategyData.pricing_yearly,
                }),
              })

              if (!retryResponse.ok) {
                const retryErrorData = await retryResponse
                  .json()
                  .catch(() => ({ error: 'Unknown error' }))
                logger.error('Retry also failed:', retryErrorData)
                return {
                  success: false,
                  error: 'Authentication failed',
                  details: `HTTP ${retryResponse.status}: ${retryErrorData.error || retryResponse.statusText}`,
                }
              }

              const retryResult = await retryResponse.json()
              // Extract Stripe IDs from response
              if (retryResult.stripe_product_id) {
                stripeProductId = retryResult.stripe_product_id
                stripePriceWeeklyId = retryResult.stripe_price_weekly_id
                stripePriceMonthlyId = retryResult.stripe_price_monthly_id
                stripePriceYearlyId = retryResult.stripe_price_yearly_id
              }
            } else {
              return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                details: errorData.details,
              }
            }
          } else {
            const result = await response.json()
            // Extract Stripe IDs from response
            if (result.stripe_product_id) {
              stripeProductId = result.stripe_product_id
              stripePriceWeeklyId = result.stripe_price_weekly_id
              stripePriceMonthlyId = result.stripe_price_monthly_id
              stripePriceYearlyId = result.stripe_price_yearly_id
            }
          }
        } catch (error) {
          logger.error('Error calling web API:', error)
          return {
            success: false,
            error: 'Failed to call web API',
            details: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      }

      // Update strategy in Supabase with all data including Stripe IDs
      const updateData: any = {
        name: strategyData.name,
        description: strategyData.description,
        monetized: strategyData.monetized,
        pricing_weekly: strategyData.pricing_weekly,
        pricing_monthly: strategyData.pricing_monthly,
        pricing_yearly: strategyData.pricing_yearly,
        updated_at: new Date().toISOString(),
      }

      // Add Stripe IDs if we have them
      if (stripeProductId) {
        updateData.stripe_product_id = stripeProductId
        updateData.stripe_price_weekly_id = stripePriceWeeklyId
        updateData.stripe_price_monthly_id = stripePriceMonthlyId
        updateData.stripe_price_yearly_id = stripePriceYearlyId
        updateData.creator_account_id = userProfile?.stripe_connect_account_id
      }

      const { data, error } = await supabase
        .from('strategies')
        .update(updateData)
        .eq('id', strategyData.id)
        .eq('user_id', session.user.id)
        .select()

      if (error) {
        logger.error('Strategy database update failed:', error)

        return {
          success: false,
          error: error.message || 'Failed to update strategy',
          details: error.details,
        }
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Strategy update failed',
          details: 'No rows were updated',
        }
      }
      // Also update the strategy_leaderboard table if the strategy is monetized
      if (strategyData.monetized) {
        const { error: leaderboardError } = await supabase
          .from('strategy_leaderboard')
          .update({
            is_monetized: true,
            subscription_price_weekly: strategyData.pricing_weekly,
            subscription_price_monthly: strategyData.pricing_monthly,
            subscription_price_yearly: strategyData.pricing_yearly,
            updated_at: new Date().toISOString(),
          })
          .eq('strategy_id', strategyData.id)

        if (leaderboardError) {
          // Don't fail the entire operation, just log the warning
        } else {
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      logger.error('Error monetizing strategy:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Open Stripe onboarding URL in browser
  async openStripeOnboarding(onboardingUrl: string): Promise<void> {
    try {
      // For iOS, we'll use Linking to open the URL in Safari
      const canOpen = await Linking.canOpenURL(onboardingUrl)
      if (canOpen) {
        await Linking.openURL(onboardingUrl)
      } else {
        throw new Error('Cannot open Stripe onboarding URL')
      }
    } catch (error) {
      logger.error('Error opening Stripe onboarding:', error)
      throw error
    }
  }

  // Get Stripe customer billing portal URL
  async getCustomerBillingPortalUrl(): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get current session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      // Call the web app's billing-portal API endpoint
      const response = await fetch(API_ENDPOINTS.billingPortal, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=[${JSON.stringify(session.access_token)}]`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        logger.error('Customer billing portal creation failed:', errorData)
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      if (!data.url) {
        return { success: false, error: 'No billing portal URL provided' }
      }

      return { success: true, url: data.url }
    } catch (error) {
      logger.error('Error getting customer billing portal URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Get Stripe Connect account management URL
  async getAccountManagementUrl(): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get current session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return { success: false, error: 'Authentication required' }
      }

      // Get account management URL from web app API - let the API handle account verification
      const response = await fetch(`${API_ENDPOINTS.stripeConnectLogin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=[${JSON.stringify(session.access_token)}]`,
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('Account management login link creation failed', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          message: data.message,
          userId: session.user.id,
          endpoint: API_ENDPOINTS.stripeConnectLogin,
        })
        
        // Provide more specific error messages based on Stripe API responses
        let userFriendlyError = data.error || `Failed to create account management link: HTTP ${response.status}`;
        
        if (response.status === 400 && data.error?.includes('setup must be completed')) {
          userFriendlyError = 'Account setup is not complete. Please complete your Stripe onboarding first.';
        } else if (response.status === 404) {
          userFriendlyError = 'No Stripe Connect account found. Please set up your seller account first.';
        } else if (response.status === 401) {
          userFriendlyError = 'Authentication failed. Please try logging out and back in.';
        }
        
        return {
          success: false,
          error: userFriendlyError,
        }
      }

      if (data.success) {
        const url = data.url || data.login_url
        if (!url) {
          logger.error('API returned success but no URL', data)
          return { success: false, error: 'No URL returned from API' }
        }
        return { success: true, url: url }
      } else {
        return { success: false, error: data.error || 'Failed to get account management URL' }
      }
    } catch (error) {
      logger.error('Error getting account management URL', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Open account management in browser
  async openAccountManagement(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.getAccountManagementUrl()

      if (!result.success) {
        return { success: false, error: result.error }
      }

      if (!result.url) {
        return { success: false, error: 'No account management URL provided' }
      }

      // Open the URL in device browser
      const canOpen = await Linking.canOpenURL(result.url)
      if (canOpen) {
        await Linking.openURL(result.url)
        return { success: true }
      } else {
        return { success: false, error: 'Cannot open Stripe management URL' }
      }
    } catch (error) {
      logger.error('Error opening account management', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Get marketplace fee percentage
  getMarketplaceFeePercentage(): number {
    return STRIPE_CONFIG.marketplaceFeePercentage
  }

  // Calculate estimated earnings after fees
  calculateEstimatedEarnings(grossAmount: number): {
    gross: number
    platformFee: number
    stripeFee: number
    net: number
  } {
    const platformFeeAmount = grossAmount * (STRIPE_CONFIG.marketplaceFeePercentage / 100)
    const stripeFeeAmount = grossAmount * 0.029 + 0.3 // Stripe's standard fee
    const net = grossAmount - platformFeeAmount - stripeFeeAmount

    return {
      gross: grossAmount,
      platformFee: platformFeeAmount,
      stripeFee: stripeFeeAmount,
      net: Math.max(0, net), // Ensure non-negative
    }
  }

  // Delete strategy with full Stripe cleanup (calls web app API)
  async deleteStrategyWithStripeCleanup(strategyId: string): Promise<{
    success: boolean
    error?: string
    details?: string
    deletedSubscriptions?: number
  }> {
    try {
      // Get current session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return {
          success: false,
          error: 'Authentication required',
          details: 'User must be logged in to delete strategies',
        }
      }

      // Call the web app's comprehensive DELETE endpoint
      const response = await fetch(API_ENDPOINTS.deleteStrategy(strategyId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `sb-trsogafrxpptszxydycn-auth-token=[${JSON.stringify(session.access_token)}]`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.details || 'Strategy deletion failed',
        }
      }

      const result = await response.json()
      return {
        success: true,
        deletedSubscriptions: result.deletedSubscriptions,
      }
    } catch (error) {
      logger.error('Error deleting strategy:', error)
      return {
        success: false,
        error: 'Failed to delete strategy',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const stripeService = new StripeService()
export default stripeService
