# Modern iOS IAP Implementation Guide

## Client-Side: Updated Expo Implementation

```typescript
// ios-app/src/services/modern-storekit.ts
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

// Use expo-in-app-purchases for transaction management
let InAppPurchases: any = null
try {
  InAppPurchases = require('expo-in-app-purchases')
} catch (error) {
  logger.error('Failed to import expo-in-app-purchases', error)
}

export interface ModernPurchaseResult {
  success: boolean
  productId?: string
  transactionId?: string
  originalTransactionId?: string
  error?: string
  serverValidated?: boolean
}

class ModernStoreKitService {
  private isConnected = false

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false
    
    if (!InAppPurchases) return false

    try {
      await InAppPurchases.connectAsync()
      this.isConnected = true
      return true
    } catch (error) {
      logger.error('Failed to initialize StoreKit:', error)
      return false
    }
  }

  /**
   * Modern purchase flow - sends transaction ID to server
   */
  async purchaseSubscription(productId: string): Promise<ModernPurchaseResult> {
    if (!this.isConnected) {
      throw new Error('StoreKit not initialized')
    }

    try {
      // Step 1: Initiate purchase
      const purchaseResult = await InAppPurchases.purchaseItemAsync(productId)
      
      if (purchaseResult.responseCode !== InAppPurchases.IAPResponseCode.OK) {
        return {
          success: false,
          error: `Purchase failed: ${purchaseResult.errorCode}`
        }
      }

      // Step 2: Extract transaction data
      const purchase = purchaseResult.results?.[0]
      if (!purchase?.acknowledged) {
        return {
          success: false,
          error: 'Purchase not acknowledged by Apple'
        }
      }

      // Step 3: Send transaction ID to server (modern approach)
      const validationResult = await this.validateTransactionWithServer({
        transactionId: purchase.orderId,
        originalTransactionId: purchase.orderId, // For subscriptions
        productId: purchase.productId
      })

      if (validationResult.success) {
        // Step 4: Finish transaction only after server validation
        try {
          if (InAppPurchases.finishTransactionAsync) {
            await InAppPurchases.finishTransactionAsync(purchase.orderId)
          }
        } catch (finishError) {
          logger.warn('Failed to finish transaction:', finishError)
          // Don't fail the purchase for this
        }
      }

      return {
        success: validationResult.success,
        productId: purchase.productId,
        transactionId: purchase.orderId,
        originalTransactionId: purchase.orderId,
        serverValidated: validationResult.success,
        error: validationResult.error
      }

    } catch (error) {
      logger.error('Purchase failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Modern server validation using transaction ID
   */
  private async validateTransactionWithServer(data: {
    transactionId: string
    originalTransactionId: string
    productId: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          transactionId: data.transactionId,
          originalTransactionId: data.originalTransactionId,
          productId: data.productId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const result = await response.json()
      return { success: result.valid === true, error: result.error }

    } catch (error) {
      logger.error('Transaction validation failed:', error)
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`
      }
    }
  }

  /**
   * Restore purchases using modern transaction lookup
   */
  async restorePurchases(): Promise<ModernPurchaseResult[]> {
    if (!this.isConnected) {
      throw new Error('StoreKit not initialized')
    }

    try {
      const response = await InAppPurchases.getPurchaseHistoryAsync()
      
      if (response.responseCode !== InAppPurchases.IAPResponseCode.OK) {
        throw new Error(`Failed to restore: ${response.errorCode}`)
      }

      const results: ModernPurchaseResult[] = []

      if (response.results?.length > 0) {
        for (const purchase of response.results) {
          if (purchase.acknowledged) {
            // Use modern validation for restored purchases
            const validationResult = await this.validateTransactionWithServer({
              transactionId: purchase.orderId,
              originalTransactionId: purchase.orderId,
              productId: purchase.productId
            })

            results.push({
              success: validationResult.success,
              productId: purchase.productId,
              transactionId: purchase.orderId,
              originalTransactionId: purchase.orderId,
              serverValidated: validationResult.success,
              error: validationResult.error
            })
          }
        }
      }

      return results
    } catch (error) {
      logger.error('Restore purchases failed:', error)
      throw error
    }
  }
}

export const modernStoreKitService = new ModernStoreKitService()
```

## Backend: App Store Server API Implementation

```typescript
// src/app/api/validate-apple-transaction/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// App Store Server API endpoints
const APP_STORE_SERVER_API_BASE = 'https://api.storekit.itunes.apple.com'
const SANDBOX_API_BASE = 'https://api.storekit-sandbox.itunes.apple.com'

interface AppleTransactionValidationRequest {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    const body: AppleTransactionValidationRequest = await request.json()
    const { userId, transactionId, originalTransactionId, productId } = body

    // Security: Verify user ID matches
    if (userId !== user.id) {
      return NextResponse.json({ valid: false, error: 'User ID mismatch' }, { status: 403 })
    }

    // Validate required fields
    if (!transactionId || !productId) {
      return NextResponse.json({
        valid: false,
        error: 'Missing required fields: transactionId, productId'
      }, { status: 400 })
    }

    console.log('🔍 Validating transaction with App Store Server API', {
      userId,
      transactionId,
      productId
    })

    // Step 1: Generate JWT for App Store Server API
    const apiToken = generateAppStoreAPIToken()

    // Step 2: Validate transaction with App Store Server API
    const transactionData = await validateTransactionWithAppStore(transactionId, apiToken)

    // Step 3: Process the validated transaction
    const result = await processValidatedTransaction({
      userId,
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId,
      transactionData
    })

    console.log('✅ Transaction validation successful', {
      subscriptionId: result.subscription_id,
      isActive: result.is_active,
      validationTime: Date.now() - startTime
    })

    return NextResponse.json({
      valid: true,
      subscription: {
        id: result.subscription_id,
        plan: result.plan,
        isActive: result.is_active,
        expirationDate: result.expiration_date
      },
      meta: {
        validationTime: Date.now() - startTime
      }
    })

  } catch (error) {
    console.error('❌ Transaction validation failed:', error)
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }, { status: 500 })
  }
}

/**
 * Generate JWT token for App Store Server API authentication
 */
function generateAppStoreAPIToken(): string {
  const keyId = process.env.APPLE_API_KEY_ID!
  const issuerId = process.env.APPLE_ISSUER_ID!
  const privateKey = process.env.APPLE_PRIVATE_KEY!

  if (!keyId || !issuerId || !privateKey) {
    throw new Error('Missing Apple API credentials')
  }

  const now = Math.round(Date.now() / 1000)
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    aud: 'appstoreconnect-v1',
    bid: process.env.APPLE_BUNDLE_ID!
  }

  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT'
    }
  })
}

/**
 * Validate transaction using App Store Server API
 */
async function validateTransactionWithAppStore(transactionId: string, apiToken: string) {
  // Try production first, then sandbox
  const environments = [
    { name: 'production', baseUrl: APP_STORE_SERVER_API_BASE },
    { name: 'sandbox', baseUrl: SANDBOX_API_BASE }
  ]

  for (const env of environments) {
    try {
      console.log(`📡 Checking ${env.name} environment for transaction ${transactionId}`)
      
      const response = await fetch(`${env.baseUrl}/inApps/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Transaction found in ${env.name} environment`)
        return {
          ...data,
          environment: env.name
        }
      } else if (response.status === 404) {
        console.log(`ℹ️ Transaction not found in ${env.name} environment`)
        continue
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
    } catch (error) {
      console.error(`❌ Error checking ${env.name} environment:`, error)
      if (env === environments[environments.length - 1]) {
        throw error // Re-throw on last environment
      }
    }
  }

  throw new Error('Transaction not found in any environment')
}

/**
 * Process validated transaction and create subscription
 */
async function processValidatedTransaction({
  userId,
  transactionId,
  originalTransactionId,
  productId,
  transactionData
}: {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
  transactionData: any
}) {
  const supabase = createRouteHandlerClient({ cookies })

  // Extract and validate transaction details
  const signedTransactionInfo = transactionData.signedTransactionInfo
  if (!signedTransactionInfo) {
    throw new Error('No signed transaction info found')
  }

  // Decode the JWS (JSON Web Signature) transaction
  const transactionInfo = decodeJWS(signedTransactionInfo)
  
  // Validate transaction data
  if (transactionInfo.productId !== productId) {
    throw new Error(`Product ID mismatch: expected ${productId}, got ${transactionInfo.productId}`)
  }

  // Extract dates
  const purchaseDate = new Date(transactionInfo.purchaseDate)
  const expirationDate = new Date(transactionInfo.expiresDate)

  // Use atomic database function
  const { data: result, error } = await supabase.rpc('complete_apple_subscription_validation', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_original_transaction_id: originalTransactionId,
    p_product_id: productId,
    p_environment: transactionData.environment,
    p_purchase_date: purchaseDate.toISOString(),
    p_expiration_date: expirationDate.toISOString()
  })

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return result
}

/**
 * Decode JWS (JSON Web Signature) from Apple
 */
function decodeJWS(jws: string): any {
  const parts = jws.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format')
  }

  const payload = parts[1]
  const decoded = Buffer.from(payload, 'base64url').toString('utf8')
  return JSON.parse(decoded)
}
```

## App Store Server Notifications V2 Webhook

```typescript
// src/app/api/apple-webhooks/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the JWS payload from Apple
    const body = await request.text()
    const notification = JSON.parse(body)

    // Decode the signed payload
    const signedPayload = decodeJWS(notification.signedPayload)
    
    // Handle different notification types
    const notificationType = signedPayload.notificationType
    const transactionInfo = signedPayload.data?.signedTransactionInfo
    
    if (!transactionInfo) {
      return NextResponse.json({ status: 'no_transaction_info' })
    }

    const transaction = decodeJWS(transactionInfo)
    
    console.log(`📬 Received ${notificationType} notification for transaction ${transaction.transactionId}`)

    switch (notificationType) {
      case 'SUBSCRIBED':
      case 'DID_RENEW':
        await handleSubscriptionRenewal(transaction, supabase)
        break
      
      case 'EXPIRED':
      case 'DID_FAIL_TO_RENEW':
        await handleSubscriptionExpiration(transaction, supabase)
        break
      
      case 'REVOKE':
        await handleSubscriptionRevocation(transaction, supabase)
        break
      
      default:
        console.log(`ℹ️ Unhandled notification type: ${notificationType}`)
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionRenewal(transaction: any, supabase: any) {
  // Update subscription with new expiration date
  const { error } = await supabase
    .from('pro_subscriptions')
    .update({
      current_period_end: new Date(transaction.expiresDate).toISOString(),
      status: 'active'
    })
    .eq('apple_transaction_id', transaction.originalTransactionId)

  if (error) {
    console.error('Failed to update subscription renewal:', error)
  }
}

async function handleSubscriptionExpiration(transaction: any, supabase: any) {
  // Mark subscription as expired
  const { error } = await supabase
    .from('pro_subscriptions')
    .update({ status: 'expired' })
    .eq('apple_transaction_id', transaction.originalTransactionId)

  if (error) {
    console.error('Failed to mark subscription as expired:', error)
  }
}

async function handleSubscriptionRevocation(transaction: any, supabase: any) {
  // Mark subscription as revoked
  const { error } = await supabase
    .from('pro_subscriptions')
    .update({ status: 'revoked' })
    .eq('apple_transaction_id', transaction.originalTransactionId)

  if (error) {
    console.error('Failed to revoke subscription:', error)
  }
}

function decodeJWS(jws: string): any {
  const parts = jws.split('.')
  const payload = parts[1]
  const decoded = Buffer.from(payload, 'base64url').toString('utf8')
  return JSON.parse(decoded)
}
```