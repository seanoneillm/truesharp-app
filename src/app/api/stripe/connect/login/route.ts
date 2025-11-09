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

    // Get seller's Stripe account - check both seller_stripe_accounts and profiles tables
    let accountId = null
    let detailsSubmitted = false

    console.log('Login endpoint - looking for account for user:', user.id)

    // First try seller_stripe_accounts table (new preferred location)
    const { data: sellerAccount, error: sellerError } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id, details_submitted')
      .eq('user_id', user.id)
      .single()

    console.log('seller_stripe_accounts result:', { sellerAccount, sellerError })

    if (sellerAccount?.stripe_account_id) {
      accountId = sellerAccount.stripe_account_id
      detailsSubmitted = sellerAccount.details_submitted
      console.log('Found account in seller_stripe_accounts:', accountId)
    } else {
      // Fallback to profiles table (legacy location)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', user.id)
        .single()
      
      console.log('profiles result:', { profile, profileError })
      
      if (profile?.stripe_connect_account_id) {
        accountId = profile.stripe_connect_account_id
        // For accounts in profiles table, verify with Stripe API to get actual status
        try {
          const account = await stripe.accounts.retrieve(accountId)
          detailsSubmitted = account.details_submitted
          console.log('Found account in profiles with Stripe verification:', {
            accountId,
            detailsSubmitted,
            chargesEnabled: account.charges_enabled,
          })
        } catch (stripeError) {
          console.error('Failed to verify account with Stripe:', stripeError)
          detailsSubmitted = false
        }
      }
    }

    if (!accountId) {
      console.error('No Stripe Connect account found in either table', {
        userId: user.id,
        email: user.email,
        sellerAccountsError: error?.message,
      })
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    if (!detailsSubmitted) {
      console.error('Stripe account setup incomplete', {
        userId: user.id,
        email: user.email,
        stripeAccountId: accountId,
        detailsSubmitted: detailsSubmitted,
        source: sellerAccount ? 'seller_stripe_accounts' : 'profiles',
      })
      return NextResponse.json(
        { error: 'Account setup must be completed first' },
        { status: 400 }
      )
    }

    // Create login link for the connected account
    const loginLink = await stripe.accounts.createLoginLink(accountId)

    console.log('Stripe login link created successfully', {
      userId: user.id,
      email: user.email,
      stripeAccountId: accountId,
      loginUrlCreated: !!loginLink.url,
    })

    return NextResponse.json({
      success: true,
      login_url: loginLink.url,
    })
  } catch (error) {
    console.error('Stripe login link creation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id,
      email: user?.email,
      stripeAccountId: accountId,
    })
    return NextResponse.json(
      {
        error: 'Failed to create login link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}