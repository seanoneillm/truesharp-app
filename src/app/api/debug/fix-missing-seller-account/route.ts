import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Get authenticated user (must be seanoneill715 to work with RLS)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required - must be logged in as seanoneill715' },
        { status: 401 }
      )
    }

    // Verify this is seanoneill715
    const seanUserId = "28991397-dae7-42e8-a822-0dffc6ff49b7"
    const seanStripeAccountId = "acct_1Roci3FZGaZbtPC8"
    
    if (user.id !== seanUserId) {
      return NextResponse.json(
        { error: 'This fix is only for seanoneill715', user_id: user.id, expected: seanUserId },
        { status: 403 }
      )
    }
    
    // Verify the Stripe account exists and get current status
    let stripeAccount
    try {
      stripeAccount = await stripe.accounts.retrieve(seanStripeAccountId)
    } catch (err) {
      return NextResponse.json(
        { error: 'Stripe account not found', details: err instanceof Error ? err.message : 'Unknown' },
        { status: 404 }
      )
    }

    // Check if record already exists (shouldn't, but let's be safe)
    const { data: existingRecord } = await supabase
      .from('seller_stripe_accounts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Record already exists' },
        { status: 409 }
      )
    }

    // Create the missing database record using authenticated user's ID
    const { data: newRecord, error: insertError } = await supabase
      .from('seller_stripe_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: seanStripeAccountId,
        details_submitted: stripeAccount.details_submitted || false,
        charges_enabled: stripeAccount.charges_enabled || false,
        payouts_enabled: stripeAccount.payouts_enabled || false,
        requirements_due: stripeAccount.requirements?.currently_due || [],
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create database record', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Missing seller account record created successfully!',
      record: newRecord,
      stripe_account_status: {
        id: stripeAccount.id,
        details_submitted: stripeAccount.details_submitted,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
      }
    })
  } catch (error) {
    console.error('Fix missing account error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}