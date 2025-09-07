import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Debug Subscribe Request - Auth:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('Debug Subscribe Request - Body:', body)
    } catch (e) {
      console.log('Debug Subscribe Request - Body parse error:', e)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Check all required fields
    const { strategyId, sellerId, frequency } = body
    console.log('Debug Subscribe Request - Fields:', { strategyId, sellerId, frequency })

    // Validate fields existence
    const missingFields = []
    if (!strategyId) missingFields.push('strategyId')
    if (!sellerId) missingFields.push('sellerId')  
    if (!frequency) missingFields.push('frequency')

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing fields: ${missingFields.join(', ')}`,
        received: body,
        missingFields
      }, { status: 400 })
    }

    // Validate frequency
    if (!['weekly', 'monthly', 'yearly'].includes(frequency)) {
      return NextResponse.json({
        error: 'Invalid frequency',
        frequency,
        validOptions: ['weekly', 'monthly', 'yearly']
      }, { status: 400 })
    }

    // Check if user is trying to subscribe to their own strategy  
    if (user && user.id === sellerId) {
      return NextResponse.json({
        error: 'Cannot subscribe to your own strategy',
        userId: user.id,
        sellerId
      }, { status: 400 })
    }

    // Get strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select(`
        id, name, user_id,
        stripe_product_id,
        stripe_price_weekly_id,
        stripe_price_monthly_id,
        stripe_price_yearly_id,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly
      `)
      .eq('id', strategyId)
      .eq('user_id', sellerId)
      .single()

    console.log('Debug Subscribe Request - Strategy Query:', { 
      strategy, 
      strategyError: strategyError?.message 
    })

    return NextResponse.json({
      success: true,
      debug: {
        auth: { hasUser: !!user, userId: user?.id },
        body,
        fields: { strategyId, sellerId, frequency },
        strategy: strategy || null,
        strategyError: strategyError?.message || null,
        validationPassed: true
      }
    })
  } catch (error) {
    console.error('Debug subscribe request error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}