import { authenticatedRequest, paginatedRequest, supabaseDirect } from './client'
// import type { Seller } from '@/lib/types'

// Define SellerFilters interface
interface SellerFilters {
  sports?: string[]
  verificationStatus?: string[]
  minRoi?: number
  minWinRate?: number
  minSubscribers?: number
  priceRange?: {
    min?: number
    max?: number
  }
  sortBy?: 'roi' | 'winRate' | 'subscribers' | 'rating' | 'price'
  sortOrder?: 'asc' | 'desc'
}

// Get marketplace sellers with filtering
export async function getMarketplaceSellers(
  filters: SellerFilters = {},
  options = { page: 1, limit: 20 }
) {
  return authenticatedRequest(async () => {
    let query = supabaseDirect
      .from('seller_profiles')
      .select(
        `
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified,
          total_followers
        )
      `
      )
      .eq('is_active', true)

    // Apply filters
    if (filters.sports?.length) {
      query = query.overlaps('specialization', filters.sports)
    }

    if (filters.verificationStatus?.length) {
      query = query.in('verification_status', filters.verificationStatus)
    }

    if (filters.minRoi !== undefined) {
      query = query.gte('roi', filters.minRoi)
    }

    if (filters.minWinRate !== undefined) {
      query = query.gte('win_rate', filters.minWinRate)
    }

    if (filters.minSubscribers !== undefined) {
      query = query.gte('subscriber_count', filters.minSubscribers)
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange
      if (min !== undefined) {
        query = query.gte('min_price', min)
      }
      if (max !== undefined) {
        query = query.lte('max_price', max)
      }
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'roi'
    const sortOrder = filters.sortOrder || 'desc'

    switch (sortBy) {
      case 'roi':
        query = query.order('roi', { ascending: sortOrder === 'asc' })
        break
      case 'winRate':
        query = query.order('win_rate', { ascending: sortOrder === 'asc' })
        break
      case 'subscribers':
        query = query.order('subscriber_count', { ascending: sortOrder === 'asc' })
        break
      case 'rating':
        query = query.order('rating', { ascending: sortOrder === 'asc' })
        break
      case 'price':
        query = query.order('min_price', { ascending: sortOrder === 'asc' })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const paginated = await paginatedRequest(async (params) => {
      const { data, error, count } = await query.range(
        (params.page! - 1) * params.limit!,
        params.page! * params.limit! - 1
      )
      
      if (error) throw error
      
      return {
        data: data || [],
        pagination: {
          page: params.page!,
          limit: params.limit!,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit!),
          hasNext: (count || 0) > params.page! * params.limit!,
          hasPrev: params.page! > 1,
        },
        success: true,
      }
    }, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get featured sellers
export async function getFeaturedSellers(limit = 6) {
  return authenticatedRequest(async () => {
    return await supabaseDirect
      .from('seller_profiles')
      .select(
        `
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified,
          total_followers
        )
      `
      )
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('roi', { ascending: false })
      .limit(limit)
  })
}

// Get seller profile by username
export async function getSellerByUsername(username: string) {
  return authenticatedRequest(async () => {
    return await supabaseDirect
      .from('seller_profiles')
      .select(
        `
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_verified,
          total_followers,
          total_following,
          created_at
        )
      `
      )
      .eq('user.username', username)
      .eq('is_active', true)
      .single()
  })
}

// Get seller statistics
export async function getSellerStats(sellerId: string) {
  return authenticatedRequest(async () => {
    // Get comprehensive seller statistics
    const [performanceResult, subscriptionResult, pickResult, revenueResult] = await Promise.all([
      // Performance stats
      supabaseDirect
        .from('picks')
        .select('status, confidence, created_at')
        .eq('user_id', sellerId)
        .in('status', ['won', 'lost']),

      // Subscription stats
      supabaseDirect
        .from('subscriptions')
        .select('tier, price, status, created_at')
        .eq('seller_id', sellerId),

      // Pick counts
      supabaseDirect
        .from('picks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sellerId),

      // Revenue (this would be calculated from subscriptions)
      supabaseDirect
        .from('revenue_events')
        .select('amount_cents')
        .eq('seller_id', sellerId)
        .eq('status', 'completed'),
    ])

    const performance = performanceResult.data || []
    const subscriptions = subscriptionResult.data || []
    const totalPicks = pickResult.count || 0
    const revenue = revenueResult.data || []

    // Calculate performance metrics
    const wonPicks = performance.filter((p: any) => p.status === 'won').length
    const winRate = performance.length > 0 ? (wonPicks / performance.length) * 100 : 0

    // Calculate subscriber metrics
    const activeSubscribers = subscriptions.filter((s: any) => s.status === 'active').length
    const totalRevenue = revenue.reduce((sum: number, r: any) => sum + r.amount_cents, 0) / 100

    // Calculate recent performance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPicks = performance.filter((p: any) => new Date(p.created_at) >= thirtyDaysAgo)
    const recentWinRate =
      recentPicks.length > 0
        ? (recentPicks.filter((p: any) => p.status === 'won').length / recentPicks.length) * 100
        : 0

    return {
      data: {
        totalPicks,
        winRate,
        recentWinRate,
        activeSubscribers,
        totalSubscribers: subscriptions.length,
        totalRevenue,
        avgConfidence:
          performance.length > 0
            ? performance.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / performance.length
            : 0,
      },
      error: null,
    }
  })
}

// Get seller's recent picks (public view)
export async function getSellerRecentPicks(sellerId: string, options = { page: 1, limit: 10 }) {
  return authenticatedRequest(async () => {
    const query = supabaseDirect
      .from('picks')
      .select(
        `
        id,
        title,
        description,
        sport,
        confidence,
        odds,
        status,
        result,
        tier,
        created_at,
        game_time
      `
      )
      .eq('user_id', sellerId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    
    const paginated = await paginatedRequest(async (params) => {
      const { data, error, count } = await query.range(
        (params.page! - 1) * params.limit!,
        params.page! * params.limit! - 1
      )
      
      if (error) throw error
      
      return {
        data: data || [],
        pagination: {
          page: params.page!,
          limit: params.limit!,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit!),
          hasNext: (count || 0) > params.page! * params.limit!,
          hasPrev: params.page! > 1,
        },
        success: true,
      }
    }, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Search sellers
export async function searchSellers(query: string, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async () => {
    const searchQuery = supabaseDirect
      .from('seller_profiles')
      .select(
        `
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          bio,
          is_verified
        )
      `
      )
      .eq('is_active', true).or(`
        user.username.ilike.%${query}%,
        user.display_name.ilike.%${query}%,
        bio.ilike.%${query}%,
        specialization.cs.{${query}}
      `)
    
    const paginated = await paginatedRequest(async (params) => {
      const { data, error, count } = await searchQuery.range(
        (params.page! - 1) * params.limit!,
        params.page! * params.limit! - 1
      )
      
      if (error) throw error
      
      return {
        data: data || [],
        pagination: {
          page: params.page!,
          limit: params.limit!,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit!),
          hasNext: (count || 0) > params.page! * params.limit!,
          hasPrev: params.page! > 1,
        },
        success: true,
      }
    }, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get seller subscription tiers
export async function getSellerSubscriptionTiers(sellerId: string) {
  return authenticatedRequest(async () => {
    return await supabaseDirect
      .from('seller_subscription_tiers')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .order('price', { ascending: true })
  })
}

// Check if user is subscribed to seller
export async function checkSubscriptionStatus(sellerId: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('subscriptions')
      .select('id, tier, status, expires_at')
      .eq('subscriber_id', userId)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .single()
  })
}

// Get seller leaderboard
export async function getSellerLeaderboard(
  sport?: string,
  _timeframe: 'week' | 'month' | 'all' = 'month',
  limit = 50
) {
  return authenticatedRequest(async () => {
    let query = supabaseDirect
      .from('seller_profiles')
      .select(
        `
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `
      )
      .eq('is_active', true)
      .gte('total_picks', 25) // Minimum picks for leaderboard eligibility

    // Filter by sport if specified
    if (sport) {
      query = query.contains('specialization', [sport])
    }

    // Apply timeframe filter (this would require additional date filtering in a real implementation)
    // For now, we'll just order by ROI
    query = query.order('roi', { ascending: false }).limit(limit)

    return await query
  })
}

// Get seller performance by sport
export async function getSellerSportPerformance(sellerId: string) {
  return authenticatedRequest(async () => {
    const { data: picks, error } = await supabaseDirect
      .from('picks')
      .select('sport, status, confidence, created_at')
      .eq('user_id', sellerId)
      .in('status', ['won', 'lost'])

    if (error) {
      return { data: null, error }
    }

    // Group by sport and calculate performance
    const sportGroups = picks.reduce(
      (groups: any, pick: any) => {
        const sport = pick.sport || 'Unknown'
        if (!groups[sport]) {
          groups[sport] = []
        }
        groups[sport].push(pick)
        return groups
      },
      {} as Record<string, any[]>
    )

    const sportPerformance = Object.entries(sportGroups).map(([sport, sportPicks]: [string, any]) => {
      const wonPicks = sportPicks.filter((p: any) => p.status === 'won').length
      const winRate = sportPicks.length > 0 ? (wonPicks / sportPicks.length) * 100 : 0
      const avgConfidence =
        sportPicks.length > 0
          ? sportPicks.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / sportPicks.length
          : 0

      return {
        sport,
        totalPicks: sportPicks.length,
        winRate,
        avgConfidence,
      }
    })

    return { data: sportPerformance, error: null }
  })
}

// Get marketplace statistics
export async function getMarketplaceStats() {
  return authenticatedRequest(async () => {
    const [sellersResult, activeSubscriptionsResult, totalRevenueResult, picksResult] =
      await Promise.all([
        supabaseDirect
          .from('seller_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        supabaseDirect
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),

        supabaseDirect
          .from('revenue_events')
          .select('amount_cents')
          .eq('status', 'completed'),

        supabaseDirect.from('picks').select('*', { count: 'exact', head: true }),
      ])

    const totalSellers = sellersResult.count || 0
    const activeSubscriptions = activeSubscriptionsResult.count || 0
    const totalRevenue =
      (totalRevenueResult.data || []).reduce((sum: number, r: any) => sum + r.amount_cents, 0) / 100
    const totalPicks = picksResult.count || 0

    return {
      data: {
        totalSellers,
        activeSubscriptions,
        totalRevenue,
        totalPicks,
      },
      error: null,
    }
  })
}

// Report seller (content moderation)
export async function reportSeller(sellerId: string, reason: string, description?: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('seller_reports')
      .insert({
        reporter_id: userId,
        seller_id: sellerId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single()
  })
}
