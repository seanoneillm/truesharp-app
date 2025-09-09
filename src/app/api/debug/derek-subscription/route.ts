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
    let stripeCustomers: unknown[] = []
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
    let stripeSubscriptions: unknown[] = []
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
        const subscription = sub as { id: string; customer: string; status: string; metadata: Record<string, string> }
        console.log(`  ${i + 1}. Stripe Sub: ${subscription.id}`)
        console.log(`     Customer: ${subscription.customer}`)
        console.log(`     Status: ${subscription.status}`)
        console.log(`     Metadata:`, subscription.metadata)
        console.log('')
      })
    } catch (stripeError) {
      console.error('Error fetching Stripe subscriptions:', stripeError)
    }

    // 5. Check checkout sessions
    let checkoutSessions: unknown[] = []
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
        const s = session as { 
          id: string; 
          customer: string | null; 
          subscription: string | null; 
          payment_status: string; 
          status: string; 
          metadata: Record<string, string> | null 
        }
        console.log(`  ${i + 1}. Session: ${s.id}`)
        console.log(`     Customer: ${s.customer}`)
        console.log(`     Subscription: ${s.subscription}`)
        console.log(`     Payment Status: ${s.payment_status}`)
        console.log(`     Status: ${s.status}`)
        console.log(`     Metadata:`, s.metadata)
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
        stripe_customers: stripeCustomers.map(c => {
          const customer = c as { id: string; email: string | null; metadata: Record<string, string>; created: number }
          return {
            id: customer.id,
            email: customer.email,
            metadata: customer.metadata,
            created: customer.created,
          }
        }),
        stripe_subscriptions: stripeSubscriptions.map(s => {
          const subscription = s as { id: string; customer: string; status: string; metadata: Record<string, string>; created: number }
          return {
            id: subscription.id,
            customer: subscription.customer,
            status: subscription.status,
            metadata: subscription.metadata,
            created: subscription.created,
          }
        }),
        checkout_sessions: checkoutSessions.map(s => {
          const session = s as { 
            id: string; 
            customer: string | null; 
            subscription: string | null; 
            payment_status: string; 
            status: string; 
            metadata: Record<string, string> | null; 
            created: number 
          }
          return {
            id: session.id,
            customer: session.customer,
            subscription: session.subscription,
            payment_status: session.payment_status,
            status: session.status,
            metadata: session.metadata,
            created: session.created,
          }
        }),
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
