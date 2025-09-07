import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    // Get the current user's session using server client with proper auth handling
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer ID from database if not provided
    let stripeCustomerId = customerId
    if (!stripeCustomerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      stripeCustomerId = profile?.stripe_customer_id
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ subscriptions: [] })
    }

    // Fetch all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      expand: ['data.items.data.price.product'],
      limit: 100,
    })

    // Get TrueSharp Pro subscriptions
    const { data: proSubscriptions } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Format subscription data
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: (sub as any).current_period_start,
      current_period_end: (sub as any).current_period_end,
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

    // Add TrueSharp Pro subscriptions to the list
    const proSubsFormatted = proSubscriptions?.map(proSub => ({
      id: proSub.stripe_subscription_id,
      status: proSub.status,
      current_period_start: Math.floor(new Date(proSub.current_period_start).getTime() / 1000),
      current_period_end: Math.floor(new Date(proSub.current_period_end).getTime() / 1000),
      items: [{
        price: {
          id: proSub.price_id,
          unit_amount: proSub.plan === 'yearly' ? 20000 : 2000, // $200/year or $20/month
          recurring: {
            interval: proSub.plan === 'yearly' ? 'year' : 'month',
          },
        },
        product: {
          id: 'truesharp-pro',
          name: 'TrueSharp Pro',
          metadata: {
            type: 'truesharp_pro',
          },
        },
      }],
    })) || []

    const allSubscriptions = [...formattedSubscriptions, ...proSubsFormatted]

    return NextResponse.json({
      subscriptions: allSubscriptions,
    })

  } catch (error) {
    console.error('Error fetching subscriber Stripe data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriber data' },
      { status: 500 }
    )
  }
}