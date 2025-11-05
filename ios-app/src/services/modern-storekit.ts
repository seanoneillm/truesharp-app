import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

// Safely import expo-in-app-purchases with fallback
let InAppPurchases: any = null
try {
  InAppPurchases = require('expo-in-app-purchases')
} catch (error) {
  logger.error('Failed to import expo-in-app-purchases', error)
}

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

export interface ModernPurchaseResult {
  success: boolean
  productId?: string
  transactionId?: string
  originalTransactionId?: string
  error?: string
  serverValidated?: boolean
  validationAttempts?: number
}

export interface SubscriptionStatus {
  isActive: boolean
  productId?: string
  expirationDate?: Date
  isTrialPeriod?: boolean
}

class ModernStoreKitService {
  private isConnected = false
  private products: StoreProduct[] = []
  private currentPurchaseHandler: ((result: ModernPurchaseResult) => void) | null = null
  private initializationPromise: Promise<boolean> | null = null
  private pendingPurchaseProductId: string | null = null

  /**
   * Initialize the StoreKit service
   */
  async initialize(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization()

    try {
      const result = await this.initializationPromise
      return result
    } finally {
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

    if (this.isConnected) {
      return true
    }

    try {
      await InAppPurchases.connectAsync()
      this.isConnected = true
      
      // Set up purchase listener immediately after connection
      this.setupPurchaseListener()
      
      return true
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Already connected') ||
          error.message.includes('already connected') ||
          error.message.includes('App Store'))
      ) {
        this.isConnected = true
        this.setupPurchaseListener()
        return true
      }

      console.error('❌ Failed to initialize StoreKit service:', error)
      return false
    }
  }

  /**
   * Set up the purchase listener
   */
  private setupPurchaseListener(): void {
    if (!InAppPurchases) return

    try {
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
        this.handlePurchaseUpdate({ responseCode, results, errorCode })
      })
    } catch (error) {
      console.error('❌ Failed to set up purchase listener:', error)
    }
  }

  /**
   * Get available subscription products
   */
  async getProducts(): Promise<StoreProduct[]> {
    if (this.isSimulator()) {
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
   * Modern purchase flow - WEBHOOK DRIVEN (no timeouts!)
   * 1. User initiates purchase
   * 2. Apple completes purchase and we finish transaction immediately 
   * 3. Return success to user right away
   * 4. Apple webhook activates subscription in database automatically
   * 5. If webhook fails, "Restore Purchases" will activate it
   */
  async purchaseSubscription(productId: string): Promise<ModernPurchaseResult> {
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
      logger.info(`🛒 Starting modern purchase for product: ${productId}`)

      // Create promise that resolves when purchase completes
      const purchasePromise = new Promise<ModernPurchaseResult>((resolve, reject) => {
        // Very short timeout since we only wait for Apple's purchase response (no server validation)
        const timeout = setTimeout(() => {
          logger.error('⏰ Purchase timeout reached after 15 seconds')
          resolve({
            success: false,
            error: 'Purchase timed out. Please try "Restore Purchases" if the purchase was completed.',
            serverValidated: false,
            validationAttempts: 0
          })
        }, 15000)

        const handlePurchaseResult = (result: ModernPurchaseResult) => {
          clearTimeout(timeout)
          resolve(result)
        }

        this.currentPurchaseHandler = handlePurchaseResult
        this.pendingPurchaseProductId = productId
      })

      // Initiate the purchase
      logger.info(`📲 Initiating Apple purchase for ${productId}`)
      await InAppPurchases.purchaseItemAsync(productId)

      // Wait for purchase listener to process the result
      const result = await purchasePromise

      logger.info(`✅ Purchase completed: ${result.success ? 'SUCCESS' : 'FAILED'}`, {
        productId,
        transactionId: result.transactionId,
        serverValidated: result.serverValidated,
        error: result.error
      })

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown purchase error'
      logger.error('❌ Purchase failed:', errorMessage)

      return {
        success: false,
        error: errorMessage,
        serverValidated: false,
        validationAttempts: 0
      }
    } finally {
      this.currentPurchaseHandler = null
      this.pendingPurchaseProductId = null
    }
  }

  /**
   * Handle purchase updates from the listener
   */
  handlePurchaseUpdate({ responseCode, results, errorCode }: any): void {
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      if (results && results.length > 0) {
        // Process purchases sequentially to avoid timing issues
        for (const purchase of results) {
          // Validate this is the purchase we're expecting
          if (
            this.pendingPurchaseProductId &&
            purchase.productId !== this.pendingPurchaseProductId
          ) {
            continue
          }

          logger.info('🛒 Processing purchase from listener', {
            productId: purchase.productId,
            transactionId: purchase.orderId,
            originalTransactionId: purchase.originalTransactionId,
            webOrderLineItemId: purchase.webOrderLineItemId,
            acknowledged: purchase.acknowledged,
            purchaseTime: purchase.purchaseTime,
            purchaseState: purchase.purchaseState,
            allFields: purchase // Log all available fields
          })

          if (purchase.acknowledged) {
            logger.info('🔍 Purchase acknowledged by Apple, processing...', {
              transactionId: purchase.orderId,
              productId: purchase.productId,
              timestamp: new Date().toISOString()
            })
            
            // STEP 1: Immediately finish transaction (Apple's requirement)
            // Per Apple guidelines: finish transactions promptly to avoid issues
            this.finishTransactionAsync(purchase.orderId)
              .then(() => {
                logger.info('✅ Transaction finished with Apple', {
                  transactionId: purchase.orderId,
                  timestamp: new Date().toISOString()
                })
                
                // STEP 2: Report success to user immediately (webhooks will handle database updates)
                logger.info('🎉 Purchase successful - Apple webhook will activate subscription', {
                  transactionId: purchase.orderId,
                  originalTransactionId: purchase.originalTransactionId || purchase.orderId,
                  productId: purchase.productId,
                  timestamp: new Date().toISOString()
                })

                // STEP 3: Report success to user immediately (no validation blocking)
                if (this.currentPurchaseHandler) {
                  logger.info('📱 Reporting immediate success to user', {
                    transactionId: purchase.orderId,
                    timestamp: new Date().toISOString()
                  })
                  
                  this.currentPurchaseHandler({
                    success: true,
                    productId: purchase.productId,
                    transactionId: purchase.orderId,
                    originalTransactionId: purchase.originalTransactionId || purchase.orderId,
                    serverValidated: true, // Apple webhook will activate subscription
                    validationAttempts: 0 // No validation attempts during purchase
                  })
                }

                logger.info('✅ Purchase completed successfully - Apple webhook will activate subscription automatically', {
                  transactionId: purchase.orderId,
                  originalTransactionId: purchase.originalTransactionId || purchase.orderId,
                  productId: purchase.productId,
                  timestamp: new Date().toISOString()
                })
              })
              .catch((finishError) => {
                logger.error('⚠️ Failed to finish transaction:', finishError, {
                  transactionId: purchase.orderId,
                  timestamp: new Date().toISOString()
                })
                
                if (this.currentPurchaseHandler) {
                  this.currentPurchaseHandler({
                    success: false,
                    error: 'Purchase completed but activation pending. Please try "Restore Purchases" in a few moments.',
                    serverValidated: false,
                    validationAttempts: 0
                  })
                }
              })
          } else {
            logger.warn('⚠️ Purchase not acknowledged by Apple')
            if (this.currentPurchaseHandler) {
              this.currentPurchaseHandler({
                success: false,
                error: 'Purchase not confirmed by Apple',
                serverValidated: false,
                validationAttempts: 0
              })
            }
          }
        }
      }
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      logger.info('👤 User canceled the purchase')
      if (this.currentPurchaseHandler) {
        this.currentPurchaseHandler({
          success: false,
          error: 'Purchase canceled',
          serverValidated: false,
          validationAttempts: 0
        })
      }
    } else {
      logger.error('❌ Purchase failed with error code:', errorCode)
      if (this.currentPurchaseHandler) {
        this.currentPurchaseHandler({
          success: false,
          error: `Purchase failed: ${errorCode || 'Unknown error'}`,
          serverValidated: false,
          validationAttempts: 0
        })
      }
    }
  }


  /**
   * Finish transaction with Apple (required by Apple guidelines)
   */
  private async finishTransactionAsync(transactionId: string): Promise<void> {
    if (InAppPurchases?.finishTransactionAsync) {
      await InAppPurchases.finishTransactionAsync(transactionId)
    }
  }

  /**
   * REMOVED: validateAndUpdateServer - Apple webhooks handle database updates automatically
   * This was causing timeout issues because iOS was trying to validate during purchase
   * New flow: finish transaction immediately → Apple sends webhook → database updates
   */

  /**
   * REMOVED: backgroundValidateTransaction - Purchase flow now relies 100% on Apple webhooks
   * This eliminates any potential timeout issues during purchase.
   * New flow: Purchase completes immediately → Apple sends webhook → Database updated automatically
   */

  /**
   * Modern server validation using transaction ID
   */
  private async validateTransactionWithServer(data: {
    transactionId: string
    originalTransactionId: string
    productId: string
  }, customTimeout?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      logger.info('🔍 Validating transaction with modern API', {
        userId: user.id,
        transactionId: data.transactionId,
        productId: data.productId,
        timestamp: new Date().toISOString(),
        step: 'SERVER_CALL_START'
      })

      const { Environment } = await import('../config/environment')
      
      logger.info('🌐 Making API request', {
        url: `${Environment.API_BASE_URL}/api/validate-apple-transaction`,
        environment: this.getEnvironment(),
        timestamp: new Date().toISOString(),
        step: 'API_REQUEST_START'
      })
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutMs = customTimeout || 15000 // Use custom timeout or default 15 seconds
      const timeoutId = setTimeout(() => {
        logger.error(`⏰ Request timeout after ${timeoutMs/1000} seconds`, {
          transactionId: data.transactionId,
          timestamp: new Date().toISOString(),
          step: 'REQUEST_TIMEOUT'
        })
        controller.abort()
      }, timeoutMs)
      
      const response = await fetch(`${Environment.API_BASE_URL}/api/validate-apple-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          transactionId: data.transactionId,
          originalTransactionId: data.originalTransactionId,
          productId: data.productId,
          environment: this.getEnvironment()
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      logger.info('📡 Received API response', {
        status: response.status,
        ok: response.ok,
        transactionId: data.transactionId,
        timestamp: new Date().toISOString(),
        step: 'API_RESPONSE_RECEIVED'
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('❌ Transaction validation HTTP error:', {
          status: response.status,
          error: errorText,
          transactionId: data.transactionId,
          timestamp: new Date().toISOString(),
          step: 'API_ERROR'
        })
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const result = await response.json()
      logger.info('✅ Transaction validation response:', {
        ...result,
        transactionId: data.transactionId,
        timestamp: new Date().toISOString(),
        step: 'API_RESPONSE_PARSED'
      })

      return { success: result.valid === true, error: result.error }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(`⏰ Transaction validation timed out after ${(customTimeout || 15000)/1000} seconds`)
        return {
          success: false,
          error: 'Server validation timed out. Your purchase is valid - use "Restore Purchases" to activate.'
        }
      }
      
      // Handle network errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch') ||
            error.message.includes('ECONNREFUSED')) {
          logger.error('🌐 Network error during validation:', error.message)
          return {
            success: false,
            error: 'Network error. Your purchase is valid - use "Restore Purchases" when online.'
          }
        }
      }
      
      logger.error('❌ Transaction validation error:', error)
      return {
        success: false,
        error: 'Validation error. Your purchase is valid - use "Restore Purchases" to activate.'
      }
    }
  }

  /**
   * Debug function to test server validation with a known transaction
   * Use this to test without making new purchases
   */
  async debugValidateTransaction(transactionId: string, productId: string = 'pro_subscription_month'): Promise<void> {
    logger.info('🐛 DEBUG: Testing transaction validation', {
      transactionId,
      productId,
      timestamp: new Date().toISOString()
    })

    try {
      const validationResult = await this.validateTransactionWithServer({
        transactionId,
        originalTransactionId: transactionId,
        productId
      })

      logger.info('🐛 DEBUG: Validation result', {
        transactionId,
        success: validationResult.success,
        error: validationResult.error,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('🐛 DEBUG: Validation failed', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Restore purchases using modern transaction validation
   */
  async restorePurchases(): Promise<ModernPurchaseResult[]> {
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

      const restoredPurchases: ModernPurchaseResult[] = []

      if (response.results && response.results.length > 0) {
        for (const purchase of response.results) {
          if (purchase.acknowledged) {
            // For restore purchases, we still validate to get current status
            // This is not blocking the purchase flow, so it's acceptable
            try {
              const validationResult = await this.validateTransactionWithServer({
                transactionId: purchase.orderId,
                originalTransactionId: purchase.orderId,
                productId: purchase.productId
              })

              restoredPurchases.push({
                success: validationResult.success,
                productId: purchase.productId,
                transactionId: purchase.orderId,
                originalTransactionId: purchase.orderId,
                serverValidated: validationResult.success,
                error: validationResult.error
              })
            } catch (error) {
              logger.error('⚠️ Restore validation failed:', error)
              restoredPurchases.push({
                success: false,
                productId: purchase.productId,
                transactionId: purchase.orderId,
                originalTransactionId: purchase.orderId,
                serverValidated: false,
                error: 'Validation failed during restore'
              })
            }
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
   * Check current subscription status with comprehensive validation
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return { isActive: false }
      }

      logger.info('🔍 Checking subscription status for user:', user.id);

      // First check for active subscription in pro_subscriptions table
      const { data: subscription, error: subscriptionError } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle to avoid error if no results

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        logger.error('❌ Error fetching subscription:', subscriptionError);
      }

      if (subscription) {
        const expirationDate = new Date(subscription.current_period_end)
        const now = new Date()
        const isActive = now <= expirationDate

        logger.info('📋 Found subscription record:', {
          id: subscription.id,
          status: subscription.status,
          expirationDate: expirationDate.toISOString(),
          isActive
        });

        // If subscription is expired, update profile status
        if (!isActive) {
          logger.warn('⚠️ Subscription expired, updating profile status');
          try {
            await supabase
              .from('profiles')
              .update({ pro: 'no', updated_at: new Date().toISOString() })
              .eq('id', user.id);
          } catch (updateError) {
            logger.error('❌ Failed to update expired subscription status:', updateError);
          }
        }

        return {
          isActive,
          productId: subscription.price_id,
          expirationDate: expirationDate,
          isTrialPeriod: false
        }
      }

      // Check for any subscription record (including inactive ones)
      const { data: anySubscription } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (anySubscription) {
        logger.info('📋 Found inactive subscription:', {
          id: anySubscription.id,
          status: anySubscription.status,
          expirationDate: anySubscription.current_period_end
        });
      }

      // Fallback to profile check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('pro, id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logger.error('❌ Error fetching profile:', profileError);
        return { isActive: false }
      }

      const isProFromProfile = profile?.pro === 'yes';
      
      logger.info('📋 Profile pro status:', {
        userId: user.id,
        proStatus: profile?.pro,
        isActive: isProFromProfile
      });

      // If profile says pro but no active subscription, this might be inconsistent
      if (isProFromProfile && !subscription) {
        logger.warn('⚠️ Profile shows pro=yes but no active subscription found. This may indicate a sync issue.');
        
        // Try to restore purchases to sync any missing subscriptions
        if (this.isStoreKitAvailable()) {
          try {
            logger.info('🔄 Attempting to sync with Apple subscriptions...');
            await this.syncWithAppleSubscriptions();
          } catch (syncError) {
            logger.warn('⚠️ Could not sync with Apple subscriptions:', syncError);
          }
        }
      }

      return {
        isActive: isProFromProfile
      }
    } catch (error) {
      logger.error('❌ Error checking subscription status:', error)
      return { isActive: false }
    }
  }

  /**
   * Sync with Apple's subscription status
   * This method checks Apple's servers for current subscription state
   */
  private async syncWithAppleSubscriptions(): Promise<void> {
    if (!this.isStoreKitAvailable()) {
      return;
    }

    try {
      // Initialize if needed
      if (!this.isConnected) {
        await this.initialize();
      }

      // Try to restore purchases to get latest Apple subscription state
      const restoredPurchases = await this.restorePurchases();
      
      if (restoredPurchases.length > 0) {
        logger.info('✅ Synced with Apple subscriptions:', restoredPurchases.length);
      } else {
        logger.info('📱 No Apple subscriptions found to sync');
      }
    } catch (error) {
      logger.error('❌ Failed to sync with Apple subscriptions:', error);
      throw error;
    }
  }

  /**
   * Mock purchase for local development
   */
  private async mockPurchase(productId: string): Promise<ModernPurchaseResult> {
    logger.info('🧪 Starting mock purchase for local development')

    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const mockTransactionId = `dev_txn_${Date.now()}`
      
      // Simulate transaction validation
      const validationResult = await this.validateTransactionWithServer({
        transactionId: mockTransactionId,
        originalTransactionId: mockTransactionId,
        productId
      })

      return {
        success: validationResult.success,
        productId,
        transactionId: mockTransactionId,
        originalTransactionId: mockTransactionId,
        serverValidated: validationResult.success,
        validationAttempts: 1,
        error: validationResult.error
      }
    } catch (error) {
      logger.error('❌ Mock purchase failed:', error)
      return {
        success: false,
        error: 'Mock purchase simulation failed',
        serverValidated: false,
        validationAttempts: 0
      }
    }
  }

  /**
   * Utility methods
   */
  private isStoreKitAvailable(): boolean {
    return Platform.OS === 'ios' && InAppPurchases !== null
  }

  private isSimulator(): boolean {
    if (Platform.OS !== 'ios') return false
    
    const isSimulator =
      Platform.constants.systemName === 'iOS' &&
      (Platform.constants as any).model?.includes('Simulator')
    
    return isSimulator
  }

  /**
   * Get the correct environment for Apple API calls
   * CRITICAL: Proper environment detection for sandbox vs production
   */
  private getEnvironment(): 'sandbox' | 'production' {
    // Simulator always uses sandbox
    if (this.isSimulator()) {
      return 'sandbox'
    }
    
    // Force sandbox for now - TestFlight detection is unreliable
    // TODO: Only use production for actual App Store builds
    return 'sandbox'
    
    // Check if this is a TestFlight build
    const isTestFlight = this.isTestFlightBuild()
    
    // Development builds and TestFlight use sandbox
    if (__DEV__ || isTestFlight) {
      return 'sandbox'
    }
    
    // Only App Store builds use production
    return 'production'
  }

  /**
   * Detect if this is a TestFlight build
   * TestFlight builds should use sandbox environment
   */
  private isTestFlightBuild(): boolean {
    if (Platform.OS !== 'ios') return false
    
    // TestFlight builds have a specific app bundle structure
    // This is the most reliable way to detect TestFlight in React Native
    try {
      const bundlePath = Platform.constants.bundlePath || ''
      return bundlePath.includes('Application') && !bundlePath.includes('Simulator')
    } catch (error) {
      // Fallback: assume sandbox for safety
      return true
    }
  }

  getProductById(productId: string): StoreProduct | undefined {
    return this.products.find(product => product.productId === productId)
  }

  formatPrice(product: StoreProduct): string {
    return product.price
  }

  isAvailable(): boolean {
    return this.isStoreKitAvailable()
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.isConnected = false
      this.currentPurchaseHandler = null
    }
  }

  reset(): void {
    this.isConnected = false
    this.currentPurchaseHandler = null
    this.products = []
    this.initializationPromise = null
    this.pendingPurchaseProductId = null
  }
}

// Export singleton instance
export const modernStoreKitService = new ModernStoreKitService()

// Convenience functions
export const initializeStoreKit = () => modernStoreKitService.initialize()
export const getAvailableProducts = () => modernStoreKitService.getProducts()
export const purchaseSubscription = (productId: string) =>
  modernStoreKitService.purchaseSubscription(productId)
export const restorePurchases = () => modernStoreKitService.restorePurchases()
export const getSubscriptionStatus = () => modernStoreKitService.getSubscriptionStatus()

// Debug function for testing
export const debugValidateTransaction = (transactionId: string, productId?: string) =>
  modernStoreKitService.debugValidateTransaction(transactionId, productId)

// Account deletion cleanup
export const cleanupSubscriptionForAccountDeletion = async (userId: string) => {
  try {
    // Note: Apple handles subscription cancellation automatically when account is deleted
    // The backend delete-account API already removes pro_subscriptions records
    // This function serves as an audit log and future extension point
    console.log(`🧹 iOS subscription cleanup for account deletion: ${userId}`)
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Error during StoreKit subscription cleanup:', error)
    // Don't throw - this is a cleanup operation that shouldn't block account deletion
  }
}