import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userId } = await request.json()

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let targetUserId = userId
    let targetEmail = userEmail

    // If userId not provided, try to get it from email
    if (!targetUserId && userEmail) {
      const { data: profile, error: profileError } = await serviceSupabase
        .from('profiles')
        .select('id, email')
        .eq('email', userEmail)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({
          success: false,
          error: `User not found with email: ${userEmail}`
        })
      }
      targetUserId = profile.id
      targetEmail = profile.email
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'Either userId or userEmail must be provided'
      })
    }

    console.log('Debugging bets for user:', targetUserId, targetEmail)

    // Get ALL bets for this user (no date filtering)
    const { data: allBets, error: allBetsError } = await serviceSupabase
      .from('bets')
      .select('*')
      .eq('user_id', targetUserId)
      .order('placed_at', { ascending: false })

    if (allBetsError) {
      return NextResponse.json({
        success: false,
        error: `Error fetching bets: ${allBetsError.message}`
      })
    }

    // Get bets for 2024 specifically
    const { data: bets2024, error: bets2024Error } = await serviceSupabase
      .from('bets')
      .select('placed_at, stake, profit, status, home_team, away_team, sport')
      .eq('user_id', targetUserId)
      .gte('placed_at', '2024-01-01T00:00:00Z')
      .lte('placed_at', '2024-12-31T23:59:59Z')
      .order('placed_at', { ascending: true })

    if (bets2024Error) {
      return NextResponse.json({
        success: false,
        error: `Error fetching 2024 bets: ${bets2024Error.message}`
      })
    }

    // Get settled bets only (won/lost)
    const { data: settledBets, error: settledError } = await serviceSupabase
      .from('bets')
      .select('placed_at, stake, profit, status, home_team, away_team, sport')
      .eq('user_id', targetUserId)
      .in('status', ['won', 'lost'])
      .gte('placed_at', '2024-01-01T00:00:00Z')
      .lte('placed_at', '2024-12-31T23:59:59Z')
      .order('placed_at', { ascending: true })

    if (settledError) {
      return NextResponse.json({
        success: false,
        error: `Error fetching settled bets: ${settledError.message}`
      })
    }

    // Calculate stats
    const totalBets = allBets?.length || 0
    const total2024Bets = bets2024?.length || 0
    const settledBetsCount = settledBets?.length || 0
    
    const totalProfit = settledBets?.reduce((sum, bet) => sum + (bet.profit || 0), 0) || 0

    // Group bets by status
    const betsByStatus = allBets?.reduce((acc, bet) => {
      acc[bet.status] = (acc[bet.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Sample of recent bets
    const recentBets = allBets?.slice(0, 5).map(bet => ({
      id: bet.id,
      sport: bet.sport,
      home_team: bet.home_team,
      away_team: bet.away_team,
      status: bet.status,
      profit: bet.profit,
      placed_at: bet.placed_at,
      stake: bet.stake
    })) || []

    return NextResponse.json({
      success: true,
      user: {
        id: targetUserId,
        email: targetEmail || 'unknown'
      },
      stats: {
        totalBets,
        total2024Bets,
        settledBetsCount,
        totalProfit,
        betsByStatus
      },
      recentBets,
      sample2024Bets: bets2024?.slice(0, 3) || [],
      sampleSettledBets: settledBets?.slice(0, 3) || []
    })

  } catch (err) {
    console.error('Debug error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during debug'
    })
  }
}
