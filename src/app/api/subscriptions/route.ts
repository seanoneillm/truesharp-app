import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/subscriptions - Get user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Subscriptions API - Auth check:', { 
      hasUser: !!user, 
      authError: authError?.message,
      userId: user?.id 
    })
    
    if (authError || !user) {
      console.error('Authentication failed in subscriptions API:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // First, let's check what basic subscriptions exist without joins
    const { data: basicSubscriptions, error: basicError } = await supabase
      .from('subscriptions')
      .select('id, subscriber_id, strategy_id, status, seller_id')
      .eq('subscriber_id', user.id)
      .limit(5)

    console.log('Subscriptions API - Basic query result:', {
      error: basicError?.message,
      dataCount: basicSubscriptions?.length || 0,
      sampleData: basicSubscriptions?.slice(0, 2)
    })

    // Fetch user's subscriptions with strategy and profile data
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        subscriber_id,
        seller_id,
        strategy_id,
        status,
        frequency,
        price,
        currency,
        created_at,
        updated_at,
        cancelled_at,
        current_period_start,
        current_period_end,
        next_billing_date,
        stripe_subscription_id,
        strategies!inner (
          id,
          name,
          description,
          performance_roi,
          performance_win_rate,
          performance_total_bets
        ),
        profiles!subscriptions_seller_id_fkey (
          id,
          username,
          email
        )
      `)
      .eq('subscriber_id', user.id)
      .order('created_at', { ascending: false })

    console.log('Subscriptions API - Query result:', {
      error: subscriptionsError?.message,
      dataCount: subscriptions?.length || 0
    })

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions',
        details: subscriptionsError.message
      }, { status: 500 })
    }

    // Format the response to match the expected structure
    const formattedSubscriptions = (subscriptions || []).map(sub => {
      const strategy = sub.strategies
      const profile = sub.profiles

      return {
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        seller_id: sub.seller_id,
        strategy_id: sub.strategy_id,
        status: sub.status,
        frequency: sub.frequency,
        price: sub.price,
        currency: sub.currency,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        cancelled_at: sub.cancelled_at,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        next_billing_date: sub.next_billing_date,
        stripe_subscription_id: sub.stripe_subscription_id,
        // Flattened strategy data
        strategy_name: strategy?.name || 'Unknown Strategy',
        strategy_description: strategy?.description || 'No description available',
        strategy_performance_roi: strategy?.performance_roi || 0,
        strategy_performance_win_rate: strategy?.performance_win_rate || 0,
        strategy_performance_total_bets: strategy?.performance_total_bets || 0,
        // Flattened profile data
        seller_username: profile?.username || 'Unknown',
        seller_display_name: profile?.username || 'Unknown'
      }
    })

    return NextResponse.json({
      success: true,
      subscriptions: formattedSubscriptions,
      count: formattedSubscriptions.length
    })

  } catch (error) {
    console.error('Subscriptions API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { sellerId, tier, price } = await request.json()
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: user.id,
        seller_id: sellerId,
        tier,
        price,
        status: 'active',
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: subscription })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
