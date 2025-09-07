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
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (error || !sellerAccount) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      )
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: sellerAccount.stripe_account_id,
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