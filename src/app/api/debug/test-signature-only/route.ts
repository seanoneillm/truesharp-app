import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing webhook signature verification only...')
    
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('📝 Request details:', {
      hasBody: !!body,
      bodyLength: body.length,
      hasSignature: !!signature,
      signaturePrefix: signature?.substring(0, 20) + '...',
      webhookSecretPrefix: STRIPE_CONFIG.webhookSecret?.substring(0, 12) + '...'
    })

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return NextResponse.json({ 
        error: 'Missing signature',
        test_result: 'FAILED - No signature provided' 
      }, { status: 400 })
    }

    let event
    try {
      // Test signature verification only
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret)
      console.log('✅ Signature verification SUCCESS!')
      console.log('📋 Event type:', event.type)
      console.log('📋 Event id:', event.id)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ 
        error: 'Signature verification failed',
        test_result: 'FAILED - Invalid signature',
        details: err.message
      }, { status: 400 })
    }

    // Don't process the event, just confirm signature works
    return NextResponse.json({
      success: true,
      test_result: 'SUCCESS - Signature verification passed!',
      event_info: {
        id: event.id,
        type: event.type,
        created: event.created
      },
      webhook_config: {
        secret_configured: !!STRIPE_CONFIG.webhookSecret,
        secret_prefix: STRIPE_CONFIG.webhookSecret?.substring(0, 12) + '...'
      }
    })

  } catch (error) {
    console.error('❌ Test signature error:', error)
    return NextResponse.json({
      error: 'Test failed',
      test_result: 'FAILED - Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}