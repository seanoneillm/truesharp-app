import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Starting webhook health check...')

    // 1. Check recent Stripe events
    let recentEvents: unknown[] = []
    try {
      const events = await stripe.events.list({
        limit: 10,
        type: 'checkout.session.completed',
      })
      recentEvents = events.data
      console.log('📋 Recent checkout.session.completed events:', recentEvents.length)
    } catch (error) {
      console.error('Error fetching Stripe events:', error)
    }

    // 2. Find any orphaned subscriptions (exist in Stripe but not in DB)
    const orphanedSubscriptions: unknown[] = []

    try {
      const stripeSubscriptions = await stripe.subscriptions.list({
        limit: 20,
        created: {
          gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
        },
      })

      for (const stripeSub of stripeSubscriptions.data) {
        // Check if exists in database
        const { data: dbSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', stripeSub.id)
          .single()

        if (!dbSub && stripeSub.status === 'active') {
          orphanedSubscriptions.push({
            stripe_id: stripeSub.id,
            customer: stripeSub.customer,
            status: stripeSub.status,
            metadata: stripeSub.metadata,
            created: stripeSub.created,
          })
        }
      }
    } catch (error) {
      console.error('Error checking for orphaned subscriptions:', error)
    }

    // 3. Check for missing strategies referenced in Stripe metadata
    const missingStrategies: unknown[] = []

    try {
      const stripeSubscriptions = await stripe.subscriptions.list({ limit: 20 })

      for (const stripeSub of stripeSubscriptions.data) {
        const metadata = stripeSub.metadata
        if (metadata.strategy_id) {
          const { data: strategy } = await supabase
            .from('strategies')
            .select('id, name')
            .eq('id', metadata.strategy_id)
            .single()

          if (!strategy) {
            missingStrategies.push({
              stripe_subscription_id: stripeSub.id,
              missing_strategy_id: metadata.strategy_id,
              subscriber_id: metadata.subscriber_id,
              seller_id: metadata.seller_id,
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking for missing strategies:', error)
    }

    // 4. Get webhook endpoint configuration status
    let webhookEndpoints: unknown[] = []
    try {
      const endpoints = await stripe.webhookEndpoints.list()
      webhookEndpoints = endpoints.data.map(endpoint => ({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        enabled_events: endpoint.enabled_events,
      }))
    } catch (error) {
      console.error('Error fetching webhook endpoints:', error)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health_check: {
        recent_events: recentEvents.length,
        orphaned_subscriptions: orphanedSubscriptions.length,
        missing_strategies: missingStrategies.length,
        webhook_endpoints: webhookEndpoints.length,
      },
      details: {
        recent_checkout_events: recentEvents.map(event => {
          const e = event as { 
            id: string; 
            created: number; 
            type: string; 
            data: { object: { id: string; metadata: Record<string, string> | null } } 
          }
          return {
            id: e.id,
            created: e.created,
            type: e.type,
            session_id: e.data.object.id,
            metadata: e.data.object.metadata,
          }
        }),
        orphaned_subscriptions: orphanedSubscriptions,
        missing_strategies: missingStrategies,
        webhook_endpoints: webhookEndpoints,
      },
      recommendations:
        orphanedSubscriptions.length > 0
          ? [
              'Found orphaned subscriptions that exist in Stripe but not in database',
              'Use /api/debug/recover-subscription to manually recover these subscriptions',
              'Check webhook configuration and error logs',
            ]
          : ['No orphaned subscriptions found - webhook processing appears healthy'],
    })
  } catch (error) {
    console.error('Webhook health check error:', error)
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
