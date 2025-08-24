import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/picks - Get picks with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const tier = searchParams.get('tier')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    let query = supabase
      .from('picks')
      .select('*, profiles(username, display_name, is_verified)', { count: 'exact' })
    if (sellerId) {
      query = query.eq('user_id', sellerId)
    }
    if (tier) {
      query = query.eq('tier', tier)
    }
    query = query
      .order('posted_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    const { data: picks, error, count } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      data: picks || [],
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

// POST /api/picks - Create new pick
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const pickData = await request.json()
    const { data: pick, error } = await supabase
      .from('picks')
      .insert({
        user_id: user.id,
        bet_id: pickData.betId,
        sport: pickData.sport,
        title: pickData.title,
        description: pickData.description,
        analysis: pickData.analysis,
        confidence: pickData.confidence,
        odds: pickData.odds,
        tier: pickData.tier || 'free',
        status: pickData.status || 'pending',
        result: pickData.result,
        game_time: pickData.gameTime,
        is_manual: pickData.isManual || true,
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: pick })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
