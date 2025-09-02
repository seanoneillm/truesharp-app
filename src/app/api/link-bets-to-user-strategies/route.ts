import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = await createServiceRoleClient()

    // Current user from logs
    const currentUserId = '0e16e4f5-f206-4e62-8282-4188ff8af48a'

    // User's subscribed strategy IDs from logs
    const userStrategyIds = [
      'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
      '8bff6189-e315-4864-9318-f99307c7019d',
      'c867d015-75fa-4563-b695-b6756376aa3d',
    ]

    // Get our test bets with future dates
    const { data: testBets } = await supabase
      .from('bets')
      .select('id, bet_description, game_date')
      .in('bet_description', ['Red Sox +1.5', 'Over 8.5', 'Chiefs ML'])
      .gt('game_date', new Date().toISOString())

    console.log('Found test bets:', testBets)

    if (!testBets || testBets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No test bets found',
      })
    }

    // Link each test bet to one of the user's subscribed strategies
    const strategyBetsToInsert = testBets.map((bet, index) => ({
      strategy_id: userStrategyIds[index % userStrategyIds.length], // Distribute across strategies
      bet_id: bet.id,
    }))

    // Insert into strategy_bets table (with conflict handling)
    const { data: insertedLinks, error: linkError } = await supabase
      .from('strategy_bets')
      .upsert(strategyBetsToInsert, {
        onConflict: 'strategy_id,bet_id',
        ignoreDuplicates: false,
      })
      .select()

    if (linkError) {
      console.error('Error linking bets to strategies:', linkError)
      return NextResponse.json({
        success: false,
        error: linkError.message,
      })
    }

    console.log('Successfully linked bets:', insertedLinks)

    // Verify the links were created
    const { data: verification } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets!inner (
          bet_description,
          game_date,
          status
        )
      `
      )
      .in('strategy_id', userStrategyIds)
      .eq('bets.status', 'pending')
      .gt('bets.game_date', new Date().toISOString())

    console.log('Verification query result:', verification)

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${testBets.length} bets to user's subscribed strategies`,
      data: {
        testBets: testBets.length,
        linksCreated: insertedLinks?.length || 0,
        verification: verification?.length || 0,
        details: {
          userStrategyIds,
          testBetIds: testBets.map(b => b.id),
          verificationData: verification,
        },
      },
    })
  } catch (error) {
    console.error('Error linking bets:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
