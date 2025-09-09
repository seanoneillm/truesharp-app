#!/usr/bin/env node

// Debug script to check subscription flow
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugSubscriptions() {
  console.log('🔍 Debugging Subscription Flow\n')

  try {
    // 1. Check subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('📋 Recent Subscriptions:')
    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError)
    } else {
      console.log(`✅ Found ${subscriptions.length} subscriptions`)
      subscriptions.forEach((sub, i) => {
        console.log(`  ${i + 1}. ID: ${sub.id}`)
        console.log(`     Stripe ID: ${sub.stripe_subscription_id}`)
        console.log(`     Status: ${sub.status}`)
        console.log(`     Subscriber: ${sub.subscriber_id}`)
        console.log(`     Strategy: ${sub.strategy_id}`)
        console.log(`     Created: ${sub.created_at}`)
        console.log('')
      })
    }

    // 2. Check pro subscriptions table
    const { data: proSubs, error: proError } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('📋 Recent Pro Subscriptions:')
    if (proError) {
      console.error('❌ Error fetching pro subscriptions:', proError)
    } else {
      console.log(`✅ Found ${proSubs.length} pro subscriptions`)
      proSubs.forEach((sub, i) => {
        console.log(`  ${i + 1}. ID: ${sub.id}`)
        console.log(`     Stripe ID: ${sub.stripe_subscription_id}`)
        console.log(`     Status: ${sub.status}`)
        console.log(`     User: ${sub.user_id}`)
        console.log(`     Created: ${sub.created_at}`)
        console.log('')
      })
    }

    // 3. Check strategies with Stripe products
    const { data: strategies, error: stratError } = await supabase
      .from('strategies')
      .select(
        'id, name, stripe_product_id, stripe_price_monthly_id, pricing_monthly, subscriber_count'
      )
      .not('stripe_product_id', 'is', null)
      .limit(5)

    console.log('💰 Monetized Strategies:')
    if (stratError) {
      console.error('❌ Error fetching strategies:', stratError)
    } else {
      console.log(`✅ Found ${strategies.length} monetized strategies`)
      strategies.forEach((strat, i) => {
        console.log(`  ${i + 1}. ${strat.name}`)
        console.log(`     ID: ${strat.id}`)
        console.log(`     Product ID: ${strat.stripe_product_id}`)
        console.log(`     Monthly Price ID: ${strat.stripe_price_monthly_id}`)
        console.log(`     Monthly Price: $${strat.pricing_monthly}`)
        console.log(`     Subscribers: ${strat.subscriber_count}`)
        console.log('')
      })
    }

    // 4. Check profiles with Stripe customer IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, stripe_customer_id, stripe_connect_account_id')
      .not('stripe_customer_id', 'is', null)
      .limit(5)

    console.log('👥 Profiles with Stripe Customers:')
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
    } else {
      console.log(`✅ Found ${profiles.length} profiles with Stripe customers`)
      profiles.forEach((profile, i) => {
        console.log(`  ${i + 1}. ${profile.username || 'No username'}`)
        console.log(`     ID: ${profile.id}`)
        console.log(`     Customer ID: ${profile.stripe_customer_id}`)
        console.log(`     Connect Account: ${profile.stripe_connect_account_id || 'None'}`)
        console.log('')
      })
    }

    console.log('🎯 Debug Complete!\n')
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugSubscriptions()
