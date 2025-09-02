import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function POST() {
  try {
    // Use service role to bypass RLS
    const supabase = await createServiceRoleClient()

    // 1. First, get an existing user from profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found in profiles table',
      })
    }

    console.log('Found users:', users)
    const userId = users[0].id

    // 2. Get existing strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, user_id')
      .limit(5)

    if (strategiesError || !strategies || strategies.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No strategies found in strategies table',
      })
    }

    console.log('Found strategies:', strategies)
    const strategyId = strategies[0].id

    // 3. Create subscription if doesn't exist
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', userId)
      .eq('strategy_id', strategyId)
      .single()

    if (!existingSub) {
      const { error: subError } = await supabase.from('subscriptions').insert({
        subscriber_id: userId,
        seller_id: strategies[0].user_id,
        strategy_id: strategyId,
        status: 'active',
        frequency: 'monthly',
        price: 29.99,
        currency: 'USD',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (subError) {
        console.error('Error creating subscription:', subError)
      } else {
        console.log('Created test subscription')
      }
    }

    // 4. Insert test bets
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    const testBets = [
      {
        user_id: userId,
        sport: 'MLB',
        league: 'Major League Baseball',
        home_team: 'Yankees',
        away_team: 'Red Sox',
        bet_type: 'spread',
        bet_description: 'Red Sox +1.5',
        line_value: 1.5,
        odds: -110,
        stake: 100.0,
        potential_payout: 190.91,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: tomorrow.toISOString(),
        sportsbook: 'DraftKings',
      },
      {
        user_id: userId,
        sport: 'MLB',
        league: 'Major League Baseball',
        home_team: 'Dodgers',
        away_team: 'Giants',
        bet_type: 'total',
        bet_description: 'Over 8.5',
        line_value: 8.5,
        odds: 105,
        stake: 50.0,
        potential_payout: 102.5,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: dayAfterTomorrow.toISOString(),
        sportsbook: 'FanDuel',
      },
      {
        user_id: userId,
        sport: 'NFL',
        league: 'National Football League',
        home_team: 'Chiefs',
        away_team: 'Bills',
        bet_type: 'moneyline',
        bet_description: 'Chiefs ML',
        odds: -150,
        stake: 75.0,
        potential_payout: 125.0,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        sportsbook: 'BetMGM',
      },
    ]

    const { data: insertedBets, error: betsError } = await supabase
      .from('bets')
      .insert(testBets)
      .select('id')

    if (betsError) {
      console.error('Error inserting bets:', betsError)
      return NextResponse.json({
        success: false,
        error: betsError.message,
      })
    }

    console.log('Inserted bets:', insertedBets)

    // 5. Link bets to strategy via strategy_bets table
    if (insertedBets && insertedBets.length > 0) {
      const strategyBetsData = insertedBets.map(bet => ({
        strategy_id: strategyId,
        bet_id: bet.id,
      }))

      const { error: strategyBetsError } = await supabase
        .from('strategy_bets')
        .insert(strategyBetsData)

      if (strategyBetsError) {
        console.error('Error linking bets to strategy:', strategyBetsError)
        return NextResponse.json({
          success: false,
          error: strategyBetsError.message,
        })
      }

      console.log('Linked bets to strategy')
    }

    return NextResponse.json({
      success: true,
      message: 'Test bets created successfully',
      data: {
        userId,
        strategyId,
        betsCreated: insertedBets?.length || 0,
      },
    })
  } catch (error) {
    console.error('Error creating test bets:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
