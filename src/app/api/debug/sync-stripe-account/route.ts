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

    const { stripe_account_id } = await request.json()

    if (!stripe_account_id) {
      return NextResponse.json(
        { error: 'stripe_account_id is required' },
        { status: 400 }
      )
    }

    // Verify the Stripe account exists and get its details
    let account
    try {
      account = await stripe.accounts.retrieve(stripe_account_id)
    } catch (err) {
      return NextResponse.json(
        { error: 'Stripe account not found', details: err instanceof Error ? err.message : 'Unknown' },
        { status: 404 }
      )
    }

    // Check if already exists in database
    const { data: existingRecord } = await supabase
      .from('seller_stripe_accounts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Database record already exists for this user' },
        { status: 409 }
      )
    }

    // Create the database record
    const { data: newRecord, error: insertError } = await supabase
      .from('seller_stripe_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        details_submitted: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        requirements_due: account.requirements?.currently_due || [],
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
      message: 'Stripe account successfully synced to database',
      account: {
        database_id: newRecord.id,
        stripe_account_id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }
    })
  } catch (error) {
    console.error('Sync endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}