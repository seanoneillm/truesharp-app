import { supabase } from '@/lib/auth/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use the pre-configured supabase client
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all' // all, following, hot, live
    const sport = searchParams.get('sport')

    let query = supabase
      .from('pick_posts')
      .select(
        `
        *,
        profiles!inner(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        bets(
          id,
          sport,
          description,
          odds,
          status,
          game_date,
          stake,
          actual_payout
        )
      `
      )
      .eq('tier', 'free') // Only show free picks in public feed
      .order('posted_at', { ascending: false })

    // Apply filters
    if (sport) {
      query = query.eq('bets.sport', sport)
    }

    if (filter === 'following' && user) {
      // Get user's following list
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = following?.map((f: { following_id: string }) => f.following_id) || []
      if (followingIds.length > 0) {
        query = query.in('seller_id', followingIds)
      } else {
        // If not following anyone, return empty results
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    if (filter === 'live') {
      // Show picks for games starting within next 4 hours
      const fourHoursFromNow = new Date()
      fourHoursFromNow.setHours(fourHoursFromNow.getHours() + 4)

      query = query
        .gte('bets.game_date', new Date().toISOString())
        .lte('bets.game_date', fourHoursFromNow.toISOString())
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: picks, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If hot filter, sort by engagement (this would be more complex in practice)
    let sortedPicks = picks || []
    if (filter === 'hot') {
      sortedPicks = sortedPicks.sort((a: any, b: any) => {
        // Simple engagement score based on confidence and recency
        const aScore =
          a.confidence * (1 / ((Date.now() - new Date(a.posted_at).getTime()) / 1000 / 3600))
        const bScore =
          b.confidence * (1 / ((Date.now() - new Date(b.posted_at).getTime()) / 1000 / 3600))
        return bScore - aScore
      })
    }

    return NextResponse.json({
      data: sortedPicks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
