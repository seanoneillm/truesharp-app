import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const strategyId = resolvedParams.id

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 })
    }

    // Create service role client for database operations to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get strategy with Stripe product ID and price IDs and verify ownership
    const { data: strategy, error: fetchError } = await serviceSupabase
      .from('strategies')
      .select('id, name, stripe_product_id, stripe_price_weekly_id, stripe_price_monthly_id, stripe_price_yearly_id, user_id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found or access denied' }, { status: 404 })
    }

    // Get all active subscriptions for this strategy
    const { data: subscriptions, error: subscriptionsError } = await serviceSupabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('strategy_id', strategyId)
      .eq('status', 'active')

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Cancel all subscriptions in Stripe first
    if (subscriptions && subscriptions.length > 0) {
      console.log(`🚫 Canceling ${subscriptions.length} subscriptions for strategy ${strategyId}`)
      
      for (const subscription of subscriptions) {
        if (subscription.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
            console.log(`✅ Canceled subscription: ${subscription.stripe_subscription_id}`)
          } catch (stripeError) {
            console.error(`❌ Failed to cancel subscription ${subscription.stripe_subscription_id}:`, stripeError)
            // Continue with other subscriptions even if one fails
          }
        }
      }
    }

    // Delete Stripe prices and product if they exist
    if (strategy.stripe_product_id) {
      try {
        // First, list all prices for this product to make sure we get them all
        const prices = await stripe.prices.list({
          product: strategy.stripe_product_id,
          active: true,
          limit: 100
        })

        console.log(`🗑️ Found ${prices.data.length} active Stripe prices for product ${strategy.stripe_product_id}`)
        
        // Deactivate all active prices for this product
        for (const price of prices.data) {
          try {
            await stripe.prices.update(price.id, { active: false })
            console.log(`✅ Deactivated Stripe price: ${price.id}`)
          } catch (priceError) {
            console.error(`❌ Failed to deactivate price ${price.id}:`, priceError)
            // Continue with other prices even if one fails
          }
        }

        // Now try to delete the product (should work since all prices are deactivated)
        await stripe.products.del(strategy.stripe_product_id)
        console.log(`✅ Deleted Stripe product: ${strategy.stripe_product_id}`)
      } catch (stripeError: any) {
        console.error(`❌ Failed to delete Stripe product ${strategy.stripe_product_id}:`, stripeError)
        
        // If deletion still fails, try archiving the product instead
        if (stripeError.message?.includes('user-created prices')) {
          try {
            await stripe.products.update(strategy.stripe_product_id, { active: false })
            console.log(`✅ Archived Stripe product instead: ${strategy.stripe_product_id}`)
          } catch (archiveError) {
            console.error(`❌ Failed to archive Stripe product:`, archiveError)
          }
        }
        // Continue with database cleanup even if Stripe operations fail
      }
    }

    // Delete all related data from database (use service role to bypass RLS)
    try {
      // Delete subscriptions (this will cascade or we can delete manually)
      const { error: deleteSubscriptionsError } = await serviceSupabase
        .from('subscriptions')
        .delete()
        .eq('strategy_id', strategyId)

      if (deleteSubscriptionsError) {
        console.error('Error deleting subscriptions:', deleteSubscriptionsError)
      } else {
        console.log('✅ Deleted subscriptions from database')
      }

      // Delete strategy_leaderboard entries
      const { error: deleteLeaderboardError } = await serviceSupabase
        .from('strategy_leaderboard')
        .delete()
        .eq('strategy_id', strategyId)

      if (deleteLeaderboardError) {
        console.error('Error deleting strategy_leaderboard:', deleteLeaderboardError)
      } else {
        console.log('✅ Deleted strategy_leaderboard entries')
      }

      // Delete strategy_bets relationships
      const { error: deleteStrategyBetsError } = await serviceSupabase
        .from('strategy_bets')
        .delete()
        .eq('strategy_id', strategyId)

      if (deleteStrategyBetsError) {
        console.error('Error deleting strategy_bets:', deleteStrategyBetsError)
      } else {
        console.log('✅ Deleted strategy_bets relationships')
      }

      // Finally, delete the strategy itself
      const { error: deleteStrategyError } = await serviceSupabase
        .from('strategies')
        .delete()
        .eq('id', strategyId)

      if (deleteStrategyError) {
        console.error('Error deleting strategy:', deleteStrategyError)
        return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 })
      }

      console.log('✅ Deleted strategy from database')

    } catch (dbError) {
      console.error('Database cleanup error:', dbError)
      return NextResponse.json({ error: 'Failed to delete strategy data' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Strategy "${strategy.name}" and all related data deleted successfully`,
      deletedSubscriptions: subscriptions?.length || 0
    })

  } catch (error) {
    console.error('Error in DELETE strategy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}