import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'No authorization header provided'
      }, { status: 401 })
    }

    // Set the auth header for the supabase client
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 })
    }

    console.log('Creating bets for current user:', user.id, user.email)

    // Use service role to create test bets
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create a variety of test bets for the current user
    const testBets = [
      // Recent 2024 bets
      {
        user_id: user.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'San Francisco 49ers',
        away_team: 'Seattle Seahawks',
        bet_type: 'spread',
        bet_description: 'San Francisco 49ers -3.5',
        line_value: -3.5,
        odds: -110,
        stake: 100.00,
        potential_payout: 190.91,
        status: 'won',
        profit: 90.91,
        placed_at: '2024-12-01T19:00:00Z',
        settled_at: '2024-12-01T22:30:00Z',
        game_date: '2024-12-01',
        sportsbook: 'DraftKings'
      },
      {
        user_id: user.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Los Angeles Lakers',
        away_team: 'Boston Celtics',
        bet_type: 'moneyline',
        bet_description: 'Los Angeles Lakers ML',
        odds: 150,
        stake: 75.00,
        potential_payout: 187.50,
        status: 'won',
        profit: 112.50,
        placed_at: '2024-11-15T20:00:00Z',
        settled_at: '2024-11-15T23:00:00Z',
        game_date: '2024-11-15',
        sportsbook: 'FanDuel'
      },
      {
        user_id: user.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Green Bay Packers',
        away_team: 'Chicago Bears',
        bet_type: 'total',
        bet_description: 'Over 42.5 Points',
        line_value: 42.5,
        odds: -105,
        stake: 50.00,
        potential_payout: 97.62,
        status: 'lost',
        profit: -50.00,
        placed_at: '2024-10-20T16:00:00Z',
        settled_at: '2024-10-20T19:30:00Z',
        game_date: '2024-10-20',
        sportsbook: 'Caesars'
      },
      {
        user_id: user.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Golden State Warriors',
        away_team: 'Phoenix Suns',
        bet_type: 'spread',
        bet_description: 'Golden State Warriors +2.5',
        line_value: 2.5,
        odds: -110,
        stake: 80.00,
        potential_payout: 152.73,
        status: 'won',
        profit: 72.73,
        placed_at: '2024-09-25T20:30:00Z',
        settled_at: '2024-09-25T23:15:00Z',
        game_date: '2024-09-25',
        sportsbook: 'BetMGM'
      },
      {
        user_id: user.id,
        sport: 'mlb',
        league: 'MLB',
        home_team: 'New York Yankees',
        away_team: 'Boston Red Sox',
        bet_type: 'moneyline',
        bet_description: 'New York Yankees ML',
        odds: -140,
        stake: 140.00,
        potential_payout: 240.00,
        status: 'won',
        profit: 100.00,
        placed_at: '2024-08-15T19:00:00Z',
        settled_at: '2024-08-15T22:30:00Z',
        game_date: '2024-08-15',
        sportsbook: 'DraftKings'
      },
      // Some 2025 bets
      {
        user_id: user.id,
        sport: 'nfl',
        league: 'NFL',
        home_team: 'Buffalo Bills',
        away_team: 'Miami Dolphins',
        bet_type: 'moneyline',
        bet_description: 'Buffalo Bills ML',
        odds: -160,
        stake: 120.00,
        potential_payout: 195.00,
        status: 'won',
        profit: 75.00,
        placed_at: '2025-01-15T18:00:00Z',
        settled_at: '2025-01-15T21:30:00Z',
        game_date: '2025-01-15',
        sportsbook: 'FanDuel'
      },
      {
        user_id: user.id,
        sport: 'nba',
        league: 'NBA',
        home_team: 'Miami Heat',
        away_team: 'Philadelphia 76ers',
        bet_type: 'total',
        bet_description: 'Under 220.5 Points',
        line_value: 220.5,
        odds: -110,
        stake: 60.00,
        potential_payout: 114.55,
        status: 'lost',
        profit: -60.00,
        placed_at: '2025-02-10T20:00:00Z',
        settled_at: '2025-02-10T23:00:00Z',
        game_date: '2025-02-10',
        sportsbook: 'Caesars'
      }
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

    console.log(`Created ${createdBets.length} of ${testBets.length} test bets for user ${user.id}`)

    return NextResponse.json({
      success: createdBets.length > 0,
      message: `Created ${createdBets.length} test bets for your account`,
      user: {
        id: user.id,
        email: user.email
      },
      bets: createdBets,
      skipped: testBets.length - createdBets.length,
      errors: errors.slice(0, 3)
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error creating test bets'
    })
  }
}
