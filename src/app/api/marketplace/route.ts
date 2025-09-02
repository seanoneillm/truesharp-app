import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { calculateLeaderboardScore } from '@/lib/marketplace/ranking'

export interface StrategyData {
  id: string
  strategy_id: string
  user_id: string // Add user_id for seller identification
  strategy_name: string
  strategy_description: string
  username: string
  display_name: string
  profile_picture_url: string | null
  total_bets: number
  roi_percentage: number
  win_rate: number
  primary_sport: string
  strategy_type: string
  price: number
  pricing_weekly: number
  pricing_monthly: number
  pricing_yearly: number
  subscriber_count: number
  is_verified: boolean
  verification_status: string
  rank: number | null
  leaderboard_score?: number // Composite algorithm score
  last_bet_date: string | null
  last_updated: string
  created_at: string
  start_date?: string // Start date for strategy filtering
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sport = searchParams.get('sport')
    const sortBy = searchParams.get('sort') || 'leaderboard'
    const verified = searchParams.get('verified')

    // Query the strategy_leaderboard table directly - only monetized strategies
    let query = supabase.from('strategy_leaderboard').select('*').eq('is_monetized', true)

    // Apply sport filter
    if (sport && sport !== 'all') {
      query = query.eq('primary_sport', sport.toUpperCase())
    }

    // Apply verified filter
    if (verified === 'true') {
      query = query.eq('is_verified_seller', true)
    }

    // Apply sorting
    switch (sortBy) {
      case 'leaderboard':
        // Since leaderboard_score column doesn't exist, order by ROI for now
        query = query
          .order('roi_percentage', { ascending: false })
          .order('overall_rank', { ascending: true, nullsLast: true })
        break
      case 'roi':
        query = query.order('roi_percentage', { ascending: false })
        break
      case 'winRate':
        query = query.order('win_rate', { ascending: false })
        break
      case 'totalBets':
        query = query.order('total_bets', { ascending: false })
        break
      default:
        // Default to overall rank if leaderboard score isn't available
        query = query.order('overall_rank', { ascending: true, nullsLast: true })
    }

    const { data: leaderboardData, error } = await query
      .limit(limit)
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get additional strategy details if needed
    const strategyIds = (leaderboardData || []).map(s => s.strategy_id)
    let strategyDetails: Array<{
      id: string
      description: string
      subscriber_count: number
      start_date?: string
    }> = []

    if (strategyIds.length > 0) {
      const { data: strategies, error: strategyError } = await supabase
        .from('strategies')
        .select('id, description, subscriber_count, start_date')
        .in('id', strategyIds)

      if (!strategyError) {
        strategyDetails = strategies || []
      }
    }

    // Transform to StrategyData format and calculate leaderboard scores
    const strategiesWithStats = (leaderboardData || []).map((item): StrategyData => {
      const strategyDetail = strategyDetails.find(s => s.id === item.strategy_id)

      // Calculate leaderboard score using our algorithm
      const leaderboardScore = calculateLeaderboardScore({
        id: item.id,
        strategy_id: item.strategy_id,
        user_id: item.user_id,
        strategy_name: item.strategy_name,
        username: item.username,
        is_verified_seller: item.is_verified_seller || false,
        total_bets: item.total_bets || 0,
        winning_bets: item.winning_bets || 0,
        losing_bets: item.losing_bets || 0,
        push_bets: item.push_bets || 0,
        roi_percentage: parseFloat(item.roi_percentage?.toString() || '0'),
        win_rate: parseFloat(item.win_rate?.toString() || '0'),
        overall_rank: item.overall_rank,
        sport_rank: item.sport_rank,
        leaderboard_score: undefined,
        primary_sport: item.primary_sport,
        strategy_type: item.strategy_type,
        bet_type: item.bet_type,
        is_eligible: item.is_eligible || false,
        minimum_bets_met: item.minimum_bets_met || false,
        verification_status: item.verification_status || 'unverified',
        is_monetized: item.is_monetized || false,
        subscription_price_weekly: item.subscription_price_weekly,
        subscription_price_monthly: item.subscription_price_monthly,
        subscription_price_yearly: item.subscription_price_yearly,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        last_calculated_at: item.last_calculated_at || new Date().toISOString(),
      })

      return {
        id: item.id,
        strategy_id: item.strategy_id,
        user_id: item.user_id, // Include user_id for seller identification
        strategy_name: item.strategy_name,
        strategy_description: strategyDetail?.description || 'No description available',
        username: item.username,
        display_name: item.username,
        profile_picture_url: null, // We'll need to join with profiles if needed
        total_bets: item.total_bets,
        roi_percentage: parseFloat(item.roi_percentage.toString()),
        win_rate: parseFloat(item.win_rate.toString()) * 100, // Convert decimal to percentage for display
        primary_sport: item.primary_sport || 'Multi-Sport',
        strategy_type: item.strategy_type || 'Custom',
        price: parseFloat(item.subscription_price_monthly?.toString() || '50'),
        pricing_weekly: parseFloat(item.subscription_price_weekly?.toString() || '15'),
        pricing_monthly: parseFloat(item.subscription_price_monthly?.toString() || '50'),
        pricing_yearly: parseFloat(item.subscription_price_yearly?.toString() || '500'),
        subscriber_count: strategyDetail?.subscriber_count || 0,
        is_verified: item.is_verified_seller,
        verification_status: item.verification_status,
        rank: item.overall_rank,
        leaderboard_score: leaderboardScore, // Use calculated score
        last_bet_date: null,
        last_updated: item.updated_at,
        created_at: item.created_at,
        start_date: strategyDetail?.start_date || null,
      }
    })

    // Sort by leaderboard score if requested
    if (sortBy === 'leaderboard') {
      strategiesWithStats.sort((a, b) => (b.leaderboard_score || 0) - (a.leaderboard_score || 0))
    }

    return NextResponse.json({
      data: strategiesWithStats,
      pagination: {
        page,
        limit,
        total: strategiesWithStats.length,
        totalPages: Math.ceil(strategiesWithStats.length / limit),
      },
    })
  } catch (error) {
    console.error('Marketplace API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
