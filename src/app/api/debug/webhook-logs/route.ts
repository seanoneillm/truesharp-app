import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Webhook logs and debugging info...')

    // Check recent subscriptions in database
    const { data: recentSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, status, created_at, strategy_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (subError) {
      console.error('Error fetching recent subscriptions:', subError)
    }

    // Check if the strategy exists
    const { data: strategy, error: stratError } = await supabase
      .from('strategies')
      .select('id, name, user_id, pricing_monthly')
      .eq('id', '13ce72e8-62cc-4e2a-b4d4-2c11bc0c6fb2')
      .single()

    if (stratError) {
      console.error('Error fetching strategy:', stratError)
    }

    // Check recent Stripe events
    let recentEvents: any[] = []
    try {
      const events = await stripe.events.list({
        limit: 3,
        type: 'checkout.session.completed',
      })
      recentEvents = events.data.map(event => ({
        id: event.id,
        created: event.created,
        type: event.type,
      }))
    } catch (error) {
      console.error('Error fetching Stripe events:', error)
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhook_secret_prefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 12),
        recent_subscriptions: recentSubs || [],
        test_strategy: strategy || null,
        recent_stripe_events: recentEvents,
        environment: {
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      }
    })

  } catch (error) {
    console.error('Debug logs error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}