import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userId, numberOfBets = 50 } = await request.json()

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let targetUserId = userId

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
          error: `User not found with email: ${userEmail}`,
        })
      }
      targetUserId = profile.id
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'Either userId or userEmail must be provided',
      })
    }

    // Get pending bets from 2024 that we can settle
    const { data: pendingBets, error: pendingError } = await serviceSupabase
      .from('bets')
      .select('id, stake, potential_payout')
      .eq('user_id', targetUserId)
      .eq('status', 'pending')
      .gte('placed_at', '2024-01-01T00:00:00Z')
      .lte('placed_at', '2024-12-31T23:59:59Z')
      .limit(numberOfBets)

    if (pendingError || !pendingBets) {
      return NextResponse.json({
        success: false,
        error: `Error fetching pending bets: ${pendingError?.message}`,
      })
    }

    console.log(`Found ${pendingBets.length} pending bets to settle`)

    const updatedBets = []
    const errors = []

    // Settle bets with realistic win/loss ratio (about 55% wins)
    for (let i = 0; i < pendingBets.length; i++) {
      const bet = pendingBets[i]
      if (!bet) continue

      const willWin = Math.random() < 0.55 // 55% win rate

      let newStatus: string
      let profit: number

      if (willWin) {
        newStatus = 'won'
        // Calculate profit as potential_payout minus stake
        profit = (bet.potential_payout || bet.stake * 1.91) - bet.stake
      } else {
        newStatus = 'lost'
        profit = -bet.stake
      }

      const { data, error } = await serviceSupabase
        .from('bets')
        .update({
          status: newStatus,
          profit: profit,
          settled_at: new Date().toISOString(),
        })
        .eq('id', bet.id)
        .select('id, status, profit, stake')
        .single()

      if (error) {
        console.warn(`Failed to update bet ${bet.id}:`, error.message)
        errors.push({ betId: bet.id, error: error.message })
        continue
      }

      if (data) {
        updatedBets.push(data)
      }
    }

    console.log(`Updated ${updatedBets.length} of ${pendingBets.length} bets`)

    // Calculate new totals
    const wonBets = updatedBets.filter(bet => bet.status === 'won').length
    const lostBets = updatedBets.filter(bet => bet.status === 'lost').length
    const totalProfit = updatedBets.reduce((sum, bet) => sum + (bet.profit || 0), 0)

    return NextResponse.json({
      success: updatedBets.length > 0,
      message: `Settled ${updatedBets.length} pending bets for user ${targetUserId}`,
      user: {
        id: targetUserId,
        email: userEmail || 'unknown',
      },
      stats: {
        totalUpdated: updatedBets.length,
        wonBets,
        lostBets,
        totalProfitFromUpdates: totalProfit,
        winRate: updatedBets.length > 0 ? ((wonBets / updatedBets.length) * 100).toFixed(1) : 0,
      },
      errors: errors.slice(0, 3),
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error settling bets',
    })
  }
}
