import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface SubscribeRequest {
  strategyId: string
  sellerId: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  currency?: string
}

interface SubscriptionResponse {
  id: string
  subscriber_id: string
  seller_id: string
  strategy_id: string
  status: string
  price: number
  frequency: string
  currency: string
  current_period_start: string
  current_period_end: string
  next_billing_date: string
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    // Debug request headers
    const cookieHeader = request.headers.get('cookie')
    const authCookieValue = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value
    console.log('Subscribe POST - Cookie header:', cookieHeader ? 'present' : 'missing')
    console.log('Subscribe POST - Auth cookie value:', authCookieValue)
    
    const supabase = await createServerSupabaseClient(request)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Subscribe POST API auth check:', { 
      hasUser: !!user, 
      authError: authError?.message,
      userId: user?.id,
      hasCookies: !!cookieHeader
    })
    
    if (authError || !user) {
      console.error('Authentication failed in subscribe POST API:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // Parse request body
    const { strategyId, sellerId, frequency, price, currency = 'USD' }: SubscribeRequest = await request.json()

    // Validate required fields
    if (!strategyId || !sellerId || !frequency || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: strategyId, sellerId, frequency, price' 
      }, { status: 400 })
    }

    // Validate frequency
    if (!['weekly', 'monthly', 'yearly'].includes(frequency)) {
      return NextResponse.json({ 
        error: 'Invalid frequency. Must be weekly, monthly, or yearly' 
      }, { status: 400 })
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json({ 
        error: 'Price must be greater than 0' 
      }, { status: 400 })
    }

    // Check if user is trying to subscribe to their own strategy
    if (user.id === sellerId) {
      return NextResponse.json({ 
        error: 'Cannot subscribe to your own strategy' 
      }, { status: 400 })
    }

    // Check if already subscribed to this strategy
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('subscriber_id', user.id)
      .eq('strategy_id', strategyId)
      .eq('status', 'active')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing subscription:', checkError)
      return NextResponse.json({ error: 'Failed to check existing subscriptions' }, { status: 500 })
    }

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'Already subscribed to this strategy',
        subscription: existingSubscription
      }, { status: 409 })
    }

    // Calculate period dates
    const now = new Date()
    const currentPeriodStart = now.toISOString()
    
    let currentPeriodEnd: Date
    switch (frequency) {
      case 'weekly':
        currentPeriodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        currentPeriodEnd = new Date(now)
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
        break
      case 'yearly':
        currentPeriodEnd = new Date(now)
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
        break
      default:
        return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    const currentPeriodEndStr = currentPeriodEnd.toISOString()
    const nextBillingDate = currentPeriodEndStr

    // Create subscription
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: user.id,
        seller_id: sellerId,
        strategy_id: strategyId,
        status: 'active',
        price: price,
        frequency: frequency,
        currency: currency,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEndStr,
        next_billing_date: nextBillingDate
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json({ 
          error: 'Already subscribed to this strategy' 
        }, { status: 409 })
      }
      
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    // Optional: Here you would integrate with Stripe to create a subscription
    // const stripeSubscription = await createStripeSubscription({
    //   customerId: user.id,
    //   priceId: getPriceIdForFrequency(frequency),
    //   metadata: { subscription_id: subscription.id }
    // })
    
    // Update subscription with Stripe ID if needed
    // await supabase
    //   .from('subscriptions')
    //   .update({ stripe_subscription_id: stripeSubscription.id })
    //   .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      subscription: subscription as SubscriptionResponse
    })

  } catch (error) {
    console.error('Subscribe API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Subscribe GET API auth check:', { 
      hasUser: !!user, 
      authError: authError?.message,
      userId: user?.id 
    })
    
    if (authError || !user) {
      console.error('Authentication failed in subscribe GET API:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID required' }, { status: 400 })
    }

    // Check subscription status
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', user.id)
      .eq('strategy_id', strategyId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error)
      return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 })
    }

    return NextResponse.json({
      isSubscribed: !!subscription,
      subscription: subscription || null
    })

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}