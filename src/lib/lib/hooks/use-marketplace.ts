// FILE: src/lib/hooks/use-marketplace.ts
// Marketplace data hook for sellers and marketplace browsing

import { paginatedRequest, PaginatedResponse, supabaseDirect } from '@/lib/api/client'
import { Profile } from '@/lib/auth/supabase'
import { PaginationParams } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

interface MarketplaceSeller extends Profile {
  seller_settings: {
    bronze_price: number
    silver_price: number
    premium_price: number
    specialization: string[]
    bio: string
  } | null
  performance: {
    total_bets: number
    win_rate: number
    roi: number
    profit: number
    subscribers: number
    rating: number
  }
}

interface MarketplaceFilters {
  sports?: string[]
  priceRange?: {
    min?: number
    max?: number
  }
  verificationStatus?: ('unverified' | 'pending' | 'verified')[]
  sortBy?: 'roi' | 'winrate' | 'subscribers' | 'rating' | 'recent'
  search?: string
}

interface UseMarketplaceReturn {
  sellers: PaginatedResponse<MarketplaceSeller>
  featuredSellers: MarketplaceSeller[]
  isLoading: boolean
  error: string | null
  setFilters: (filters: MarketplaceFilters) => void
  setPagination: (pagination: PaginationParams) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  getSeller: (username: string) => Promise<MarketplaceSeller | null>
  getSellerPerformance: (sellerId: string) => Promise<any>
}

export function useMarketplace(): UseMarketplaceReturn {
  const [sellers, setSellers] = useState<PaginatedResponse<MarketplaceSeller>>({
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    success: true,
  })
  const [featuredSellers, setFeaturedSellers] = useState<MarketplaceSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MarketplaceFilters>({})
  const [pagination, setPaginationState] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'roi',
    sortOrder: 'desc',
  })

  // Build query with filters
  const buildQuery = useCallback(() => {
    let query = supabaseDirect
      .from('profiles')
      .select(
        `
        *,
        seller_settings (
          bronze_price,
          silver_price,
          premium_price,
          specialization,
          bio
        ),
        user_performance_cache (
          total_bets,
          win_rate,
          roi,
          profit
        )
      `,
        { count: 'exact' }
      )
      .eq('seller_enabled', true)

    // Apply filters
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      query = query.in('verification_status', filters.verificationStatus)
    }

    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`)
    }

    // Note: Sport and price filtering would require additional logic
    // since they're in related tables or arrays

    return query
  }, [filters])

  // Fetch sellers with pagination
  const fetchSellers = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchFunction = async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
          const query = buildQuery()
          
          const from = ((params.page || 1) - 1) * (params.limit || 20)
          const to = from + (params.limit || 20) - 1

          const { data, error, count } = await query
            .order(params.sortBy || 'created_at', { ascending: params.sortOrder === 'asc' })
            .range(from, to)

          if (error) {
            throw new Error(error.message)
          }

          const total = count || 0
          const totalPages = Math.ceil(total / (params.limit || 20))
          const currentPage = params.page || 1

          return {
            data: data || [],
            pagination: {
              page: currentPage,
              limit: params.limit || 20,
              total,
              totalPages,
              hasNext: currentPage < totalPages,
              hasPrev: currentPage > 1,
            },
            success: true,
          }
        }

        const paginationOptions = {
          ...pagination,
          page,
        }

        const result = await paginatedRequest<any>(fetchFunction, paginationOptions)

        if (result.success) {
          // Transform the data to include performance metrics
          const transformedData: MarketplaceSeller[] = result.data.map(seller => ({
            ...seller,
            seller_settings: seller.seller_settings?.[0] || null,
            performance: {
              total_bets: seller.user_performance_cache?.[0]?.total_bets || 0,
              win_rate: seller.user_performance_cache?.[0]?.win_rate || 0,
              roi: seller.user_performance_cache?.[0]?.roi || 0,
              profit: seller.user_performance_cache?.[0]?.profit || 0,
              subscribers: 0, // TODO: Calculate from subscriptions table
              rating: 4.5, // TODO: Calculate from reviews/ratings
            },
          }))

          setSellers(prev => ({
            ...result,
            data: append ? [...prev.data, ...transformedData] : transformedData,
          }))
        } else {
          throw new Error(result.error || 'Failed to fetch sellers')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sellers')
      } finally {
        setIsLoading(false)
      }
    },
    [buildQuery, pagination]
  )

  // Fetch featured sellers
  const fetchFeaturedSellers = useCallback(async () => {
    try {
      const { data, error } = await supabaseDirect
        .from('profiles')
        .select(
          `
          *,
          seller_settings (
            bronze_price,
            silver_price,
            premium_price,
            specialization,
            bio
          ),
          user_performance_cache (
            total_bets,
            win_rate,
            roi,
            profit
          )
        `
        )
        .eq('seller_enabled', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error

      const transformedData: MarketplaceSeller[] = (data || []).map(seller => ({
        ...seller,
        seller_settings: seller.seller_settings?.[0] || null,
        performance: {
          total_bets: seller.user_performance_cache?.[0]?.total_bets || 0,
          win_rate: seller.user_performance_cache?.[0]?.win_rate || 0,
          roi: seller.user_performance_cache?.[0]?.roi || 0,
          profit: seller.user_performance_cache?.[0]?.profit || 0,
          subscribers: 0,
          rating: 4.5,
        },
      }))

      setFeaturedSellers(transformedData)
    } catch (err) {
      console.error('Failed to fetch featured sellers:', err)
    }
  }, [])

  // Load more sellers
  const loadMore = useCallback(async () => {
    if (sellers.pagination.hasNext && !isLoading) {
      await fetchSellers(sellers.pagination.page + 1, true)
    }
  }, [sellers.pagination.hasNext, sellers.pagination.page, isLoading, fetchSellers])

  // Refresh sellers
  const refresh = useCallback(async () => {
    await Promise.all([fetchSellers(1, false), fetchFeaturedSellers()])
  }, [fetchSellers, fetchFeaturedSellers])

  // Get individual seller
  const getSeller = useCallback(async (username: string): Promise<MarketplaceSeller | null> => {
    try {
      const { data, error } = await supabaseDirect
        .from('profiles')
        .select(
          `
          *,
          seller_settings (
            bronze_price,
            silver_price,
            premium_price,
            specialization,
            bio
          ),
          user_performance_cache (
            total_bets,
            win_rate,
            roi,
            profit
          )
        `
        )
        .eq('username', username)
        .eq('seller_enabled', true)
        .single()

      if (error) throw error

      return {
        ...data,
        seller_settings: data.seller_settings?.[0] || null,
        performance: {
          total_bets: data.user_performance_cache?.[0]?.total_bets || 0,
          win_rate: data.user_performance_cache?.[0]?.win_rate || 0,
          roi: data.user_performance_cache?.[0]?.roi || 0,
          profit: data.user_performance_cache?.[0]?.profit || 0,
          subscribers: 0,
          rating: 4.5,
        },
      }
    } catch (err) {
      console.error('Failed to fetch seller:', err)
      return null
    }
  }, [])

  // Get seller performance details
  const getSellerPerformance = useCallback(async (sellerId: string) => {
    try {
      // Get performance metrics
      const { data: performance, error: perfError } = await supabaseDirect
        .from('user_performance_cache')
        .select('*')
        .eq('user_id', sellerId)
        .single()

      if (perfError && perfError.code !== 'PGRST116') throw perfError

      // Get recent bets for trending analysis
      const { data: recentBets, error: betsError } = await supabaseDirect
        .from('bets')
        .select('*')
        .eq('user_id', sellerId)
        .eq('is_public', true)
        .order('placed_at', { ascending: false })
        .limit(50)

      if (betsError) throw betsError

      // Get subscriber count
      const { count: subscriberCount, error: subError } = await supabaseDirect
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'active')

      if (subError) throw subError

      return {
        performance: performance || {
          total_bets: 0,
          win_rate: 0,
          roi: 0,
          profit: 0,
        },
        recentBets: recentBets || [],
        subscriberCount: subscriberCount || 0,
      }
    } catch (err) {
      console.error('Failed to fetch seller performance:', err)
      return null
    }
  }, [])

  // Set filters
  const setFiltersWrapper = useCallback((newFilters: MarketplaceFilters) => {
    setFilters(newFilters)
  }, [])

  // Set pagination
  const setPagination = useCallback((newPagination: PaginationParams) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Initial load and filter/pagination changes
  useEffect(() => {
    fetchSellers(pagination.page || 1, false)
  }, [filters, pagination])

  // Load featured sellers on mount
  useEffect(() => {
    fetchFeaturedSellers()
  }, [fetchFeaturedSellers])

  return {
    sellers,
    featuredSellers,
    isLoading,
    error,
    setFilters: setFiltersWrapper,
    setPagination,
    loadMore,
    refresh,
    getSeller,
    getSellerPerformance,
  }
}
