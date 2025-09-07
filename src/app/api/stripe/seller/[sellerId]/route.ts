import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth/auth-helpers-server'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil' as any,
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sellerId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sellerId } = await context.params

    // Verify the user is requesting their own data
    if (user.id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient()

    // Get seller's strategies with Stripe product IDs
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        stripe_product_id,
        stripe_price_weekly_id,
        stripe_price_monthly_id,
        stripe_price_yearly_id,
        monetized,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly
      `)
      .eq('user_id', sellerId)
      .eq('monetized', true)

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return NextResponse.json(
        { error: 'Failed to fetch strategies' },
        { status: 500 }
      )
    }

    // Filter strategies that have Stripe products configured
    const stripeStrategies = (strategies || []).filter(s => s.stripe_product_id)

    if (stripeStrategies.length === 0) {
      console.log('⚠️ No Stripe products found for seller strategies:', sellerId)
      return NextResponse.json({
        totalRevenue: 0,
        subscriberCount: 0,
        pendingPayments: 0,
        strategyMetrics: {},
        subscriptions: [],
        hasStripeAccount: false,
        message: 'No Stripe products configured for strategies'
      })
    }

    console.log('✅ Found', stripeStrategies.length, 'strategies with Stripe products for seller:', sellerId)

    // Get all price IDs for the seller's strategies
    const allPriceIds = stripeStrategies.reduce((prices: string[], strategy) => {
      if (strategy.stripe_price_weekly_id) prices.push(strategy.stripe_price_weekly_id)
      if (strategy.stripe_price_monthly_id) prices.push(strategy.stripe_price_monthly_id)
      if (strategy.stripe_price_yearly_id) prices.push(strategy.stripe_price_yearly_id)
      return prices
    }, [])

    console.log('🔍 Fetching subscriptions for price IDs:', allPriceIds)

    // Fetch subscriptions for all price IDs
    
    // We need to query by price ID, but Stripe doesn't have a direct way to do this
    // So we'll get all subscriptions and filter by price ID
    const subscriptions = await stripe.subscriptions.list({
      expand: ['data.customer', 'data.items.data.price'],
      status: 'all',
      limit: 100,
    })

    // Filter subscriptions to only include those with our price IDs
    const relevantSubscriptions = subscriptions.data.filter(sub => 
      sub.items.data.some(item => allPriceIds.includes(item.price.id))
    )

    // Filter to active subscriptions and calculate metrics
    const activeSubscriptions = relevantSubscriptions.filter(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    console.log('✅ Found', relevantSubscriptions.length, 'total subscriptions,', activeSubscriptions.length, 'active')

    // Create a mapping from price ID to strategy
    const priceToStrategy = new Map<string, any>()
    stripeStrategies.forEach(strategy => {
      if (strategy.stripe_price_weekly_id) priceToStrategy.set(strategy.stripe_price_weekly_id, strategy)
      if (strategy.stripe_price_monthly_id) priceToStrategy.set(strategy.stripe_price_monthly_id, strategy)
      if (strategy.stripe_price_yearly_id) priceToStrategy.set(strategy.stripe_price_yearly_id, strategy)
    })

    // Calculate total monthly revenue
    let totalRevenue = 0
    const strategyMetrics: Record<string, {
      subscribers: number
      revenue: number
      tiers: string[]
    }> = {}

    for (const subscription of activeSubscriptions) {
      const lineItem = subscription.items.data[0]
      if (!lineItem) continue

      const priceId = lineItem.price.id
      const strategy = priceToStrategy.get(priceId)
      
      if (!strategy) {
        console.warn('⚠️ Could not find strategy for price ID:', priceId)
        continue
      }

      const amount = lineItem.price.unit_amount || 0
      const interval = lineItem.price.recurring?.interval || 'month'

      // Convert to monthly revenue
      let monthlyAmount = amount / 100 // Convert from cents
      if (interval === 'year') {
        monthlyAmount = monthlyAmount / 12
      } else if (interval === 'week') {
        monthlyAmount = monthlyAmount * 4.33 // ~4.33 weeks per month
      }

      // Apply platform fee (seller gets 82% after Stripe + platform fees)
      const sellerRevenue = monthlyAmount * 0.82

      totalRevenue += sellerRevenue

      // Track by strategy ID
      const strategyId = strategy.id
      if (!strategyMetrics[strategyId]) {
        strategyMetrics[strategyId] = {
          subscribers: 0,
          revenue: 0,
          tiers: [],
        }
      }

      strategyMetrics[strategyId].subscribers += 1
      strategyMetrics[strategyId].revenue += sellerRevenue

      // Track pricing tiers
      const tierName = `$${amount / 100}/${interval}`
      if (!strategyMetrics[strategyId].tiers.includes(tierName)) {
        strategyMetrics[strategyId].tiers.push(tierName)
      }
    }

    // For now, we'll set pending payments to 0 since we're querying by product ID
    // In a full Connect implementation, this would query the seller's Connect account
    const pendingPayments = 0

    const result = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      subscriberCount: activeSubscriptions.length,
      pendingPayments: Math.round(pendingPayments * 100) / 100,
      strategyMetrics,
      subscriptions: activeSubscriptions.map(sub => {
        const lineItem = sub.items.data[0]
        const priceId = lineItem?.price.id
        const strategy = priceToStrategy.get(priceId || '')
        
        return {
          id: sub.id,
          status: sub.status,
          customer_email: typeof sub.customer === 'object' && sub.customer && 'email' in sub.customer ? (sub.customer as any).email : null,
          amount: lineItem?.price.unit_amount || 0,
          interval: lineItem?.price.recurring?.interval || 'month',
          current_period_start: (sub as any).current_period_start,
          current_period_end: (sub as any).current_period_end,
          strategy_id: strategy?.id || null,
          product_name: strategy?.name || 'Strategy Subscription',
        }
      }),
      hasStripeAccount: true,
      message: 'Stripe data loaded successfully'
    }

    console.log('✅ Returning Stripe seller data:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching seller Stripe data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller data' },
      { status: 500 }
    )
  }
}