import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, period = 'month', year = 2024 } = await request.json()

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user by email
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

    // Simulate the exact same date logic as the analytics component
    let startDate: Date
    let endDate: Date
    
    if (period === 'year') {
      // For year view, show data for the entire selected year
      startDate = new Date(year, 0, 1) // January 1st of selected year
      endDate = new Date(year, 11, 31, 23, 59, 59) // December 31st of selected year
    } else {
      // For week/month, use current date logic but within the selected year
      const now = new Date()
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = now
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = now
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = now
      }
    }

    console.log(`Testing analytics query for ${period} ${year}`)
    console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString())

    // Test the exact same query as analytics component
    const { data: bets, error: betsError } = await serviceSupabase
      .from('bets')
      .select('placed_at, stake, profit, status, potential_payout')
      .eq('user_id', profile.id)
      .gte('placed_at', startDate.toISOString())
      .lte('placed_at', endDate.toISOString())
      .in('status', ['won', 'lost'])
      .order('placed_at', { ascending: true })

    if (betsError) {
      return NextResponse.json({
        success: false,
        error: `Error fetching bets: ${betsError.message}`
      })
    }

    // Also test for all 2024 data without date filtering
    const { data: all2024Bets, error: all2024Error } = await serviceSupabase
      .from('bets')
      .select('placed_at, stake, profit, status')
      .eq('user_id', profile.id)
      .gte('placed_at', '2024-01-01T00:00:00Z')
      .lte('placed_at', '2024-12-31T23:59:59Z')
      .in('status', ['won', 'lost'])
      .order('placed_at', { ascending: true })

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email
      },
      testQuery: {
        period,
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        resultCount: bets?.length || 0,
        firstBet: bets?.[0] || null,
        lastBet: bets?.[bets.length - 1] || null
      },
      all2024Data: {
        count: all2024Bets?.length || 0,
        firstBet: all2024Bets?.[0] || null,
        lastBet: all2024Bets?.[all2024Bets.length - 1] || null,
        sampleBets: all2024Bets?.slice(0, 3) || []
      }
    })

  } catch (err) {
    console.error('Test query error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during test'
    })
  }
}
