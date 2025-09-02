import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  getSellerStrategiesWithOpenBets,
  getSubscriberStrategiesWithOpenBets,
} from '@/lib/queries/open-bets'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const testType = searchParams.get('type') || 'seller' // 'seller' or 'subscriber'

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }

    // Create service role client for testing
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result
    let summary = {}

    if (testType === 'seller') {
      console.log('Testing seller strategies with open bets for user:', userId)
      result = await getSellerStrategiesWithOpenBets(userId, serviceSupabase)

      summary = {
        totalStrategies: result.length,
        strategiesWithOpenBets: result.filter(s => s.open_bets_count > 0).length,
        totalOpenBets: result.reduce((sum, s) => sum + (s.open_bets_count || 0), 0),
        totalPotentialProfit: result.reduce((sum, s) => sum + (s.total_potential_profit || 0), 0),
      }
    } else if (testType === 'subscriber') {
      console.log('Testing subscriber strategies with open bets for user:', userId)
      result = await getSubscriberStrategiesWithOpenBets(userId, serviceSupabase)

      summary = {
        totalSubscriptions: result.length,
        subscriptionsWithOpenBets: result.filter(s => s.open_bets_count > 0).length,
        totalOpenBets: result.reduce((sum, s) => sum + (s.open_bets_count || 0), 0),
        totalPotentialProfit: result.reduce((sum, s) => sum + (s.total_potential_profit || 0), 0),
      }
    } else {
      return NextResponse.json(
        { error: 'type parameter must be "seller" or "subscriber"' },
        { status: 400 }
      )
    }

    // Also test the raw database structure
    const { data: strategies, error: strategiesError } = await serviceSupabase
      .from('strategies')
      .select('id, name, user_id, monetized')
      .eq('user_id', userId)
      .limit(5)

    const { data: bets, error: betsError } = await serviceSupabase
      .from('bets')
      .select('id, strategy_id, status, game_date, stake, potential_payout')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())
      .limit(5)

    const { data: subscriptions, error: subscriptionsError } = await serviceSupabase
      .from('subscriptions')
      .select('id, strategy_id, status, subscriber_id')
      .eq('subscriber_id', userId)
      .limit(5)

    return NextResponse.json({
      success: true,
      testType,
      userId,
      summary,
      strategiesWithOpenBets: result.map(s => ({
        id: s.id,
        name: s.name,
        open_bets_count: s.open_bets_count,
        total_potential_profit: s.total_potential_profit,
        sample_open_bets: s.open_bets?.slice(0, 2).map(bet => ({
          id: bet.id,
          bet_description: bet.bet_description,
          odds: bet.odds,
          stake: bet.stake,
          potential_payout: bet.potential_payout,
          game_date: bet.game_date,
        })),
      })),
      rawDatabaseSample: {
        strategies: {
          data: strategies,
          error: strategiesError?.message,
        },
        bets: {
          data: bets,
          error: betsError?.message,
        },
        subscriptions: {
          data: subscriptions,
          error: subscriptionsError?.message,
        },
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, strategyId, sampleData } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Create service role client for inserting test data
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let strategy

    if (strategyId) {
      // Use existing strategy
      const { data: existingStrategy, error: strategyFetchError } = await serviceSupabase
        .from('strategies')
        .select('*')
        .eq('id', strategyId)
        .eq('user_id', userId) // Security check
        .single()

      if (strategyFetchError || !existingStrategy) {
        return NextResponse.json(
          { error: 'Strategy not found or access denied', details: strategyFetchError?.message },
          { status: 404 }
        )
      }

      strategy = existingStrategy
    } else {
      // Create a new test strategy
      const { data: newStrategy, error: strategyError } = await serviceSupabase
        .from('strategies')
        .insert({
          user_id: userId,
          name: 'Test Open Bets Strategy',
          description: 'A test strategy to demonstrate open bets functionality',
          monetized: true,
          pricing_monthly: 29.99,
          performance_roi: 15.5,
          performance_win_rate: 65.0,
          performance_total_bets: 100,
          filter_config: { betTypes: ['spread'], sports: ['NFL'] },
        })
        .select()
        .single()

      if (strategyError) {
        return NextResponse.json(
          { error: 'Failed to create test strategy', details: strategyError.message },
          { status: 500 }
        )
      }

      strategy = newStrategy
    }

    // Insert sample open bets
    const sampleBets = [
      {
        user_id: userId,
        strategy_id: strategy.id,
        sport: 'NFL',
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills',
        bet_type: 'spread',
        bet_description: 'Buffalo Bills +3.5',
        line_value: 3.5,
        odds: -110,
        stake: 100,
        potential_payout: 190.91,
        status: 'pending',
        game_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        sportsbook: 'DraftKings',
      },
      {
        user_id: userId,
        strategy_id: strategy.id,
        sport: 'NFL',
        home_team: 'San Francisco 49ers',
        away_team: 'Dallas Cowboys',
        bet_type: 'total',
        bet_description: 'Over 47.5 Points',
        line_value: 47.5,
        odds: -105,
        stake: 50,
        potential_payout: 97.62,
        status: 'pending',
        game_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        sportsbook: 'FanDuel',
      },
    ]

    const { data: bets, error: betsError } = await serviceSupabase
      .from('bets')
      .insert(sampleBets)
      .select()

    if (betsError) {
      return NextResponse.json(
        { error: 'Failed to create test bets', details: betsError.message },
        { status: 500 }
      )
    }

    // Create strategy_bets to link bets to strategy
    const strategyBets = bets.map(bet => ({
      strategy_id: strategy.id,
      bet_id: bet.id,
    }))

    const { error: strategyBetsError } = await serviceSupabase
      .from('strategy_bets')
      .insert(strategyBets)

    if (strategyBetsError) {
      console.warn('Failed to create strategy_bets:', strategyBetsError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      testData: {
        strategy: strategy,
        bets: bets,
        strategyBets: strategyBets.length,
      },
      testUrl: `/api/test-open-bets?userId=${userId}&type=seller`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
