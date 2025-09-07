import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Get authenticated user (buyer)
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

    const { strategyId, sellerId } = await request.json()

    if (!strategyId || !sellerId) {
      return NextResponse.json(
        { error: 'strategyId and sellerId required' },
        { status: 400 }
      )
    }

    // Step 1: Get strategy details
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select(`
        id, name, user_id,
        stripe_product_id,
        stripe_price_weekly_id,
        stripe_price_monthly_id,
        stripe_price_yearly_id,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly
      `)
      .eq('id', strategyId)
      .single()

    // Step 2: Get seller's Stripe Connect account
    const { data: sellerAccount, error: sellerError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')
      .eq('user_id', sellerId)
      .single()

    // Step 3: Get seller profile
    const { data: sellerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, is_seller, stripe_connect_account_id')
      .eq('id', sellerId)
      .single()

    return NextResponse.json({
      buyer: {
        id: user.id,
        email: user.email,
      },
      strategy: strategy || null,
      strategy_error: strategyError?.message,
      seller_account: sellerAccount || null,
      seller_account_error: sellerError?.message,
      seller_profile: sellerProfile || null,
      seller_profile_error: profileError?.message,
      debug_info: {
        provided_strategy_id: strategyId,
        provided_seller_id: sellerId,
        strategy_user_id: strategy?.user_id,
        seller_id_match: strategy?.user_id === sellerId,
      }
    })
  } catch (error) {
    console.error('Subscription test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}