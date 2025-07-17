import { authenticatedRequest, paginatedRequest, supabase } from './client'

// Fallback type for SubscriptionForm
interface SubscriptionForm {
  sellerId: string
  tier: string
  price: number
  expiresAt?: Date
}

// Get user's active subscriptions
export async function getUserSubscriptions(options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async (userId) => {
    const query = supabase
      .from('subscriptions')
      .select(`
        *,
        seller:profiles!seller_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        seller_profile:seller_profiles!seller_id(
          specialization,
          roi,
          win_rate,
          subscriber_count
        )
      `)
      .eq('subscriber_id', userId)
      .order('created_at', { ascending: false })
    const paginated = await paginatedRequest(query, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get active subscriptions only
export async function getActiveSubscriptions() {
  return authenticatedRequest(async (userId) => {
    return await supabase
      .from('subscriptions')
      .select(`
        *,
        seller:profiles!seller_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        seller_profile:seller_profiles!seller_id(
          specialization,
          roi,
          win_rate
        )
      `)
      .eq('subscriber_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
  })
}

// Create new subscription
export async function createSubscription(subscriptionData: SubscriptionForm) {
  return authenticatedRequest(async (userId) => {
    // Check if user is already subscribed to this seller
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('subscriber_id', userId)
      .eq('seller_id', subscriptionData.sellerId)
      .eq('status', 'active')
      .single()

    if (existing) {
      return { data: null, error: 'Already subscribed to this seller' }
    }

    // Prevent self-subscription
    if (userId === subscriptionData.sellerId) {
      return { data: null, error: 'Cannot subscribe to yourself' }
    }

    const subscription = {
      subscriber_id: userId,
      seller_id: subscriptionData.sellerId,
      tier: subscriptionData.tier,
      price: subscriptionData.price,
      status: 'pending', // Will be updated to 'active' after payment confirmation
      started_at: new Date().toISOString(),
      expires_at: subscriptionData.expiresAt?.toISOString() || null
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select(`
        *,
        seller:profiles!seller_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .single()

    if (!error) {
      // Increment seller's subscriber count
      await supabase.rpc('increment_seller_subscribers', { seller_id: subscriptionData.sellerId })
    }

    return { data, error }
  })
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string, reason?: string) {
  return authenticatedRequest(async (userId) => {
    // Get subscription details first
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('seller_id, status')
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .single()

    if (!subscription) {
      return { data: null, error: 'Subscription not found' }
    }

    if (subscription.status !== 'active') {
      return { data: null, error: 'Subscription is not active' }
    }

    const updates = {
      status: 'cancelled' as const,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .select()
      .single()

    if (!error) {
      // Decrement seller's subscriber count
      await supabase.rpc('decrement_seller_subscribers', { seller_id: subscription.seller_id })
    }

    return { data, error }
  })
}

// Reactivate cancelled subscription
export async function reactivateSubscription(subscriptionId: string) {
  return authenticatedRequest(async (userId) => {
    // Get subscription details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('seller_id, status')
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .single()

    if (!subscription) {
      return { data: null, error: 'Subscription not found' }
    }

    if (subscription.status !== 'cancelled') {
      return { data: null, error: 'Can only reactivate cancelled subscriptions' }
    }

    const updates = {
      status: 'active' as const,
      cancelled_at: null,
      cancellation_reason: null,
      reactivated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .select()
      .single()

    if (!error) {
      // Increment seller's subscriber count
      await supabase.rpc('increment_seller_subscribers', { seller_id: subscription.seller_id })
    }

    return { data, error }
  })
}

// Update subscription tier
export async function updateSubscriptionTier(subscriptionId: string, newTier: string, newPrice: number) {
  return authenticatedRequest(async (userId) => {
    const updates = {
      tier: newTier,
      price: newPrice,
      updated_at: new Date().toISOString()
    }

    return await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .eq('status', 'active')
      .select(`
        *,
        seller:profiles!seller_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .single()
  })
}

// Get subscription by ID
export async function getSubscriptionById(subscriptionId: string) {
  return authenticatedRequest(async (userId) => {
    return await supabase
      .from('subscriptions')
      .select(`
        *,
        seller:profiles!seller_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        seller_profile:seller_profiles!seller_id(
          specialization,
          roi,
          win_rate,
          subscriber_count
        )
      `)
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .single()
  })
}

// Get picks available to user based on subscriptions
export async function getSubscriptionPicks(options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async (userId) => {
    // Get user's active subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('seller_id, tier')
      .eq('subscriber_id', userId)
      .eq('status', 'active')

    if (!subscriptions || subscriptions.length === 0) {
      return { data: [], error: null }
    }

    // Build query for picks user has access to
    const sellerIds = subscriptions.map(sub => sub.seller_id)
    const query = supabase
      .from('picks')
      .select(`
        *,
        author:profiles!user_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .in('user_id', sellerIds)
      .order('created_at', { ascending: false })
    const paginated = await paginatedRequest(query, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get subscription statistics for user
export async function getSubscriptionStats() {
  return authenticatedRequest(async (userId) => {
    const [
      activeResult,
      totalResult,
      monthlySpendResult,
      totalSpendResult
    ] = await Promise.all([
      // Active subscriptions count
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('subscriber_id', userId)
        .eq('status', 'active'),
      // Total subscriptions count
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('subscriber_id', userId),
      // Monthly spending
      supabase
        .from('subscriptions')
        .select('price')
        .eq('subscriber_id', userId)
        .eq('status', 'active'),
      // Total spending (from billing records)
      supabase
        .from('billing_records')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'paid')
    ])
    const activeCount = activeResult.count || 0
    const totalCount = totalResult.count || 0
    const monthlySpend = (monthlySpendResult.data || []).reduce((sum, sub) => sum + sub.price, 0)
    const totalSpend = (totalSpendResult.data || []).reduce((sum, record) => sum + record.amount, 0)
    return {
      data: {
        activeSubscriptions: activeCount,
        totalSubscriptions: totalCount,
        monthlySpending: monthlySpend,
        totalSpending: totalSpend
      },
      error: null
    }
  })
}

// Get seller's subscribers (for sellers)
export async function getSellerSubscribers(options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async (userId) => {
    const query = supabase
      .from('subscriptions')
      .select(`
        *,
        subscriber:profiles!subscriber_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
    const paginated = await paginatedRequest(query, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Get subscription performance tracking
export async function getSubscriptionPerformance(subscriptionId: string) {
  return authenticatedRequest(async (userId) => {
    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('seller_id, started_at, tier')
      .eq('id', subscriptionId)
      .eq('subscriber_id', userId)
      .single()

    if (subError || !subscription) {
      return { data: null, error: 'Subscription not found' }
    }

    // Get picks from this seller since subscription started
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('status, confidence, tier, created_at, result')
      .eq('user_id', subscription.seller_id)
      .gte('created_at', subscription.started_at)
      .in('status', ['won', 'lost'])

    if (picksError) {
      return { data: null, error: picksError }
    }

    // Filter picks by subscription tier access
    const accessiblePicks = picks.filter(pick => {
      const tierOrder = { 'free': 0, 'bronze': 1, 'silver': 2, 'premium': 3 }
      const userTierLevel = tierOrder[subscription.tier as keyof typeof tierOrder] || 0
      const pickTierLevel = tierOrder[pick.tier as keyof typeof tierOrder] || 0
      return pickTierLevel <= userTierLevel
    })

    // Calculate performance metrics
    const totalPicks = accessiblePicks.length
    const wonPicks = accessiblePicks.filter(p => p.status === 'won').length
    const winRate = totalPicks > 0 ? (wonPicks / totalPicks) * 100 : 0
    
    // Calculate ROI if result data is available
    const picksWithResults = accessiblePicks.filter(p => p.result)
    const totalProfit = picksWithResults.reduce((sum, pick) => {
      const profit = parseFloat(pick.result?.replace(/[^-\d.]/g, '') || '0')
      return sum + profit
    }, 0)

    return {
      data: {
        totalPicks,
        wonPicks,
        winRate,
        totalProfit,
        averageConfidence: totalPicks > 0 ? 
          accessiblePicks.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPicks : 0,
        subscriptionValue: totalProfit - (subscription.tier === 'premium' ? 89 : 
                                        subscription.tier === 'silver' ? 49 : 29)
      },
      error: null
    }
  })
}

// Check access to specific pick
export async function checkPickAccess(pickId: string) {
  return authenticatedRequest(async (userId) => {
    // Get pick details
    const { data: pick } = await supabase
      .from('picks')
      .select('user_id, tier')
      .eq('id', pickId)
      .single()

    if (!pick) {
      return { data: { hasAccess: false, reason: 'Pick not found', userTier: undefined, pickTier: undefined }, error: null }
    }

    // Check if user is subscribed to the pick's author
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('subscriber_id', userId)
      .eq('seller_id', pick.user_id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return { data: { hasAccess: false, reason: 'No active subscription', userTier: undefined, pickTier: undefined }, error: null }
    }

    // Check tier access
    const tierOrder = { 'free': 0, 'bronze': 1, 'silver': 2, 'premium': 3 }
    const userTierLevel = tierOrder[subscription.tier as keyof typeof tierOrder] || 0
    const pickTierLevel = tierOrder[pick.tier as keyof typeof tierOrder] || 0
    const hasAccess = pickTierLevel <= userTierLevel

    return {
      data: {
        hasAccess,
        userTier: subscription.tier,
        pickTier: pick.tier,
        reason: hasAccess ? '' : 'Tier upgrade required'
      },
      error: null
    }
  })
}