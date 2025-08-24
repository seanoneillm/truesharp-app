import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = createClient()
    const { username } = await params

    // Fetch seller profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        profile_picture_url,
        is_verified_seller,
        bio,
        created_at
      `)
      .eq('username', username)
      .eq('is_seller', true)
      .single()

    if (profileError) {
      console.error('Database query error:', profileError)
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Fetch strategies for this seller separately
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        name,
        description,
        performance_roi,
        performance_win_rate,
        performance_total_bets,
        subscriber_count,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        created_at
      `)
      .eq('user_id', profile.id)
      .eq('monetized', true)

    if (strategiesError) {
      console.error('Strategies query error:', strategiesError)
    }

    return NextResponse.json({
      data: {
        ...profile,
        strategies: strategies || []
      }
    })

  } catch (error) {
    console.error('Seller profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}