import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Check what's actually in each table
    const { data: bets } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'pending')
      .limit(5)

    const { data: strategies } = await supabase
      .from('strategies')
      .select('*')
      .limit(5)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    const { data: strategyBets } = await supabase
      .from('strategy_bets')
      .select('*')
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        bets: bets || [],
        strategies: strategies || [],
        subscriptions: subscriptions || [],
        strategyBets: strategyBets || []
      }
    })

  } catch (error) {
    console.error('Debug all data error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}