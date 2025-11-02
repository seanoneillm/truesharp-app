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
  originalTransactionId?: string
  productId: string
  environment?: 'sandbox' | 'production'
}

interface JWSTransaction {
  transactionId: string
  originalTransactionId: string
  productId: string
  purchaseDate: number
  expiresDate: number
  type: string
  inAppOwnershipType: string
  signedDate: number
  environment: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get auth token from Authorization header (iOS app sends Bearer token)
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      console.error('❌ Transaction validation: No authorization token provided')
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    // Create Supabase client and verify the token
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify user authentication using the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Transaction validation: User not authenticated', authError)
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    const body: AppleTransactionValidationRequest = await request.json()
    const { userId, transactionId, originalTransactionId, productId, environment: clientEnvironment } = body

    // Security: Verify user ID matches
    if (userId !== user.id) {
      console.error('❌ Transaction validation: User ID mismatch', {
        authenticatedUserId: user.id,
        requestUserId: userId,
      })
      return NextResponse.json({ valid: false, error: 'User ID mismatch' }, { status: 403 })
    }

    // Validate required fields
    if (!transactionId || !productId) {
      return NextResponse.json({
        valid: false,
        error: 'Missing required fields: transactionId, productId'
      }, { status: 400 })
    }

    console.log('🔍 Starting App Store Server API transaction validation', {
      userId,
      transactionId,
      productId,
      originalTransactionId
    })

    // Step 1: Generate JWT for App Store Server API
    const apiToken = generateAppStoreAPIToken()

    // Step 2: Validate subscription with App Store Server API using original transaction ID
    const { transactionData, environment } = await validateTransactionWithAppStore(originalTransactionId || transactionId, apiToken, clientEnvironment)

    // Step 3: Process the validated transaction
    const result = await processValidatedTransaction({
      userId,
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId,
      transactionData,
      environment
    })

    console.log('✅ Transaction validation successful', {
      subscriptionId: result.subscription_id,
      plan: result.plan,
      isActive: result.is_active,
      environment,
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
        environment,
        validationTime: Date.now() - startTime
      }
    })

  } catch (error) {
    console.error('❌ Transaction validation failed:', error)
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Transaction validation failed',
      meta: { validationTime: Date.now() - startTime }
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
  const bundleId = process.env.APPLE_BUNDLE_ID!

  if (!keyId || !issuerId || !privateKey || !bundleId) {
    const debugInfo = {
      keyId: keyId ? 'SET' : 'MISSING',
      issuerId: issuerId ? 'SET' : 'MISSING', 
      privateKey: privateKey ? 'SET' : 'MISSING',
      bundleId: bundleId ? 'SET' : 'MISSING',
      keyIdLength: keyId?.length || 0,
      issuerIdLength: issuerId?.length || 0,
      privateKeyLength: privateKey?.length || 0,
      bundleIdLength: bundleId?.length || 0
    }
    throw new Error(`Missing Apple API credentials. Debug: ${JSON.stringify(debugInfo)}`)
  }

  const now = Math.round(Date.now() / 1000)
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    aud: 'appstoreconnect-v1',
    bid: bundleId
  }

  try {
    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    })
  } catch (error) {
    console.error('❌ JWT generation failed:', error)
    throw new Error('Failed to generate App Store API token')
  }
}

/**
 * Validate subscription using App Store Server API
 * Uses the subscription endpoint for better subscription data
 */
async function validateTransactionWithAppStore(originalTransactionId: string, apiToken: string, preferredEnvironment?: string): Promise<{
  transactionData: JWSTransaction
  environment: string
}> {
  // Smart environment detection: try client's preferred environment first, then fallback
  const environments = preferredEnvironment === 'sandbox' 
    ? [
        { name: 'sandbox', baseUrl: SANDBOX_API_BASE },
        { name: 'production', baseUrl: APP_STORE_SERVER_API_BASE }
      ]
    : [
        { name: 'production', baseUrl: APP_STORE_SERVER_API_BASE },
        { name: 'sandbox', baseUrl: SANDBOX_API_BASE }
      ]

  let lastError: Error | null = null

  for (const env of environments) {
    try {
      console.log(`📡 Checking ${env.name} environment for subscription ${originalTransactionId}`)
      
      // Use subscription endpoint for better subscription status information
      const response = await fetch(`${env.baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'User-Agent': 'TrueSharp/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Subscription found in ${env.name} environment`)
        
        // Get the latest transaction from the subscription data
        const lastTransactions = data.data
        if (!lastTransactions || lastTransactions.length === 0) {
          throw new Error('No transaction data found in subscription response')
        }
        
        // Get the most recent transaction
        const latestTransaction = lastTransactions[0]
        const transactionData = decodeJWSTransaction(latestTransaction.signedTransactionInfo)
        
        return {
          transactionData,
          environment: env.name
        }
      } else if (response.status === 404) {
        console.log(`ℹ️ Subscription not found in ${env.name} environment`)
        continue
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Error checking ${env.name} environment:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Continue to next environment
      continue
    }
  }

  // If we get here, subscription wasn't found in any environment
  throw new Error(`Subscription ${originalTransactionId} not found in any environment. Last error: ${lastError?.message}`)
}

/**
 * Decode JWS (JSON Web Signature) transaction from Apple
 */
function decodeJWSTransaction(jws: string): JWSTransaction {
  try {
    const parts = jws.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWS format - expected 3 parts')
    }

    const payload = parts[1]
    if (!payload) {
      throw new Error('Invalid JWS payload')
    }
    const decoded = Buffer.from(payload, 'base64url').toString('utf8')
    const transaction = JSON.parse(decoded)
    
    // Validate required fields exist
    const requiredFields = ['transactionId', 'productId', 'purchaseDate', 'type']
    for (const field of requiredFields) {
      if (!transaction[field]) {
        throw new Error(`Missing required field in transaction: ${field}`)
      }
    }
    
    return transaction as JWSTransaction
  } catch (error) {
    console.error('❌ Failed to decode JWS transaction:', error)
    throw new Error('Invalid transaction signature from Apple')
  }
}

/**
 * Process validated transaction and create subscription
 */
async function processValidatedTransaction({
  userId,
  transactionId,
  originalTransactionId,
  productId,
  transactionData,
  environment
}: {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
  transactionData: JWSTransaction
  environment: string
}) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Validate transaction data matches request
  if (transactionData.transactionId !== transactionId) {
    throw new Error(`Transaction ID mismatch: expected ${transactionId}, got ${transactionData.transactionId}`)
  }

  if (transactionData.productId !== productId) {
    throw new Error(`Product ID mismatch: expected ${productId}, got ${transactionData.productId}`)
  }

  // Extract dates from transaction
  const purchaseDate = new Date(transactionData.purchaseDate)
  const expirationDate = transactionData.expiresDate ? new Date(transactionData.expiresDate) : null

  if (isNaN(purchaseDate.getTime())) {
    throw new Error('Invalid purchase date in transaction')
  }

  if (expirationDate && isNaN(expirationDate.getTime())) {
    throw new Error('Invalid expiration date in transaction')
  }

  // For subscriptions, we need an expiration date
  if (!expirationDate) {
    throw new Error('No expiration date found for subscription transaction')
  }

  console.log('📅 Transaction validation details', {
    transactionId,
    productId,
    purchaseDate: purchaseDate.toISOString(),
    expirationDate: expirationDate.toISOString(),
    environment,
    isActive: new Date() <= expirationDate
  })

  // Use atomic database function to create/update subscription
  const { data: result, error } = await supabase.rpc('complete_apple_subscription_validation', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_apple_original_transaction_id: originalTransactionId,
    p_product_id: productId,
    p_environment: environment,
    p_purchase_date: purchaseDate.toISOString(),
    p_expiration_date: expirationDate.toISOString()
  })

  if (error) {
    console.error('❌ Database error during transaction processing:', error)
    throw new Error(`Database error: ${error.message}`)
  }

  if (!result) {
    throw new Error('No result returned from database function')
  }

  return result
}