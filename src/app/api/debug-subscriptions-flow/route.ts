import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getOpenBetsForStrategies } from '@/lib/queries/open-bets'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    console.log('=== DEBUGGING SUBSCRIPTIONS FLOW ===')

    // Step 1: Get active subscriptions (like the subscriptions page does)
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, strategy_id, subscriber_id, status, seller_id')
      .eq('status', 'active')
      .limit(10)

    console.log('1. Subscriptions query:', {
      error: subsError?.message,
      count: subscriptions?.length || 0,
      data: subscriptions
    })

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active subscriptions found',
        step: 'subscriptions'
      })
    }

    // Step 2: Extract strategy IDs
    const strategyIds = subscriptions.map(s => s.strategy_id).filter(Boolean)
    console.log('2. Strategy IDs from subscriptions:', strategyIds)

    if (strategyIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid strategy IDs in subscriptions',
        step: 'strategy_ids'
      })
    }

    // Step 3: Get open bets using our function
    const openBetsByStrategy = await getOpenBetsForStrategies(strategyIds, supabase)
    console.log('3. Open bets by strategy:', openBetsByStrategy)

    // Step 4: Calculate totals
    const totalOpenBets = Object.values(openBetsByStrategy).reduce((sum, bets) => sum + bets.length, 0)
    console.log('4. Total open bets found:', totalOpenBets)

    // Step 5: Also test the direct query approach
    console.log('5. Testing direct query approach...')
    
    const { data: directBets, error: directError } = await supabase
      .from('bets')
      .select('*')
      .in('strategy_id', strategyIds)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())

    console.log('5a. Direct bets query (looking for strategy_id in bets):', {
      error: directError?.message,
      count: directBets?.length || 0,
      sample: directBets?.slice(0, 2)
    })

    // Step 6: Test strategy_bets approach
    const { data: strategyBets, error: strategyBetsError } = await supabase
      .from('strategy_bets')
      .select(`
        strategy_id,
        bet_id,
        bets!inner (
          id,
          bet_description,
          status,
          game_date,
          odds,
          stake,
          potential_payout
        )
      `)
      .in('strategy_id', strategyIds)
      .eq('bets.status', 'pending')
      .gt('bets.game_date', new Date().toISOString())

    console.log('6. Strategy_bets query:', {
      error: strategyBetsError?.message,
      count: strategyBets?.length || 0,
      sample: strategyBets?.slice(0, 2)
    })

    return NextResponse.json({
      success: true,
      debug: {
        subscriptions: subscriptions.length,
        strategyIds,
        openBetsByStrategy,
        totalOpenBets,
        directBets: directBets?.length || 0,
        strategyBets: strategyBets?.length || 0,
        details: {
          subscriptions: subscriptions,
          strategyBetsData: strategyBets
        }
      }
    })

  } catch (error) {
    console.error('Debug subscriptions flow error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}