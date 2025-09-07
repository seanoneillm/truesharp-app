import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'

interface CreateProductRequest {
  strategyId: string
  strategyName: string
  description?: string
  pricing: {
    weekly?: number
    monthly?: number
    yearly?: number
  }
}

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

    const body: CreateProductRequest = await request.json()
    const { strategyId, strategyName, description, pricing } = body

    if (!strategyId || !strategyName) {
      return NextResponse.json(
        { error: 'Strategy ID and name are required' },
        { status: 400 }
      )
    }

    // Verify strategy belongs to user and get seller's Stripe account
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .select(`
        *,
        profiles!inner(stripe_connect_account_id:seller_stripe_accounts(stripe_account_id))
      `)
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (strategyError || !strategyData) {
      return NextResponse.json(
        { error: 'Strategy not found or access denied' },
        { status: 404 }
      )
    }

    // Get seller's Stripe Connect account
    const { data: sellerAccount, error: accountError } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id, details_submitted, charges_enabled')
      .eq('user_id', user.id)
      .single()

    if (accountError || !sellerAccount) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found. Please complete seller onboarding first.' },
        { status: 400 }
      )
    }

    if (!sellerAccount.details_submitted || !sellerAccount.charges_enabled) {
      return NextResponse.json(
        { error: 'Stripe Connect account setup not completed. Please complete onboarding first.' },
        { status: 400 }
      )
    }

    // Create Stripe product on the connected account
    const product = await stripe.products.create({
      name: `${strategyName} - Strategy Subscription`,
      description: description || `Access to ${strategyName} betting strategy`,
      metadata: {
        strategy_id: strategyId,
        user_id: user.id,
        strategy_name: strategyName,
      },
    }, {
      stripeAccount: sellerAccount.stripe_account_id,
    })

    // Create prices for each frequency that has a value
    const priceIds: Record<string, string> = {}

    if (pricing.weekly && pricing.weekly > 0) {
      const weeklyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pricing.weekly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'week',
        },
        metadata: {
          strategy_id: strategyId,
          frequency: 'weekly',
        },
      }, {
        stripeAccount: sellerAccount.stripe_account_id,
      })
      priceIds.weekly = weeklyPrice.id
    }

    if (pricing.monthly && pricing.monthly > 0) {
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pricing.monthly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          strategy_id: strategyId,
          frequency: 'monthly',
        },
      }, {
        stripeAccount: sellerAccount.stripe_account_id,
      })
      priceIds.monthly = monthlyPrice.id
    }

    if (pricing.yearly && pricing.yearly > 0) {
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pricing.yearly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          strategy_id: strategyId,
          frequency: 'yearly',
        },
      }, {
        stripeAccount: sellerAccount.stripe_account_id,
      })
      priceIds.yearly = yearlyPrice.id
    }

    // Update strategy with Stripe product and price IDs
    const { error: updateError } = await supabase
      .from('strategies')
      .update({
        stripe_product_id: product.id,
        stripe_price_weekly_id: priceIds.weekly || null,
        stripe_price_monthly_id: priceIds.monthly || null,
        stripe_price_yearly_id: priceIds.yearly || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)

    if (updateError) {
      console.error('Failed to update strategy with Stripe IDs:', updateError)
      // Continue anyway, we can retry this later
    }

    return NextResponse.json({
      success: true,
      product_id: product.id,
      price_ids: priceIds,
    })
  } catch (error) {
    console.error('Stripe product creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create Stripe product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      )
    }

    // Get strategy with Stripe IDs
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('stripe_product_id, user_id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json(
        { error: 'Strategy not found or access denied' },
        { status: 404 }
      )
    }

    // Get seller's Stripe Connect account
    const { data: sellerAccount, error: accountError } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (accountError || !sellerAccount) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 400 }
      )
    }

    // Archive the Stripe product (can't delete products with active subscriptions)
    if (strategy.stripe_product_id) {
      try {
        await stripe.products.update(strategy.stripe_product_id, {
          active: false,
        }, {
          stripeAccount: sellerAccount.stripe_account_id,
        })
      } catch (error) {
        console.error('Error archiving Stripe product:', error)
        // Continue anyway
      }
    }

    // Clear Stripe IDs from strategy
    const { error: updateError } = await supabase
      .from('strategies')
      .update({
        stripe_product_id: null,
        stripe_price_weekly_id: null,
        stripe_price_monthly_id: null,
        stripe_price_yearly_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)

    if (updateError) {
      console.error('Failed to clear Stripe IDs from strategy:', updateError)
      return NextResponse.json(
        { error: 'Failed to update strategy' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error archiving Stripe product:', error)
    return NextResponse.json(
      {
        error: 'Failed to archive Stripe product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}