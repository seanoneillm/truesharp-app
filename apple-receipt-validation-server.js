/**
 * TrueSharp Apple Receipt Validation - Node.js/Express Implementation
 * Production-ready server-side validation with fallback strategy
 */

const express = require('express')
const https = require('https')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.json())

// Apple endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Configuration
const CONFIG = {
  maxRetries: 3,
  timeoutMs: 45000, // 45 seconds for sandbox delays
  rateLimitDelay: 1000, // 1 second between requests
  sharedSecret: process.env.APPLE_SHARED_SECRET,
}

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Apple Receipt Validation Endpoint
 * POST /validate-apple-receipt
 */
app.post('/validate-apple-receipt', async (req, res) => {
  const startTime = Date.now()
  const { userId, productId, receiptData, transactionId } = req.body

  try {
    // Security: Validate required fields
    if (!userId || !productId || !receiptData || !transactionId) {
      return res.status(400).json({
        valid: false,
        error: 'Missing required fields',
      })
    }

    // Security: Validate shared secret is configured
    if (!CONFIG.sharedSecret) {
      console.error('❌ APPLE_SHARED_SECRET not configured')
      return res.status(500).json({
        valid: false,
        error: 'Server configuration error',
      })
    }

    console.log(`🔍 Starting receipt validation for user ${userId}`)

    // Validate receipt with Apple (production-first strategy)
    const { appleData, environment } = await validateWithApple(receiptData)

    // Process validated receipt
    const result = await processValidatedReceipt({
      userId,
      productId,
      transactionId,
      receiptData,
      appleData,
      environment,
    })

    // Log successful validation
    await logValidationAttempt(userId, transactionId, {
      success: true,
      environment,
      validationTime: Date.now() - startTime,
    })

    res.json({
      valid: true,
      subscription: result,
      meta: {
        environment,
        validationTime: Date.now() - startTime,
      },
    })
  } catch (error) {
    console.error('❌ Receipt validation failed:', error)

    // Log failed validation
    await logValidationAttempt(userId, transactionId, {
      success: false,
      error: error.message,
      validationTime: Date.now() - startTime,
    })

    res.status(error.statusCode || 500).json({
      valid: false,
      error: error.message || 'Receipt validation failed',
    })
  }
})

/**
 * Apple Receipt Validation with Production-First Strategy
 */
async function validateWithApple(receiptData, retryCount = 0) {
  const requestBody = {
    'receipt-data': receiptData,
    password: CONFIG.sharedSecret,
    'exclude-old-transactions': true,
  }

  let appleData
  let environment

  try {
    // Step 1: Try production endpoint first
    console.log('📡 Validating with Apple production endpoint')
    appleData = await makeAppleRequest(APPLE_PRODUCTION_URL, requestBody)

    // If status 21007, receipt is from sandbox - redirect to sandbox
    if (appleData.status === 21007) {
      console.log('🔄 Receipt from sandbox, redirecting to sandbox endpoint')
      appleData = await makeAppleRequest(APPLE_SANDBOX_URL, requestBody)
      environment = 'sandbox'
    } else {
      environment = 'production'
    }
  } catch (error) {
    console.error('❌ Production validation failed, trying sandbox:', error)

    // Fallback to sandbox on network errors
    try {
      appleData = await makeAppleRequest(APPLE_SANDBOX_URL, requestBody)
      environment = 'sandbox'
    } catch (sandboxError) {
      if (retryCount < CONFIG.maxRetries) {
        console.log(`🔄 Retry attempt ${retryCount + 1}/${CONFIG.maxRetries}`)
        await sleep(CONFIG.rateLimitDelay * (retryCount + 1))
        return validateWithApple(receiptData, retryCount + 1)
      }
      throw new Error(`Apple validation failed after ${CONFIG.maxRetries} attempts`)
    }
  }

  // Validate Apple's response
  if (appleData.status !== 0) {
    const errorMessage = getAppleErrorMessage(appleData.status)
    throw new Error(`Apple validation failed (${appleData.status}): ${errorMessage}`)
  }

  console.log(`✅ Apple validation successful (${environment})`)
  return { appleData, environment }
}

/**
 * Make HTTP request to Apple verification endpoint
 */
function makeAppleRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: CONFIG.timeoutMs,
    }

    const req = https.request(url, options, res => {
      let body = ''

      res.on('data', chunk => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          resolve(result)
        } catch (error) {
          reject(new Error('Invalid JSON response from Apple'))
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Apple request timeout'))
    })

    req.on('error', error => {
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

/**
 * Process validated Apple receipt and create subscription
 */
async function processValidatedReceipt({
  userId,
  productId,
  transactionId,
  receiptData,
  appleData,
  environment,
}) {
  // Extract transaction info from receipt
  const receiptInfo = appleData.latest_receipt_info || appleData.receipt?.in_app || []

  if (!Array.isArray(receiptInfo) || receiptInfo.length === 0) {
    throw new Error('No transaction information found in receipt')
  }

  // Find the specific transaction
  const transaction = receiptInfo.find(
    t => t.transaction_id === transactionId || t.original_transaction_id === transactionId
  )

  if (!transaction) {
    throw new Error('Transaction not found in receipt')
  }

  // Validate product ID
  if (transaction.product_id !== productId) {
    throw new Error(`Product ID mismatch: expected ${productId}, got ${transaction.product_id}`)
  }

  // Extract dates and validate
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms))
  const expirationDate = new Date(parseInt(transaction.expires_date_ms))

  if (isNaN(purchaseDate.getTime()) || isNaN(expirationDate.getTime())) {
    throw new Error('Invalid date format in receipt')
  }

  const isActive = new Date() <= expirationDate
  const originalTransactionId = transaction.original_transaction_id || transactionId

  // Use atomic database function to create subscription
  const { data: result, error } = await supabase.rpc('complete_apple_subscription_validation', {
    p_user_id: userId,
    p_transaction_id: transactionId,
    p_original_transaction_id: originalTransactionId,
    p_product_id: productId,
    p_receipt_data: receiptData,
    p_environment: environment,
    p_purchase_date: purchaseDate.toISOString(),
    p_expiration_date: expirationDate.toISOString(),
  })

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return {
    id: result.subscription_id,
    plan: result.plan,
    isActive: result.is_active,
    expirationDate: expirationDate.toISOString(),
  }
}

/**
 * Log validation attempt for audit trail
 */
async function logValidationAttempt(userId, transactionId, result) {
  try {
    await supabase.from('apple_transaction_attempts').insert({
      user_id: userId,
      transaction_id: transactionId,
      validation_result: result,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log validation attempt:', error)
    // Don't throw - logging failure shouldn't break validation
  }
}

/**
 * Get human-readable error message for Apple status codes
 */
function getAppleErrorMessage(status) {
  const messages = {
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

  return messages[status] || `Unknown Apple error: ${status}`
}

/**
 * Utility function for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 TrueSharp receipt validation server running on port ${PORT}`)
  console.log(`📋 Apple shared secret configured: ${!!CONFIG.sharedSecret}`)
})

module.exports = app
