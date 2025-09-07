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

    // Get user's Stripe Connect account ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.stripe_connect_account_id) {
      return NextResponse.json({ 
        error: 'No seller account found',
        details: 'You need to set up your seller account first. Complete the onboarding process in Settings.'
      }, { status: 400 })
    }

    // Verify Connect account exists in Stripe
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id)
      console.log('Retrieved Connect account:', {
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
      })
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: 'Seller account not found',
          details: 'Your seller account could not be found. Please set up your account again in Settings.'
        }, { status: 400 })
      }
      throw stripeError
    }

    // Create account link for account management
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_connect_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/sell`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/sell`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    })

  } catch (error) {
    console.error('Account link API error:', error)
    return NextResponse.json({
      error: 'Failed to create account management link',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}