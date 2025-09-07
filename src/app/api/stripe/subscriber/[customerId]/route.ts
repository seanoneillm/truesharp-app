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
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId } = await context.params

    const supabase = createClient()

    // Verify the customer ID belongs to the current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id !== customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      expand: ['data.items.price.product'],
      limit: 100,
    })

    return NextResponse.json({
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        items: sub.items.data.map(item => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          },
          product: {
            id: (item.price.product as any).id,
            name: (item.price.product as any).name,
            description: (item.price.product as any).description,
            metadata: (item.price.product as any).metadata,
          },
        })),
        current_period_start: (sub as any).current_period_start,
        current_period_end: (sub as any).current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        metadata: sub.metadata,
        created: sub.created,
      })),
    })
  } catch (error) {
    console.error('Error fetching subscriber Stripe data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriber data' },
      { status: 500 }
    )
  }
}