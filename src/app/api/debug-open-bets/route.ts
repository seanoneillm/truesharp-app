import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getOpenBetsForStrategies } from '@/lib/queries/open-bets'

export async function GET() {
  try {
    const supabase = createClient()

    // 1. Check if there are ANY pending bets
    const { data: allPendingBets, error: pendingError } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    console.log('🔍 Debug - All pending bets:', { 
      error: pendingError?.message, 
      count: allPendingBets?.length || 0,
      sample: allPendingBets?.slice(0, 2)
    })

    // 2. Check if there are pending bets with future game dates
    const { data: futurePendingBets, error: futureError } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())
      .limit(10)

    console.log('🔍 Debug - Future pending bets:', { 
      error: futureError?.message, 
      count: futurePendingBets?.length || 0,
      sample: futurePendingBets?.slice(0, 2)
    })

    // 3. Check strategy_bets table
    const { data: strategyBetsData, error: strategyBetsError } = await supabase
      .from('strategy_bets')
      .select(`
        strategy_id,
        bet_id,
        bets!inner (
          id,
          status,
          game_date,
          bet_description
        )
      `)
      .limit(10)

    console.log('🔍 Debug - Strategy bets:', { 
      error: strategyBetsError?.message, 
      count: strategyBetsData?.length || 0,
      sample: strategyBetsData?.slice(0, 2)
    })

    // 4. Check subscriptions to get strategy IDs
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, strategy_id, subscriber_id, status')
      .eq('status', 'active')
      .limit(5)

    console.log('🔍 Debug - Active subscriptions:', { 
      error: subsError?.message, 
      count: subscriptions?.length || 0,
      sample: subscriptions?.slice(0, 2)
    })

    // 5. Test getOpenBetsForStrategies with sample strategy IDs
    if (subscriptions && subscriptions.length > 0) {
      const strategyIds = subscriptions.map(s => s.strategy_id).filter(Boolean)
      const openBetsResult = await getOpenBetsForStrategies(strategyIds, supabase)
      
      console.log('🔍 Debug - getOpenBetsForStrategies result:', {
        strategyIds,
        result: openBetsResult,
        totalBets: Object.values(openBetsResult).flat().length
      })
    }

    return NextResponse.json({
      success: true,
      debug: {
        allPendingBets: allPendingBets?.length || 0,
        futurePendingBets: futurePendingBets?.length || 0,
        strategyBets: strategyBetsData?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        sampleData: {
          pendingBets: allPendingBets?.slice(0, 2),
          futureBets: futurePendingBets?.slice(0, 2),
          strategyBets: strategyBetsData?.slice(0, 2),
          subscriptions: subscriptions?.slice(0, 2)
        }
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}