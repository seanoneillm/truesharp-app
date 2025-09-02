import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createServiceRoleClient } from '@/lib/supabase'
import { getOpenBetsForStrategies } from '@/lib/queries/open-bets'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/subscriptions-open-bets - Get open bets for user's subscribed strategies
export async function GET(request: NextRequest) {
  try {
    // Use regular auth client to verify user
    const supabase = await createServerSupabaseClient(request)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Subscriptions Open Bets API - Auth check:', {
      hasUser: !!user,
      authError: authError?.message,
      userId: user?.id,
    })

    if (authError || !user) {
      console.error('Authentication failed in subscriptions open bets API:', authError)
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: authError?.message || 'No user found',
        },
        { status: 401 }
      )
    }

    // Get user's active subscriptions using regular client
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('strategy_id')
      .eq('subscriber_id', user.id)
      .eq('status', 'active')

    console.log('Subscriptions Open Bets API - User subscriptions:', {
      error: subsError?.message,
      count: subscriptions?.length || 0,
      strategyIds: subscriptions?.map(s => s.strategy_id),
    })

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        openBetsByStrategy: {},
        message: 'No active subscriptions found',
      })
    }

    // Extract strategy IDs
    const strategyIds = subscriptions.map(s => s.strategy_id).filter(Boolean)

    if (strategyIds.length === 0) {
      return NextResponse.json({
        success: true,
        openBetsByStrategy: {},
        message: 'No valid strategy IDs',
      })
    }

    // Use service role client to fetch open bets (bypasses RLS)
    const serviceSupabase = await createServiceRoleClient()
    const openBetsByStrategy = await getOpenBetsForStrategies(strategyIds, serviceSupabase)

    console.log('Subscriptions Open Bets API - Results:', {
      strategyIds,
      openBetsCount: Object.values(openBetsByStrategy).reduce((sum, bets) => sum + bets.length, 0),
      openBetsByStrategy,
    })

    return NextResponse.json({
      success: true,
      openBetsByStrategy,
      strategyIds,
      totalBets: Object.values(openBetsByStrategy).reduce((sum, bets) => sum + bets.length, 0),
    })
  } catch (error) {
    console.error('Subscriptions Open Bets API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
