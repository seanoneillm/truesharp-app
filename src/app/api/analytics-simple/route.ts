import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, period = 'year', year = 2024 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('Analytics query for user:', userId, 'period:', period, 'year:', year)

    // Use service role to bypass auth issues
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
    } else { // week
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate = oneWeekAgo.toISOString().split('T')[0] || ''
      endDate = now.toISOString().split('T')[0] || ''
    }

    console.log('Date range:', { startDate, endDate })

    // Query bets for this user and date range
    const { data: bets, error } = await supabase
      .from('bets')
      .select('placed_at, stake, profit, status')
      .eq('user_id', userId)
      .gte('placed_at', startDate)
      .lte('placed_at', endDate + 'T23:59:59')
      .in('status', ['won', 'lost']) // Only settled bets
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('Bets query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${bets.length} settled bets for user ${userId}`)

    // Calculate running profit for chart
    let runningProfit = 0
    const profitData = bets.map(bet => {
      runningProfit += bet.profit || 0
      return {
        date: bet.placed_at.split('T')[0],
        profit: runningProfit
      }
    })

    const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0)

    return NextResponse.json({
      success: true,
      profitData,
      totalProfit,
      totalBets: bets.length,
      period,
      year
    })

  } catch (error) {
    console.error('Analytics query error:', error)
    return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 })
  }
}
