import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Receipt validation: User not authenticated', authError)
      return NextResponse.json({ valid: false, error: 'Authentication required' }, { status: 401 })
    }

    const body: AppleReceiptValidationRequest = await request.json()
    const { userId, productId, receiptData, transactionId, environment } = body

    // Verify the user ID matches the authenticated user
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

    // Validate input
    if (!receiptData || !productId || !transactionId) {
      return NextResponse.json({ valid: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Prepare Apple verification request
    const appleRequestBody = {
      'receipt-data': receiptData,
      password: process.env.APPLE_SHARED_SECRET, // App-specific shared secret
      'exclude-old-transactions': true,
    }

    if (!process.env.APPLE_SHARED_SECRET) {
      console.error('❌ APPLE_SHARED_SECRET not configured')
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Determine Apple endpoint based on environment
    const appleEndpoint = environment === 'production' ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL

    console.log(`📡 Sending receipt to Apple ${environment} endpoint`)

    // Send receipt to Apple for validation
    let appleResponse: Response
    let appleData: AppleReceiptResponse

    try {
      appleResponse = await fetch(appleEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appleRequestBody),
        signal: AbortSignal.timeout(30000), // 30 second timeout for Apple sandbox delays
      })

      appleData = await appleResponse.json()
    } catch (error) {
      console.error('❌ Network error contacting Apple:', error)
      return NextResponse.json(
        { valid: false, error: 'Failed to contact Apple verification service' },
        { status: 503 }
      )
    }

    console.log('📋 Apple validation response:', {
      status: appleData.status,
      environment: appleData.environment,
      hasReceipt: !!appleData.receipt,
      hasLatestReceiptInfo: !!appleData.latest_receipt_info,
    })

    // Handle sandbox-to-production redirect (status 21007)
    if (appleData.status === 21007 && environment === 'production') {
      console.log('🔄 Redirecting to sandbox for validation')

      try {
        appleResponse = await fetch(APPLE_SANDBOX_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appleRequestBody),
          signal: AbortSignal.timeout(30000), // 30 second timeout for Apple sandbox delays
        })

        appleData = await appleResponse.json()
        console.log('📋 Apple sandbox validation response:', {
          status: appleData.status,
          environment: appleData.environment,
        })
      } catch (error) {
        console.error('❌ Network error contacting Apple sandbox:', error)
        return NextResponse.json(
          { valid: false, error: 'Failed to contact Apple sandbox service' },
          { status: 503 }
        )
      }
    }

    // Check Apple's response status
    if (appleData.status !== 0) {
      const errorMessages: { [key: number]: string } = {
        21000: 'The App Store could not read the JSON object you provided',
        21002: 'The data in the receipt-data property was malformed or missing',
        21003: 'The receipt could not be authenticated',
        21004: 'The shared secret you provided does not match the shared secret on file',
        21005: 'The receipt server is not currently available',
        21006: 'This receipt is valid but the subscription has expired',
        21007: 'This receipt is from the sandbox environment but was sent to production',
        21008: 'This receipt is from the production environment but was sent to sandbox',
        21009: 'Internal data access error',
        21010: 'The user account cannot be found or has been deleted',
      }

      const errorMessage = errorMessages[appleData.status] || `Unknown error: ${appleData.status}`
      console.error('❌ Apple receipt validation failed:', {
        status: appleData.status,
        error: errorMessage,
      })

      return NextResponse.json({ valid: false, error: errorMessage }, { status: 400 })
    }

    // Extract transaction info from receipt
    const receiptInfo = appleData.latest_receipt_info || appleData.receipt?.in_app || []

    if (!Array.isArray(receiptInfo) || receiptInfo.length === 0) {
      console.error('❌ No transaction info found in receipt')
      return NextResponse.json(
        { valid: false, error: 'No transaction information found in receipt' },
        { status: 400 }
      )
    }

    // Find the specific transaction
    const matchingTransaction = receiptInfo.find(
      transaction =>
        transaction.transaction_id === transactionId ||
        transaction.original_transaction_id === transactionId
    )

    if (!matchingTransaction) {
      console.error('❌ Transaction not found in receipt', {
        searchTransactionId: transactionId,
        availableTransactions: receiptInfo.map(t => t.transaction_id),
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
      return NextResponse.json({ valid: false, error: 'Product ID mismatch' }, { status: 400 })
    }

    // Calculate subscription period dates
    const purchaseDate = new Date(parseInt(matchingTransaction.purchase_date_ms))
    const expirationDate = new Date(parseInt(matchingTransaction.expires_date_ms))
    const now = new Date()

    // Check if subscription is still valid
    const isActive = now <= expirationDate

    console.log('📅 Subscription period validation', {
      purchaseDate: purchaseDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      isActive,
      currentTime: now.toISOString(),
    })

    // Determine plan type from product ID
    const plan = productId.includes('year') ? 'yearly' : 'monthly'

    try {
      // Check if subscription already exists to prevent duplicates
      const { data: existingSubscription } = await supabase
        .from('pro_subscriptions')
        .select('id, apple_transaction_id')
        .eq('user_id', userId)
        .eq('apple_transaction_id', transactionId)
        .single()

      if (existingSubscription) {
        console.log('✅ Subscription already exists in database', {
          subscriptionId: existingSubscription.id,
        })
        return NextResponse.json({ valid: true })
      }

      // Create new subscription record
      const subscriptionData = {
        user_id: userId,
        stripe_subscription_id: null, // Apple purchase - no Stripe
        stripe_customer_id: null,
        status: isActive ? 'active' : 'expired',
        plan: plan,
        current_period_start: purchaseDate.toISOString(),
        current_period_end: expirationDate.toISOString(),
        price_id: productId,
        apple_transaction_id: transactionId,
        apple_receipt_data: receiptData.substring(0, 500), // Store first 500 chars for audit
      }

      const { data: newSubscription, error: insertError } = await supabase
        .from('pro_subscriptions')
        .insert(subscriptionData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to create subscription record:', insertError)
        return NextResponse.json(
          { valid: false, error: 'Failed to create subscription record' },
          { status: 500 }
        )
      }

      // Update user profile to pro status if subscription is active
      if (isActive) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ pro: 'yes' })
          .eq('id', userId)

        if (profileError) {
          console.error('❌ Failed to update profile pro status:', profileError)
          // Don't fail the validation for this, subscription is still valid
        } else {
          console.log('✅ Profile updated to pro status')
        }
      }

      console.log('✅ Receipt validation successful', {
        subscriptionId: newSubscription.id,
        plan,
        isActive,
        transactionId,
      })

      return NextResponse.json({
        valid: true,
        subscription: {
          id: newSubscription.id,
          plan,
          isActive,
          expirationDate: expirationDate.toISOString(),
        },
      })
    } catch (dbError) {
      console.error('❌ Database error during receipt validation:', dbError)
      return NextResponse.json({ valid: false, error: 'Database error occurred' }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Unexpected error during receipt validation:', error)
    return NextResponse.json({ valid: false, error: 'Unexpected server error' }, { status: 500 })
  }
}
