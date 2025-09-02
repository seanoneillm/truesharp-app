import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get detailed bet structure
    const { data: bets, error } = await serviceSupabase.from('bets').select('*').limit(3)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      sample_bets: bets,
      columns: bets && bets.length > 0 ? Object.keys(bets[0]) : [],
    })
  } catch (error) {
    console.error('Error in test-bet-structure:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
