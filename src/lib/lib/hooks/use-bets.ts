// FILE: src/lib/hooks/use-bets.ts
// Betting data hook with pagination and real-time updates

import { authenticatedRequest, paginatedRequest, PaginatedResponse, supabaseDirect } from '@/lib/api/client'
import { Bet } from '@/lib/auth/supabase'
import { PaginationParams } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

interface BetFilters {
  sports?: string[]
  betTypes?: string[]
  status?: ('pending' | 'won' | 'lost' | 'void' | 'cancelled')[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  search?: string
}

interface UseBetsReturn {
  bets: PaginatedResponse<Bet>
  isLoading: boolean
  error: string | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  updateBet: (betId: string, updates: Partial<Bet>) => Promise<boolean>
  deleteBet: (betId: string) => Promise<boolean>
  createBet: (betData: Omit<Bet, 'id' | 'created_at'>) => Promise<boolean>
  setFilters: (filters: BetFilters) => void
  setPagination: (pagination: PaginationParams) => void
  markAsPublic: (betId: string) => Promise<boolean>
  markAsPrivate: (betId: string) => Promise<boolean>
}

export function useBets(userId?: string): UseBetsReturn {
  const [bets, setBets] = useState<PaginatedResponse<Bet>>({
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
  const [filters, setFilters] = useState<BetFilters>({})
  const [pagination, setPaginationState] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'placed_at',
    sortOrder: 'desc'
  })

  // Build query with filters
  const buildQuery = useCallback((targetUserId?: string) => {
    let query = supabaseDirect
      .from('bets')
      .select('*', { count: 'exact' })

    // Filter by user
    if (targetUserId) {
      query = query.eq('user_id', targetUserId)
    } else {
      // Will be handled by RLS policy for authenticated user
    }

    // Apply filters
    if (filters.sports && filters.sports.length > 0) {
      query = query.in('sport', filters.sports)
    }

    if (filters.betTypes && filters.betTypes.length > 0) {
      query = query.in('bet_type', filters.betTypes)
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.dateRange?.start) {
      query = query.gte('placed_at', filters.dateRange.start.toISOString())
    }

    if (filters.dateRange?.end) {
      query = query.lte('placed_at', filters.dateRange.end.toISOString())
    }

    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }

    return query
  }, [filters])

  // Fetch bets with pagination
  const fetchBets = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabaseDirect.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId && !userId) {
        throw new Error('No user ID available')
      }

      const query = buildQuery(targetUserId)
      const paginationOptions = {
        ...pagination,
        page
      }

      const result = await paginatedRequest<Bet>(query, paginationOptions)

      if (result.success) {
        setBets(prev => ({
          ...result,
          data: append ? [...prev.data, ...result.data] : result.data
        }))
      } else {
        throw new Error(result.error || 'Failed to fetch bets')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bets')
    } finally {
      setIsLoading(false)
    }
  }, [userId, buildQuery, pagination])

  // Load more bets (pagination)
  const loadMore = useCallback(async () => {
    if (bets.pagination.hasNext && !isLoading) {
      await fetchBets(bets.pagination.page + 1, true)
    }
  }, [bets.pagination.hasNext, bets.pagination.page, isLoading, fetchBets])

  // Refresh bets
  const refresh = useCallback(async () => {
    await fetchBets(1, false)
  }, [fetchBets])

  // Update bet
  const updateBet = useCallback(async (betId: string, updates: Partial<Bet>): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('bets')
        .update(updates)
        .eq('id', betId)
        .eq('user_id', currentUserId)
        .select()
        .single()
    })

    if (response.success && response.data) {
      setBets(prev => ({
        ...prev,
        data: prev.data.map(bet => 
          bet.id === betId && response.data && typeof response.data === 'object'
            ? { ...bet, ...(response.data as object) }
            : bet
        )
      }))
      return true
    } else {
      setError(response.error || 'Failed to update bet')
      return false
    }
  }, [])

  // Delete bet
  const deleteBet = useCallback(async (betId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('bets')
        .delete()
        .eq('id', betId)
        .eq('user_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setBets(prev => ({
        ...prev,
        data: prev.data.filter(bet => bet.id !== betId),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1
        }
      }))
      return true
    } else {
      setError(response.error || 'Failed to delete bet')
      return false
    }
  }, [])

  // Create bet
  const createBet = useCallback(async (betData: Omit<Bet, 'id' | 'created_at'>): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('bets')
        .insert({ ...betData, user_id: currentUserId })
        .select()
        .single()
    })

    if (response.success && response.data) {
      setBets(prev => ({
        ...prev,
        data: response.data ? [response.data, ...prev.data] : prev.data,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1
        }
      }))
      return true
    } else {
      setError(response.error || 'Failed to create bet')
      return false
    }
  }, [])

  // Mark bet as public
  const markAsPublic = useCallback(async (betId: string): Promise<boolean> => {
    return await updateBet(betId, { is_public: true })
  }, [updateBet])

  // Mark bet as private
  const markAsPrivate = useCallback(async (betId: string): Promise<boolean> => {
    return await updateBet(betId, { is_public: false })
  }, [updateBet])

  // Set filters
  const setFiltersWrapper = useCallback((newFilters: BetFilters) => {
    setFilters(newFilters)
  }, [])

  // Set pagination
  const setPagination = useCallback((newPagination: PaginationParams) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Initial load and filter/pagination changes
  useEffect(() => {
    fetchBets(pagination.page || 1, false)
  }, [filters, pagination])

  // Set up real-time subscription for bet changes
  useEffect(() => {
    supabaseDirect.auth.getUser().then(({ data: { user } }) => {
      const targetUserId = userId || user?.id
      if (!targetUserId) return

      const channel = supabaseDirect
        .channel('bet-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBets(prev => ({
                ...prev,
                data: [payload.new as Bet, ...prev.data],
                pagination: {
                  ...prev.pagination,
                  total: prev.pagination.total + 1
                }
              }))
            } else if (payload.eventType === 'UPDATE') {
              setBets(prev => ({
                ...prev,
                data: prev.data.map(bet => 
                  bet.id === payload.new.id ? payload.new as Bet : bet
                )
              }))
            } else if (payload.eventType === 'DELETE') {
              setBets(prev => ({
                ...prev,
                data: prev.data.filter(bet => bet.id !== payload.old.id),
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
    })

    let isMounted = true;
    supabaseDirect.auth.getUser().then(({ data: { user } }) => {
      const targetUserId = userId || user?.id
      if (!targetUserId || !isMounted) return

      const channel = supabaseDirect
        .channel('bet-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBets(prev => ({
                ...prev,
                data: [payload.new as Bet, ...prev.data],
                pagination: {
                  ...prev.pagination,
                  total: prev.pagination.total + 1
                }
              }))
            } else if (payload.eventType === 'UPDATE') {
              setBets(prev => ({
                ...prev,
                data: prev.data.map(bet => 
                  bet.id === payload.new.id ? payload.new as Bet : bet
                )
              }))
            } else if (payload.eventType === 'DELETE') {
              setBets(prev => ({
                ...prev,
                data: prev.data.filter(bet => bet.id !== payload.old.id),
                pagination: {
                  ...prev.pagination,
                  total: prev.pagination.total - 1
                }
              }))
            }
          }
        )
        .subscribe()

      // Cleanup
      return () => {
        isMounted = false;
        supabaseDirect.removeChannel(channel)
      }
    })

    return () => {
      isMounted = false;
    }
  }, [userId])

  return {
    bets,
    isLoading,
    error,
    loadMore,
    refresh,
    updateBet,
    deleteBet,
    createBet,
    setFilters: setFiltersWrapper,
    setPagination,
    markAsPublic,
    markAsPrivate
  }
}