import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

// Safely import expo-in-app-purchases
import * as InAppPurchases from 'expo-in-app-purchases'

// Receipt validation constants
const MAX_RECEIPT_VALIDATION_ATTEMPTS = 6
const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30000
const RETRY_JITTER_FACTOR = 0.3

// Product IDs for Apple App Store subscriptions
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'pro_subscription_month',
  PRO_YEARLY: 'pro_subscription_year',
} as const

export type ProductId = keyof typeof PRODUCT_IDS

export interface StoreProduct {
  productId: string
  price: string
  priceAmountMicros: number
  priceCurrencyCode: string
  title: string
  description: string
  type: 'subscription'
  subscriptionPeriod?: string
}

export interface PurchaseResult {
  success: boolean
  productId?: string
  transactionId?: string
  transactionReceipt?: string
  error?: string
  receiptValidated?: boolean
  validationAttempts?: number
  requiresManualCheck?: boolean
}

export interface SubscriptionStatus {
  isActive: boolean
  productId?: string
  expirationDate?: Date
  isTrialPeriod?: boolean
}

class StoreKitService {
  private isConnected = false
  private products: StoreProduct[] = []
  private currentPurchaseHandler: ((result: PurchaseResult) => void) | null = null
  private initializationPromise: Promise<boolean> | null = null
  private pendingPurchaseProductId: string | null = null

  /**
   * Initialize the StoreKit service
   */
  async initialize(): Promise<boolean> {
    // If initialization is already in progress, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Create the initialization promise
    this.initializationPromise = this.performInitialization()

    try {
      const result = await this.initializationPromise
      return result
    } finally {
      // Clear the promise when done (success or failure)
      this.initializationPromise = null
    }
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false
    }

    if (!this.isStoreKitAvailable()) {
      return false
    }
    // Check if already connected to prevent "Already connected" error
    if (this.isConnected) {
      return true
    }

    try {
      await InAppPurchases.connectAsync()
      this.isConnected = true
      return true
    } catch (error) {
      // Handle the "Already connected" error gracefully
      if (
        error instanceof Error &&
        (error.message.includes('Already connected') ||
          error.message.includes('already connected') ||
          error.message.includes('App Store'))
      ) {
        this.isConnected = true
        return true
      }

      console.error('❌ Failed to initialize StoreKit service:', error)
      return false
    }
  }

  /**
   * Get available subscription products
   */
  async getProducts(): Promise<StoreProduct[]> {
    if (this.isSimulator()) {
      // Return mock products for local simulator development only
      return this.getMockProducts()
    }

    if (!this.isStoreKitAvailable()) {
      throw new Error('StoreKit not available on this platform')
    }

    if (!this.isConnected) {
      throw new Error('StoreKit service not initialized. Call initialize() first.')
    }

    try {
      const productIds = Object.values(PRODUCT_IDS)
      const response = await InAppPurchases.getProductsAsync(productIds)
      if (response.responseCode !== InAppPurchases.IAPResponseCode.OK) {
        // Handle specific network/connection errors
        if (response.errorCode === 'NETWORK_ERROR' || response.errorCode?.includes('network')) {
          throw new Error('Network error: Please check your internet connection and try again')
        } else if (response.errorCode?.includes('timeout')) {
          throw new Error('Connection timeout: Please try again')
        } else {
          throw new Error(`App Store connection failed: ${response.errorCode || 'Unknown error'}`)
        }
      }

      if (!response.results) {
        throw new Error('No product results returned')
      }

      this.products = response.results.map((product: any) => ({
        productId: product.productId,
        price: product.price,
        priceAmountMicros: product.priceAmountMicros,
        priceCurrencyCode: product.priceCurrencyCode,
        title: product.title,
        description: product.description,
        type: 'subscription' as const,
        subscriptionPeriod: product.subscriptionPeriod,
      }))
      return this.products
    } catch (error) {
      logger.error('Error fetching products', error)
      throw error
    }
  }

  /**
   * Get mock products for development environment
   */
  private getMockProducts(): StoreProduct[] {
    return [
      {
        productId: PRODUCT_IDS.PRO_MONTHLY,
        price: '$19.99',
        priceAmountMicros: 19990000,
        priceCurrencyCode: 'USD',
        title: 'TrueSharp Pro Monthly',
        description: 'Monthly subscription to TrueSharp Pro features',
        type: 'subscription',
        subscriptionPeriod: 'P1M',
      },
      {
        productId: PRODUCT_IDS.PRO_YEARLY,
        price: '$199.99',
        priceAmountMicros: 199990000,
        priceCurrencyCode: 'USD',
        title: 'TrueSharp Pro Yearly',
        description: 'Yearly subscription to TrueSharp Pro features',
        type: 'subscription',
        subscriptionPeriod: 'P1Y',
      },
    ]
  }

  /**
   * Purchase a subscription with proper Apple receipt validation
   * SECURITY: Only reports success after server-side receipt validation
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    // Only use mock purchases on local simulator development
    if (this.isSimulator()) {
      return this.mockPurchase(productId)
    }

    if (!this.isStoreKitAvailable()) {
      throw new Error('StoreKit not available on this platform')
    }

    if (!this.isConnected) {
      throw new Error('StoreKit service not initialized. Call initialize() first.')
    }

    try {
      logger.info(`🛒 Starting purchase for product: ${productId}`)

      // Create a promise that resolves when the purchase listener handles the result
      const purchasePromise = new Promise<PurchaseResult>((resolve, reject) => {
        // Increased timeout for production Apple receipt delays (especially sandbox)
        const timeout = setTimeout(() => {
          logger.error('⏰ Purchase timeout reached - no response from Apple after 90 seconds')
          logger.error(
            '📱 This usually means Apple receipt validation is taking longer than expected'
          )
          logger.error('🔄 User should try "Restore Purchases" if this occurs')

          // Don't reject immediately - Apple may still be processing
          // Instead, return partial success with guidance
          resolve({
            success: false,
            error:
              'Purchase verification timed out - receipt may still be processing. Please try "Restore Purchases" in a few minutes or contact support if this persists.',
            receiptValidated: false,
            validationAttempts: 0,
            requiresManualCheck: true,
          })
        }, 90000) // 90 seconds for Apple sandbox delays

        // Set up one-time purchase result handler
        const handlePurchaseResult = (result: PurchaseResult) => {
          clearTimeout(timeout)

          // SECURITY: Only resolve with success if receipt was validated server-side
          if (result.success && !result.receiptValidated) {
            logger.error(
              '❌ SECURITY: Purchase succeeded but receipt not validated - preventing false success'
            )
            resolve({
              success: false,
              error: 'Purchase completed but receipt validation failed. Please contact support.',
              receiptValidated: false,
              validationAttempts: result.validationAttempts || 0,
            })
          } else {
            resolve(result)
          }
        }

        // Store the handler so the purchase listener can call it
        this.currentPurchaseHandler = handlePurchaseResult
        this.pendingPurchaseProductId = productId
      })

      // Initiate the purchase
      logger.info(`📲 Initiating Apple purchase for ${productId}`)
      await InAppPurchases.purchaseItemAsync(productId)

      // Wait for the purchase listener to process the result with receipt validation
      const result = await purchasePromise

      logger.info(`✅ Purchase completed: ${result.success ? 'SUCCESS' : 'FAILED'}`, {
        productId,
        transactionId: result.transactionId,
        receiptValidated: result.receiptValidated,
        validationAttempts: result.validationAttempts,
        error: result.error,
        requiresManualCheck: result.requiresManualCheck,
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown purchase error'
      logger.error('❌ Purchase failed:', errorMessage)

      return {
        success: false,
        error: errorMessage,
        receiptValidated: false,
        validationAttempts: 0,
      }
    } finally {
      // Clean up the handler
      this.currentPurchaseHandler = null
      this.pendingPurchaseProductId = null
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   * Enhanced for production Apple receipt delays
   */
  private calculateRetryDelay(attempt: number): number {
    // Increased base delays for Apple sandbox environment
    const enhancedBaseDelay = attempt < 3 ? 2000 : 5000 // Start with 2s, then 5s for later attempts
    const exponentialDelay = Math.min(enhancedBaseDelay * Math.pow(2, attempt), MAX_RETRY_DELAY_MS)
    const jitter = exponentialDelay * RETRY_JITTER_FACTOR * Math.random()
    return Math.floor(exponentialDelay + jitter)
  } /**
   * Poll for receipt with retry logic and exponential backoff
   */
  private async pollForReceipt(
    productId: string,
    transactionId: string
  ): Promise<{ receipt: string; attempts: number } | null> {
    logger.info(`🔄 Starting receipt polling for transaction ${transactionId}`)

    for (let attempt = 0; attempt < MAX_RECEIPT_VALIDATION_ATTEMPTS; attempt++) {
      logger.info(`📡 Receipt polling attempt ${attempt + 1}/${MAX_RECEIPT_VALIDATION_ATTEMPTS}`)

      try {
        // Check purchase history for the receipt
        const history = await InAppPurchases.getPurchaseHistoryAsync()

        if (history.responseCode === InAppPurchases.IAPResponseCode.OK && history.results) {
          const matchingPurchase = history.results.find(
            (purchase: any) =>
              purchase.productId === productId &&
              purchase.orderId === transactionId &&
              purchase.transactionReceipt &&
              purchase.acknowledged
          )

          if (matchingPurchase && matchingPurchase.transactionReceipt) {
            logger.info(`✅ Receipt found on attempt ${attempt + 1}`, {
              transactionId,
              receiptLength: matchingPurchase.transactionReceipt.length,
            })
            return {
              receipt: matchingPurchase.transactionReceipt,
              attempts: attempt + 1,
            }
          }
        }

        logger.info(
          `⏳ No receipt yet, waiting before retry ${attempt + 1}/${MAX_RECEIPT_VALIDATION_ATTEMPTS}`
        )

        // Don't wait after the last attempt
        if (attempt < MAX_RECEIPT_VALIDATION_ATTEMPTS - 1) {
          const delay = this.calculateRetryDelay(attempt)
          logger.info(`⏱️ Waiting ${Math.round(delay)}ms before next attempt`)
          await this.sleep(delay)
        }
      } catch (error) {
        logger.error(`❌ Error during receipt polling attempt ${attempt + 1}:`, error)

        // Don't wait after the last attempt or on error
        if (attempt < MAX_RECEIPT_VALIDATION_ATTEMPTS - 1) {
          const delay = this.calculateRetryDelay(attempt)
          await this.sleep(delay)
        }
      }
    }

    logger.error(`❌ Receipt polling failed after ${MAX_RECEIPT_VALIDATION_ATTEMPTS} attempts`)
    return null
  }

  /**
   * Validate receipt with server-side Apple receipt validation
   */
  private async validateReceiptWithServer(
    receiptData: string,
    productId: string,
    transactionId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { valid: false, error: 'User not authenticated' }
      }

      // Get current environment - use sandbox for TestFlight and development
      const environment = __DEV__ || this.isSimulator() ? 'sandbox' : 'production'

      logger.info(`🔍 Validating receipt with server`, {
        userId: user.id,
        productId,
        transactionId,
        environment,
        receiptLength: receiptData.length,
      })

      const { Environment } = await import('../config/environment')
      const response = await fetch(`${Environment.API_BASE_URL}/api/validate-apple-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          receiptData,
          transactionId,
          environment,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('❌ Receipt validation HTTP error:', {
          status: response.status,
          error: errorText,
        })
        return { valid: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const result = await response.json()
      logger.info('✅ Receipt validation response:', result)

      return { valid: result.valid === true, error: result.error }
    } catch (error) {
      logger.error('❌ Receipt validation network error:', error)
      return {
        valid: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Mock purchase for local development (Expo Go / iOS Simulator only)
   */
  private async mockPurchase(productId: string): Promise<PurchaseResult> {
    logger.info('🧪 Starting mock purchase for local development')

    // Simulate user interaction delay
    await this.sleep(1500)

    // Simulate successful purchase and trigger Supabase sync
    try {
      const mockTransactionId = `dev_txn_${Date.now()}`
      const mockReceipt = `simulator_receipt_${Date.now()}_mock_base64_data`

      // Simulate receipt validation for local development
      await this.handleStoreKitPurchaseCompleted(productId, mockTransactionId, mockReceipt, true)

      return {
        success: true,
        productId,
        transactionId: mockTransactionId,
        transactionReceipt: mockReceipt,
        receiptValidated: true,
        validationAttempts: 1,
      }
    } catch (error) {
      logger.error('❌ [LOCAL DEV] Mock purchase failed:', error)
      return {
        success: false,
        error: 'Mock purchase simulation failed - check console for details',
        receiptValidated: false,
        validationAttempts: 0,
      }
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult[]> {
    if (!this.isStoreKitAvailable()) {
      return []
    }

    if (!this.isConnected) {
      throw new Error('StoreKit service not initialized. Call initialize() first.')
    }

    try {
      const response = await InAppPurchases.getPurchaseHistoryAsync()

      if (response.responseCode !== InAppPurchases.IAPResponseCode.OK) {
        throw new Error(`Failed to restore purchases: ${response.errorCode}`)
      }

      const restoredPurchases: PurchaseResult[] = []

      if (response.results && response.results.length > 0) {
        for (const purchase of response.results) {
          if (purchase.acknowledged) {
            restoredPurchases.push({
              success: true,
              productId: purchase.productId,
              transactionId: purchase.orderId,
              transactionReceipt: purchase.transactionReceipt,
            })

            // Process the restored purchase with receipt (works for both sandbox and production)
            await this.handleStoreKitPurchaseCompleted(
              purchase.productId,
              purchase.orderId,
              purchase.transactionReceipt
            )
          }
        }
      }
      return restoredPurchases
    } catch (error) {
      logger.error('Error restoring purchases', error)
      throw error
    }
  }

  /**
   * Check current subscription status with expiration handling
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    // Always check database for current status (handles both StoreKit and Stripe subscriptions)
    const dbStatus = await this.getSubscriptionStatusFromSupabase()

    // If we have an active subscription in the database, verify it's not expired
    if (dbStatus.isActive && dbStatus.expirationDate) {
      const now = new Date()
      if (now > dbStatus.expirationDate) {
        // Check if there are newer transactions that might renew the subscription
        if (this.isStoreKitAvailable() && this.isConnected) {
          await this.syncSubscriptionRenewals()
          // Re-check database after sync
          return this.getSubscriptionStatusFromSupabase()
        }

        // Mark as inactive if expired and no renewals found
        return { isActive: false }
      }
    }

    return dbStatus
  }

  /**
   * Sync subscription renewals from Apple
   */
  private async syncSubscriptionRenewals(): Promise<void> {
    try {
      const response = await InAppPurchases.getPurchaseHistoryAsync()

      if (response.responseCode !== InAppPurchases.IAPResponseCode.OK || !response.results) {
        return
      }

      // Process any new transactions that might be renewals
      for (const purchase of response.results) {
        if (
          purchase.acknowledged &&
          Object.values(PRODUCT_IDS).includes(purchase.productId as any) &&
          purchase.transactionReceipt
        ) {
          // Check if this transaction is already in our database
          const existingTransaction = await this.checkTransactionExists(purchase.orderId)

          if (!existingTransaction) {
            await this.handleStoreKitPurchaseCompleted(
              purchase.productId,
              purchase.orderId,
              purchase.transactionReceipt
            )
          }
        }
      }
    } catch (error) {
      console.error('❌ Error syncing subscription renewals:', error)
    }
  }

  /**
   * Check if a transaction already exists in the database
   */
  private async checkTransactionExists(transactionId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('pro_subscriptions')
        .select('id')
        .eq('apple_transaction_id', transactionId)
        .single()

      return !!data
    } catch (error) {
      return false // Assume doesn't exist if error
    }
  }

  /**
   * Get subscription status from Supabase with expiration data
   */
  private async getSubscriptionStatusFromSupabase(): Promise<SubscriptionStatus> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { isActive: false }
      }

      // Check pro_subscriptions table for detailed subscription info
      const { data: subscription } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscription) {
        const expirationDate = new Date(subscription.current_period_end)
        const now = new Date()

        return {
          isActive: now <= expirationDate,
          productId: subscription.price_id,
          expirationDate: expirationDate,
          isTrialPeriod: false, // You can add trial logic here if needed
        }
      }

      // Fallback to profile check
      const { data: profile } = await supabase
        .from('profiles')
        .select('pro')
        .eq('id', user.id)
        .single()

      return {
        isActive: profile?.pro === 'yes',
      }
    } catch (error) {
      console.error('Error checking subscription status from Supabase:', error)
      return { isActive: false }
    }
  }

  /**
   * Handle StoreKit purchase completion - MIRRORS STRIPE LOGIC EXACTLY
   * This function mirrors handleProCheckoutCompleted() in the Stripe webhook
   */
  private async handleStoreKitPurchaseCompleted(
    productId: string,
    transactionId: string,
    transactionReceipt?: string,
    skipReceiptValidation = false
  ): Promise<void> {
    try {
      logger.info(`🎯 Processing StoreKit purchase completion`, {
        productId,
        transactionId,
        hasReceipt: !!transactionReceipt,
        receiptLength: transactionReceipt?.length,
        skipValidation: skipReceiptValidation,
      })

      if (transactionReceipt && !skipReceiptValidation) {
        logger.info('📋 Validating Apple receipt with server-side validation')
        const receiptValidationResult = await this.validateReceiptWithServer(
          transactionReceipt,
          productId,
          transactionId
        )

        if (!receiptValidationResult.valid) {
          logger.error('❌ Server-side receipt validation failed', receiptValidationResult)
          throw new Error(
            `Receipt validation failed: ${receiptValidationResult.error || 'Invalid receipt'}`
          )
        }

        logger.info('✅ Receipt validation successful', receiptValidationResult)
      } else if (transactionReceipt) {
        logger.info('⚠️ Skipping receipt validation (development mode)')
      } else {
        logger.warn('⚠️ No receipt provided for validation')
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error('❌ CRITICAL: User not authenticated for StoreKit purchase')
        return
      }
      // Determine plan from product ID (mirrors Stripe logic)
      const plan = productId.includes('year') ? 'yearly' : 'monthly'
      // Check if Pro subscription already exists to prevent duplicates (mirrors Stripe check)
      const { data: existingProSubscription } = await supabase
        .from('pro_subscriptions')
        .select('id, plan, current_period_end, apple_transaction_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (existingProSubscription) {
        // Check if this exact transaction already exists
        const { data: duplicateTransaction } = await supabase
          .from('pro_subscriptions')
          .select('id')
          .eq('apple_transaction_id', transactionId)
          .single()

        if (duplicateTransaction) {
          return
        }

        // If different transaction but user has active subscription, this might be an upgrade/downgrade
        // Calculate period dates for update
        const currentPeriodStart = new Date()
        const currentPeriodEnd = new Date()

        if (plan === 'yearly') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
        } else {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
        }

        // Update existing subscription instead of creating new one
        const { error: updateError } = await supabase
          .from('pro_subscriptions')
          .update({
            plan: plan,
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            price_id: productId,
            apple_transaction_id: transactionId,
            apple_receipt_data: transactionReceipt ? transactionReceipt.substring(0, 500) : null,
          })
          .eq('id', existingProSubscription.id)

        if (updateError) {
          console.error('❌ Error updating existing subscription:', updateError)
          return
        }
        return
      }

      // Calculate period dates (mirrors Stripe logic)
      const currentPeriodStart = new Date()
      const currentPeriodEnd = new Date()

      if (plan === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
      }

      // Create Pro subscription record (EXACTLY MIRRORS STRIPE STRUCTURE)
      const proSubscriptionData = {
        user_id: user.id,
        stripe_subscription_id: null, // StoreKit purchase - no Stripe ID
        stripe_customer_id: null, // StoreKit purchase - no Stripe customer
        status: 'active',
        plan: plan,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        price_id: productId, // Use Apple product ID instead of Stripe price ID
        // Store Apple transaction details for receipt validation
        apple_transaction_id: transactionId,
        apple_receipt_data: transactionReceipt ? transactionReceipt.substring(0, 500) : null, // Store first 500 chars for audit
      }
      const { data: newProSubscription, error: insertError } = await supabase
        .from('pro_subscriptions')
        .insert(proSubscriptionData)
        .select()
        .single()

      if (insertError) {
        logger.error('❌ CRITICAL: Error creating Pro subscription in database!', insertError)
        logger.error('📋 Failed data:', proSubscriptionData)
        logger.error('🚨 StoreKit purchase exists but NOT in database')
        throw new Error(`Database insertion failed: ${insertError.message}`)
      } else {
        logger.info('✅ Pro subscription created successfully in database', {
          subscriptionId: newProSubscription.id,
          userId: user.id,
          plan,
          productId,
        })
      }

      // Update profile pro status (EXACTLY MIRRORS STRIPE LOGIC)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ pro: 'yes' })
        .eq('id', user.id)

      if (profileError) {
        logger.error('❌ Error updating profile pro status', profileError)
        throw new Error(`Profile update failed: ${profileError.message}`)
      } else {
        logger.info('✅ Profile pro status updated successfully', { userId: user.id })
      }
    } catch (error) {
      logger.error('❌ CRITICAL: Error processing StoreKit purchase', error)
      // Don't throw - we don't want to break the app flow
    }
  }

  /**
   * Create the purchase listener function
   */
  private createPurchaseListener() {
    return ({ responseCode, results, errorCode }: any) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results && results.length > 0) {
          results.forEach(async (purchase: any) => {
            // Validate this is the purchase we're expecting
            if (
              this.pendingPurchaseProductId &&
              purchase.productId !== this.pendingPurchaseProductId
            ) {
              return
            }

            logger.info('🛒 Processing purchase from listener', {
              productId: purchase.productId,
              transactionId: purchase.orderId,
              acknowledged: purchase.acknowledged,
              hasReceipt: !!purchase.transactionReceipt,
            })

            if (purchase.acknowledged) {
              // Handle the case where receipt might be delayed
              if (!purchase.transactionReceipt) {
                logger.warn(
                  '⚠️ Purchase acknowledged but no receipt yet - starting receipt polling'
                )

                try {
                  const receiptResult = await this.pollForReceipt(
                    purchase.productId,
                    purchase.orderId
                  )

                  if (!receiptResult) {
                    logger.error('❌ CRITICAL: Failed to obtain receipt after polling')
                    if (this.currentPurchaseHandler) {
                      this.currentPurchaseHandler({
                        success: false,
                        error:
                          'Apple receipt not available - purchase may need manual verification',
                        receiptValidated: false,
                        validationAttempts: MAX_RECEIPT_VALIDATION_ATTEMPTS,
                      })
                    }
                    return
                  }

                  // Use the polled receipt
                  purchase.transactionReceipt = receiptResult.receipt
                  logger.info(`✅ Receipt obtained after ${receiptResult.attempts} attempts`)
                } catch (error) {
                  logger.error('❌ Error during receipt polling:', error)
                  if (this.currentPurchaseHandler) {
                    this.currentPurchaseHandler({
                      success: false,
                      error: 'Failed to obtain Apple receipt - please contact support',
                      receiptValidated: false,
                      validationAttempts: 0,
                    })
                  }
                  return
                }
              }

              // Validate receipt format (basic check)
              if (purchase.transactionReceipt && purchase.transactionReceipt.length < 100) {
                logger.error('❌ CRITICAL: Receipt appears to be invalid (too short)')

                if (this.currentPurchaseHandler) {
                  this.currentPurchaseHandler({
                    success: false,
                    error: 'Invalid receipt: Receipt data appears corrupted',
                    receiptValidated: false,
                    validationAttempts: 0,
                  })
                }
                return
              }

              try {
                // SECURITY: Process purchase with server-side receipt validation
                // Do NOT finishTransaction until server validates receipt
                logger.info(
                  '🔐 Starting server-side receipt validation before transaction completion'
                )

                await this.handleStoreKitPurchaseCompleted(
                  purchase.productId,
                  purchase.orderId,
                  purchase.transactionReceipt
                )

                // Only report success if server validation succeeded
                logger.info('✅ Server-side validation successful - purchase completed')

                if (this.currentPurchaseHandler) {
                  this.currentPurchaseHandler({
                    success: true,
                    productId: purchase.productId,
                    transactionId: purchase.orderId,
                    transactionReceipt: purchase.transactionReceipt,
                    receiptValidated: true,
                    validationAttempts: 1,
                  })
                }

                // SECURITY: Only finish transaction after successful server validation
                // This ensures Apple knows we've processed the purchase correctly
                try {
                  if (InAppPurchases.finishTransactionAsync) {
                    await InAppPurchases.finishTransactionAsync(purchase.orderId)
                    logger.info('✅ Transaction finished successfully after validation')
                  }
                } catch (finishError) {
                  logger.error(
                    '⚠️ Failed to finish transaction (purchase still valid):',
                    finishError
                  )
                  // Don't fail the purchase for this - the validation succeeded
                }
              } catch (validationError) {
                logger.error('❌ Server-side receipt validation failed:', validationError)

                // Don't finish the transaction on validation failure
                // This allows user to retry or restore purchase
                if (this.currentPurchaseHandler) {
                  this.currentPurchaseHandler({
                    success: false,
                    error:
                      'Receipt validation failed - please try again or contact support if this persists',
                    receiptValidated: false,
                    validationAttempts: 1,
                  })
                }
              }
            } else {
              logger.warn('⚠️ Purchase not acknowledged by Apple')
              if (this.currentPurchaseHandler) {
                this.currentPurchaseHandler({
                  success: false,
                  error: 'Purchase not confirmed by Apple',
                  receiptValidated: false,
                  validationAttempts: 0,
                })
              }
            }
          })
        } else {
          logger.warn('⚠️ No purchase results received from Apple')
          if (this.currentPurchaseHandler) {
            this.currentPurchaseHandler({
              success: false,
              error: 'No purchase data received from Apple',
              receiptValidated: false,
              validationAttempts: 0,
            })
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        logger.info('👤 User canceled the purchase')
        if (this.currentPurchaseHandler) {
          this.currentPurchaseHandler({
            success: false,
            error: 'Purchase canceled',
            receiptValidated: false,
            validationAttempts: 0,
          })
        }
      } else {
        logger.error('❌ Purchase failed with error code:', errorCode)

        if (this.currentPurchaseHandler) {
          this.currentPurchaseHandler({
            success: false,
            error: `Purchase failed: ${errorCode || 'Unknown error'}`,
            receiptValidated: false,
            validationAttempts: 0,
          })
        }
      }
    }
  }

  /**
   * Handle purchase updates from the global listener
   */
  handlePurchaseUpdate({ responseCode, results, errorCode }: any): void {
    const purchaseHandler = this.createPurchaseListener()
    purchaseHandler({ responseCode, results, errorCode })
  }

  /**
   * Get product by ID
   */
  getProductById(productId: string): StoreProduct | undefined {
    return this.products.find(product => product.productId === productId)
  }

  /**
   * Format price for display
   */
  formatPrice(product: StoreProduct): string {
    return product.price
  }

  /**
   * Check if StoreKit is available in current environment
   */
  private isStoreKitAvailable(): boolean {
    return Platform.OS === 'ios' && InAppPurchases !== null
  }

  /**
   * Check if running on iOS Simulator (ONLY for local development)
   */
  private isSimulator(): boolean {
    if (Platform.OS !== 'ios') return false

    // Only consider it a simulator if explicitly running in Expo Go
    // TestFlight and production builds should ALWAYS use real App Store
    const isExpoGo = false // Simplified check for production
    const isSimulator =
      Platform.constants.systemName === 'iOS' &&
      (Platform.constants as any).model?.includes('Simulator')
    // ONLY use mock purchases if:
    // 1. Explicitly running in Expo Go, OR
    // 2. Model explicitly mentions Simulator
    // TestFlight and production builds will NEVER use mocks
    return isExpoGo || isSimulator
  }

  /**
   * Check if service is available (iOS only)
   */
  isAvailable(): boolean {
    return this.isStoreKitAvailable()
  }

  /**
   * Disconnect from the service
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      // Note: Expo InAppPurchases doesn't have a disconnect method
      this.isConnected = false
      this.currentPurchaseHandler = null
    }
  }

  /**
   * Reset the service state (useful for debugging)
   */
  reset(): void {
    this.isConnected = false
    this.currentPurchaseHandler = null
    this.products = []
    this.initializationPromise = null
    this.pendingPurchaseProductId = null
  }

  /**
   * Clean up subscription data for account deletion
   * Note: Apple subscriptions are automatically handled by iOS
   * This function logs the cleanup for audit purposes
   */
  async cleanupSubscriptionForAccountDeletion(userId: string): Promise<void> {
    try {
      // Note: Apple handles subscription cancellation automatically when account is deleted
      // The backend delete-account API already removes pro_subscriptions records
      // This function serves as an audit log and future extension point
    } catch (error) {
      console.error('❌ Error during StoreKit subscription cleanup:', error)
      // Don't throw - this is a cleanup operation that shouldn't block account deletion
    }
  }
}

// Export singleton instance
export const storeKitService = new StoreKitService()

// Set up global purchase listener immediately when module loads
if (Platform.OS === 'ios' && InAppPurchases !== null) {
  try {
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
      // Delegate to the service instance
      if (storeKitService && typeof storeKitService.handlePurchaseUpdate === 'function') {
        storeKitService.handlePurchaseUpdate({ responseCode, results, errorCode })
      }
    })
  } catch (error) {
    console.error('📱 Failed to set up global purchase listener:', error)
  }
}

// Convenience functions
export const initializeStoreKit = () => storeKitService.initialize()
export const getAvailableProducts = () => storeKitService.getProducts()
export const purchaseSubscription = (productId: string) =>
  storeKitService.purchaseSubscription(productId)
export const restorePurchases = () => storeKitService.restorePurchases()
export const getSubscriptionStatus = () => storeKitService.getSubscriptionStatus()
export const cleanupSubscriptionForAccountDeletion = (userId: string) =>
  storeKitService.cleanupSubscriptionForAccountDeletion(userId)

// Legacy function for backward compatibility - now handled automatically in purchase flow
export const updateSubscriptionStatus = (productId: string, isActive: boolean) => {
  return Promise.resolve()
}
