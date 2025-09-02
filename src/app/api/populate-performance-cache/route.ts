import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Starting performance cache population for all existing users...')

    // Get all unique user IDs from bets table
    const { data: users, error: usersError } = await serviceSupabase
      .from('bets')
      .select('user_id')
      .not('user_id', 'is', null)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({
        success: false,
        error: usersError.message,
      })
    }

    const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])]
    console.log(`Found ${uniqueUsers.length} unique users with bets`)

    // Calculate performance for each user
    const results = []
    for (const userId of uniqueUsers) {
      try {
        // Get all bets for this user
        const { data: userBets, error: betsError } = await serviceSupabase
          .from('bets')
          .select('status, profit, stake')
          .eq('user_id', userId)

        if (betsError || !userBets) {
          console.warn(`Failed to get bets for user ${userId}:`, betsError?.message)
          continue
        }

        const totalBets = userBets.length
        const wonBets = userBets.filter(b => b.status === 'won').length
        const lostBets = userBets.filter(b => b.status === 'lost').length
        const totalProfit = userBets.reduce((sum, b) => sum + (b.profit || 0), 0)
        const totalStake = userBets.reduce((sum, b) => sum + (b.stake || 0), 0)

        const settledBets = wonBets + lostBets
        const winRate = settledBets > 0 ? (wonBets * 100.0) / settledBets : 0
        const roi = totalStake > 0 ? (totalProfit * 100.0) / totalStake : 0

        // Insert or update performance cache
        const { error: cacheError } = await serviceSupabase.from('user_performance_cache').upsert({
          user_id: userId,
          total_bets: totalBets,
          won_bets: wonBets,
          lost_bets: lostBets,
          total_profit: totalProfit,
          total_stake: totalStake,
          win_rate: winRate,
          roi: roi,
          updated_at: new Date().toISOString(),
        })

        if (cacheError) {
          console.warn(`Failed to update cache for user ${userId}:`, cacheError.message)
          continue
        }

        results.push({
          userId,
          totalBets,
          wonBets,
          lostBets,
          totalProfit,
          winRate: Math.round(winRate * 100) / 100,
          roi: Math.round(roi * 100) / 100,
        })

        console.log(
          `Updated performance for user ${userId}: ${totalBets} bets, ${Math.round(winRate)}% win rate, ${Math.round(roi)}% ROI`
        )
      } catch (err) {
        console.warn(`Error processing user ${userId}:`, err)
        continue
      }
    }

    console.log(`Successfully updated performance cache for ${results.length} users`)

    return NextResponse.json({
      success: true,
      message: `Updated performance cache for ${results.length} users`,
      processedUsers: results.length,
      totalUsers: uniqueUsers.length,
      results: results.slice(0, 5), // Show first 5 results
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error updating performance cache',
    })
  }
}
