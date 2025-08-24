import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Use service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from auth header (for testing)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 })
    }

    // For testing, get the seller's strategies
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    // Get seller's strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, pricing_monthly, pricing_weekly, pricing_yearly')
      .eq('user_id', user.id)
      .limit(3) // Just test with first 3 strategies

    if (strategiesError) {
      return NextResponse.json({ error: strategiesError.message }, { status: 500 })
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json({ error: 'No strategies found' }, { status: 404 })
    }

    // Create test subscriptions for each strategy
    const testSubscriptions = []
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i]
      
      // Create 1-3 subscribers per strategy
      const subscriberCount = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < subscriberCount; j++) {
        // Determine price based on strategy pricing
        let price = 25 // default
        let frequency = 'monthly'
        
        if (strategy.pricing_monthly) {
          price = strategy.pricing_monthly
          frequency = 'monthly'
        } else if (strategy.pricing_weekly) {
          price = strategy.pricing_weekly
          frequency = 'weekly'
        } else if (strategy.pricing_yearly) {
          price = strategy.pricing_yearly
          frequency = 'yearly'
        }

        testSubscriptions.push({
          subscriber_id: user.id, // Using same user as subscriber for testing
          seller_id: user.id,
          strategy_id: strategy.id,
          status: 'active',
          frequency: frequency,
          price: price,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
      }
    }

    // Insert test subscriptions
    const { data: insertedSubs, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testSubscriptions)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Test subscriptions created',
      subscriptions: insertedSubs,
      strategies: strategies
    })

  } catch (error) {
    console.error('Error creating test subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Use service role client  
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all subscriptions for debugging
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        strategy_id,
        seller_id,
        frequency,
        price,
        status,
        strategies(name, pricing_monthly, pricing_weekly, pricing_yearly)
      `)
      .eq('status', 'active')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscriptions })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
