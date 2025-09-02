import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    const now = new Date()
    const nowISO = now.toISOString()

    console.log('Current time:', nowISO)
    console.log('Current time (local):', now.toString())

    // Get our test bets and their game dates
    const { data: testBets } = await supabase
      .from('bets')
      .select('id, bet_description, game_date, status, placed_at')
      .in('bet_description', ['Red Sox +1.5', 'Over 8.5', 'Chiefs ML', 'Atlanta Braves -105'])
      .eq('status', 'pending')

    console.log('Test bets found:', testBets)

    // Test the time comparison logic
    const futureComparisons = testBets?.map(bet => {
      const gameDate = new Date(bet.game_date)
      const isFuture = gameDate > now
      return {
        bet_description: bet.bet_description,
        game_date: bet.game_date,
        game_date_local: gameDate.toString(),
        is_future: isFuture,
        hours_difference: (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60),
      }
    })

    // Also test the actual query with time filter
    const { data: filteredBets, error } = await supabase
      .from('bets')
      .select('id, bet_description, game_date, status')
      .in('bet_description', ['Red Sox +1.5', 'Over 8.5', 'Chiefs ML', 'Atlanta Braves -105'])
      .eq('status', 'pending')
      .gt('game_date', nowISO)

    console.log('Filtered bets query result:', filteredBets)
    console.log('Query error:', error)

    return NextResponse.json({
      success: true,
      debug: {
        currentTime: nowISO,
        currentTimeLocal: now.toString(),
        testBets: testBets?.length || 0,
        futureComparisons,
        filteredBetsCount: filteredBets?.length || 0,
        filteredBets,
        queryError: error?.message,
      },
    })
  } catch (error) {
    console.error('Debug time comparison error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
