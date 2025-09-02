import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'User email is required',
        },
        { status: 400 }
      )
    }

    // Use service role to get user by email
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user by email from profiles table
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: `User not found with email: ${userEmail}`,
        },
        { status: 404 }
      )
    }

    console.log('Creating bets for user:', profile.id, profile.email)

    // Create a variety of test bets for the user
    const testBets = [
      // Recent 2024 bets
      {
        user_id: profile.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'San Francisco 49ers',
        away_team: 'Seattle Seahawks',
        bet_type: 'spread',
        bet_description: 'San Francisco 49ers -3.5',
        line_value: -3.5,
        odds: -110,
        stake: 100.0,
        potential_payout: 190.91,
        status: 'won',
        profit: 90.91,
        placed_at: '2024-12-01T19:00:00Z',
        settled_at: '2024-12-01T22:30:00Z',
        game_date: '2024-12-01',
        sportsbook: 'DraftKings',
      },
      {
        user_id: profile.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Los Angeles Lakers',
        away_team: 'Boston Celtics',
        bet_type: 'moneyline',
        bet_description: 'Los Angeles Lakers ML',
        odds: 150,
        stake: 75.0,
        potential_payout: 187.5,
        status: 'won',
        profit: 112.5,
        placed_at: '2024-11-15T20:00:00Z',
        settled_at: '2024-11-15T23:00:00Z',
        game_date: '2024-11-15',
        sportsbook: 'FanDuel',
      },
      {
        user_id: profile.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Green Bay Packers',
        away_team: 'Chicago Bears',
        bet_type: 'total',
        bet_description: 'Over 42.5 Points',
        line_value: 42.5,
        odds: -105,
        stake: 50.0,
        potential_payout: 97.62,
        status: 'lost',
        profit: -50.0,
        placed_at: '2024-10-20T16:00:00Z',
        settled_at: '2024-10-20T19:30:00Z',
        game_date: '2024-10-20',
        sportsbook: 'Caesars',
      },
      {
        user_id: profile.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Golden State Warriors',
        away_team: 'Phoenix Suns',
        bet_type: 'spread',
        bet_description: 'Golden State Warriors +2.5',
        line_value: 2.5,
        odds: -110,
        stake: 80.0,
        potential_payout: 152.73,
        status: 'won',
        profit: 72.73,
        placed_at: '2024-09-25T20:30:00Z',
        settled_at: '2024-09-25T23:15:00Z',
        game_date: '2024-09-25',
        sportsbook: 'BetMGM',
      },
      {
        user_id: profile.id,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'New York Yankees',
        away_team: 'Boston Red Sox',
        bet_type: 'moneyline',
        bet_description: 'New York Yankees ML',
        odds: -140,
        stake: 140.0,
        potential_payout: 240.0,
        status: 'won',
        profit: 100.0,
        placed_at: '2024-08-15T19:00:00Z',
        settled_at: '2024-08-15T22:30:00Z',
        game_date: '2024-08-15',
        sportsbook: 'DraftKings',
      },
      // Some 2025 bets
      {
        user_id: profile.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Buffalo Bills',
        away_team: 'Miami Dolphins',
        bet_type: 'moneyline',
        bet_description: 'Buffalo Bills ML',
        odds: -160,
        stake: 120.0,
        potential_payout: 195.0,
        status: 'won',
        profit: 75.0,
        placed_at: '2025-01-15T18:00:00Z',
        settled_at: '2025-01-15T21:30:00Z',
        game_date: '2025-01-15',
        sportsbook: 'FanDuel',
      },
      {
        user_id: profile.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Miami Heat',
        away_team: 'Philadelphia 76ers',
        bet_type: 'total',
        bet_description: 'Under 220.5 Points',
        line_value: 220.5,
        odds: -110,
        stake: 60.0,
        potential_payout: 114.55,
        status: 'lost',
        profit: -60.0,
        placed_at: '2025-02-10T20:00:00Z',
        settled_at: '2025-02-10T23:00:00Z',
        game_date: '2025-02-10',
        sportsbook: 'Caesars',
      },
      {
        user_id: profile.id,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'Los Angeles Dodgers',
        away_team: 'San Diego Padres',
        bet_type: 'spread',
        bet_description: 'Los Angeles Dodgers -1.5',
        line_value: -1.5,
        odds: 110,
        stake: 90.0,
        potential_payout: 189.0,
        status: 'won',
        profit: 99.0,
        placed_at: '2024-07-10T19:30:00Z',
        settled_at: '2024-07-10T22:45:00Z',
        game_date: '2024-07-10',
        sportsbook: 'BetMGM',
      },
    ]

    // Create each bet individually
    const createdBets = []
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

    console.log(
      `Created ${createdBets.length} of ${testBets.length} test bets for user ${profile.id}`
    )

    return NextResponse.json({
      success: createdBets.length > 0,
      message: `Created ${createdBets.length} test bets for ${profile.email}`,
      user: {
        id: profile.id,
        email: profile.email,
      },
      bets: createdBets,
      skipped: testBets.length - createdBets.length,
      errors: errors.slice(0, 3),
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error creating test bets',
    })
  }
}
