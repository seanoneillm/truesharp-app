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

    // Get user's Stripe Connect account ID - check both tables for compatibility
    let stripeAccountId: string | null = null

    // First try seller_stripe_accounts table (newer structure)
    const { data: sellerAccount } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (sellerAccount?.stripe_account_id) {
      stripeAccountId = sellerAccount.stripe_account_id
      console.log('Found Stripe account in seller_stripe_accounts:', stripeAccountId)
    } else {
      // Fallback to profiles table (older structure)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.log('Profile lookup error:', profileError)
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      stripeAccountId = profile.stripe_connect_account_id
      console.log('Found Stripe account in profiles:', stripeAccountId)
    }

    if (!stripeAccountId) {
      return NextResponse.json({ 
        error: 'No seller account found',
        details: 'You need to set up your seller account first. Complete the onboarding process in Settings.'
      }, { status: 400 })
    }

    // Verify Connect account exists in Stripe
    let account;
    try {
      account = await stripe.accounts.retrieve(stripeAccountId)
      console.log('Retrieved Connect account:', {
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        created: account.created,
        type: account.type,
      })
    } catch (stripeError: any) {
      console.error('Error retrieving Stripe account:', stripeError)
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: 'Seller account not found',
          details: 'Your seller account could not be found. Please set up your account again in Settings.'
        }, { status: 400 })
      }
      throw stripeError
    }

    // Check if account is in a state where we can create login links
    if (!account.details_submitted) {
      console.log('Account details not submitted, cannot create login link')
      return NextResponse.json({ 
        error: 'Account setup incomplete',
        details: 'Please complete your seller account onboarding process before accessing account management.'
      }, { status: 400 })
    }

    // Create login link for account management (Express Dashboard)
    console.log('Creating login link for Stripe account:', stripeAccountId)
    let loginLink;
    try {
      loginLink = await stripe.accounts.createLoginLink(stripeAccountId)
      console.log('Login link created successfully:', loginLink.url)
    } catch (loginError: any) {
      console.error('Error creating login link:', loginError)
      return NextResponse.json({ 
        error: 'Cannot access account management',
        details: 'Your account may need to complete onboarding before accessing the dashboard.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      login_url: loginLink.url,
    })

  } catch (error) {
    console.error('Account link API error:', error)
    return NextResponse.json({
      error: 'Failed to create account management link',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}