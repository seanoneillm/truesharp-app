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

    // Get user profile to check seller status
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
        { error: 'User must be a seller to create Stripe Connect account' },
        { status: 400 }
      )
    }

    // Parse request body to check if this is for an existing account
    const body = await request.json().catch(() => ({}))
    const existingAccountId = body.account_id
    
    console.log('Stripe Connect API request:', {
      method: request.method,
      hasAccountId: !!existingAccountId,
      accountId: existingAccountId,
      userId: user.id,
      body: body,
    })

    // Check if seller already has a Stripe Connect account
    const { data: existingAccount } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    // If an account_id was provided, create onboarding link for existing account
    console.log('Checking existing account conditions:', {
      existingAccountId,
      existingAccountStripeId: existingAccount?.stripe_connect_account_id,
      shouldUseExistingAccount: !!(existingAccountId || existingAccount?.stripe_connect_account_id),
    })
    
    if (existingAccountId || existingAccount?.stripe_connect_account_id) {
      const accountId = existingAccountId || existingAccount.stripe_connect_account_id
      
      console.log('Using existing account flow for account:', accountId)
      
      try {
        // Verify account exists in Stripe
        await stripe.accounts.retrieve(accountId)
        
        // Create account onboarding link for existing account
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: body.refresh_url || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&refresh=true`,
          return_url: body.return_url || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&success=true`,
          type: 'account_onboarding',
        })

        return NextResponse.json({
          success: true,
          account_id: accountId,
          onboarding_url: accountLink.url,
        })
      } catch (stripeError) {
        console.error('Error with existing Stripe account:', stripeError)
        // If account doesn't exist in Stripe, continue to create new one
        if ((stripeError as any)?.code === 'resource_missing') {
          console.log('Existing account not found in Stripe, creating new one')
        } else {
          return NextResponse.json(
            { error: 'Failed to access existing Stripe account' },
            { status: 500 }
          )
        }
      }
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // You may want to make this configurable
      email: profile.email,
      metadata: {
        user_id: user.id,
        username: profile.username || '',
      },
    })

    // Store the account in the database
    const { error: insertError } = await supabase
      .from('profiles')
      .update({
        stripe_connect_account_id: account.id,
      })
      .eq('id', user.id)

    if (insertError) {
      // If database insert fails, clean up the Stripe account
      await stripe.accounts.del(account.id).catch(console.error)
      throw insertError
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=seller&success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      account_id: account.id,
      onboarding_url: accountLink.url,
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
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get seller's Stripe account
    const { data: sellerAccount, error } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (error || !sellerAccount?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    // Get fresh account data from Stripe
    const account = await stripe.accounts.retrieve(sellerAccount.stripe_connect_account_id)


    return NextResponse.json({
      account: {
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements_due: account.requirements?.currently_due || [],
      }
    })
  } catch (error) {
    console.error('Error fetching Stripe account:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Stripe account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}