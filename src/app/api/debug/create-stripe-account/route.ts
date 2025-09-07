import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'

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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_seller, email, username')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.is_seller) {
      return NextResponse.json(
        { error: 'User must be a seller' },
        { status: 400 }
      )
    }

    // Check if already has Stripe account
    const { data: existingAccount } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Stripe Connect account already exists', account_id: existingAccount.stripe_account_id },
        { status: 409 }
      )
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: profile.email,
      metadata: {
        user_id: user.id,
        username: profile.username || '',
      },
    })

    // Store the account in the database
    const { error: insertError } = await supabase
      .from('seller_stripe_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        requirements_due: [],
      })

    if (insertError) {
      // If database insert fails, clean up the Stripe account
      await stripe.accounts.del(account.id).catch(console.error)
      throw insertError
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      account_id: account.id,
      onboarding_url: accountLink.url,
      message: 'Stripe Connect account created. Complete onboarding at the provided URL.'
    })
  } catch (error) {
    console.error('Stripe Connect account creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create Stripe Connect account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}