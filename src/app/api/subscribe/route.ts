import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

interface SubscribeRequest {
  strategyId: string
  sellerId: string
  frequency: 'weekly' | 'monthly' | 'yearly'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: authError?.message || 'No user found',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const { strategyId, sellerId, frequency }: SubscribeRequest = await request.json()

    // Validate required fields
    if (!strategyId || !sellerId || !frequency) {
      return NextResponse.json(
        {
          error: 'Missing required fields: strategyId, sellerId, frequency',
        },
        { status: 400 }
      )
    }

    // Validate frequency
    if (!['weekly', 'monthly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        {
          error: 'Invalid frequency. Must be weekly, monthly, or yearly',
        },
        { status: 400 }
      )
    }

    // Check if user is trying to subscribe to their own strategy
    if (user.id === sellerId) {
      return NextResponse.json(
        {
          error: 'Cannot subscribe to your own strategy',
        },
        { status: 400 }
      )
    }

    // Check if already subscribed to this strategy
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('subscriber_id', user.id)
      .eq('strategy_id', strategyId)
      .eq('status', 'active')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError)
      return NextResponse.json({ error: 'Failed to check existing subscriptions' }, { status: 500 })
    }

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'Already subscribed to this strategy',
          subscription: existingSubscription,
        },
        { status: 409 }
      )
    }

    // Get strategy with Stripe price IDs
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select(`
        id, name, description, 
        stripe_product_id,
        stripe_price_weekly_id,
        stripe_price_monthly_id,
        stripe_price_yearly_id,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        user_id
      `)
      .eq('id', strategyId)
      .eq('user_id', sellerId)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      )
    }

    if (!strategy.stripe_product_id) {
      return NextResponse.json(
        { error: 'Strategy is not monetized or Stripe products not created' },
        { status: 400 }
      )
    }

    // Get the appropriate price ID for the frequency
    let priceId: string | null = null
    let price: number = 0

    switch (frequency) {
      case 'weekly':
        priceId = strategy.stripe_price_weekly_id
        price = strategy.pricing_weekly || 0
        break
      case 'monthly':
        priceId = strategy.stripe_price_monthly_id
        price = strategy.pricing_monthly || 0
        break
      case 'yearly':
        priceId = strategy.stripe_price_yearly_id
        price = strategy.pricing_yearly || 0
        break
    }

    if (!priceId || price <= 0) {
      return NextResponse.json(
        { error: `No pricing available for ${frequency} frequency` },
        { status: 400 }
      )
    }

    // Get seller's Stripe Connect account using service role to bypass RLS
    // Use direct createClient since the utility function seems to have env issues
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    const { data: sellerProfile, error: sellerError } = await serviceSupabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', sellerId)
      .single()

    if (sellerError || !sellerProfile?.stripe_connect_account_id) {
      return NextResponse.json(
        { 
          error: 'Seller payment setup incomplete',
          details: 'This seller has not completed their payment setup yet. Subscriptions are temporarily unavailable.'
        },
        { status: 400 }
      )
    }

    // Verify the Connect account is ready to accept payments
    try {
      const connectAccount = await stripe.accounts.retrieve(sellerProfile.stripe_connect_account_id)
      if (!connectAccount.charges_enabled) {
        return NextResponse.json(
          { 
            error: 'Seller account verification pending',
            details: 'This seller is still completing their account verification. Please try again later.'
          },
          { status: 400 }
        )
      }
    } catch (stripeError) {
      console.error('Error retrieving Connect account:', stripeError)
      return NextResponse.json(
        { 
          error: 'Seller account error',
          details: 'There was an issue with the seller\'s payment account. Please contact support.'
        },
        { status: 500 }
      )
    }

    // Create or get Stripe customer for buyer on platform account
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    let customerId = existingProfile.stripe_customer_id
    console.log('🔍 Initial customer ID from database:', customerId)

    // Verify existing customer or create new one
    if (customerId) {
      try {
        console.log('🔍 Attempting to retrieve customer from Stripe:', customerId)
        // Check if customer exists in Stripe
        const existingCustomer = await stripe.customers.retrieve(customerId)
        console.log('✅ Customer found in Stripe:', existingCustomer.id)
      } catch (stripeError: any) {
        console.error('❌ Error retrieving Stripe customer:', stripeError.code, stripeError.message)
        if (stripeError.code === 'resource_missing') {
          console.log('🔄 Customer not found in Stripe, will create new one:', customerId)
          customerId = null // Reset to create new customer
        } else {
          console.error('💥 Unexpected error retrieving Stripe customer:', stripeError)
          return NextResponse.json(
            { 
              error: 'Payment account error',
              details: 'Unable to verify payment profile. Please try again.'
            },
            { status: 500 }
          )
        }
      }
    }

    // Create Stripe customer if doesn't exist or was invalid
    if (!customerId) {
      try {
        console.log('🆕 Creating new Stripe customer for user:', user.id)
        const customer = await stripe.customers.create({
          email: existingProfile.email || user.email,
          metadata: {
            user_id: user.id,
          },
        })
        customerId = customer.id
        console.log('✅ New Stripe customer created:', customerId)

        // Update profile with new customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)

        if (updateError) {
          console.error('❌ Failed to update profile with Stripe customer ID:', updateError)
          // Continue anyway, we have the customer ID
        } else {
          console.log('✅ Profile updated with new customer ID:', customerId)
        }
      } catch (stripeError) {
        console.error('❌ Failed to create Stripe customer:', stripeError)
        return NextResponse.json(
          { 
            error: 'Failed to set up payment account',
            details: 'Unable to create payment profile. Please try again.'
          },
          { status: 500 }
        )
      }
    }

    // Create Checkout Session with application fees
    console.log('🎯 Final customer ID for checkout session:', customerId)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: STRIPE_CONFIG.marketplaceFeePercentage, // 15% platform fee
        transfer_data: {
          destination: sellerProfile.stripe_connect_account_id,
        },
        metadata: {
          strategy_id: strategyId,
          subscriber_id: user.id,
          seller_id: sellerId,
          frequency: frequency,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true&strategy_id=${strategyId}`,
      metadata: {
        strategy_id: strategyId,
        subscriber_id: user.id,
        seller_id: sellerId,
        frequency: frequency,
        seller_connect_account_id: sellerProfile.stripe_connect_account_id,
      },
    })

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Subscribe API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Subscribe GET API auth check:', {
      hasUser: !!user,
      authError: authError?.message,
      userId: user?.id,
    })

    if (authError || !user) {
      console.error('Authentication failed in subscribe GET API:', authError)
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: authError?.message || 'No user found',
        },
        { status: 401 }
      )
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID required' }, { status: 400 })
    }

    // Check subscription status
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', user.id)
      .eq('strategy_id', strategyId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error)
      return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 })
    }

    return NextResponse.json({
      isSubscribed: !!subscription,
      subscription: subscription || null,
    })
  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
