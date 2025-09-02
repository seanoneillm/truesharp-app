import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get strategies directly from strategies table (simplified)
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('id, name, description, sport, league, bet_type, monetized, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to expected format
    const transformedStrategies =
      strategies?.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description || '',
        primary_sport: strategy.sport,
        bet_type: strategy.bet_type,
        total_bets: 0, // Simplified - no stats for now
        win_rate: 0,
        roi_percentage: 0,
        is_monetized: strategy.monetized || false,
        verification_status: 'unverified',
        start_date: strategy.created_at,
      })) || []

    return NextResponse.json({
      strategies: transformedStrategies,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
