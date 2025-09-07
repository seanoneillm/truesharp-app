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

    // Get seller's Stripe account
    const { data: sellerAccount, error } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id, details_submitted')
      .eq('user_id', user.id)
      .single()

    if (error || !sellerAccount) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    if (!sellerAccount.details_submitted) {
      return NextResponse.json(
        { error: 'Account setup must be completed first' },
        { status: 400 }
      )
    }

    // Create login link for the connected account
    const loginLink = await stripe.accounts.createLoginLink(
      sellerAccount.stripe_account_id
    )

    return NextResponse.json({
      success: true,
      login_url: loginLink.url,
    })
  } catch (error) {
    console.error('Stripe login link creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create login link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}