import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get some sample users and their bet counts
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, username, email')
      .limit(5)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const results = []

    for (const profile of profiles || []) {
      const { data: bets } = await serviceSupabase
        .from('bets')
        .select('id, sport, bet_type, status')
        .eq('user_id', profile.id)
        .limit(5)

      results.push({
        user_id: profile.id,
        username: profile.username,
        email: profile.email,
        bet_count: bets?.length || 0,
        sample_bets: bets || [],
      })
    }

    return NextResponse.json({ users: results })
  } catch (error) {
    console.error('Error in test-users:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
