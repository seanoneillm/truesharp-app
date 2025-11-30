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
      originalTransactionId,
      clientEnvironment,
      timestamp: new Date().toISOString()
    })

    // Step 1: Generate JWT for App Store Server API
    console.log('🔐 Generating Apple API token...')
    const apiToken = generateAppStoreAPIToken()
    console.log('✅ Apple API token generated successfully')

    // NEW APPROACH: Quick validation check first, then background processing
    console.log('🚀 Quick validation approach - checking for existing subscription first...')
    
    // Step 2: Quick check for existing subscription or claimable subscription
    const existingResult = await quickValidationCheck({
      userId,
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId
    })
    
    if (existingResult.found) {
      console.log('✅ Quick validation successful - existing subscription found', {
        subscriptionId: existingResult.subscription_id,
        isActive: existingResult.is_active,
        source: existingResult.source,
        validationTime: Date.now() - startTime
      })
      
      return NextResponse.json({
        valid: true,
        subscription: {
          id: existingResult.subscription_id,
          plan: existingResult.plan,
          isActive: existingResult.is_active,
          expirationDate: existingResult.expiration_date
        },
        meta: {
          source: existingResult.source,
          validationTime: Date.now() - startTime
        }
      })
    }
    
    // Step 3: For new transactions, start background validation and return optimistic response
    console.log('🔄 New transaction detected - starting background validation...')
    
    // Schedule background validation (don't await)
    scheduleBackgroundValidation({
      userId,
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId,
      clientEnvironment,
      apiToken
    }).catch(error => {
      console.error('❌ Background validation failed:', error)
    })
    
    // Return optimistic response immediately
    const optimisticResult = await createOptimisticSubscription({
      userId,
      transactionId,
      originalTransactionId: originalTransactionId || transactionId,
      productId,
      clientEnvironment
    })
    
    console.log('⚡ Returning optimistic response - background validation in progress', {
      subscriptionId: optimisticResult.subscription_id,
      validationTime: Date.now() - startTime
    })
    
    return NextResponse.json({
      valid: true,
      subscription: {
        id: optimisticResult.subscription_id,
        plan: optimisticResult.plan,
        isActive: true, // Optimistic - will be corrected by background validation
        expirationDate: optimisticResult.estimated_expiration
      },
      meta: {
        processing: 'background_validation_in_progress',
        validationTime: Date.now() - startTime,
        note: 'Subscription will be validated in background. Check status in a few seconds.'
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
  let privateKey = process.env.APPLE_PRIVATE_KEY!
  const bundleId = process.env.APPLE_BUNDLE_ID!

  // Process private key to ensure proper format
  if (privateKey) {
    // Remove quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '')
    // Ensure proper newlines (replace \n with actual newlines)
    privateKey = privateKey.replace(/\\n/g, '\n')
    // Ensure it starts and ends with proper markers
    if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // If it's all on one line, try to format it properly
      privateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
        // Add newlines every 64 characters in the middle
        .replace(/^-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----$/, (match, content) => {
          const formattedContent = content.match(/.{1,64}/g)?.join('\n') || content
          return `-----BEGIN PRIVATE KEY-----\n${formattedContent}\n-----END PRIVATE KEY-----`
        })
    }
  }

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
    // Debug: Log key format details
    console.log('🔍 JWT Debug - Key length:', privateKey.length)
    console.log('🔍 JWT Debug - Key starts with:', privateKey.substring(0, 30))
    console.log('🔍 JWT Debug - Key ends with:', privateKey.substring(privateKey.length - 30))
    console.log('🔍 JWT Debug - Contains newlines:', privateKey.includes('\n'))
    
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
    throw new Error(`Failed to generate App Store API token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate subscription using App Store Server API
 * Uses the subscription endpoint for better subscription data
 */
async function validateTransactionWithAppStore(originalTransactionId: string, requestedTransactionId: string, apiToken: string, preferredEnvironment?: string): Promise<{
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
    const apiCallStart = Date.now()
    try {
      console.log(`📡 Checking ${env.name} environment for subscription ${originalTransactionId}`)
      
      // Try transaction history endpoint first (more reliable for new transactions)
      let response = await fetch(`${env.baseUrl}/inApps/v1/history/${originalTransactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'User-Agent': 'TrueSharp/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      // If transaction history fails, try subscription endpoint
      if (!response.ok && response.status === 404) {
        console.log(`📡 Transaction history not found, trying subscription endpoint...`)
        response = await fetch(`${env.baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json',
            'User-Agent': 'TrueSharp/1.0'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
      }

      const apiCallDuration = Date.now() - apiCallStart
      console.log(`⏱️ Apple API call took ${apiCallDuration}ms (status: ${response.status})`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Subscription found in ${env.name} environment`)
        console.log('🔍 Apple API response structure:', JSON.stringify(data, null, 2))
        
        // Get the latest transaction from the subscription data (Apple uses 'signedTransactions' not 'data')
        const signedTransactions = data.signedTransactions
        if (!signedTransactions || signedTransactions.length === 0) {
          console.log('❌ No signed transactions found. Response keys:', Object.keys(data))
          throw new Error('No transaction data found in subscription response')
        }
        
        // Find the transaction that matches our request (or use the most recent)
        let matchingTransaction = null;
        
        // First try to find exact transaction ID match
        for (const signedTx of signedTransactions) {
          const decodedTx = decodeJWSTransaction(signedTx);
          console.log('🔍 Checking transaction:', {
            decodedTransactionId: decodedTx.transactionId,
            requestedTransactionId: requestedTransactionId,
            originalTransactionId: decodedTx.originalTransactionId
          });
          
          if (decodedTx.transactionId === requestedTransactionId) {
            matchingTransaction = decodedTx;
            console.log('🎯 Found exact transaction ID match:', requestedTransactionId);
            break;
          }
        }
        
        // If no exact match, use the most recent transaction (first in array)
        if (!matchingTransaction) {
          console.log('🔄 No exact transaction ID match found, using most recent transaction');
          matchingTransaction = decodeJWSTransaction(signedTransactions[0]);
          console.log('📋 Using transaction:', {
            transactionId: matchingTransaction.transactionId,
            originalTransactionId: matchingTransaction.originalTransactionId,
            productId: matchingTransaction.productId
          });
        }
        
        const transactionData = matchingTransaction;
        
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
      const apiCallDuration = Date.now() - apiCallStart
      console.error(`❌ Error checking ${env.name} environment after ${apiCallDuration}ms:`, error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ API call timed out after 10 seconds`)
        lastError = new Error(`Apple API timeout after 10 seconds`)
      } else {
        lastError = error instanceof Error ? error : new Error(String(error))
      }
      
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
 * Quick validation check for existing subscriptions
 */
async function quickValidationCheck({
  userId,
  transactionId,
  originalTransactionId,
  productId
}: {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
}) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  console.log('🔍 Checking for existing subscription...', {
    userId,
    originalTransactionId,
    transactionId
  })

  // Check for existing subscription by original transaction ID first
  const { data: existingSubscription, error } = await supabase
    .from('pro_subscriptions')
    .select('id, plan, current_period_end, status, user_id')
    .eq('apple_original_transaction_id', originalTransactionId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking existing subscription:', error)
  }

  if (existingSubscription) {
    const isActive = new Date(existingSubscription.current_period_end) > new Date()
    console.log('✅ Found existing subscription by original transaction ID')
    
    // If it's for a different user, this is suspicious
    if (existingSubscription.user_id && existingSubscription.user_id !== userId) {
      console.warn('⚠️ Transaction belongs to different user', {
        existingUserId: existingSubscription.user_id,
        requestUserId: userId
      })
      return { found: false }
    }
    
    // If no user is set (claimable subscription), claim it
    if (!existingSubscription.user_id) {
      console.log('🎯 Found claimable subscription, claiming it...')
      const claimResult = await supabase.rpc('claim_apple_subscription', {
        p_user_id: userId,
        p_original_transaction_id: originalTransactionId
      })
      
      if (claimResult.data?.success) {
        console.log('✅ Successfully claimed subscription')
        return {
          found: true,
          subscription_id: claimResult.data.subscription_id,
          plan: claimResult.data.plan,
          is_active: claimResult.data.is_active,
          expiration_date: claimResult.data.expiration_date,
          source: 'claimed_webhook_subscription'
        }
      }
    }
    
    return {
      found: true,
      subscription_id: existingSubscription.id,
      plan: existingSubscription.plan,
      is_active: isActive,
      expiration_date: existingSubscription.current_period_end,
      source: 'existing_subscription'
    }
  }

  // Check for subscription by current transaction ID
  const { data: byTransactionId } = await supabase
    .from('pro_subscriptions')
    .select('id, plan, current_period_end, status')
    .eq('apple_transaction_id', transactionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (byTransactionId) {
    const isActive = new Date(byTransactionId.current_period_end) > new Date()
    console.log('✅ Found existing subscription by transaction ID')
    return {
      found: true,
      subscription_id: byTransactionId.id,
      plan: byTransactionId.plan,
      is_active: isActive,
      expiration_date: byTransactionId.current_period_end,
      source: 'existing_by_transaction_id'
    }
  }

  console.log('ℹ️ No existing subscription found')
  return { found: false }
}

/**
 * Create optimistic subscription for immediate response
 */
async function createOptimisticSubscription({
  userId,
  transactionId,
  originalTransactionId,
  productId,
  clientEnvironment
}: {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
  clientEnvironment?: string
}) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const plan = productId.includes('year') ? 'yearly' : 'monthly'
  const estimatedExpiration = new Date()
  estimatedExpiration.setMonth(estimatedExpiration.getMonth() + (plan === 'yearly' ? 12 : 1))

  console.log('🚀 Creating optimistic subscription record...')

  // Create optimistic subscription with 'processing' status
  const { data, error } = await supabase
    .from('pro_subscriptions')
    .insert({
      user_id: userId,
      status: 'processing',
      plan: plan,
      current_period_start: new Date().toISOString(),
      current_period_end: estimatedExpiration.toISOString(),
      price_id: productId,
      apple_transaction_id: transactionId,
      apple_original_transaction_id: originalTransactionId,
      apple_environment: clientEnvironment || 'sandbox',
      receipt_validation_status: 'pending',
      validation_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ Failed to create optimistic subscription:', error)
    throw new Error('Failed to create optimistic subscription')
  }

  // Optimistically update profile to pro
  await supabase
    .from('profiles')
    .update({ pro: 'yes', updated_at: new Date().toISOString() })
    .eq('id', userId)

  console.log('✅ Created optimistic subscription:', data.id)

  return {
    subscription_id: data.id,
    plan: plan,
    estimated_expiration: estimatedExpiration.toISOString()
  }
}

/**
 * Schedule background validation (fire-and-forget)
 */
async function scheduleBackgroundValidation({
  userId,
  transactionId,
  originalTransactionId,
  productId,
  clientEnvironment,
  apiToken
}: {
  userId: string
  transactionId: string
  originalTransactionId: string
  productId: string
  clientEnvironment?: string
  apiToken: string
}) {
  // Use setTimeout to run validation in background
  setTimeout(async () => {
    try {
      console.log('🔄 Starting background validation for transaction:', transactionId)

      const { transactionData, environment } = await validateTransactionWithAppStore(
        originalTransactionId,
        transactionId,
        apiToken,
        clientEnvironment
      )

      const result = await processValidatedTransaction({
        userId,
        transactionId,
        originalTransactionId,
        productId,
        transactionData,
        environment
      })

      console.log('✅ Background validation completed successfully:', {
        subscriptionId: result.subscription_id,
        isActive: result.is_active,
        environment
      })

    } catch (error) {
      console.error('❌ Background validation failed:', error)
      
      // Mark the optimistic subscription as failed
      const cookieStore = await cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      await supabase
        .from('pro_subscriptions')
        .update({
          status: 'validation_failed',
          receipt_validation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('apple_transaction_id', transactionId)
        .eq('user_id', userId)

      // Don't update profile to 'no' immediately - user might restore purchases
    }
  }, 100) // Start after 100ms
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

  // Log transaction ID info for debugging (Apple may return different transaction IDs)
  if (transactionData.transactionId !== transactionId) {
    console.log('ℹ️ Transaction ID mismatch (common with Apple API):', {
      requested: transactionId,
      received: transactionData.transactionId,
      originalTransactionId: transactionData.originalTransactionId,
      note: 'Apple often returns the most recent transaction ID for a subscription'
    })
    // Don't throw error - this is normal behavior for Apple's API
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

  // First, check if there's a claimable subscription from webhook
  console.log('🔍 Checking for claimable subscription:', originalTransactionId)
  const { data: claimResult, error: claimError } = await supabase.rpc(
    'claim_apple_subscription',
    {
      p_user_id: userId,
      p_original_transaction_id: originalTransactionId
    }
  )
  
  let result
  if (claimError) {
    console.error('❌ Error checking for claimable subscription:', claimError)
    // Continue with normal flow
  } else if (claimResult && claimResult.success) {
    console.log('✅ Successfully claimed webhook-created subscription:', {
      subscriptionId: claimResult.subscription_id,
      originalTransactionId,
      claimed: true
    })
    result = claimResult
  } else {
    console.log('ℹ️ No claimable subscription found, creating new subscription')
  }
  
  // If no claimable subscription was found, create a new one
  if (!result) {
    const { data: validationResult, error } = await supabase.rpc('complete_apple_subscription_validation', {
      p_user_id: userId,
      p_transaction_id: transactionId,
      p_original_transaction_id: originalTransactionId,
      p_product_id: productId,
      p_environment: environment,
      p_purchase_date: purchaseDate.toISOString(),
      p_expiration_date: expirationDate.toISOString()
    })

    if (error) {
      console.error('❌ Database error during transaction processing:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!validationResult) {
      throw new Error('No result returned from database function')
    }
    
    result = validationResult
  }

  return result
}