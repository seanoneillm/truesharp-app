import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No payment account found',
        details: 'You need to make at least one subscription to access billing management.'
      }, { status: 400 })
    }

    // Verify customer exists in Stripe
    try {
      await stripe.customers.retrieve(profile.stripe_customer_id)
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: 'Payment account not found',
          details: 'Your payment account could not be found. Please contact support.'
        }, { status: 400 })
      }
      throw stripeError
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions`,
    })

    return NextResponse.json({
      success: true,
      url: session.url,
    })

  } catch (error: any) {
    console.error('Billing portal API error:', error)
    
    // Handle specific Stripe billing portal configuration error
    if (error.type === 'StripeInvalidRequestError' && error.message?.includes('configuration')) {
      return NextResponse.json({
        error: 'Billing portal not configured',
        details: 'The Stripe billing portal needs to be configured in the Stripe Dashboard. Please visit https://dashboard.stripe.com/test/settings/billing/portal to set up your billing portal configuration.',
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create billing portal session',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}