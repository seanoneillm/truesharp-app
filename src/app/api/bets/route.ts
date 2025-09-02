// FILE: src/app/api/bets/route.ts
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bets - Get user's bets with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sports = searchParams.get('sports')?.split(',') || []
    const betTypes = searchParams.get('betTypes')?.split(',') || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000')

    let query = supabase.from('bets').select('*', { count: 'exact' }).eq('user_id', user.id)

    if (sports.length > 0 && !sports.includes('all')) {
      query = query.in('sport', sports)
    }

    if (betTypes.length > 0 && !betTypes.includes('all')) {
      query = query.in('bet_type', betTypes)
    }

    if (startDate) {
      query = query.gte('placed_at', startDate)
    }

    if (endDate) {
      query = query.lte('placed_at', endDate)
    }

    query = query
      .order('placed_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data: bets, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: bets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bets - Create new bet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const betData = await request.json()

    const { data: bet, error } = await supabase
      .from('bets')
      .insert({
        user_id: user.id,
        external_bet_id: betData.externalBetId || `manual_${Date.now()}`,
        sportsbook_id: betData.sportsbookId || 'manual',
        sport: betData.sport,
        league: betData.league,
        bet_type: betData.betType,
        description: betData.description,
        odds: betData.odds,
        stake: betData.stake,
        potential_payout: betData.potentialPayout,
        actual_payout: betData.actualPayout,
        status: betData.status || 'pending',
        placed_at: betData.placedAt || new Date().toISOString(),
        settled_at: betData.settledAt,
        game_date: betData.gameDate,
        teams: betData.teams,
        is_public: betData.isPublic || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: bet })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
