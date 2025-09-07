import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get database Stripe account record
    const { data: dbAccount, error: dbError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let stripeAccountData = null
    let stripeError = null

    // If we have a database record, check the actual Stripe account
    if (dbAccount && dbAccount.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(dbAccount.stripe_account_id)
        stripeAccountData = {
          id: account.id,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          requirements: account.requirements,
          capabilities: account.capabilities,
        }
      } catch (err) {
        stripeError = err instanceof Error ? err.message : 'Unknown Stripe error'
      }
    }

    // Also check if there are any Stripe accounts with this user's email
    let possibleAccounts: string[] = []
    try {
      // Note: This is limited - Stripe doesn't allow searching by email directly
      // We can only check the account we think should exist
      possibleAccounts = dbAccount ? [dbAccount.stripe_account_id] : []
    } catch (err) {
      // Ignore search errors
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      database_stripe_account: dbAccount || null,
      actual_stripe_account: stripeAccountData,
      stripe_error: stripeError,
      possible_accounts: possibleAccounts,
      errors: {
        profile: profileError?.message,
        database: dbError?.message,
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}