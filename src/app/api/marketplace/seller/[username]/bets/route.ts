import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = createClient()
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // First, get the user ID from username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .eq('is_seller', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Fetch recent bets for this seller
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select(
        `
        id,
        sport,
        bet_type,
        bet_description,
        odds,
        stake,
        status,
        profit,
        placed_at,
        game_date
      `
      )
      .eq('user_id', profile.id)
      .order('placed_at', { ascending: false })
      .limit(limit)

    if (betsError) {
      console.error('Database query error:', betsError)
      return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
    }

    return NextResponse.json({
      data: bets || [],
    })
  } catch (error) {
    console.error('Seller bets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
