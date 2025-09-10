import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { sellerId } = await request.json()

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 })
    }

    // Get the current user's session using server client with proper auth handling
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user || user.id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller's Stripe Connect account
    const { data: sellerAccount } = await supabase
      .from('seller_stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', sellerId)
      .single()

    if (!sellerAccount?.stripe_account_id) {
      return NextResponse.json({
        totalRevenue: 0,
        subscriberCount: 0,
        activeSubscriptions: [],
        pendingPayments: 0,
        strategyMetrics: {},
      })
    }

    const stripeAccountId = sellerAccount.stripe_account_id

    // Fetch subscriptions for this seller
    const subscriptions = await stripe.subscriptions.list({
      expand: ['data.items.data.price.product', 'data.customer'],
      limit: 100,
    }, {
      stripeAccount: stripeAccountId,
    })

    // Filter active subscriptions
    const activeSubscriptions = subscriptions.data.filter(sub => 
      ['active', 'trialing'].includes(sub.status)
    )

    // Calculate total revenue (monthly recurring)
    let totalRevenue = 0
    const subscriberCount = activeSubscriptions.length
    const strategyMetrics: Record<string, { subscribers: number; revenue: number; tiers: string[] }> = {}

    activeSubscriptions.forEach(sub => {
      sub.items.data.forEach(item => {
        if (item.price && item.price.product) {
          const product = item.price.product as any
          const strategyId = product.metadata?.strategy_id || 'unknown'
          
          // Calculate monthly amount
          let monthlyAmount = item.price.unit_amount || 0
          if (item.price.recurring?.interval === 'year') {
            monthlyAmount = monthlyAmount / 12
          } else if (item.price.recurring?.interval === 'week') {
            monthlyAmount = monthlyAmount * 4.33
          }
          
          // Convert from cents to dollars and apply marketplace fee (seller keeps ~82%)
          const revenueAmount = (monthlyAmount / 100) * 0.82
          totalRevenue += revenueAmount

          // Track strategy metrics
          if (!strategyMetrics[strategyId]) {
            strategyMetrics[strategyId] = {
              subscribers: 0,
              revenue: 0,
              tiers: [],
            }
          }
          
          strategyMetrics[strategyId].subscribers += 1
          strategyMetrics[strategyId].revenue += revenueAmount
          
          const tier = item.price.recurring?.interval || 'monthly'
          if (!strategyMetrics[strategyId].tiers.includes(tier)) {
            strategyMetrics[strategyId].tiers.push(tier)
          }
        }
      })
    })

    // Get pending invoices
    const pendingInvoices = await stripe.invoices.list({
      status: 'open',
      limit: 10,
    }, {
      stripeAccount: stripeAccountId,
    })

    const pendingPayments = pendingInvoices.data.length

    // Format subscription data for response
    const formattedSubscriptions = activeSubscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: (sub as any).current_period_start,
      current_period_end: (sub as any).current_period_end,
      customer: {
        id: (sub.customer as any)?.id || '',
        email: (sub.customer as any)?.email || '',
        name: (sub.customer as any)?.name || undefined,
      },
      items: sub.items.data.map(item => ({
        price: {
          id: item.price?.id || '',
          unit_amount: item.price?.unit_amount || 0,
          recurring: {
            interval: item.price?.recurring?.interval || 'month',
          },
        },
        product: {
          id: (item.price?.product as any)?.id || '',
          name: (item.price?.product as any)?.name || '',
          metadata: (item.price?.product as any)?.metadata || {},
        },
      })),
    }))

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      subscriberCount,
      activeSubscriptions: formattedSubscriptions,
      pendingPayments,
      strategyMetrics,
    })

  } catch (error) {
    console.error('Error fetching seller Stripe data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller data' },
      { status: 500 }
    )
  }
}