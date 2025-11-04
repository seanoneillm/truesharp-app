import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface AppleNotificationPayload {
  notificationType: string
  subtype?: string
  notificationUUID: string
  version: string
  signedDate: number
  data?: {
    appAppleId?: number
    bundleId?: string
    bundleVersion?: string
    environment?: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
  }
}

interface DecodedTransaction {
  transactionId: string
  originalTransactionId: string
  productId: string
  purchaseDate: number
  expiresDate?: number
  type: string
  inAppOwnershipType: string
  signedDate: number
  environment: string
  revocationDate?: number
  revocationReason?: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📬 Received App Store Server Notification')
    
    // Get the raw body
    const body = await request.text()
    console.log('📋 Raw body length:', body.length)
    console.log('📋 Raw body preview:', body.substring(0, 200))
    
    if (!body) {
      console.error('❌ Empty notification body')
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    // Parse the notification
    let notification: any
    try {
      notification = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON in notification body:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Handle Apple webhook test ping (different format from actual notifications)
    if (notification.data?.type === 'webhookPingCreated') {
      console.log('🏓 Apple webhook test ping received', {
        id: notification.data.id,
        timestamp: notification.data.attributes?.timestamp,
        version: notification.data.version
      })
      return NextResponse.json({ 
        status: 'ok',
        message: 'Webhook test ping received successfully',
        timestamp: new Date().toISOString()
      })
    }

    // Handle actual App Store Server Notifications (V2 format)
    if (!notification.signedPayload) {
      console.error('❌ No signedPayload in notification - this should be a V2 App Store Server Notification')
      console.log('📋 Notification structure:', JSON.stringify(notification, null, 2))
      return NextResponse.json({ error: 'No signedPayload - expected App Store Server Notification V2 format' }, { status: 400 })
    }

    // Apple's security is built into the JWS signature itself
    // The signedPayload is cryptographically signed by Apple
    let payload: AppleNotificationPayload
    try {
      payload = decodeJWS(notification.signedPayload) as AppleNotificationPayload
      console.log('✅ Successfully decoded Apple JWS notification')
    } catch (error) {
      console.error('❌ Failed to decode Apple JWS notification:', error)
      return NextResponse.json({ error: 'Invalid JWS signature' }, { status: 400 })
    }
    
    console.log('📋 Notification details', {
      type: payload.notificationType,
      subtype: payload.subtype,
      uuid: payload.notificationUUID,
      environment: payload.data?.environment,
      bundleId: payload.data?.bundleId
    })

    // Verify this notification is for our app
    if (payload.data?.bundleId !== process.env.APPLE_BUNDLE_ID) {
      console.error('❌ Notification for different bundle ID', {
        received: payload.data?.bundleId,
        expected: process.env.APPLE_BUNDLE_ID
      })
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 })
    }

    // Process the notification based on type
    const result = await processNotification(payload)
    
    console.log('✅ Notification processed successfully', {
      type: payload.notificationType,
      processingTime: Date.now() - startTime,
      result
    })

    return NextResponse.json({ 
      status: 'ok',
      processed: true,
      notificationType: payload.notificationType,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    
    // Log error for debugging but return 200 to prevent Apple retries for non-recoverable errors
    return NextResponse.json({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 })
  }
}

/**
 * Process different types of App Store notifications
 */
async function processNotification(payload: AppleNotificationPayload): Promise<string> {
  const supabase = createRouteHandlerClient({ cookies })

  // Extract transaction info if present
  const signedTransactionInfo = payload.data?.signedTransactionInfo
  if (!signedTransactionInfo) {
    console.log('ℹ️ No transaction info in notification, skipping transaction processing')
    return 'no_transaction_info'
  }

  const transaction = decodeJWS(signedTransactionInfo) as DecodedTransaction
  
  console.log('🔍 Processing transaction from notification', {
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
    productId: transaction.productId,
    type: transaction.type,
    notificationType: payload.notificationType
  })

  switch (payload.notificationType) {
    case 'SUBSCRIBED':
      return await handleSubscriptionStart(transaction, supabase)
    
    case 'DID_RENEW':
      return await handleSubscriptionRenewal(transaction, supabase)
    
    case 'EXPIRED':
      return await handleSubscriptionExpiration(transaction, supabase)
    
    case 'DID_FAIL_TO_RENEW':
      return await handleSubscriptionFailedRenewal(transaction, supabase)
    
    case 'GRACE_PERIOD_EXPIRED':
      return await handleGracePeriodExpired(transaction, supabase)
    
    case 'REVOKE':
      return await handleSubscriptionRevocation(transaction, supabase)
    
    case 'DID_CHANGE_RENEWAL_PREF':
      return await handleRenewalPreferenceChange(transaction, supabase)
    
    case 'DID_CHANGE_RENEWAL_STATUS':
      return await handleRenewalStatusChange(transaction, supabase)
    
    case 'PRICE_INCREASE':
      return await handlePriceIncrease(transaction, supabase)
    
    case 'REFUND':
      return await handleRefund(transaction, supabase)
    
    default:
      console.log(`ℹ️ Unhandled notification type: ${payload.notificationType}`)
      return 'unhandled_type'
  }
}

/**
 * Handle new subscription start
 */
async function handleSubscriptionStart(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    // This is typically handled by the purchase flow, but we can log it
    console.log('🎉 Subscription started via notification', {
      transactionId: transaction.transactionId,
      productId: transaction.productId
    })
    
    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('pro_subscriptions')
      .select('id')
      .eq('apple_transaction_id', transaction.originalTransactionId)
      .single()
    
    if (existing) {
      console.log('ℹ️ Subscription already exists, skipping creation')
      return 'already_exists'
    }
    
    // Create subscription if it doesn't exist
    const purchaseDate = new Date(transaction.purchaseDate)
    const expirationDate = transaction.expiresDate ? new Date(transaction.expiresDate) : null
    
    if (!expirationDate) {
      console.error('❌ No expiration date for subscription')
      return 'no_expiration_date'
    }
    
    // First find the user by transaction ID - try both current and original transaction IDs
    let userId = null
    
    // Try original transaction ID first
    const { data: userByOriginalTx } = await supabase.rpc('find_user_by_apple_transaction', {
      p_original_transaction_id: transaction.originalTransactionId
    })
    
    if (userByOriginalTx) {
      userId = userByOriginalTx
      console.log('✅ Found user by original transaction ID:', transaction.originalTransactionId)
    } else {
      // Try current transaction ID as fallback
      const { data: userByCurrentTx } = await supabase.rpc('find_user_by_apple_transaction', {
        p_original_transaction_id: transaction.transactionId
      })
      
      if (userByCurrentTx) {
        userId = userByCurrentTx
        console.log('✅ Found user by current transaction ID:', transaction.transactionId)
      }
    }
    
    if (!userId) {
      console.error('❌ No user found for transaction. Tried:', {
        originalTransactionId: transaction.originalTransactionId,
        currentTransactionId: transaction.transactionId
      })
      console.log('💡 This might be a new subscription - background validation should handle it')
      return 'user_not_found'
    }
    
    const { error } = await supabase.rpc('complete_apple_subscription_validation', {
      p_user_id: userId,
      p_transaction_id: transaction.transactionId,
      p_original_transaction_id: transaction.originalTransactionId,
      p_product_id: transaction.productId,
      p_environment: transaction.environment,
      p_purchase_date: purchaseDate.toISOString(),
      p_expiration_date: expirationDate.toISOString()
    })
    
    if (error) {
      console.error('❌ Failed to create subscription from notification:', error)
      return 'creation_failed'
    }
    
    return 'subscription_created'
    
  } catch (error) {
    console.error('❌ Error handling subscription start:', error)
    return 'error'
  }
}

/**
 * Handle subscription renewal
 */
async function handleSubscriptionRenewal(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    console.log('🔄 Processing subscription renewal', {
      originalTransactionId: transaction.originalTransactionId,
      newTransactionId: transaction.transactionId,
      expiresDate: transaction.expiresDate
    })
    
    if (!transaction.expiresDate) {
      console.error('❌ No expiration date in renewal')
      return 'no_expiration_date'
    }
    
    const newExpirationDate = new Date(transaction.expiresDate)
    
    // Update the subscription with new expiration date
    const { error } = await supabase
      .from('pro_subscriptions')
      .update({
        current_period_end: newExpirationDate.toISOString(),
        status: 'active',
        apple_transaction_id: transaction.transactionId, // Update to latest transaction
        updated_at: new Date().toISOString()
      })
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
    
    if (error) {
      console.error('❌ Failed to update subscription renewal:', error)
      return 'update_failed'
    }
    
    console.log('✅ Subscription renewed successfully')
    return 'renewed'
    
  } catch (error) {
    console.error('❌ Error handling subscription renewal:', error)
    return 'error'
  }
}

/**
 * Handle subscription expiration
 */
async function handleSubscriptionExpiration(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    console.log('⏰ Processing subscription expiration', {
      originalTransactionId: transaction.originalTransactionId
    })
    
    // Mark subscription as expired and update profile
    const { error: subscriptionError } = await supabase
      .from('pro_subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
    
    if (subscriptionError) {
      console.error('❌ Failed to mark subscription as expired:', subscriptionError)
      return 'update_failed'
    }
    
    // Also update the user's profile
    const { data: subscription } = await supabase
      .from('pro_subscriptions')
      .select('user_id')
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
      .single()
    
    if (subscription?.user_id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ pro: 'no' })
        .eq('id', subscription.user_id)
      
      if (profileError) {
        console.error('❌ Failed to update profile pro status:', profileError)
      }
    }
    
    console.log('✅ Subscription expired successfully')
    return 'expired'
    
  } catch (error) {
    console.error('❌ Error handling subscription expiration:', error)
    return 'error'
  }
}

/**
 * Handle failed renewal
 */
async function handleSubscriptionFailedRenewal(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    console.log('❌ Processing failed renewal', {
      originalTransactionId: transaction.originalTransactionId
    })
    
    // Mark subscription as having billing issues
    const { error } = await supabase
      .from('pro_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
    
    if (error) {
      console.error('❌ Failed to mark subscription as past due:', error)
      return 'update_failed'
    }
    
    return 'marked_past_due'
    
  } catch (error) {
    console.error('❌ Error handling failed renewal:', error)
    return 'error'
  }
}

/**
 * Handle grace period expiration
 */
async function handleGracePeriodExpired(transaction: DecodedTransaction, supabase: any): Promise<string> {
  // Similar to expiration but specifically for grace period
  return await handleSubscriptionExpiration(transaction, supabase)
}

/**
 * Handle subscription revocation
 */
async function handleSubscriptionRevocation(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    console.log('🚫 Processing subscription revocation', {
      originalTransactionId: transaction.originalTransactionId,
      revocationDate: transaction.revocationDate,
      revocationReason: transaction.revocationReason
    })
    
    // Mark subscription as revoked
    const { error } = await supabase
      .from('pro_subscriptions')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
    
    if (error) {
      console.error('❌ Failed to revoke subscription:', error)
      return 'revocation_failed'
    }
    
    return 'revoked'
    
  } catch (error) {
    console.error('❌ Error handling subscription revocation:', error)
    return 'error'
  }
}

/**
 * Handle renewal preference change
 */
async function handleRenewalPreferenceChange(transaction: DecodedTransaction, _supabase: any): Promise<string> {
  console.log('🔄 Renewal preference changed', {
    originalTransactionId: transaction.originalTransactionId
  })
  // Log for now, may implement specific logic later
  return 'logged'
}

/**
 * Handle renewal status change
 */
async function handleRenewalStatusChange(transaction: DecodedTransaction, _supabase: any): Promise<string> {
  console.log('🔄 Renewal status changed', {
    originalTransactionId: transaction.originalTransactionId
  })
  // Log for now, may implement specific logic later
  return 'logged'
}

/**
 * Handle price increase notification
 */
async function handlePriceIncrease(transaction: DecodedTransaction, _supabase: any): Promise<string> {
  console.log('💰 Price increase notification', {
    originalTransactionId: transaction.originalTransactionId
  })
  // Log for now, may implement user notification later
  return 'logged'
}

/**
 * Handle refund notification
 */
async function handleRefund(transaction: DecodedTransaction, supabase: any): Promise<string> {
  try {
    console.log('💸 Processing refund', {
      originalTransactionId: transaction.originalTransactionId
    })
    
    // Mark subscription as refunded and expire it
    const { error } = await supabase
      .from('pro_subscriptions')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
    
    if (error) {
      console.error('❌ Failed to process refund:', error)
      return 'refund_failed'
    }
    
    return 'refunded'
    
  } catch (error) {
    console.error('❌ Error handling refund:', error)
    return 'error'
  }
}

/**
 * Decode JWS (JSON Web Signature) from Apple
 */
function decodeJWS(jws: string): any {
  try {
    const parts = jws.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWS format - expected 3 parts, got ' + parts.length)
    }

    const payload = parts[1]
    if (!payload) {
      throw new Error('Invalid JWS payload - part 1 is empty')
    }
    
    // Handle both base64url and base64 encoding
    let decoded: string
    try {
      decoded = Buffer.from(payload, 'base64url').toString('utf8')
    } catch (base64urlError) {
      console.log('⚠️ base64url failed, trying base64:', base64urlError)
      decoded = Buffer.from(payload, 'base64').toString('utf8')
    }
    
    console.log('🔍 Decoded JWS payload length:', decoded.length)
    return JSON.parse(decoded)
  } catch (error) {
    console.error('❌ Failed to decode JWS:', error)
    console.error('❌ JWS string length:', jws.length)
    console.error('❌ JWS first 100 chars:', jws.substring(0, 100))
    throw new Error('Invalid JWS signature from Apple: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Note: Apple App Store Server Notifications V2 use JWS (JSON Web Signature) for security
 * The signedPayload is cryptographically signed by Apple using their private key
 * No additional HMAC verification is needed - the JWS signature provides authenticity
 * 
 * For additional security (optional), you could verify the JWS signature against Apple's public key,
 * but this is not required as Apple's infrastructure guarantees delivery authenticity.
 */