// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  // Generate cache key from function name and arguments
  // private generateKey(fn: string, args: any[] = []): string {
  //   const argsString = JSON.stringify(args)
  //   return `${fn}:${argsString}`
  // }

  // Check if cache entry is still valid
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Set cache entry
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  // Clear specific cache entry
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Global cache instance
export const apiCache = new ApiCache()

// Cache wrapper function
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    ttl?: number
    keyGenerator?: (...args: T) => string
    invalidateOn?: string[]
  } = {}
) {
  return async (...args: T): Promise<R> => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`

    // Try to get from cache first
    const cached = apiCache.get<R>(key)
    if (cached !== null) {
      return cached
    }

    // If not in cache, execute function
    const result = await fn(...args)

    // Store in cache
    apiCache.set(key, result, options.ttl)

    return result
  }
}

// Cache invalidation helpers
export const CacheKeys = {
  // User related
  USER_PROFILE: (userId: string) => `user_profile:${userId}`,
  USER_STATS: (userId: string) => `user_stats:${userId}`,
  USER_FOLLOWERS: (userId: string) => `user_followers:${userId}`,
  USER_FOLLOWING: (userId: string) => `user_following:${userId}`,

  // Betting related
  USER_BETS: (userId: string, filters?: any) =>
    `user_bets:${userId}:${JSON.stringify(filters || {})}`,
  BET_STATS: (userId: string, filters?: any) =>
    `bet_stats:${userId}:${JSON.stringify(filters || {})}`,
  PERFORMANCE_METRICS: (userId: string, filters?: any) =>
    `performance:${userId}:${JSON.stringify(filters || {})}`,

  // Marketplace related
  MARKETPLACE_SELLERS: (filters?: any) => `marketplace_sellers:${JSON.stringify(filters || {})}`,
  SELLER_PROFILE: (username: string) => `seller_profile:${username}`,
  SELLER_STATS: (sellerId: string) => `seller_stats:${sellerId}`,
  SELLER_PICKS: (sellerId: string) => `seller_picks:${sellerId}`,

  // Social related
  SOCIAL_FEED: (userId: string, filters?: any) =>
    `social_feed:${userId}:${JSON.stringify(filters || {})}`,
  POST_COMMENTS: (postId: string) => `post_comments:${postId}`,
  TRENDING_HASHTAGS: () => 'trending_hashtags',

  // Subscriptions
  USER_SUBSCRIPTIONS: (userId: string) => `user_subscriptions:${userId}`,
  SUBSCRIPTION_PICKS: (userId: string) => `subscription_picks:${userId}`,

  // Analytics
  SPORT_BREAKDOWN: (userId: string, filters?: any) =>
    `sport_breakdown:${userId}:${JSON.stringify(filters || {})}`,
  PROFIT_OVER_TIME: (userId: string, filters?: any) =>
    `profit_over_time:${userId}:${JSON.stringify(filters || {})}`,
  ADVANCED_ANALYTICS: (userId: string, filters?: any) =>
    `advanced_analytics:${userId}:${JSON.stringify(filters || {})}`,
}

// Cache invalidation groups
export const CacheInvalidation = {
  // Invalidate user-related caches when user data changes
  invalidateUser: (userId: string) => {
    const patterns = [
      CacheKeys.USER_PROFILE(userId),
      CacheKeys.USER_STATS(userId),
      CacheKeys.USER_FOLLOWERS(userId),
      CacheKeys.USER_FOLLOWING(userId),
    ]
    patterns.forEach(pattern => apiCache.delete(pattern))
  },

  // Invalidate betting caches when new bet is added/updated
  invalidateUserBets: (userId: string) => {
    // Clear all bet-related cache for user
    const stats = apiCache.getStats()
    stats.keys
      .filter(
        key =>
          key.includes(`user_bets:${userId}`) ||
          key.includes(`bet_stats:${userId}`) ||
          key.includes(`performance:${userId}`) ||
          key.includes(`sport_breakdown:${userId}`) ||
          key.includes(`profit_over_time:${userId}`) ||
          key.includes(`advanced_analytics:${userId}`)
      )
      .forEach(key => apiCache.delete(key))
  },

  // Invalidate seller caches when seller data changes
  invalidateSeller: (sellerId: string, username?: string) => {
    const patterns = [CacheKeys.SELLER_STATS(sellerId), CacheKeys.SELLER_PICKS(sellerId)]
    if (username) {
      patterns.push(CacheKeys.SELLER_PROFILE(username))
    }
    patterns.forEach(pattern => apiCache.delete(pattern))

    // Also clear marketplace cache
    const stats = apiCache.getStats()
    stats.keys
      .filter(key => key.includes('marketplace_sellers'))
      .forEach(key => apiCache.delete(key))
  },

  // Invalidate social caches when new post is created
  invalidateSocialFeed: () => {
    const stats = apiCache.getStats()
    stats.keys
      .filter(key => key.includes('social_feed') || key.includes('trending_hashtags'))
      .forEach(key => apiCache.delete(key))
  },

  // Invalidate subscription caches when subscription changes
  invalidateSubscriptions: (userId: string) => {
    const patterns = [CacheKeys.USER_SUBSCRIPTIONS(userId), CacheKeys.SUBSCRIPTION_PICKS(userId)]
    patterns.forEach(pattern => apiCache.delete(pattern))
  },

  // Clear all cache (nuclear option)
  clearAll: () => {
    apiCache.clear()
  },
}

// Cache configurations for different data types
export const CacheConfigs = {
  // User data - medium TTL since it changes occasionally
  USER_DATA: { ttl: 10 * 60 * 1000 }, // 10 minutes

  // Performance data - medium TTL since it's computation heavy
  PERFORMANCE_DATA: { ttl: 15 * 60 * 1000 }, // 15 minutes

  // Marketplace data - short TTL since it's competitive
  MARKETPLACE_DATA: { ttl: 5 * 60 * 1000 }, // 5 minutes

  // Social feed - very short TTL for real-time feel
  SOCIAL_DATA: { ttl: 2 * 60 * 1000 }, // 2 minutes

  // Static/reference data - long TTL
  REFERENCE_DATA: { ttl: 60 * 60 * 1000 }, // 1 hour

  // Analytics - medium TTL since computation is expensive
  ANALYTICS_DATA: { ttl: 20 * 60 * 1000 }, // 20 minutes
}

// Background cache cleanup
if (typeof window !== 'undefined') {
  // Clean up expired cache entries every 5 minutes
  setInterval(
    () => {
      apiCache.cleanup()
    },
    5 * 60 * 1000
  )
}

// Cache debugging helpers
export const CacheDebug = {
  logStats: () => {
    const stats = apiCache.getStats()
    console.log('Cache Stats:', stats)
  },

  logKey: (key: string) => {
    const data = apiCache.get(key)
    console.log(`Cache[${key}]:`, data)
  },

  clearAndLog: () => {
    const stats = apiCache.getStats()
    console.log('Clearing cache. Current stats:', stats)
    apiCache.clear()
  },
}

// Export cache instance and utilities
export default apiCache
