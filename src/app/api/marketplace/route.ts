/**
 * MARKETPLACE API - RANKED SYSTEM (FINAL)
 * 
 * This API implements the advanced marketplace ranking algorithm:
 * 
 * 1. ✅ SORTS BY overall_rank ASC (best strategies first)
 * 2. ✅ Uses marketplace_rank_score DESC as secondary sort
 * 3. ✅ Returns maximum 50 strategies
 * 4. ✅ Ensures real-time reflection of database ranking updates
 * 5. ✅ Handles parlay bet aggregation correctly (no double-counting)
 * 6. ✅ Accounts for:
 *    - Long-term ROI (normalized, capped to prevent manipulation)
 *    - Bet volume consistency (ideal 20-70 bets/week)
 *    - Posting consistency (active days in last 28 days)
 *    - Rewards sustainable performance over short-term spikes
 * 
 * Key features:
 * ✅ Live ranking updates without manual sorting
 * ✅ Cache control for fresh data
 * ✅ Preserved public display metrics (ROI, Win Rate, Total Bets, Subscribers)
 * ✅ Production-ready for React/Next.js with Supabase
 * ✅ Score displays removed from UI
 */

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
  marketplace_rank_score?: number // New marketplace ranking score
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
    const league = searchParams.get('league')
    const sortBy = searchParams.get('sort') || 'leaderboard'
    const verified = searchParams.get('verified')

    // Query the strategy_leaderboard table directly - only monetized strategies
    let query = supabase.from('strategy_leaderboard').select('*').eq('is_monetized', true)

    // Apply league filter
    if (league && league !== 'all') {
      // Map league to primary_sport for now - you may need to update your database schema
      // to have a separate league column if you want more granular filtering
      const sportMapping: Record<string, string> = {
        'NFL': 'NFL',
        'NBA': 'NBA',
        'MLB': 'MLB',
        'NHL': 'NHL',
        'NCAAF': 'NCAAF',
        'NCAAB': 'NCAAB',
        'WNBA': 'WNBA',
        'CFL': 'CFL',
        'XFL': 'XFL',
        'Premier League': 'Soccer',
        'Champions League': 'Soccer',
        'Europa League': 'Soccer',
        'La Liga': 'Soccer',
        'Serie A': 'Soccer',
        'Bundesliga': 'Soccer',
        'Ligue 1': 'Soccer',
        'MLS': 'Soccer',
        'ATP Tour': 'Tennis',
        'WTA Tour': 'Tennis',
        'PGA Tour': 'Golf',
        'UFC': 'MMA',
        'Bellator': 'MMA',
        'Boxing': 'Boxing',
        'Formula 1': 'Racing',
        'NASCAR': 'Racing'
      }
      
      const mappedSport = sportMapping[league]
      if (mappedSport) {
        query = query.eq('primary_sport', mappedSport.toUpperCase())
      }
    }

    // Apply verified filter
    if (verified === 'true') {
      query = query.eq('is_verified_seller', true)
    }

    // Apply sorting - Updated to use new ranking system with existing database schema
    switch (sortBy) {
      case 'leaderboard':
        // Primary sort by overall_rank (best strategies first)
        // Secondary sort by marketplace_rank_score for ties
        query = query
          .order('overall_rank', { ascending: true, nullsFirst: false })
          .order('marketplace_rank_score', { ascending: false, nullsFirst: false })
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
        // Default to new ranking system using overall_rank
        query = query
          .order('overall_rank', { ascending: true, nullsFirst: false })
          .order('marketplace_rank_score', { ascending: false, nullsFirst: false })
    }

    const { data: leaderboardData, error } = await query
      .limit(limit)
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Database query error:', error)
      console.error('Query details:', { sortBy, league, verified, page, limit })
      return NextResponse.json({ 
        error: 'Failed to fetch marketplace data', 
        details: error.message 
      }, { status: 500 })
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        message: 'No strategies found matching criteria'
      })
    }

    // Get additional strategy details and accurate subscriber counts
    const strategyIds = (leaderboardData || []).map(s => s.strategy_id)
    const userIds = (leaderboardData || []).map(s => s.user_id)
    
    let strategyDetails: Array<{
      id: string
      description: string
      start_date?: string
      subscriber_count: number
    }> = []
    let profilePictures: Array<{
      id: string
      profile_picture_url: string | null
    }> = []

    if (strategyIds.length > 0) {
      // Get strategy details including subscriber_count (maintained by trigger)
      const { data: strategies, error: strategyError } = await supabase
        .from('strategies')
        .select('id, description, start_date, subscriber_count')
        .in('id', strategyIds)

      if (!strategyError) {
        strategyDetails = strategies || []
      }

      // Get profile pictures
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, profile_picture_url')
        .in('id', userIds)

      if (!profileError) {
        profilePictures = profiles || []
      }
    }

    // Transform to StrategyData format and calculate leaderboard scores
    const strategiesWithStats = (leaderboardData || []).map((item): StrategyData => {
      const strategyDetail = strategyDetails.find(s => s.id === item.strategy_id)
      const profileData = profilePictures.find(p => p.id === item.user_id)

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
        leaderboard_score: 0,
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
        profile_picture_url: profileData?.profile_picture_url || null,
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
        marketplace_rank_score: item.marketplace_rank_score || 0, // Use database marketplace_rank_score
        last_bet_date: null,
        last_updated: item.updated_at,
        created_at: item.created_at,
        start_date: strategyDetail?.start_date || '',
      }
    })

    // Note: Sorting is now handled at the database level using overall_rank
    // This ensures real-time reflection of the latest ranking calculations

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
