// FILE: src/lib/hooks/use-picks.ts
// Pick data hook for managing and viewing picks

import { authenticatedRequest, paginatedRequest, PaginatedResponse, supabaseDirect } from '@/lib/api/client'
import { PaginationParams, Pick } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

interface PickWithSeller {
  id: string
  seller_id: string
  bet_id: string | null
  tier: 'free' | 'bronze' | 'silver' | 'premium'
  title: string
  analysis: string | null
  confidence: number
  is_premium: boolean
  posted_at: string
  created_at: string
  seller: {
    username: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  engagement: {
    views: number
    likes: number
    comments: number
    shares: number
  }
}

interface PickFilters {
  sellerId?: string
  sports?: string[]
  tiers?: ('free' | 'bronze' | 'silver' | 'premium')[]
  confidence?: number[]
  subscribedOnly?: boolean
  search?: string
}

interface UsePicksReturn {
  picks: PaginatedResponse<PickWithSeller>
  isLoading: boolean
  error: string | null
  createPick: (pickData: Omit<Pick, 'id' | 'userId' | 'createdAt' | 'engagement'>) => Promise<boolean>
  updatePick: (pickId: string, updates: Partial<Pick>) => Promise<boolean>
  deletePick: (pickId: string) => Promise<boolean>
  likePick: (pickId: string) => Promise<boolean>
  unlikePick: (pickId: string) => Promise<boolean>
  setFilters: (filters: PickFilters) => void
  setPagination: (pagination: PaginationParams) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  getMyPicks: () => Promise<Pick[]>
}

export function usePicks(sellerId?: string): UsePicksReturn {
  const [picks, setPicks] = useState<PaginatedResponse<PickWithSeller>>({
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    },
    success: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PickFilters>({ sellerId } as PickFilters)
  const [pagination, setPaginationState] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'posted_at',
    sortOrder: 'desc'
  })

  // Build query with filters
  const buildQuery = useCallback(() => {
    let query = supabaseDirect
      .from('pick_posts')
      .select(`
        *,
        seller:profiles!seller_id (
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `, { count: 'exact' })

    // Apply filters
    if (filters.sellerId) {
      query = query.eq('seller_id', filters.sellerId)
    }

    if (filters.tiers && filters.tiers.length > 0) {
      query = query.in('tier', filters.tiers)
    }

    if (filters.confidence && filters.confidence.length > 0) {
      query = query.in('confidence', filters.confidence)
    }

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }

    return query
  }, [filters])

  // Fetch picks with pagination
  const fetchPicks = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const query = buildQuery()
      const paginationOptions = {
        ...pagination,
        page
      }

      const result = await paginatedRequest<any>(query, paginationOptions)

      if (result.success) {
        // Transform the data to match our interface
        const transformedData: PickWithSeller[] = result.data.map(pick => ({
          ...pick,
          seller: pick.seller || {
            username: 'unknown',
            display_name: 'Unknown User',
            avatar_url: null,
            is_verified: false
          },
          engagement: {
            views: 0, // TODO: Implement engagement tracking
            likes: 0,
            comments: 0,
            shares: 0
          }
        }))

        setPicks(prev => ({
          ...result,
          data: append ? [...prev.data, ...transformedData] : transformedData
        }))
      } else {
        throw new Error(result.error || 'Failed to fetch picks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch picks')
    } finally {
      setIsLoading(false)
    }
  }, [buildQuery, pagination])

  // Create pick
  const createPick = useCallback(async (pickData: Omit<Pick, 'id' | 'userId' | 'createdAt' | 'engagement'>): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      // Verify user is a seller
      const { data: profile, error: profileError } = await supabaseDirect
        .from('profiles')
        .select('seller_enabled')
        .eq('id', currentUserId)
        .single()

      if (profileError || !profile?.seller_enabled) {
        throw new Error('User is not enabled as a seller')
      }

      return await supabaseDirect
        .from('pick_posts')
        .insert({
          seller_id: currentUserId,
          title: pickData.title,
          analysis: pickData.analysis,
          confidence: pickData.confidence,
          tier: pickData.tier,
          is_premium: pickData.tier !== 'free'
        })
        .select(`
          *,
          seller:profiles!seller_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .single()
    })

    if (response.success && response.data) {
      const pickData = response.data as PickWithSeller
      const newPick: PickWithSeller = {
        id: pickData.id,
        seller_id: pickData.seller_id,
        bet_id: pickData.bet_id ?? null,
        tier: pickData.tier,
        title: pickData.title,
        analysis: pickData.analysis ?? null,
        confidence: pickData.confidence,
        is_premium: pickData.is_premium,
        posted_at: pickData.posted_at,
        created_at: pickData.created_at,
        seller: pickData.seller || {
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: null,
          is_verified: false
        },
        engagement: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      }

      setPicks(prev => ({
        ...prev,
        data: [newPick, ...prev.data],
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1
        }
      }))
      return true
    } else {
      setError(response.error || 'Failed to create pick')
      return false
    }
  }, [])

  // Update pick
  const updatePick = useCallback(async (pickId: string, updates: Partial<Pick>): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('pick_posts')
        .update(updates)
        .eq('id', pickId)
        .eq('seller_id', currentUserId)
        .select(`
          *,
          seller:profiles!seller_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .single()
    })

    if (response.success && response.data) {
      setPicks(prev => ({
        ...prev,
        data: prev.data.map(pick => 
          pick.id === pickId && response.data ? {
            ...(response.data as PickWithSeller),
            seller: (response.data as PickWithSeller).seller || pick.seller,
            engagement: pick.engagement
          } : pick
        )
      }))
      return true
    } else {
      setError(response.error || 'Failed to update pick')
      return false
    }
  }, [])

  // Delete pick
  const deletePick = useCallback(async (pickId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('pick_posts')
        .delete()
        .eq('id', pickId)
        .eq('seller_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setPicks(prev => ({
        ...prev,
        data: prev.data.filter(pick => pick.id !== pickId),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1
        }
      }))
      return true
    } else {
      setError(response.error || 'Failed to delete pick')
      return false
    }
  }, [])

  // Like pick (placeholder - would need likes table)
  const likePick = useCallback(async (pickId: string): Promise<boolean> => {
    // TODO: Implement likes functionality with likes table
    console.log('Like pick:', pickId)
    return true
  }, [])

  // Unlike pick (placeholder - would need likes table)
  const unlikePick = useCallback(async (pickId: string): Promise<boolean> => {
    // TODO: Implement likes functionality with likes table
    console.log('Unlike pick:', pickId)
    return true
  }, [])

  // Get my picks (for seller dashboard)
  const getMyPicks = useCallback(async (): Promise<Pick[]> => {
    try {
      const { data: { user } } = await supabaseDirect.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabaseDirect
        .from('pick_posts')
        .select('*')
        .eq('seller_id', user.id)
        .order('posted_at', { ascending: false })

      if (error) throw error

      // Transform to Pick interface
      return (data || []).map(pick => ({
        id: pick.id,
        userId: pick.seller_id,
        betId: pick.bet_id,
        sport: 'NFL', // TODO: Get from bet or add sport field
        title: pick.title,
        description: pick.title,
        analysis: pick.analysis,
        confidence: pick.confidence,
        odds: '-110', // TODO: Get from bet or add odds field
        tier: pick.tier,
        status: 'pending', // TODO: Get from bet or add status field
        postedAt: new Date(pick.posted_at),
        gameTime: new Date(), // TODO: Get from bet or add game_time field
        isManual: true,
        engagement: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your picks')
      return []
    }
  }, [])

  // Load more picks
  const loadMore = useCallback(async () => {
    if (picks.pagination.hasNext && !isLoading) {
      await fetchPicks(picks.pagination.page + 1, true)
    }
  }, [picks.pagination.hasNext, picks.pagination.page, isLoading, fetchPicks])

  // Refresh picks
  const refresh = useCallback(async () => {
    await fetchPicks(1, false)
  }, [fetchPicks])

  // Set filters
  const setFiltersWrapper = useCallback((newFilters: PickFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Set pagination
  const setPagination = useCallback((newPagination: PaginationParams) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Initial load and filter/pagination changes
  useEffect(() => {
    fetchPicks(pagination.page || 1, false)
  }, [filters, pagination])

  // Set up real-time subscription for pick changes
  useEffect(() => {
    const channel = supabaseDirect
      .channel('pick-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pick_posts'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full pick with seller info
            supabaseDirect
              .from('pick_posts')
              .select(`
                *,
                seller:profiles!seller_id (
                  username,
                  display_name,
                  avatar_url,
                  is_verified
                )
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  const newPick = {
                    ...data,
                    seller: data.seller || {
                      username: 'unknown',
                      display_name: 'Unknown User',
                      avatar_url: null,
                      is_verified: false
                    },
                    engagement: {
                      views: 0,
                      likes: 0,
                      comments: 0,
                      shares: 0
                    }
                  }

                  setPicks(prev => ({
                    ...prev,
                    data: [newPick, ...prev.data],
                    pagination: {
                      ...prev.pagination,
                      total: prev.pagination.total + 1
                    }
                  }))
                }
              })
          } else if (payload.eventType === 'UPDATE') {
            setPicks(prev => ({
              ...prev,
              data: prev.data.map(pick => 
                pick.id === payload.new.id ? { ...pick, ...payload.new } : pick
              )
            }))
          } else if (payload.eventType === 'DELETE') {
            setPicks(prev => ({
              ...prev,
              data: prev.data.filter(pick => pick.id !== payload.old.id),
              pagination: {
                ...prev.pagination,
                total: prev.pagination.total - 1
              }
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabaseDirect.removeChannel(channel)
    }
  }, [])

  return {
    picks,
    isLoading,
    error,
    createPick,
    updatePick,
    deletePick,
    likePick,
    unlikePick,
    setFilters: setFiltersWrapper,
    setPagination,
    loadMore,
    refresh,
    getMyPicks
  }
}