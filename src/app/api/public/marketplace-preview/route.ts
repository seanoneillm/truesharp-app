import { createServiceRoleClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Fetch top 3 strategies for marketplace preview
    const { data: strategies, error } = await supabase
      .from('strategy_leaderboard')
      .select(
        `
        id,
        strategy_id,
        username,
        strategy_name,
        primary_sport,
        roi_percentage,
        win_rate,
        winning_bets,
        losing_bets,
        push_bets,
        total_bets,
        subscriber_count,
        verification_status,
        profile_picture_url,
        is_monetized,
        subscription_price_weekly,
        subscription_price_monthly,
        subscription_price_yearly,
        marketplace_rank_score
      `
      )
      .order('marketplace_rank_score', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching marketplace preview:', error)
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 })
    }

    return NextResponse.json(
      { strategies },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // Cache for 10 minutes
        },
      }
    )
  } catch (error) {
    console.error('Error in marketplace-preview API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
