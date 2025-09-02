import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Use service role to create test bets
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Creating test bets for user:', userId)

    // Create test bets for 2024 and 2025
    const testBets = [
      // 2024 bets
      // Additional 2024 bets for better data visualization
      {
        user_id: userId,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Kansas City Chiefs',
        away_team: 'Denver Broncos',
        bet_type: 'spread',
        bet_description: 'Kansas City Chiefs -7.5',
        line_value: -7.5,
        odds: -110,
        stake: 110.0,
        potential_payout: 210.0,
        status: 'won',
        profit: 100.0,
        placed_at: '2024-10-15T17:00:00Z',
        settled_at: '2024-10-15T20:30:00Z',
        game_date: '2024-10-15',
        sportsbook: 'Caesars',
      },
      {
        user_id: userId,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Dallas Mavericks',
        away_team: 'San Antonio Spurs',
        bet_type: 'moneyline',
        bet_description: 'Dallas Mavericks ML',
        odds: -180,
        stake: 90.0,
        potential_payout: 140.0,
        status: 'lost',
        profit: -90.0,
        placed_at: '2024-11-20T19:30:00Z',
        settled_at: '2024-11-20T22:15:00Z',
        game_date: '2024-11-20',
        sportsbook: 'DraftKings',
      },
      {
        user_id: userId,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'Atlanta Braves',
        away_team: 'New York Mets',
        bet_type: 'total',
        bet_description: 'Over 8.5 Runs',
        line_value: 8.5,
        odds: 105,
        stake: 85.0,
        potential_payout: 174.25,
        status: 'won',
        profit: 89.25,
        placed_at: '2024-07-30T19:00:00Z',
        settled_at: '2024-07-30T22:30:00Z',
        game_date: '2024-07-30',
        sportsbook: 'FanDuel',
      },
      {
        user_id: userId,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Green Bay Packers',
        away_team: 'Chicago Bears',
        bet_type: 'total',
        bet_description: 'Under 45.5 Points',
        line_value: 45.5,
        odds: -115,
        stake: 115.0,
        potential_payout: 215.0,
        status: 'lost',
        profit: -115.0,
        placed_at: '2024-12-05T13:00:00Z',
        settled_at: '2024-12-05T16:30:00Z',
        game_date: '2024-12-05',
        sportsbook: 'BetMGM',
      },
      {
        user_id: userId,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Dallas Cowboys',
        away_team: 'Green Bay Packers',
        bet_type: 'spread',
        bet_description: 'Dallas Cowboys -3.5',
        line_value: -3.5,
        odds: -110,
        stake: 50.0,
        potential_payout: 95.45,
        status: 'lost',
        profit: -50.0,
        placed_at: '2024-02-10T16:00:00Z',
        settled_at: '2024-02-10T19:30:00Z',
        game_date: '2024-02-10',
        sportsbook: 'FanDuel',
      },
      {
        user_id: userId,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Los Angeles Lakers',
        away_team: 'Boston Celtics',
        bet_type: 'total',
        bet_description: 'Over 215.5 Points',
        line_value: 215.5,
        odds: -105,
        stake: 75.0,
        potential_payout: 146.43,
        status: 'won',
        profit: 71.43,
        placed_at: '2024-03-20T20:00:00Z',
        settled_at: '2024-03-20T23:00:00Z',
        game_date: '2024-03-20',
        sportsbook: 'Caesars',
      },
      {
        user_id: userId,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'New York Yankees',
        away_team: 'Boston Red Sox',
        bet_type: 'moneyline',
        bet_description: 'New York Yankees ML',
        odds: 120,
        stake: 100.0,
        potential_payout: 220.0,
        status: 'won',
        profit: 120.0,
        placed_at: '2024-06-15T19:00:00Z',
        settled_at: '2024-06-15T22:30:00Z',
        game_date: '2024-06-15',
        sportsbook: 'BetMGM',
      },
      {
        user_id: userId,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Miami Heat',
        away_team: 'Philadelphia 76ers',
        bet_type: 'spread',
        bet_description: 'Miami Heat +5.5',
        line_value: 5.5,
        odds: -110,
        stake: 80.0,
        potential_payout: 152.73,
        status: 'lost',
        profit: -80.0,
        placed_at: '2024-04-25T20:30:00Z',
        settled_at: '2024-04-25T23:15:00Z',
        game_date: '2024-04-25',
        sportsbook: 'DraftKings',
      },
      // 2025 bets
      {
        user_id: userId,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Buffalo Bills',
        away_team: 'Miami Dolphins',
        bet_type: 'moneyline',
        bet_description: 'Buffalo Bills ML',
        odds: -150,
        stake: 150.0,
        potential_payout: 250.0,
        status: 'won',
        profit: 100.0,
        placed_at: '2025-01-10T18:00:00Z',
        settled_at: '2025-01-10T21:30:00Z',
        game_date: '2025-01-10',
        sportsbook: 'FanDuel',
      },
      {
        user_id: userId,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Golden State Warriors',
        away_team: 'Los Angeles Clippers',
        bet_type: 'total',
        bet_description: 'Under 232.5 Points',
        line_value: 232.5,
        odds: -110,
        stake: 60.0,
        potential_payout: 114.55,
        status: 'won',
        profit: 54.55,
        placed_at: '2025-02-01T20:00:00Z',
        settled_at: '2025-02-01T23:00:00Z',
        game_date: '2025-02-01',
        sportsbook: 'Caesars',
      },
      {
        user_id: userId,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'Los Angeles Dodgers',
        away_team: 'San Francisco Giants',
        bet_type: 'spread',
        bet_description: 'Los Angeles Dodgers -1.5',
        line_value: -1.5,
        odds: 110,
        stake: 90.0,
        potential_payout: 189.0,
        status: 'lost',
        profit: -90.0,
        placed_at: '2025-08-05T19:30:00Z',
        settled_at: '2025-08-05T22:45:00Z',
        game_date: '2025-08-05',
        sportsbook: 'BetMGM',
      },
    ]

    // Create a minimal test bet first to check if basic insertion works
    const minimalBet = {
      user_id: userId,
      sport: 'nba',
      league: 'NBA',
      bet_type: 'moneyline',
      bet_description: 'Test Bet',
      odds: -110,
      stake: 10.0,
      potential_payout: 19.09,
      status: 'won',
      profit: 9.09,
      placed_at: new Date().toISOString(),
      game_date: new Date().toISOString().split('T')[0],
      home_team: 'Team A',
      away_team: 'Team B',
      sportsbook: 'Test',
    }

    // Try inserting one minimal bet first
    const { data: testData, error: testError } = await serviceSupabase
      .from('bets')
      .insert([minimalBet])
      .select('id, sport, status, profit')
      .single()

    if (testError) {
      console.error('Failed to create test bet:', testError)
      return NextResponse.json({
        success: false,
        error: `Database setup issue: ${testError.message}`,
        suggestion:
          'The user_performance_cache table or trigger functions may be missing from your Supabase database.',
        details: testError,
      })
    }

    console.log('Test bet created successfully:', testData)

    // If test bet worked, create all the test bets
    const createdBets = [testData] // Include the test bet
    const errors = []

    for (const bet of testBets) {
      const { data, error } = await serviceSupabase
        .from('bets')
        .insert([bet])
        .select('id, sport, home_team, away_team, status, profit')
        .single()

      if (error) {
        console.warn(`Failed to create bet: ${bet.bet_description}:`, error.message)
        errors.push({ bet: bet.bet_description, error: error.message })
        continue
      }

      if (data) {
        createdBets.push(data)
      }
    }

    console.log(`Created ${createdBets.length} of ${testBets.length} test bets`)

    return NextResponse.json({
      success: createdBets.length > 0,
      message: `Created ${createdBets.length} of ${testBets.length} test bets`,
      bets: createdBets,
      skipped: testBets.length - createdBets.length,
      errors: errors.slice(0, 3), // Show first 3 errors for debugging
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error creating test bets',
    })
  }
}
