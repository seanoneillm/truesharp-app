import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to verify strategy_bets constraint fixes
export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Create service role client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get a test bet and strategy for this user
    const { data: testBet, error: betError } = await serviceSupabase
      .from('bets')
      .select('*')
      .eq('user_id', user_id)
      .limit(1)
      .single()

    if (betError || !testBet) {
      return NextResponse.json({ error: 'No test bet found for user' }, { status: 404 })
    }

    const { data: testStrategy, error: strategyError } = await serviceSupabase
      .from('strategies')
      .select('*')
      .eq('user_id', user_id)
      .limit(1)
      .single()

    if (strategyError || !testStrategy) {
      return NextResponse.json({ error: 'No test strategy found for user' }, { status: 404 })
    }

    // Try to insert a test strategy_bet
    const testStrategyBet = {
      strategy_id: testStrategy.id,
      bet_id: testBet.id,
      sport: testBet.sport,
      game_date: testBet.game_date,
    }

    console.log('Attempting to insert test strategy_bet:', testStrategyBet)

    const { error: insertError } = await serviceSupabase
      .from('strategy_bets')
      .insert([testStrategyBet])

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to insert test strategy_bet',
          details: insertError,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test strategy_bet inserted successfully',
      testBet: testBet.id,
      testStrategy: testStrategy.id,
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
