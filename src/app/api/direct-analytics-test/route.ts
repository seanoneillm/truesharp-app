import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, period = 'year', year = 2024 } = await request.json()

    console.log('Direct analytics test for user:', userId)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate date range based on period and year
    let startDate: string
    let endDate: string

    if (period === 'year') {
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
    } else if (period === 'month') {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const lastDay = new Date(currentYear, currentMonth, 0).getDate()
      endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDay}`
    } else {
      // week
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate = oneWeekAgo.toISOString().split('T')[0] || ''
      endDate = now.toISOString().split('T')[0] || ''
    }

    console.log('Date range:', { startDate, endDate })

    // Query bets for this user and date range
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .gte('placed_at', startDate)
      .lte('placed_at', endDate + 'T23:59:59')
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('Bets query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${bets.length} bets for user ${userId}`)

    // Calculate running profit
    let runningProfit = 0
    const analyticsData = bets.map(bet => {
      runningProfit += bet.profit || 0
      return {
        date: bet.placed_at.split('T')[0],
        profit: runningProfit,
        bet: {
          id: bet.id,
          status: bet.status,
          stake: bet.stake,
          profit: bet.profit,
          description: bet.description,
        },
      }
    })

    return NextResponse.json({
      success: true,
      userId,
      period,
      year,
      dateRange: { startDate, endDate },
      totalBets: bets.length,
      finalProfit: runningProfit,
      analyticsData: analyticsData.slice(0, 10), // First 10 for preview
      sampleBets: bets.slice(0, 5).map(bet => ({
        id: bet.id,
        placed_at: bet.placed_at,
        status: bet.status,
        profit: bet.profit,
        stake: bet.stake,
      })),
    })
  } catch (error) {
    console.error('Direct analytics error:', error)
    return NextResponse.json({ error: 'Analytics test failed' }, { status: 500 })
  }
}
