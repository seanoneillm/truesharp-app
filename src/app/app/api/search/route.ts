import { createClient } from '@/lib/auth/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // all, users, picks, sellers
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const results: any = {}

    // Search users
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit)

      if (!usersError) {
        results.users = users
      }
    }

    // Search sellers
    if (type === 'all' || type === 'sellers') {
      const { data: sellers, error: sellersError } = await supabase
        .from('seller_settings')
        .select(`
          *,
          profiles!inner(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('is_selling_enabled', true)
        .or(`profiles.username.ilike.%${query}%,profiles.display_name.ilike.%${query}%`)
        .limit(limit)

      if (!sellersError) {
        results.sellers = sellers
      }
    }

    // Search picks (by description or analysis)
    if (type === 'all' || type === 'picks') {
      const { data: picks, error: picksError } = await supabase
        .from('pick_posts')
        .select(`
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
            status
          )
        `)
        .eq('tier', 'free') // Only search free picks
        .or(`title.ilike.%${query}%,analysis.ilike.%${query}%,bets.description.ilike.%${query}%`)
        .limit(limit)

      if (!picksError) {
        results.picks = picks
      }
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}