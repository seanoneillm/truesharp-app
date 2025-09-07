import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'

interface ProSubscribeRequest {
  plan: 'monthly' | 'yearly'
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
    const { plan }: ProSubscribeRequest = await request.json()

    // Validate plan
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        {
          error: 'Invalid plan. Must be monthly or yearly',
        },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, pro')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is already Pro
    if (profile.pro === 'yes') {
      return NextResponse.json(
        { error: 'User already has an active Pro subscription' },
        { status: 400 }
      )
    }

    // Get the correct price ID based on plan
    const priceId = plan === 'monthly' 
      ? STRIPE_CONFIG.truesharpPro.monthlyPriceId
      : STRIPE_CONFIG.truesharpPro.yearlyPriceId

    if (!priceId) {
      console.error(`Missing price ID for ${plan} plan`, {
        productId: STRIPE_CONFIG.truesharpPro.productId,
        monthly: STRIPE_CONFIG.truesharpPro.monthlyPriceId,
        yearly: STRIPE_CONFIG.truesharpPro.yearlyPriceId
      })
      return NextResponse.json(
        { error: 'Pricing configuration error' },
        { status: 500 }
      )
    }

    let customerId = profile.stripe_customer_id

    // Create or verify Stripe customer
    if (customerId) {
      try {
        // Verify customer exists in Stripe
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer verified:', customerId)
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          console.log('🔄 Customer not found in Stripe, creating new one:', customerId)
          customerId = null // Reset to create new customer
        } else {
          console.error('Error retrieving Stripe customer:', stripeError)
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

    // Create new Stripe customer if needed
    if (!customerId) {
      try {
        console.log('🆕 Creating new Stripe customer for Pro subscription')
        const customer = await stripe.customers.create({
          email: profile.email || user.email,
          metadata: {
            user_id: user.id,
            subscription_type: 'pro',
          },
        })
        customerId = customer.id
        console.log('✅ New Stripe customer created:', customerId)

        // Update profile with customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)

        if (updateError) {
          console.error('❌ Failed to update profile with Stripe customer ID:', updateError)
        } else {
          console.log('✅ Profile updated with customer ID:', customerId)
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

    console.log('🎯 Creating Pro checkout session:', {
      customerId,
      priceId,
      plan,
      userId: user.id
    })

    // Create Checkout Session for Pro subscription
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
        metadata: {
          user_id: user.id,
          subscription_type: 'pro',
          plan: plan,
          product_id: STRIPE_CONFIG.truesharpPro.productId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pro_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pro_canceled=true`,
      metadata: {
        user_id: user.id,
        subscription_type: 'pro',
        plan: plan,
        product_id: STRIPE_CONFIG.truesharpPro.productId,
      },
    })

    console.log('✅ Pro checkout session created:', session.id)

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error) {
    console.error('❌ Pro subscribe API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check Pro subscription status
export async function GET(request: NextRequest) {
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

    // Check Pro subscription status
    const { data: proSubscription, error } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking Pro subscription:', error)
      return NextResponse.json({ error: 'Failed to check Pro subscription' }, { status: 500 })
    }

    return NextResponse.json({
      isPro: !!proSubscription,
      subscription: proSubscription || null,
    })
  } catch (error) {
    console.error('Pro subscription check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}