import { supabase } from '../lib/supabase'
import { storeKitService } from './storekit'

/**
 * StoreKit Test Suite for iOS App
 * Run these tests to verify subscription flow before production
 */

export interface TestResult {
  testName: string
  success: boolean
  message: string
  data?: Record<string, unknown>
  error?: string
}

export class StoreKitTestSuite {
  private results: TestResult[] = []
  private supabaseClient = supabase

  async runAllTests(): Promise<TestResult[]> {
    this.results = []

    console.log('🧪 Starting StoreKit Test Suite...')

    await this.testStoreKitInitialization()
    await this.testProductRetrieval()
    await this.testEnvironmentDetection()
    await this.testSupabaseAuthentication()
    await this.testReceiptValidationEndpoint()
    await this.testDatabaseConnection()

    console.log('✅ StoreKit Test Suite Complete')
    console.log(
      `Results: ${this.results.filter(r => r.success).length}/${this.results.length} tests passed`
    )

    return this.results
  }

  private addResult(
    testName: string,
    success: boolean,
    message: string,
    data?: Record<string, unknown>,
    error?: string
  ) {
    const result: TestResult = { testName, success, message, data, error }
    this.results.push(result)

    const icon = success ? '✅' : '❌'
    console.log(`${icon} ${testName}: ${message}`)
    if (error) console.error(`   Error: ${error}`)
    if (data) console.log(`   Data:`, data)
  }

  async testStoreKitInitialization(): Promise<void> {
    try {
      const initialized = await storeKitService.initialize()

      if (initialized) {
        this.addResult(
          'StoreKit Initialization',
          true,
          'StoreKit service initialized successfully',
          { initialized: true }
        )
      } else {
        this.addResult('StoreKit Initialization', false, 'StoreKit failed to initialize', {
          initialized: false,
        })
      }
    } catch (error) {
      this.addResult(
        'StoreKit Initialization',
        false,
        'StoreKit initialization threw error',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async testProductRetrieval(): Promise<void> {
    try {
      const products = await storeKitService.getProducts()

      const expectedProductIds = ['pro_subscription_month', 'pro_subscription_year']
      const foundProductIds = products.map(p => p.productId)
      const missingProducts = expectedProductIds.filter(id => !foundProductIds.includes(id))

      if (products.length > 0 && missingProducts.length === 0) {
        this.addResult(
          'Product Retrieval',
          true,
          `Retrieved ${products.length} products successfully`,
          {
            products: products.map(p => ({
              productId: p.productId,
              price: p.price,
              title: p.title,
            })),
          }
        )
      } else {
        this.addResult('Product Retrieval', false, `Missing products or retrieval failed`, {
          foundProducts: foundProductIds,
          missingProducts,
          totalFound: products.length,
        })
      }
    } catch (error) {
      this.addResult(
        'Product Retrieval',
        false,
        'Product retrieval threw error',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async testEnvironmentDetection(): Promise<void> {
    try {
      // Test the environment detection logic
      const isDev = __DEV__
      const expectedEnvironment = isDev ? 'sandbox' : 'production'

      this.addResult(
        'Environment Detection',
        true,
        `Environment detected as ${expectedEnvironment}`,
        {
          isDev,
          expectedEnvironment,
          recommendation:
            expectedEnvironment === 'sandbox'
              ? 'Use sandbox Apple credentials for testing'
              : 'Use production Apple credentials',
        }
      )
    } catch (error) {
      this.addResult(
        'Environment Detection',
        false,
        'Environment detection failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async testSupabaseAuthentication(): Promise<void> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabaseClient.auth.getUser()

      if (error) {
        this.addResult(
          'Supabase Authentication',
          false,
          'User not authenticated',
          { error: error.message },
          'User must be logged in for subscription flow to work'
        )
      } else if (user) {
        this.addResult('Supabase Authentication', true, 'User authenticated successfully', {
          userId: user.id,
          email: user.email,
          hasValidSession: true,
        })
      } else {
        this.addResult(
          'Supabase Authentication',
          false,
          'No user session found',
          undefined,
          'User must be logged in for subscription flow to work'
        )
      }
    } catch (error) {
      this.addResult(
        'Supabase Authentication',
        false,
        'Authentication check failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async testReceiptValidationEndpoint(): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabaseClient.auth.getUser()

      if (!user) {
        this.addResult(
          'Receipt Validation Endpoint',
          false,
          'Cannot test - user not authenticated',
          undefined,
          'Login required for this test'
        )
        return
      }

      const {
        data: { session },
      } = await this.supabaseClient.auth.getSession()

      if (!session?.access_token) {
        this.addResult(
          'Receipt Validation Endpoint',
          false,
          'Cannot test - no access token',
          undefined,
          'Valid session required for this test'
        )
        return
      }

      // Test the receipt validation endpoint with mock data
      const testData = {
        userId: user.id,
        productId: 'pro_subscription_month',
        receiptData: 'mock_receipt_data_for_testing',
        transactionId: 'mock_transaction_' + Date.now(),
        environment: __DEV__ ? 'sandbox' : 'production',
      }

      const { Environment } = await import('../config/environment')
      const response = await fetch(`${Environment.API_BASE_URL}/api/validate-apple-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(testData),
      })

      const responseData = await response.json()

      if (response.status === 401) {
        this.addResult(
          'Receipt Validation Endpoint',
          false,
          'Authentication failed with server',
          { status: response.status, response: responseData },
          'Check if access token is valid and server auth is working'
        )
      } else if (response.status === 400 && responseData.error?.includes('receipt')) {
        this.addResult(
          'Receipt Validation Endpoint',
          true,
          'Endpoint reachable and properly rejecting mock data',
          {
            status: response.status,
            expectedError: responseData.error,
            endpointWorking: true,
          }
        )
      } else {
        this.addResult(
          'Receipt Validation Endpoint',
          response.ok,
          `Endpoint responded with status ${response.status}`,
          { status: response.status, response: responseData }
        )
      }
    } catch (error) {
      this.addResult(
        'Receipt Validation Endpoint',
        false,
        'Network error contacting receipt validation endpoint',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  async testDatabaseConnection(): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabaseClient.auth.getUser()

      if (!user) {
        this.addResult(
          'Database Connection',
          false,
          'Cannot test - user not authenticated',
          undefined,
          'Login required for this test'
        )
        return
      }

      // Test reading from pro_subscriptions table
      const { data, error } = await this.supabaseClient
        .from('pro_subscriptions')
        .select('id, user_id, status, apple_transaction_id')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        this.addResult(
          'Database Connection',
          false,
          'Database query failed',
          { error: error.message },
          'Check if pro_subscriptions table exists and has proper RLS policies'
        )
      } else {
        this.addResult(
          'Database Connection',
          true,
          'Database connection and table access working',
          {
            querySuccessful: true,
            existingSubscriptions: data?.length || 0,
            hasAppleTransactionIdColumn: true, // If query didn't fail, column exists
          }
        )
      }
    } catch (error) {
      this.addResult(
        'Database Connection',
        false,
        'Database connection test failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // Test a mock purchase flow (simulation only)
  async testMockPurchaseFlow(): Promise<TestResult> {
    try {
      // Only run on simulator/development
      if (!__DEV__) {
        return {
          testName: 'Mock Purchase Flow',
          success: false,
          message: 'Mock purchases only available in development/simulator',
          error: 'Use real device with sandbox account for actual testing',
        }
      }

      const result = await storeKitService.purchaseSubscription('pro_subscription_month')

      return {
        testName: 'Mock Purchase Flow',
        success: result.success,
        message: result.success ? 'Mock purchase completed successfully' : 'Mock purchase failed',
        data: {
          transactionId: result.transactionId,
          receiptValidated: result.receiptValidated,
          error: result.error,
        },
      }
    } catch (error) {
      return {
        testName: 'Mock Purchase Flow',
        success: false,
        message: 'Mock purchase flow threw error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export singleton instance
export const storeKitTestSuite = new StoreKitTestSuite()
