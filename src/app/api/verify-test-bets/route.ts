import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const userId = '28991397-dae7-42e8-a822-0dffc6ff49b7'

    console.log('=== VERIFYING TEST BETS ===')

    // Check all bets for your user
    const { data: allBets, error: allBetsError } = await supabase
      .from('bets')
      .select(
        `
        id,
        sport,
        bet_description,
        status,
        game_date,
        strategy_id,
        user_id,
        created_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('All user bets:', { allBets, allBetsError, count: allBets?.length })

    // Check specifically pending/future bets
    const { data: pendingFutureBets, error: pendingFutureBetsError } = await supabase
      .from('bets')
      .select(
        `
        id,
        sport,
        bet_description,
        status,
        game_date,
        strategy_id,
        user_id
      `
      )
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())

    console.log('Pending future bets:', {
      pendingFutureBets,
      pendingFutureBetsError,
      count: pendingFutureBets?.length,
    })

    // Check bets for specific strategy
    const { data: strategyBets, error: strategyBetsError } = await supabase
      .from('bets')
      .select(
        `
        id,
        sport,
        bet_description,
        status,
        game_date,
        strategy_id,
        user_id
      `
      )
      .eq('strategy_id', 'e09dd1be-d68b-4fcc-a391-a186d68f6dab')

    console.log('Strategy-specific bets:', {
      strategyBets,
      strategyBetsError,
      count: strategyBets?.length,
    })

    // If no bets exist, create some test bets
    if ((!allBets || allBets.length === 0) && request.method === 'POST') {
      const strategyId = 'e09dd1be-d68b-4fcc-a391-a186d68f6dab'

      const testBets = [
        {
          user_id: userId,
          sport: 'basketball',
          league: 'NBA',
          bet_type: 'spread',
          bet_description: 'Lakers -6.5',
          odds: -110,
          stake: 100.0,
          potential_payout: 190.91,
          status: 'pending',
          placed_at: new Date().toISOString(),
          game_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          home_team: 'Los Angeles Lakers',
          away_team: 'Boston Celtics',
          line_value: -6.5,
          sportsbook: 'DraftKings',
          strategy_id: strategyId,
        },
        {
          user_id: userId,
          sport: 'football',
          league: 'NFL',
          bet_type: 'moneyline',
          bet_description: 'Chiefs ML',
          odds: -140,
          stake: 50.0,
          potential_payout: 85.71,
          status: 'pending',
          placed_at: new Date().toISOString(),
          game_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
          home_team: 'Kansas City Chiefs',
          away_team: 'Buffalo Bills',
          sportsbook: 'FanDuel',
          strategy_id: strategyId,
        },
      ]

      const { data: insertedBets, error: insertError } = await supabase
        .from('bets')
        .insert(testBets)
        .select()

      console.log('Inserted test bets:', { insertedBets, insertError })
    }

    return NextResponse.json({
      userId,
      checks: {
        allBets: { data: allBets, count: allBets?.length },
        pendingFutureBets: { data: pendingFutureBets, count: pendingFutureBets?.length },
        strategyBets: { data: strategyBets, count: strategyBets?.length },
      },
      currentTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Verify test bets error:', error)
    return NextResponse.json({ error: 'Verification failed', details: error }, { status: 500 })
  }
}
