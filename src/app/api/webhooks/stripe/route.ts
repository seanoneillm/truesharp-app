import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// We need to use the service role key to bypass RLS in webhooks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🎯 Webhook POST request received')
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('📝 Request details:', {
    hasBody: !!body,
    bodyLength: body.length,
    hasSignature: !!signature,
    signaturePrefix: signature?.substring(0, 20) + '...'
  })

  if (!signature) {
    console.error('❌ Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  console.log('Received Stripe webhook:', event.type, event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.paid':
        // Handle the same as payment_succeeded
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id)
  console.log('Session metadata:', session.metadata)

  const { strategy_id, subscriber_id, seller_id, frequency } = session.metadata || {}
  console.log('Extracted values:', { strategy_id, subscriber_id, seller_id, frequency })

  if (!strategy_id || !subscriber_id || !seller_id || !frequency) {
    console.error('Missing required metadata in session:', session.metadata)
    return
  }

  // Get the subscription from Stripe  
  if (!session.subscription) {
    console.error('No subscription ID found in session:', session.id)
    return
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Get strategy details for price
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select('pricing_weekly, pricing_monthly, pricing_yearly')
    .eq('id', strategy_id)
    .single()

  if (strategyError || !strategy) {
    console.error('Strategy not found:', strategy_id)
    return
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

  // Calculate period dates - use any type to bypass TypeScript issues
  const subscription = stripeSubscription as any
  console.log('📅 Subscription periods:', {
    start: subscription.current_period_start,
    end: subscription.current_period_end,
    startType: typeof subscription.current_period_start,
    endType: typeof subscription.current_period_end
  })
  
  const currentPeriodStart = subscription.current_period_start 
    ? new Date(subscription.current_period_start * 1000)
    : new Date()
  const currentPeriodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now

  // Create subscription record
  const subscriptionData = {
    subscriber_id,
    seller_id,
    strategy_id,
    stripe_subscription_id: subscription.id,
    status: 'active',
    frequency,
    price,
    currency: 'USD',
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    next_billing_date: currentPeriodEnd.toISOString(),
    stripe_connect_account_id: session.metadata?.seller_connect_account_id || null,
    stripe_customer_id: session.customer as string,
  }
  
  console.log('🔍 Attempting to insert subscription data:', subscriptionData)
  
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)

  if (insertError) {
    console.error('❌ Error creating subscription:', insertError)
    console.error('❌ Failed data:', subscriptionData)
    return
  } else {
    console.log('✅ Subscription created successfully')
  }

  // Update strategy subscriber count
  const { error: updateError } = await supabase.rpc('increment_subscriber_count', {
    strategy_id_param: strategy_id
  })

  if (updateError) {
    console.error('Error updating subscriber count:', updateError)
  }

  console.log('Successfully created subscription for session:', session.id)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id)

  const subscriptionData = subscription as any
  const metadata = subscriptionData.metadata || {}
  
  console.log('📋 Subscription metadata:', metadata)

  // Check if this is a Pro subscription
  if (metadata.subscription_type === 'pro') {
    await handleProSubscriptionCreated(subscriptionData, metadata)
  } else {
    // Handle regular strategy subscriptions if needed
    console.log('ℹ️ Non-Pro subscription created, no action needed')
  }
}

async function handleProSubscriptionCreated(subscription: any, metadata: any) {
  console.log('🔄 Creating Pro subscription record')
  console.log('📦 TrueSharp Pro Product ID:', STRIPE_CONFIG.truesharpPro.productId)

  if (!metadata.user_id || !metadata.plan) {
    console.error('❌ Missing required metadata for Pro subscription:', metadata)
    return
  }

  // Determine plan from price ID or metadata
  let plan = metadata.plan
  if (!plan) {
    const priceId = subscription.items?.data?.[0]?.price?.id
    if (priceId === STRIPE_CONFIG.truesharpPro.monthlyPriceId) {
      plan = 'monthly'
    } else if (priceId === STRIPE_CONFIG.truesharpPro.yearlyPriceId) {
      plan = 'yearly'
    } else {
      plan = 'monthly' // Default fallback
    }
  }

  const proSubscriptionData = {
    user_id: metadata.user_id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status === 'active' ? 'active' : subscription.status,
    plan: plan,
    current_period_start: subscription.current_period_start 
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : new Date().toISOString(),
    current_period_end: subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    price_id: subscription.items?.data?.[0]?.price?.id || null,
  }

  console.log('🔍 Creating Pro subscription data:', proSubscriptionData)

  const { error: insertError } = await supabase
    .from('pro_subscriptions')
    .insert(proSubscriptionData)

  if (insertError) {
    console.error('❌ Error creating Pro subscription:', insertError)
    return
  }

  console.log('✅ Pro subscription created successfully')

  // Update profile pro status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ pro: 'yes' })
    .eq('id', metadata.user_id)

  if (profileError) {
    console.error('❌ Error updating profile pro status:', profileError)
  } else {
    console.log('✅ Profile updated to Pro status')
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)

  const invoiceData = invoice as any
  if (!invoiceData.subscription) return

  // Check if subscription record already exists
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoiceData.subscription)
    .single()

  if (existingSubscription) {
    // Update existing subscription status to active
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoiceData.subscription)

    if (error) {
      console.error('Error updating subscription status:', error)
    }
  } else {
    // Create subscription record if it doesn't exist (fallback for missing checkout.session.completed)
    console.log('🔄 No subscription record found, attempting to create from invoice data')
    
    // Try to get metadata from subscription or line items
    let metadata = invoiceData.subscription_details?.metadata || {}
    if (!metadata.strategy_id && invoiceData.lines?.data?.[0]?.metadata) {
      metadata = invoiceData.lines.data[0].metadata
    }
    
    console.log('📋 Invoice metadata:', metadata)
    
    if (metadata.strategy_id && metadata.subscriber_id && metadata.seller_id) {
      // Get full subscription details from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(invoiceData.subscription)
      const subscription = stripeSubscription as any
      
      // Create the subscription record
      const subscriptionData = {
        subscriber_id: metadata.subscriber_id || metadata.buyer_id, // Handle both field names
        seller_id: metadata.seller_id,
        strategy_id: metadata.strategy_id,
        stripe_subscription_id: invoiceData.subscription,
        status: 'active',
        frequency: metadata.frequency || 'monthly', // Default to monthly if not specified
        price: parseFloat(metadata.price || '0') / 100, // Convert from cents
        currency: 'USD',
        current_period_start: subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_customer_id: invoiceData.customer,
      }
      
      console.log('🔍 Creating subscription from invoice data:', subscriptionData)
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)

      if (insertError) {
        console.error('❌ Error creating subscription from invoice:', insertError)
      } else {
        console.log('✅ Subscription created successfully from invoice')
        
        // Update strategy subscriber count
        const { error: updateError } = await supabase.rpc('increment_subscriber_count', {
          strategy_id_param: metadata.strategy_id
        })

        if (updateError) {
          console.error('Error updating subscriber count:', updateError)
        }
      }
    } else {
      console.error('❌ Missing required metadata in invoice for subscription creation:', metadata)
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id)

  const invoiceData = invoice as any
  if (!invoiceData.subscription) return

  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoiceData.subscription)

  if (error) {
    console.error('Error updating subscription status:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)

  const subscriptionData = subscription as any
  const metadata = subscriptionData.metadata || {}

  // Check if this is a Pro subscription
  if (metadata.subscription_type === 'pro') {
    await handleProSubscriptionUpdated(subscriptionData, metadata)
  } else {
    // Handle regular strategy subscriptions
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscriptionData.status === 'active' ? 'active' : subscriptionData.status,
        current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
        next_billing_date: new Date(subscriptionData.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionData.id)

    if (error) {
      console.error('Error updating strategy subscription:', error)
    }
  }
}

async function handleProSubscriptionUpdated(subscription: any, metadata: any) {
  console.log('🔄 Updating Pro subscription')

  const updateData = {
    status: subscription.status,
    current_period_start: subscription.current_period_start 
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('pro_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating Pro subscription:', error)
    return
  }

  console.log('✅ Pro subscription updated successfully')

  // Update profile pro status based on subscription status
  const proStatus = subscription.status === 'active' ? 'yes' : 'no'
  
  if (metadata.user_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pro: proStatus })
      .eq('id', metadata.user_id)

    if (profileError) {
      console.error('❌ Error updating profile pro status:', profileError)
    } else {
      console.log(`✅ Profile updated to Pro status: ${proStatus}`)
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)

  const subscriptionData = subscription as any
  const metadata = subscriptionData.metadata || {}

  // Check if this is a Pro subscription
  if (metadata.subscription_type === 'pro') {
    await handleProSubscriptionDeleted(subscriptionData, metadata)
  } else {
    // Handle regular strategy subscriptions
    // Get the subscription to decrement strategy counter
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('strategy_id')
      .eq('stripe_subscription_id', subscriptionData.id)
      .single()

    // Update subscription status to cancelled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionData.id)

    if (error) {
      console.error('Error updating strategy subscription status:', error)
    }

    // Decrement strategy subscriber count
    if (subData?.strategy_id) {
      const { error: updateError } = await supabase.rpc('decrement_subscriber_count', {
        strategy_id_param: subData.strategy_id
      })

      if (updateError) {
        console.error('Error decrementing subscriber count:', updateError)
      }
    }
  }
}

async function handleProSubscriptionDeleted(subscription: any, metadata: any) {
  console.log('🔄 Deleting/cancelling Pro subscription')

  // Update Pro subscription status to cancelled
  const { error } = await supabase
    .from('pro_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error cancelling Pro subscription:', error)
    return
  }

  console.log('✅ Pro subscription cancelled successfully')

  // Update profile pro status to 'no'
  if (metadata.user_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pro: 'no' })
      .eq('id', metadata.user_id)

    if (profileError) {
      console.error('❌ Error updating profile pro status to no:', profileError)
    } else {
      console.log('✅ Profile updated to remove Pro status')
    }
  }
}