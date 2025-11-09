import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Parse request body first to check if account_id is provided
    const body = await request.json().catch(() => ({}))
    const providedAccountId = body.account_id
    
    console.log('Onboarding request body:', body)
    
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
    let stripeAccountId = null
    
    console.log('Onboarding endpoint - looking for account for user:', user.id)
    
    // First try seller_stripe_accounts table
    const { data: sellerAccount, error: sellerError } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    console.log('seller_stripe_accounts query result:', { sellerAccount, sellerError })

    if (sellerAccount?.stripe_account_id) {
      stripeAccountId = sellerAccount.stripe_account_id
      console.log('Found account in seller_stripe_accounts:', stripeAccountId)
    } else {
      // Fallback to profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_connect_account_id')
        .eq('id', user.id)
        .single()
      
      console.log('profiles query result:', { profile, profileError })
      
      if (profile?.stripe_connect_account_id) {
        stripeAccountId = profile.stripe_connect_account_id
        console.log('Found account in profiles:', stripeAccountId)
      }
    }

    // Use provided account ID if available, otherwise use the one from database
    if (providedAccountId) {
      stripeAccountId = providedAccountId
      console.log('Using provided account ID:', stripeAccountId)
    }

    console.log('Final stripeAccountId:', stripeAccountId)

    if (!stripeAccountId) {
      console.error('No Stripe Connect account found for user:', user.id)
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      onboarding_url: accountLink.url,
    })
  } catch (error) {
    console.error('Stripe onboarding link creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create onboarding link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}