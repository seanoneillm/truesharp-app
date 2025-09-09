import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface HealthCheckResult {
  orphaned_subscriptions?: { count: number; details: unknown[] }
  ghost_subscriptions?: { count: number; details: unknown[] }
  webhook_endpoints?: { relevant_endpoints: number; total_endpoints: number; details: unknown[] }
  monetized_strategies?: { count: number; details: unknown[] }
  recent_webhook_events?: {
    count: number
    last_24h: number
    details: unknown[]
    events?: unknown[]
  }
}

export async function GET() {
  try {
    console.log('🔍 Starting comprehensive webhook health check...')

    const healthReport = {
      timestamp: new Date().toISOString(),
      checks: {} as HealthCheckResult,
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // 1. Check for orphaned Stripe subscriptions (exist in Stripe but not in DB)
    console.log('🔍 Checking for orphaned subscriptions...')
    const orphanedSubscriptions = []

    try {
      const stripeSubscriptions = await stripe.subscriptions.list({
        limit: 50,
        status: 'active',
      })

      for (const stripeSub of stripeSubscriptions.data) {
        // Skip Pro subscriptions (they use different table)
        if (stripeSub.metadata?.subscription_type === 'pro') continue

        const { data: dbSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', stripeSub.id)
          .single()

        if (!dbSub) {
          orphanedSubscriptions.push({
            stripe_id: stripeSub.id,
            customer: stripeSub.customer,
            status: stripeSub.status,
            metadata: stripeSub.metadata,
            created: new Date(stripeSub.created * 1000).toISOString(),
          })
        }
      }

      healthReport.checks.orphaned_subscriptions = {
        count: orphanedSubscriptions.length,
        details: orphanedSubscriptions,
      }

      if (orphanedSubscriptions.length > 0) {
        healthReport.issues.push(`Found ${orphanedSubscriptions.length} orphaned subscriptions`)
        healthReport.recommendations.push(
          'Use /api/debug/recover-subscription to recover orphaned subscriptions'
        )
      }
    } catch (error) {
      console.error('Error checking orphaned subscriptions:', error)
      healthReport.issues.push('Failed to check for orphaned subscriptions')
    }

    // 2. Check for ghost database subscriptions (exist in DB but not in Stripe)
    console.log('🔍 Checking for ghost database subscriptions...')
    const ghostSubscriptions = []

    try {
      const { data: dbSubscriptions } = await supabase
        .from('subscriptions')
        .select('id, stripe_subscription_id, status')
        .eq('status', 'active')

      if (dbSubscriptions) {
        for (const dbSub of dbSubscriptions) {
          try {
            await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id)
          } catch (stripeError: unknown) {
            const error = stripeError as { code?: string }
            if (error.code === 'resource_missing') {
              ghostSubscriptions.push({
                db_id: dbSub.id,
                stripe_id: dbSub.stripe_subscription_id,
                status: dbSub.status,
              })
            }
          }
        }
      }

      healthReport.checks.ghost_subscriptions = {
        count: ghostSubscriptions.length,
        details: ghostSubscriptions,
      }

      if (ghostSubscriptions.length > 0) {
        healthReport.issues.push(`Found ${ghostSubscriptions.length} ghost database subscriptions`)
        healthReport.recommendations.push('Update ghost subscriptions to cancelled status')
      }
    } catch (error) {
      console.error('Error checking ghost subscriptions:', error)
      healthReport.issues.push('Failed to check for ghost subscriptions')
    }

    // 3. Check webhook endpoint configuration
    console.log('🔍 Checking webhook configuration...')
    try {
      const webhookEndpoints = await stripe.webhookEndpoints.list()
      const relevantEndpoints = webhookEndpoints.data.filter(endpoint =>
        endpoint.url.includes('/api/webhooks/stripe')
      )

      healthReport.checks.webhook_endpoints = {
        total_endpoints: webhookEndpoints.data.length,
        relevant_endpoints: relevantEndpoints.length,
        details: relevantEndpoints.map(endpoint => ({
          id: endpoint.id,
          url: endpoint.url,
          status: endpoint.status,
          enabled_events: endpoint.enabled_events,
        })),
      }

      if (relevantEndpoints.length === 0) {
        healthReport.issues.push('No webhook endpoints configured for /api/webhooks/stripe')
        healthReport.recommendations.push('Configure webhook endpoint in Stripe dashboard')
      }
    } catch (error) {
      console.error('Error checking webhook endpoints:', error)
      healthReport.issues.push('Failed to check webhook configuration')
    }

    // 4. Check for recent webhook events
    console.log('🔍 Checking recent webhook events...')
    try {
      const recentEvents = await stripe.events.list({
        limit: 20,
        types: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
        ],
      })

      healthReport.checks.recent_webhook_events = {
        count: recentEvents.data.length,
        last_24h: recentEvents.data.filter(
          event => new Date(event.created * 1000) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        details: [],
        events: recentEvents.data.map(event => ({
          id: event.id,
          type: event.type,
          created: new Date(event.created * 1000).toISOString(),
          object_id: (event.data.object as { id?: string }).id || 'unknown',
        })),
      }
    } catch (error) {
      console.error('Error checking recent events:', error)
      healthReport.issues.push('Failed to check recent webhook events')
    }

    // 5. Check strategy availability
    console.log('🔍 Checking strategy availability...')
    try {
      const { data: strategies } = await supabase
        .from('strategies')
        .select('id, name, stripe_product_id')
        .not('stripe_product_id', 'is', null)

      healthReport.checks.monetized_strategies = {
        count: strategies?.length || 0,
        details: strategies || [],
      }

      if (!strategies || strategies.length === 0) {
        healthReport.issues.push('No monetized strategies available')
        healthReport.recommendations.push('Create and monetize at least one strategy for testing')
      }
    } catch (error) {
      console.error('Error checking strategies:', error)
      healthReport.issues.push('Failed to check strategy availability')
    }

    // Generate overall health status
    const overallHealth =
      healthReport.issues.length === 0
        ? 'HEALTHY'
        : healthReport.issues.length <= 2
          ? 'WARNING'
          : 'CRITICAL'

    return NextResponse.json({
      success: true,
      health_status: overallHealth,
      summary: {
        total_issues: healthReport.issues.length,
        total_recommendations: healthReport.recommendations.length,
        orphaned_subscriptions: healthReport.checks.orphaned_subscriptions?.count || 0,
        ghost_subscriptions: healthReport.checks.ghost_subscriptions?.count || 0,
        webhook_endpoints: healthReport.checks.webhook_endpoints?.relevant_endpoints || 0,
        monetized_strategies: healthReport.checks.monetized_strategies?.count || 0,
      },
      ...healthReport,
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
