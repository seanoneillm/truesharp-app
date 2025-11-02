import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'

// Apple receipt validation configuration (currently unused)
// const APPLE_VALIDATION_CONFIG = {
//   maxRetries: 3,
//   timeoutMs: 45000, // 45 seconds for sandbox delays
//   productionFirstStrategy: true, // Always try production first, fallback to sandbox on 21007
//   rateLimitDelay: 1000, // 1 second between requests to avoid rate limiting
// }

interface AppleReceiptValidationRequest {
  userId: string
  productId: string
  receiptData: string
  transactionId: string
  environment: 'sandbox' | 'production'
}

interface AppleReceiptResponse {
  status: number
  receipt?: any
  latest_receipt_info?: any[]
  environment?: string
  'is-retryable'?: boolean
}

/**
 * Enhanced Apple Receipt Validation with Production-First Fallback Strategy
 * Implements Apple's recommended approach: try production first, fallback to sandbox on 21007
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get auth token from Authorization header (iOS app sends Bearer token)
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      console.error('❌ Receipt validation: No authorization token provided')
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    // Create Supabase client and verify the token
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify user authentication using the provided token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Receipt validation: User not authenticated', authError)
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    const body: AppleReceiptValidationRequest = await request.json()
    const { userId, productId, receiptData, transactionId, environment } = body

    // Security: Verify the user ID matches the authenticated user
    if (userId !== user.id) {
      console.error('❌ Receipt validation: User ID mismatch', {
        authenticatedUserId: user.id,
        requestUserId: userId,
      })
      return NextResponse.json({ valid: false, error: 'User ID mismatch' }, { status: 403 })
    }

    console.log('🔍 Starting Apple receipt validation', {
      userId,
      productId,
      transactionId,
      environment,
      receiptLength: receiptData.length,
    })

    // Validate required fields
    if (!receiptData || !productId || !transactionId) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing required fields: receiptData, productId, transactionId',
        },
        { status: 400 }
      )
    }

    // Security: Check shared secret is configured
    if (!process.env.APPLE_SHARED_SECRET) {
      console.error('❌ APPLE_SHARED_SECRET not configured')
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Log transaction attempt for audit
    await supabase
      .from('apple_transaction_attempts')
      .insert({
        user_id: userId,
        product_id: productId,
        transaction_id: transactionId,
        validation_result: { step: 'started', environment },
      })
      .select()
      .single()

    // Apple validation with production-first strategy and robust error handling
    let validationResult
    try {
      validationResult = await validateReceiptWithApple(receiptData, true) // Production first
    } catch (error) {
      console.error('❌ Apple validation failed:', error)

      // Log failure attempt
      await supabase.from('apple_transaction_attempts').insert({
        user_id: userId,
        product_id: productId,
        transaction_id: transactionId,
        validation_result: {
          step: 'failed',
          error: error instanceof Error ? error.message : 'Unknown',
        },
        error_message: error instanceof Error ? error.message : 'Unknown validation error',
      })

      return NextResponse.json(
        { valid: false, error: 'Failed to validate receipt with Apple' },
        { status: 503 }
      )
    }

    // Process the validated receipt
    const { appleData, finalEnvironment } = validationResult

    // Extract and validate transaction info
    const receiptInfo = appleData.latest_receipt_info || appleData.receipt?.in_app || []

    if (!Array.isArray(receiptInfo) || receiptInfo.length === 0) {
      console.error('❌ No transaction info found in receipt')
      return NextResponse.json(
        { valid: false, error: 'No transaction information found in receipt' },
        { status: 400 }
      )
    }

    // Find the specific transaction (try both transaction_id and original_transaction_id)
    const matchingTransaction = receiptInfo.find(
      transaction =>
        transaction.transaction_id === transactionId ||
        transaction.original_transaction_id === transactionId
    )

    if (!matchingTransaction) {
      console.error('❌ Transaction not found in receipt', {
        searchTransactionId: transactionId,
        availableTransactions: receiptInfo.map(t => ({
          id: t.transaction_id,
          originalId: t.original_transaction_id,
        })),
      })
      return NextResponse.json(
        { valid: false, error: 'Transaction not found in receipt' },
        { status: 400 }
      )
    }

    // Validate product ID matches
    if (matchingTransaction.product_id !== productId) {
      console.error('❌ Product ID mismatch', {
        expected: productId,
        actual: matchingTransaction.product_id,
      })
      return NextResponse.json(
        {
          valid: false,
          error: `Product ID mismatch: expected ${productId}, got ${matchingTransaction.product_id}`,
        },
        { status: 400 }
      )
    }

    // Extract transaction details with proper date handling
    const purchaseDate = new Date(parseInt(matchingTransaction.purchase_date_ms))
    const expirationDate = new Date(parseInt(matchingTransaction.expires_date_ms))
    const originalTransactionId = matchingTransaction.original_transaction_id || transactionId

    // Validate dates
    if (isNaN(purchaseDate.getTime()) || isNaN(expirationDate.getTime())) {
      console.error('❌ Invalid date format in receipt', {
        purchaseMs: matchingTransaction.purchase_date_ms,
        expirationMs: matchingTransaction.expires_date_ms,
      })
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid date format in receipt',
        },
        { status: 400 }
      )
    }

    const isActive = new Date() <= expirationDate

    console.log('📅 Subscription period validation', {
      purchaseDate: purchaseDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      isActive,
      currentTime: new Date().toISOString(),
    })

    try {
      // Use the secure database function for atomic subscription creation
      const { data: result, error: dbError } = await supabase.rpc(
        'complete_apple_subscription_validation',
        {
          p_user_id: userId,
          p_transaction_id: transactionId,
          p_original_transaction_id: originalTransactionId,
          p_product_id: productId,
          p_receipt_data: receiptData,
          p_environment: finalEnvironment,
          p_purchase_date: purchaseDate.toISOString(),
          p_expiration_date: expirationDate.toISOString(),
        }
      )

      if (dbError) {
        console.error('❌ Failed to complete subscription validation:', dbError)
        return NextResponse.json(
          { valid: false, error: 'Failed to create subscription record' },
          { status: 500 }
        )
      }

      // Log successful validation
      await supabase.from('apple_transaction_attempts').insert({
        user_id: userId,
        product_id: productId,
        transaction_id: transactionId,
        validation_result: {
          step: 'success',
          subscriptionId: result.subscription_id,
          isActive: result.is_active,
          plan: result.plan,
          validationTime: Date.now() - startTime,
        },
      })

      console.log('✅ Receipt validation successful', {
        subscriptionId: result.subscription_id,
        plan: result.plan,
        isActive: result.is_active,
        transactionId,
        validationTime: `${Date.now() - startTime}ms`,
      })

      return NextResponse.json({
        valid: true,
        subscription: {
          id: result.subscription_id,
          plan: result.plan,
          isActive: result.is_active,
          expirationDate: expirationDate.toISOString(),
        },
        meta: {
          environment: finalEnvironment,
          validationTime: Date.now() - startTime,
        },
      })
    } catch (dbError) {
      console.error('❌ Database error during receipt validation:', dbError)
      return NextResponse.json(
        {
          valid: false,
          error: 'Database error occurred',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Unexpected error during receipt validation:', error)
    return NextResponse.json(
      {
        valid: false,
        error: 'Unexpected server error',
        meta: { validationTime: Date.now() - startTime },
      },
      { status: 500 }
    )
  }
}

/**
 * Apple Receipt Validation with Production-First Strategy
 * Implements proper fallback handling as recommended by Apple
 */
async function validateReceiptWithApple(receiptData: string, productionFirst = true) {
  const appleRequestBody = {
    'receipt-data': receiptData,
    password: process.env.APPLE_SHARED_SECRET!,
    'exclude-old-transactions': true,
  }

  let appleData: AppleReceiptResponse
  let finalEnvironment: string

  // Step 1: Try production endpoint first (Apple recommended approach)
  if (productionFirst) {
    try {
      console.log('📡 Validating with Apple production endpoint')
      const response = await fetch(APPLE_PRODUCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appleRequestBody),
        signal: AbortSignal.timeout(45000), // 45 seconds for sandbox delays
      })

      appleData = await response.json()

      // If status 21007, receipt is from sandbox - fallback to sandbox
      if (appleData.status === 21007) {
        console.log('🔄 Receipt is from sandbox environment, redirecting to sandbox endpoint')

        const sandboxResponse = await fetch(APPLE_SANDBOX_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appleRequestBody),
          signal: AbortSignal.timeout(45000),
        })

        appleData = await sandboxResponse.json()
        finalEnvironment = 'sandbox'
      } else {
        finalEnvironment = 'production'
      }
    } catch (error) {
      console.error('❌ Production validation failed, trying sandbox:', error)

      // Fallback to sandbox on network errors
      const sandboxResponse = await fetch(APPLE_SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appleRequestBody),
        signal: AbortSignal.timeout(45000),
      })

      appleData = await sandboxResponse.json()
      finalEnvironment = 'sandbox'
    }
  } else {
    // Direct sandbox validation (for testing)
    console.log('📡 Validating with Apple sandbox endpoint')
    const response = await fetch(APPLE_SANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appleRequestBody),
      signal: AbortSignal.timeout(45000),
    })

    appleData = await response.json()
    finalEnvironment = 'sandbox'
  }

  // Validate Apple's response
  if (appleData.status !== 0) {
    const errorMessages: { [key: number]: string } = {
      21000: 'The App Store could not read the JSON object you provided',
      21002: 'The data in the receipt-data property was malformed or missing',
      21003: 'The receipt could not be authenticated',
      21004: 'The shared secret you provided does not match the shared secret on file',
      21005: 'The receipt server is not currently available (try again later)',
      21006: 'This receipt is valid but the subscription has expired',
      21007: 'This receipt is from the sandbox environment but was sent to production',
      21008: 'This receipt is from the production environment but was sent to sandbox',
      21009: 'Internal data access error (contact Apple)',
      21010: 'The user account cannot be found or has been deleted',
    }

    const errorMessage =
      errorMessages[appleData.status] || `Unknown Apple validation error: ${appleData.status}`
    throw new Error(`Apple validation failed (${appleData.status}): ${errorMessage}`)
  }

  console.log('✅ Apple validation successful', {
    environment: finalEnvironment,
    status: appleData.status,
    hasLatestReceiptInfo: !!appleData.latest_receipt_info?.length,
  })

  return { appleData, finalEnvironment }
}
