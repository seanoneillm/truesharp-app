import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Recalculating all strategy leaderboard entries with parlay awareness...')

    // Call the recalculation function
    const { error: recalcError } = await supabase.rpc('recalculate_all_strategy_leaderboard_with_parlays')

    if (recalcError) {
      console.error('Error running recalculation:', recalcError)
      return NextResponse.json(
        { error: 'Failed to recalculate strategies', details: recalcError },
        { status: 500 }
      )
    }

    console.log('✅ Strategy leaderboard recalculation completed')

    return NextResponse.json({
      success: true,
      message: 'All strategy leaderboard entries have been recalculated with parlay awareness',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}