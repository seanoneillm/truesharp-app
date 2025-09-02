import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting to populate user performance cache...')

    // First, let's see what users have bets
    const { data: usersWithBets, error: usersError } = await supabase
      .from('bets')
      .select('user_id')
      .not('user_id', 'is', null)

    if (usersError) {
      console.error('Error getting users with bets:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const uniqueUserIds = [...new Set(usersWithBets.map(bet => bet.user_id))]
    console.log('Found users with bets:', uniqueUserIds.length)

    // For each user, calculate and insert/update their performance cache
    const results = []
    for (const userId of uniqueUserIds) {
      console.log('Processing user:', userId)

      // Get all bets for this user
      const { data: userBets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)

      if (betsError) {
        console.error('Error getting user bets:', betsError)
        continue
      }

      // Calculate performance metrics
      const totalBets = userBets.length
      const wonBets = userBets.filter(bet => bet.status === 'won').length
      const lostBets = userBets.filter(bet => bet.status === 'lost').length
      const settledBets = wonBets + lostBets
      const totalProfit = userBets.reduce((sum, bet) => sum + (bet.profit || 0), 0)
      const totalStake = userBets.reduce((sum, bet) => sum + (bet.stake || 0), 0)
      const winRate = settledBets > 0 ? (wonBets * 100.0) / settledBets : 0
      const roi = totalStake > 0 ? (totalProfit * 100.0) / totalStake : 0

      console.log(`User ${userId} metrics:`, {
        totalBets,
        wonBets,
        lostBets,
        totalProfit,
        totalStake,
        winRate,
        roi,
      })

      // Insert or update the cache
      const { error: cacheError } = await supabase.from('user_performance_cache').upsert({
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
        console.error('Error updating cache for user:', userId, cacheError)
        results.push({ userId, error: cacheError.message })
      } else {
        console.log('Successfully updated cache for user:', userId)
        results.push({ userId, success: true })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User performance cache populated successfully',
      results,
      totalUsers: uniqueUserIds.length,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
