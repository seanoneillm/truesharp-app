import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock the webhook handler logic directly
async function handleMockCheckoutSessionCompleted(sessionData: any) {
  console.log('🎯 Processing mock checkout session completed:', sessionData.id)
  console.log('📋 Session metadata:', sessionData.metadata)

  const { strategy_id, subscriber_id, seller_id, frequency } = sessionData.metadata || {}
  console.log('📝 Extracted values:', { strategy_id, subscriber_id, seller_id, frequency })

  if (!strategy_id || !subscriber_id || !seller_id || !frequency) {
    console.error('❌ CRITICAL: Missing required metadata in session:', sessionData.metadata)
    return { error: 'Missing required metadata' }
  }

  // Check if subscription already exists to prevent duplicates
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sessionData.subscription as string)
    .single()

  if (existingSubscription) {
    console.log('ℹ️ Subscription already exists in database, skipping creation:', existingSubscription.id)
    return { error: 'Subscription already exists', existing_id: existingSubscription.id }
  }

  // Get strategy details for price
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select('pricing_weekly, pricing_monthly, pricing_yearly')
    .eq('id', strategy_id)
    .single()

  if (strategyError || !strategy) {
    console.error('❌ CRITICAL: Strategy not found in webhook processing!')
    return { error: 'Strategy not found', strategy_id }
  }

  // Get the price based on frequency
  let price = 0
  switch (frequency) {
    case 'weekly':
      price = strategy.pricing_weekly || 0
      break
    case 'monthly':
      price = strategy.pricing_monthly || 0
      break
    case 'yearly':
      price = strategy.pricing_yearly || 0
      break
  }

  const currentPeriodStart = new Date()
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

  // Create subscription record
  const subscriptionData = {
    subscriber_id,
    seller_id,
    strategy_id,
    stripe_subscription_id: sessionData.subscription,
    status: 'active',
    frequency,
    price,
    currency: 'USD',
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    next_billing_date: currentPeriodEnd.toISOString(),
    stripe_connect_account_id: sessionData.metadata?.seller_connect_account_id || null,
    stripe_customer_id: sessionData.customer,
  }

  console.log('🔍 Attempting to insert subscription data:', subscriptionData)

  const { data: newSubscription, error: insertError } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single()

  if (insertError) {
    console.error('❌ CRITICAL: Error creating subscription in database!')
    console.error('📋 Insert error:', insertError)
    return { error: 'Failed to create subscription', details: insertError }
  } else {
    console.log('✅ Subscription created successfully in database!')
    console.log('📋 New subscription ID:', newSubscription.id)
  }

  // Update strategy subscriber count
  const { error: updateError } = await supabase.rpc('increment_subscriber_count', {
    strategy_id_param: strategy_id,
  })

  if (updateError) {
    console.error('⚠️ Error updating subscriber count (non-critical):', updateError)
  } else {
    console.log('✅ Strategy subscriber count updated')
  }

  return { success: true, subscription: newSubscription }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing webhook handler directly...')

    // Create mock session data
    const mockSession = {
      id: 'cs_test_mock_' + Date.now(),
      customer: 'cus_test_mock_' + Date.now(),
      subscription: 'sub_test_mock_' + Date.now(),
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        strategy_id: '13ce72e8-62cc-4e2a-b4d4-2c11bc0c6fb2', // Use existing strategy
        subscriber_id: '28991397-dae7-42e8-a822-0dffc6ff49b7', // Use existing user
        seller_id: '0e16e4f5-f206-4e62-8282-4188ff8af48a', // Use existing seller
        frequency: 'monthly',
        seller_connect_account_id: 'acct_1S48mwJvV9fUMgsu'
      }
    }

    // Test the handler
    const result = await handleMockCheckoutSessionCompleted(mockSession)

    return NextResponse.json({
      success: !result.error,
      mock_session: mockSession,
      handler_result: result,
      message: result.error ? 'Handler test failed' : 'Handler test successful! Mock subscription created.'
    })

  } catch (error) {
    console.error('❌ Test webhook handler error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook handler test endpoint ready.',
    description: 'This tests the webhook handler logic directly without going through Stripe signature verification.',
    usage: 'POST to this endpoint to simulate a checkout.session.completed event'
  })
}