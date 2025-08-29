import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const userId = '28991397-dae7-42e8-a822-0dffc6ff49b7';
    const strategyId = 'e09dd1be-d68b-4fcc-a391-a186d68f6dab';

    console.log('Creating test bets for user:', userId);

    // Create test bets with far future dates
    const testBets = [
      {
        user_id: userId,
        sport: 'basketball',
        league: 'NBA',
        bet_type: 'spread',
        bet_description: 'Lakers -6.5',
        odds: -110,
        stake: 100.00,
        potential_payout: 190.91,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        home_team: 'Los Angeles Lakers',
        away_team: 'Boston Celtics',
        line_value: -6.5,
        sportsbook: 'DraftKings',
        strategy_id: strategyId
      },
      {
        user_id: userId,
        sport: 'football',
        league: 'NFL',
        bet_type: 'moneyline',
        bet_description: 'Chiefs ML',
        odds: -140,
        stake: 50.00,
        potential_payout: 85.71,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills',
        line_value: null,
        sportsbook: 'FanDuel',
        strategy_id: strategyId
      },
      {
        user_id: userId,
        sport: 'baseball',
        league: 'MLB',
        bet_type: 'total',
        bet_description: 'Yankees vs Red Sox Over 8.5',
        odds: 110,
        stake: 75.00,
        potential_payout: 157.50,
        status: 'pending',
        placed_at: new Date().toISOString(),
        game_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        home_team: 'New York Yankees',
        away_team: 'Boston Red Sox',
        line_value: 8.5,
        sportsbook: 'BetMGM',
        strategy_id: strategyId
      }
    ];

    // Insert the test bets
    const { data: insertedBets, error: insertError } = await supabase
      .from('bets')
      .insert(testBets)
      .select();

    if (insertError) {
      console.error('Error inserting test bets:', insertError);
      return NextResponse.json(
        { error: 'Failed to create test bets', details: insertError },
        { status: 500 }
      );
    }

    console.log('Successfully created test bets:', insertedBets);

    // Verify the bets were created
    const { data: verifyBets, error: verifyError } = await supabase
      .from('bets')
      .select('id, sport, bet_description, status, game_date, strategy_id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString());

    return NextResponse.json({
      success: true,
      message: 'Test bets created successfully',
      insertedBets,
      verificationQuery: { data: verifyBets, count: verifyBets?.length },
      userId,
      strategyId
    });

  } catch (error) {
    console.error('Create test bets error:', error);
    return NextResponse.json(
      { error: 'Failed to create test bets', details: error },
      { status: 500 }
    );
  }
}