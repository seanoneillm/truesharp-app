import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { stripe_subscription_id, override_strategy_id } = await request.json()

    if (!stripe_subscription_id) {
      return NextResponse.json(
        {
          error: 'stripe_subscription_id required',
        },
        { status: 400 }
      )
    }

    console.log('🔄 Attempting to recover subscription:', stripe_subscription_id)

    // 1. Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripe_subscription_id)
    console.log('📋 Stripe subscription:', {
      id: stripeSubscription.id,
      customer: stripeSubscription.customer,
      status: stripeSubscription.status,
      metadata: stripeSubscription.metadata,
    })

    // 2. Check if already exists in database
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripe_subscription_id)
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'Subscription already exists in database',
          subscription_id: existingSubscription.id,
        },
        { status: 409 }
      )
    }

    // 3. Get metadata from subscription
    const metadata = stripeSubscription.metadata as Record<string, string>
    const { subscriber_id, seller_id, frequency } = metadata
    let strategy_id = metadata.strategy_id

    // Allow override of strategy_id if provided (for recovery purposes)
    if (override_strategy_id) {
      console.log(`🔄 Overriding strategy_id from ${strategy_id} to ${override_strategy_id}`)
      strategy_id = override_strategy_id
    }

    console.log('📋 Metadata:', metadata)

    if (!strategy_id || !subscriber_id || !seller_id || !frequency) {
      return NextResponse.json(
        {
          error: 'Missing required metadata in Stripe subscription',
          metadata,
        },
        { status: 400 }
      )
    }

    // 4. Get strategy details for price
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('pricing_weekly, pricing_monthly, pricing_yearly')
      .eq('id', strategy_id)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json(
        {
          error: 'Strategy not found',
          strategy_id,
        },
        { status: 404 }
      )
    }

    // 5. Calculate price based on frequency
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

    // 6. Calculate period dates
    const stripeSubData = stripeSubscription as {
      current_period_start?: number
      current_period_end?: number
      status: string
      customer: string
      id: string
    }
    const currentPeriodStart = stripeSubData.current_period_start
      ? new Date(stripeSubData.current_period_start * 1000)
      : new Date()
    const currentPeriodEnd = stripeSubData.current_period_end
      ? new Date(stripeSubData.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // 7. Create subscription record
    const subscriptionData = {
      subscriber_id,
      seller_id,
      strategy_id,
      stripe_subscription_id: stripeSubscription.id,
      status: stripeSubscription.status === 'active' ? 'active' : stripeSubscription.status,
      frequency,
      price,
      currency: 'USD',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      next_billing_date: currentPeriodEnd.toISOString(),
      stripe_customer_id: stripeSubscription.customer as string,
    }

    console.log('🔍 Creating subscription data:', subscriptionData)

    const { data: newSubscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating subscription:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create subscription',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    // 8. Update strategy subscriber count
    const { error: updateError } = await supabase.rpc('increment_subscriber_count', {
      strategy_id_param: strategy_id,
    })

    if (updateError) {
      console.error('⚠️ Error updating subscriber count:', updateError)
      // Don't fail the request for this
    }

    console.log('✅ Subscription recovered successfully:', newSubscription.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription recovered successfully',
      subscription: newSubscription,
      original_stripe_data: {
        id: stripeSubscription.id,
        customer: stripeSubscription.customer,
        status: stripeSubscription.status,
        metadata: stripeSubscription.metadata,
      },
    })
  } catch (error) {
    console.error('Recovery API error:', error)
    return NextResponse.json(
      {
        error: 'Recovery failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
