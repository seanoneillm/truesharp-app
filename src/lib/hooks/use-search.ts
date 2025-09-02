// FILE: src/lib/hooks/use-search.ts
// Search functionality hook for users, picks, and marketplace

import { supabaseDirect } from '@/lib/api/client'
import { Profile } from '@/lib/auth/supabase'
import { useCallback, useEffect, useState } from 'react'

interface SearchResults {
  users: Profile[]
  picks: Array<{
    id: string
    title: string
    sport: string
    analysis: string
    seller: {
      username: string
      display_name: string
      is_verified: boolean
    }
  }>
  sellers: Array<{
    id: string
    username: string
    display_name: string
    is_verified: boolean
    specialization: string[]
    performance: {
      win_rate: number
      roi: number
    }
  }>
}

interface SearchFilters {
  type?: 'all' | 'users' | 'picks' | 'sellers'
  sports?: string[]
  verified?: boolean
}

interface UseSearchReturn {
  results: SearchResults
  isLoading: boolean
  error: string | null
  query: string
  filters: SearchFilters
  search: (query: string, filters?: SearchFilters) => Promise<void>
  clearSearch: () => void
  setFilters: (filters: SearchFilters) => void
  recentSearches: string[]
  clearRecentSearches: () => void
}

const RECENT_SEARCHES_KEY = 'truesharp_recent_searches'
const MAX_RECENT_SEARCHES = 5

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResults>({
    users: [],
    picks: [],
    sellers: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' })
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch {
          setRecentSearches([])
        }
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      )

      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      }

      return updated
    })
  }, [])

  // Search users
  const searchUsers = useCallback(
    async (searchQuery: string): Promise<Profile[]> => {
      try {
        let query = supabaseDirect
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(10)

        if (filters.verified) {
          query = query.eq('is_verified', true)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
      } catch (err) {
        console.error('Error searching users:', err)
        return []
      }
    },
    [filters.verified]
  )

  // Search picks
  const searchPicks = useCallback(async (searchQuery: string) => {
    try {
      const query = supabaseDirect
        .from('pick_posts')
        .select(
          `
          id,
          title,
          analysis,
          seller:profiles!seller_id (
            username,
            display_name,
            is_verified
          )
        `
        )
        .or(`title.ilike.%${searchQuery}%,analysis.ilike.%${searchQuery}%`)
        .limit(10)

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(pick => ({
        id: pick.id,
        title: pick.title,
        sport: 'NFL', // TODO: Get from bet relation or add sport field
        analysis: pick.analysis || '',
        seller: pick.seller || {
          username: 'unknown',
          display_name: 'Unknown User',
          is_verified: false,
        },
      }))
    } catch (err) {
      console.error('Error searching picks:', err)
      return []
    }
  }, [])

  // Search sellers
  const searchSellers = useCallback(
    async (searchQuery: string) => {
      try {
        let query = supabaseDirect
          .from('profiles')
          .select(
            `
          id,
          username,
          display_name,
          is_verified,
          seller_settings (
            specialization
          ),
          user_performance_cache (
            win_rate,
            roi
          )
        `
          )
          .eq('seller_enabled', true)
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(10)

        if (filters.verified) {
          query = query.eq('is_verified', true)
        }

        const { data, error } = await query

        if (error) throw error

        return (data || []).map(seller => ({
          id: seller.id,
          username: seller.username,
          display_name: seller.display_name,
          is_verified: seller.is_verified,
          specialization: seller.seller_settings?.[0]?.specialization || [],
          performance: {
            win_rate: seller.user_performance_cache?.[0]?.win_rate || 0,
            roi: seller.user_performance_cache?.[0]?.roi || 0,
          },
        }))
      } catch (err) {
        console.error('Error searching sellers:', err)
        return []
      }
    },
    [filters.verified]
  )

  // Main search function
  const search = useCallback(
    async (searchQuery: string, searchFilters?: SearchFilters) => {
      if (!searchQuery.trim()) {
        setResults({ users: [], picks: [], sellers: [] })
        setQuery('')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        setQuery(searchQuery)

        if (searchFilters) {
          setFilters(searchFilters)
        }

        const currentFilters = searchFilters || filters

        let users: Profile[] = []
        let picks: any[] = []
        let sellers: any[] = []

        // Search based on type filter
        if (currentFilters.type === 'all' || currentFilters.type === 'users') {
          users = await searchUsers(searchQuery)
        }

        if (currentFilters.type === 'all' || currentFilters.type === 'picks') {
          picks = await searchPicks(searchQuery)
        }

        if (currentFilters.type === 'all' || currentFilters.type === 'sellers') {
          sellers = await searchSellers(searchQuery)
        }

        setResults({ users, picks, sellers })
        saveRecentSearch(searchQuery)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setIsLoading(false)
      }
    },
    [filters, searchUsers, searchPicks, searchSellers, saveRecentSearch]
  )

  // Clear search results
  const clearSearch = useCallback(() => {
    setResults({ users: [], picks: [], sellers: [] })
    setQuery('')
    setError(null)
  }, [])

  // Set filters
  const setFiltersWrapper = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters)
      // Re-search with new filters if there's an active query
      if (query) {
        search(query, newFilters)
      }
    },
    [query, search]
  )

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!query) return

    const timeoutId = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, filters])

  return {
    results,
    isLoading,
    error,
    query,
    filters,
    search,
    clearSearch,
    setFilters: setFiltersWrapper,
    recentSearches,
    clearRecentSearches,
  }
}
