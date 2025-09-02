import { supabase } from '@/lib/auth/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use the pre-configured supabase client
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sport = searchParams.get('sport')
    const sortBy = searchParams.get('sort') || 'roi'
    const verified = searchParams.get('verified')

    let query = supabase
      .from('seller_settings')
      .select(
        `
        *,
        profiles!inner(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `
      )
      .eq('is_selling_enabled', true)

    // Apply filters
    if (sport) {
      // This would need a more complex query in practice
      // For now, we'll assume specialization is stored in seller_settings
    }

    if (verified === 'true') {
      query = query.eq('profiles.is_verified', true)
    }

    const { data: sellers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Define a type for seller
    interface Seller {
      user_id: string
      [key: string]: any
    }

    // Get performance stats for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller: Seller) => {
        const { data: bets } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', seller.user_id)
          .eq('is_public', true)
          .in('status', ['won', 'lost'])
          .order('placed_at', { ascending: false })
          .limit(100)

        const totalBets = bets?.length || 0
        const wonBets = bets?.filter((bet: any) => bet.status === 'won').length || 0
        const totalStake = bets?.reduce((sum: number, bet: any) => sum + bet.stake, 0) || 0
        const totalPayout =
          bets
            ?.filter((bet: any) => bet.status === 'won')
            .reduce((sum: number, bet: any) => sum + (bet.actual_payout || 0), 0) || 0

        const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0
        const roi = totalStake > 0 ? ((totalPayout - totalStake) / totalStake) * 100 : 0

        const { data: subscriberCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact' })
          .eq('seller_id', seller.user_id)
          .eq('status', 'active')

        return {
          ...seller,
          stats: {
            totalBets,
            winRate: Math.round(winRate * 100) / 100,
            roi: Math.round(roi * 100) / 100,
            subscribers: subscriberCount?.length || 0,
          },
        }
      })
    )

    // Sort sellers
    const sortedSellers = sellersWithStats.sort(
      (
        a: Seller & {
          stats: { totalBets: number; winRate: number; roi: number; subscribers: number }
        },
        b: Seller & {
          stats: { totalBets: number; winRate: number; roi: number; subscribers: number }
        }
      ) => {
        switch (sortBy) {
          case 'roi':
            return b.stats.roi - a.stats.roi
          case 'winrate':
            return b.stats.winRate - a.stats.winRate
          case 'subscribers':
            return b.stats.subscribers - a.stats.subscribers
          default:
            return b.stats.roi - a.stats.roi
        }
      }
    )

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedSellers = sortedSellers.slice(from, to)

    return NextResponse.json({
      data: paginatedSellers,
      pagination: {
        page,
        limit,
        total: sortedSellers.length,
        totalPages: Math.ceil(sortedSellers.length / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
