import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Checking strategies in database...')

    // Get all strategies
    const { data: strategies, error: stratError } = await supabase
      .from('strategies')
      .select('*')
      .limit(20)

    if (stratError) {
      console.error('Error fetching strategies:', stratError)
      return NextResponse.json({ error: stratError.message }, { status: 500 })
    }

    console.log('📋 Found strategies:', strategies?.length || 0)

    // Look specifically for the strategy Derek tried to subscribe to
    const targetStrategyId = 'f368548d-d216-4565-a8af-6de472c066c3'
    const targetStrategy = strategies?.find(s => s.id === targetStrategyId)

    return NextResponse.json({
      success: true,
      total_strategies: strategies?.length || 0,
      target_strategy_id: targetStrategyId,
      target_strategy_found: !!targetStrategy,
      target_strategy: targetStrategy,
      all_strategies: strategies?.map(s => ({
        id: s.id,
        name: s.name,
        user_id: s.user_id,
        is_monetized: !!s.stripe_product_id,
        pricing_weekly: s.pricing_weekly,
        pricing_monthly: s.pricing_monthly,
        pricing_yearly: s.pricing_yearly,
        stripe_product_id: s.stripe_product_id,
        stripe_price_weekly_id: s.stripe_price_weekly_id,
        stripe_price_monthly_id: s.stripe_price_monthly_id,
        stripe_price_yearly_id: s.stripe_price_yearly_id,
      })),
    })
  } catch (error) {
    console.error('Debug strategies API error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
