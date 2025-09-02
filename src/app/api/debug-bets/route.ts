import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID required' }, { status: 400 })
    }

    console.log('=== DEBUG BETS FOR STRATEGY ===', strategyId)

    // Check 1: All bets for this user
    const { data: allUserBets, error: allUserBetsError } = await supabase
      .from('bets')
      .select('id, sport, bet_description, status, game_date, strategy_id, user_id, created_at')
      .eq('user_id', '28991397-dae7-42e8-a822-0dffc6ff49b7')
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('All user bets:', { allUserBets, allUserBetsError, count: allUserBets?.length })

    // Check 2: Bets with strategy_id matching this strategy
    const { data: directStrategyBets, error: directStrategyBetsError } = await supabase
      .from('bets')
      .select('id, sport, bet_description, status, game_date, strategy_id, user_id')
      .eq('strategy_id', strategyId)

    console.log('Direct strategy bets:', {
      directStrategyBets,
      directStrategyBetsError,
      count: directStrategyBets?.length,
    })

    // Check 3: strategy_bets table entries
    const { data: strategyBetsTable, error: strategyBetsTableError } = await supabase
      .from('strategy_bets')
      .select('id, strategy_id, bet_id, added_at, created_at')
      .eq('strategy_id', strategyId)

    console.log('strategy_bets table:', {
      strategyBetsTable,
      strategyBetsTableError,
      count: strategyBetsTable?.length,
    })

    // Check 4: Pending bets for this user
    const { data: pendingBets, error: pendingBetsError } = await supabase
      .from('bets')
      .select('id, sport, bet_description, status, game_date, strategy_id, user_id')
      .eq('user_id', '28991397-dae7-42e8-a822-0dffc6ff49b7')
      .eq('status', 'pending')

    console.log('Pending user bets:', { pendingBets, pendingBetsError, count: pendingBets?.length })

    // Check 5: Future bets for this user
    const { data: futureBets, error: futureBetsError } = await supabase
      .from('bets')
      .select('id, sport, bet_description, status, game_date, strategy_id, user_id')
      .eq('user_id', '28991397-dae7-42e8-a822-0dffc6ff49b7')
      .gt('game_date', new Date().toISOString())

    console.log('Future user bets:', { futureBets, futureBetsError, count: futureBets?.length })

    return NextResponse.json({
      strategyId,
      checks: {
        allUserBets: { data: allUserBets, count: allUserBets?.length },
        directStrategyBets: { data: directStrategyBets, count: directStrategyBets?.length },
        strategyBetsTable: { data: strategyBetsTable, count: strategyBetsTable?.length },
        pendingBets: { data: pendingBets, count: pendingBets?.length },
        futureBets: { data: futureBets, count: futureBets?.length },
      },
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}
