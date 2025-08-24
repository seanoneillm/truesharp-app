import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Use service role to bypass auth for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const sport = searchParams.get('sport')
    const betType = searchParams.get('bet_type')

    // Use the existing test user
    const userId = '28991397-dae7-42e8-a822-0dffc6ff49b7'

    console.log('Fetching analytics for test user:', userId)

    // Calculate date range based on timeframe
    let dateFilter = ''
    const now = new Date()
    
    switch (timeframe) {
      case '7d':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = sevenDaysAgo.toISOString()
        break
      case '30d':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = thirtyDaysAgo.toISOString()
        break
      case '90d':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilter = ninetyDaysAgo.toISOString()
        break
      case 'ytd':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        dateFilter = yearStart.toISOString()
        break
      default:
        dateFilter = '2020-01-01T00:00:00Z' // All time
    }

    // Build the query
    let query = supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)

    if (timeframe !== 'all') {
      query = query.gte('placed_at', dateFilter)
    }

    if (sport) {
      query = query.eq('sport', sport)
    }

    if (betType) {
      query = query.eq('bet_type', betType)
    }

    const { data: bets, error } = await query

    if (error) {
      console.error('Error fetching bets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate analytics
    const totalBets = bets.length
    const wonBets = bets.filter(bet => bet.status === 'won').length
    const lostBets = bets.filter(bet => bet.status === 'lost').length
    const winRate = totalBets > 0 ? (wonBets / (wonBets + lostBets)) * 100 : 0

    const totalStake = bets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
    const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0)
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStake / totalBets : 0

    // Sport breakdown
    const sportGroups = bets.reduce((acc, bet) => {
      const sport = bet.sport || 'Unknown'
      if (!acc[sport]) {
        acc[sport] = { bets: [], totalStake: 0, totalProfit: 0 }
      }
      acc[sport].bets.push(bet)
      acc[sport].totalStake += bet.stake || 0
      acc[sport].totalProfit += bet.profit || 0
      return acc
    }, {} as Record<string, { bets: unknown[], totalStake: number, totalProfit: number }>)

    const sportBreakdown = Object.entries(sportGroups).map(([sport, data]) => {
      const wonCount = data.bets.filter((bet: any) => bet.status === 'won').length
      const lostCount = data.bets.filter((bet: any) => bet.status === 'lost').length
      const sportWinRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0
      const sportROI = data.totalStake > 0 ? (data.totalProfit / data.totalStake) * 100 : 0

      return {
        sport,
        totalBets: data.bets.length,
        winRate: sportWinRate,
        roi: sportROI,
        netProfit: data.totalProfit
      }
    })

    // Profit data for chart (group by date)
    const profitByDate = bets
      .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
      .reduce((acc, bet) => {
        const date = new Date(bet.placed_at).toISOString().split('T')[0]
        if (date && !acc[date]) {
          acc[date] = 0
        }
        if (date) {
          acc[date] += bet.profit || 0
        }
        return acc
      }, {} as Record<string, number>)

    const profitData = Object.entries(profitByDate).map(([date, profit]) => ({
      date,
      profit
    }))

    // Recent form (last 20 bets)
    const recentForm = bets
      .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())
      .slice(0, 20)
      .map(bet => ({
        date: bet.placed_at,
        result: bet.status,
        sport: bet.sport,
        roi: bet.stake > 0 ? ((bet.profit || 0) / bet.stake) * 100 : 0
      }))

    const analytics = {
      overview: {
        totalBets,
        winRate: Math.round(winRate * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        netProfit: Math.round(totalProfit * 100) / 100,
        avgBetSize: Math.round(avgBetSize * 100) / 100,
        totalStake: Math.round(totalStake * 100) / 100
      },
      sportBreakdown,
      profitData,
      recentForm
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      debug: {
        userId,
        timeframe,
        dateFilter,
        totalBetsFound: bets.length
      }
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
