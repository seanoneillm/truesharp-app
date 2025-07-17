// FILE: src/lib/hooks/use-bets.ts
// Production version - matches your working data structure

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCallback, useEffect, useState } from 'react'

// Bet type matching your actual working data structure
interface Bet {
  id: string
  user_id: string
  external_bet_id?: string
  sportsbook_id?: string | null
  sport: string
  league?: string
  bet_type: string
  description: string
  odds: number // Now correctly as number
  stake: number // Now correctly as number
  potential_payout?: number
  actual_payout?: number
  status: string
  placed_at: string
  settled_at?: string | null
  game_date?: string
  teams?: any
  is_public?: boolean
  created_at: string
  prop_type?: string | null
  team_bet_on?: string
  player_name?: string | null
  home_away?: string
  line_value?: number
  opening_spread_home?: number
  closing_spread_home?: number
  opening_total?: number
  closing_total?: number
  opening_moneyline_home?: number
  closing_moneyline_home?: number
  opening_moneyline_away?: number
  closing_moneyline_away?: number
  clv?: number
  line_movement?: string
  steam_move?: boolean
  reverse_line_movement?: boolean
  public_betting_percentage?: number
  sharp_money_indicator?: boolean
  bet_timing?: string
  days_rest_home?: number
  days_rest_away?: number
  weather_condition?: string | null
  temperature?: number | null
  confidence_level?: number
  bet_strategy?: string
  home_team: string
  away_team: string
  bet_description?: string | null
  profit_loss?: string
  result?: string
  bet_placed_at?: string | null
  sportsbook?: string
  updated_at: string
}

interface BetFilters {
  sports?: string[]
  betTypes?: string[]
  results?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  search?: string
  sportsbooks?: string[]
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UseBetsReturn {
  betsData: Bet[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  setFilters: (filters: BetFilters) => void
  bets: {
    data: Bet[]
    pagination: PaginationInfo
    success: boolean
  }
}

export function useBets(userId?: string): UseBetsReturn {
  const [betsData, setBetsData] = useState<Bet[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 1000, // Increased limit for analytics
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<BetFilters>({})
  const [authReady, setAuthReady] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  // Monitor authentication state
  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(`Session error: ${sessionError.message}`)
          setAuthReady(false)
          setCurrentUser(null)
          return
        }

        if (session?.user) {
          setCurrentUser(session.user)
          setAuthReady(true)
          setError(null)
        } else {
          setCurrentUser(null)
          setAuthReady(false)
          setError('Please sign in to view your betting data')
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError(err instanceof Error ? err.message : 'Authentication check failed')
        setAuthReady(false)
        setCurrentUser(null)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        setAuthReady(true)
        setError(null)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setAuthReady(false)
        setBetsData([])
        setError('Please sign in to view your betting data')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Transform bet data for compatibility
  const transformBet = (bet: any): Bet => {
    return {
      ...bet,
      // Add teams field for compatibility
      teams: `${bet.home_team} vs ${bet.away_team}`,
      // Map settled_at based on result
      settled_at: bet.result && bet.result !== 'pending' ? bet.updated_at : null
    }
  }

  // Fetch bets function
  const fetchBets = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!authReady || !currentUser) {
      console.log('Fetch bets skipped: auth not ready or no user', { authReady, currentUser })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const targetUserId = userId || currentUser.id

      // Build query
      let query = supabase
        .from('bets')
        .select('*', { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('placed_at', { ascending: false })

      // Apply filters
      if (filters.sports && filters.sports.length > 0) {
        query = query.in('sport', filters.sports)
      }

      if (filters.betTypes && filters.betTypes.length > 0) {
        query = query.in('bet_type', filters.betTypes)
      }

      if (filters.results && filters.results.length > 0) {
        query = query.in('result', filters.results)
      }

      if (filters.sportsbooks && filters.sportsbooks.length > 0) {
        query = query.in('sportsbook', filters.sportsbooks)
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

      // Apply pagination
      const from = (page - 1) * pagination.limit
      const to = from + pagination.limit - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      console.log('Supabase query result:', {
        data: data?.length || 0,
        error: queryError,
        count,
        firstBet: data?.[0]
      })

      if (queryError) {
        throw new Error(`Database error: ${queryError.message}`)
      }

      const total = count || 0
      const totalPages = Math.ceil(total / pagination.limit)
      
      const newPagination: PaginationInfo = {
        page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      setPagination(newPagination)

      // Transform the data
      const transformedData = (data || []).map(transformBet)

      if (append && page > 1) {
        setBetsData(prev => [...prev, ...transformedData])
      } else {
        setBetsData(transformedData)
      }

    } catch (err) {
      console.error('Error in fetchBets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bets')
      setBetsData([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, authReady, currentUser, userId, filters, pagination.limit])

  // Refresh bets
  const refresh = useCallback(async () => {
    if (authReady && currentUser) {
      await fetchBets(1, false)
    }
  }, [fetchBets, authReady, currentUser])

  // Load more bets
  const loadMore = useCallback(async () => {
    if (pagination.hasNext && !isLoading && authReady && currentUser) {
      await fetchBets(pagination.page + 1, true)
    }
  }, [fetchBets, pagination.hasNext, pagination.page, isLoading, authReady, currentUser])

  // Set filters
  const setFiltersWrapper = useCallback((newFilters: BetFilters) => {
    setFilters(newFilters)
  }, [])

  // Fetch when ready
  useEffect(() => {
    if (authReady && currentUser) {
      fetchBets(1, false)
    } else {
      setIsLoading(false)
    }
  }, [authReady, currentUser, filters])

  // Legacy compatibility object
  const legacyBets = {
    data: betsData,
    pagination,
    success: !error && authReady
  }

  return {
    betsData,
    pagination,
    isLoading: !authReady || isLoading,
    error,
    refresh,
    loadMore,
    setFilters: setFiltersWrapper,
    bets: legacyBets
  }
}