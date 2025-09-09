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
    console.log('🔍 Starting Derek subscription debug...')

    // 1. Look for Derek in profiles
    const { data: derek, error: derekError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', '%derek%')
      .or('username.ilike.%derek%,first_name.ilike.%derek%,last_name.ilike.%derek%')

    console.log('👤 Derek profiles found:', derek?.length || 0)
    if (derekError) {
      console.error('Error finding Derek:', derekError)
    }

    if (derek && derek.length > 0) {
      derek.forEach((profile, i) => {
        console.log(`  ${i + 1}. ${profile.username || profile.email} (${profile.id})`)
        console.log(`     Email: ${profile.email}`)
        console.log(`     Stripe Customer: ${profile.stripe_customer_id || 'None'}`)
      })
    }

    // 2. Check subscriptions table for any with "derek" related data
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscriber:profiles!subscriptions_subscriber_id_fkey(username, email),
        seller:profiles!subscriptions_seller_id_fkey(username, email),
        strategy:strategies(name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('📋 Recent subscriptions:', subscriptions?.length || 0)
    if (subError) {
      console.error('Error fetching subscriptions:', subError)
    }

    if (subscriptions) {
      subscriptions.forEach((sub, i) => {
        console.log(`  ${i + 1}. Sub ID: ${sub.id}`)
        console.log(`     Stripe ID: ${sub.stripe_subscription_id}`)
        console.log(`     Subscriber: ${sub.subscriber?.username || sub.subscriber?.email}`)
        console.log(`     Seller: ${sub.seller?.username || sub.seller?.email}`)
        console.log(`     Strategy: ${sub.strategy?.name}`)
        console.log(`     Status: ${sub.status}`)
        console.log(`     Created: ${sub.created_at}`)
        console.log('')
      })
    }

    // 3. Check Stripe for recent customer activity
    let stripeCustomers = []
    try {
      const customers = await stripe.customers.list({
        limit: 20,
        created: {
          gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
        },
      })
      stripeCustomers = customers.data
      console.log('💳 Recent Stripe customers:', stripeCustomers.length)
    } catch (stripeError) {
      console.error('Error fetching Stripe customers:', stripeError)
    }

    // 4. Check recent Stripe subscriptions
    let stripeSubscriptions = []
    try {
      const subscriptions = await stripe.subscriptions.list({
        limit: 20,
        created: {
          gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
        },
      })
      stripeSubscriptions = subscriptions.data
      console.log('🔄 Recent Stripe subscriptions:', stripeSubscriptions.length)

      stripeSubscriptions.forEach((sub, i) => {
        console.log(`  ${i + 1}. Stripe Sub: ${sub.id}`)
        console.log(`     Customer: ${sub.customer}`)
        console.log(`     Status: ${sub.status}`)
        console.log(`     Metadata:`, sub.metadata)
        console.log('')
      })
    } catch (stripeError) {
      console.error('Error fetching Stripe subscriptions:', stripeError)
    }

    // 5. Check checkout sessions
    let checkoutSessions = []
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 20,
        created: {
          gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // Last 7 days
        },
      })
      checkoutSessions = sessions.data
      console.log('🛒 Recent checkout sessions:', checkoutSessions.length)

      checkoutSessions.forEach((session, i) => {
        console.log(`  ${i + 1}. Session: ${session.id}`)
        console.log(`     Customer: ${session.customer}`)
        console.log(`     Subscription: ${session.subscription}`)
        console.log(`     Payment Status: ${session.payment_status}`)
        console.log(`     Status: ${session.status}`)
        console.log(`     Metadata:`, session.metadata)
        console.log('')
      })
    } catch (stripeError) {
      console.error('Error fetching checkout sessions:', stripeError)
    }

    return NextResponse.json({
      success: true,
      summary: {
        derek_profiles: derek?.length || 0,
        database_subscriptions: subscriptions?.length || 0,
        stripe_customers: stripeCustomers.length,
        stripe_subscriptions: stripeSubscriptions.length,
        checkout_sessions: checkoutSessions.length,
      },
      data: {
        derek_profiles: derek,
        database_subscriptions: subscriptions,
        stripe_customers: stripeCustomers.map(c => ({
          id: c.id,
          email: c.email,
          metadata: c.metadata,
          created: c.created,
        })),
        stripe_subscriptions: stripeSubscriptions.map(s => ({
          id: s.id,
          customer: s.customer,
          status: s.status,
          metadata: s.metadata,
          created: s.created,
        })),
        checkout_sessions: checkoutSessions.map(s => ({
          id: s.id,
          customer: s.customer,
          subscription: s.subscription,
          payment_status: s.payment_status,
          status: s.status,
          metadata: s.metadata,
          created: s.created,
        })),
      },
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
