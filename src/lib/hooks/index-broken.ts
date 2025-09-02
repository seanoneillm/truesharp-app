// FILE: src/lib/hooks/index.ts  
// REPLACE your existing hooks/index.ts with this version
// Updated to gradually transition from mock data to real data

'use client'
import { useCallback, useEffect, useState } from 'react'
import { Bet, FilterOptions, PerformanceMetrics, Pick, Subscription, User } from '../types'

// Import both mock data (for fallback) and real data hooks
import { mockData } from '../mock-data'
import {
  useBets as useRealBets,
  useNotifications as useRealNotifications,
  usePerformanceMetrics as useRealPerformanceMetrics,
  usePicks as useRealPicks,
  useSportsbookConnections as useRealSportsbookConnections,
  useSubscriptions as useRealSubscriptions,
  useUserProfile as useRealUserProfile,
} from './use-real-data'

// Feature flags to control transition from mock to real data
const FEATURE_FLAGS = {
  USE_REAL_AUTH: true,        // Always use real auth
  USE_REAL_PROFILE: true,     // Use real profile data
  USE_REAL_BETS: true,       // Still use mock bets for now
  USE_REAL_PICKS: true,      // Still use mock picks for now
  USE_REAL_SUBSCRIPTIONS: true, // Still use mock subscriptions for now
  USE_REAL_PERFORMANCE: true,   // Still use mock performance for now
}

// Export the real auth hook (no mock version needed)
export { useAuth } from './use-auth'

// User Profile Hook - Transition to real data
export function useUserProfile(userId?: string) {
  // Always call hooks in the same order
  const realProfile = useRealUserProfile(userId)
  const [mockProfile, setMockProfile] = useState<User | null>(null)
  const [mockLoading, setMockLoading] = useState(true)
  const [mockError, setMockError] = useState<string | null>(null)

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REAL_PROFILE) {
      // Simulate loading for mock data
      const timer = setTimeout(() => {
        setMockProfile(mockData.users[0] ?? null)
        setMockLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [userId])

  const mockUpdateProfile = useCallback(async (updates: Partial<User>) => {
    if (mockProfile) {
      const updated = { ...mockProfile, ...updates }
      setMockProfile(updated)
      return updated
    }
    throw new Error('No profile loaded')
  }, [mockProfile])

  // Return real or mock data based on feature flag
  if (FEATURE_FLAGS.USE_REAL_PROFILE) {
    return realProfile
  }

  return {
    profile: mockProfile,
    isLoading: mockLoading,
    error: mockError,
    updateProfile: mockUpdateProfile,
    refreshProfile: () => {}
  }
}

// Bets Hook - Gradual transition
export function useBets(filters?: FilterOptions) {
  if (FEATURE_FLAGS.USE_REAL_BETS) {
    return useRealBets(filters)
  }

  // Mock version
  const [bets, setBets] = useState<Bet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBets = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        let filteredBets = mockData.bets

        if (filters?.sports?.length) {
          filteredBets = filteredBets.filter(bet => filters.sports.includes(bet.sport))
        }

        if (filters?.betTypes?.length) {
          filteredBets = filteredBets.filter(bet => filters.betTypes.includes(bet.betType))
        }

        setBets(filteredBets)
      } catch (err) {
        setError('Failed to fetch bets')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBets()
  }, [filters])

  const createBet = useCallback(async (betData: Omit<Bet, 'id' | 'userId' | 'createdAt'>) => {
    const newBet: Bet = {
      ...betData,
      id: Date.now().toString(),
      userId: 'current_user',
      createdAt: new Date(),
    }
    setBets(prev => [newBet, ...prev])
    return newBet
  }, [])

  return {
    bets,
    isLoading,
    error,
    refetch: () => setBets(mockData.bets),
    createBet,
  }
}

// Performance Metrics Hook - Gradual transition
export function usePerformanceMetrics(filters?: FilterOptions) {
  if (FEATURE_FLAGS.USE_REAL_PERFORMANCE) {
    return useRealPerformanceMetrics(filters)
  }

  // Mock version
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))
      setMetrics(mockData.performanceMetrics)
      setIsLoading(false)
    }

    fetchMetrics()
  }, [filters])

  return {
    metrics,
    isLoading,
    refetch: () => setMetrics(mockData.performanceMetrics)
  }
}

// Picks Hook - Gradual transition
export function usePicks(sellerId?: string) {
  if (FEATURE_FLAGS.USE_REAL_PICKS) {
    return useRealPicks(sellerId)
  }

  // Mock version
  const [picks, setPicks] = useState<Pick[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPicks = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 400))
      let filteredPicks = mockData.picks
      if (sellerId) {
        filteredPicks = filteredPicks.filter(pick => pick.userId === sellerId)
      }
      setPicks(filteredPicks)
      setIsLoading(false)
    }

    fetchPicks()
  }, [sellerId])

  const createPick = useCallback(async (pickData: Partial<Pick>) => {
    const newPick: Pick = {
      id: Date.now().toString(),
      userId: mockData.users[0]?.id ?? 'mock-user-id',
      sport: pickData.sport || 'NFL',
      title: pickData.title || '',
      description: pickData.description || '',
      analysis: pickData.analysis ?? '',
      confidence: pickData.confidence || 3,
      odds: pickData.odds || '-110',
      tier: pickData.tier || 'bronze',
      status: 'pending',
      postedAt: new Date(),
      gameTime: pickData.gameTime || new Date(),
      isManual: true,
      engagement: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      }
    }

    setPicks(prev => [newPick, ...prev])
    return newPick
  }, [])

  return {
    picks,
    isLoading,
    createPick,
    refetch: () => setPicks(mockData.picks)
  }
}

// Subscriptions Hook - Gradual transition
export function useSubscriptions() {
  if (FEATURE_FLAGS.USE_REAL_SUBSCRIPTIONS) {
    return useRealSubscriptions()
  }

  // Mock version
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      setSubscriptions(mockData.subscriptions)
      setIsLoading(false)
    }

    fetchSubscriptions()
  }, [])

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    const updatedSubscriptions = subscriptions.map(sub =>
      sub.id === subscriptionId
        ? { ...sub, status: 'cancelled' as const }
        : sub
    )
    setSubscriptions(updatedSubscriptions)
  }, [subscriptions])

  return {
    subscriptions,
    isLoading,
    cancelSubscription,
    refetch: () => setSubscriptions(mockData.subscriptions)
  }
}

// Sellers Hook - Mock version (will be replaced later)
export function useSellers(filters?: any) {
  const [sellers, setSellers] = useState(mockData.sellers)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))
      setSellers(mockData.sellers)
      setIsLoading(false)
    }

    fetchSellers()
  }, [filters])

  return {
    sellers,
    isLoading,
    refetch: () => setSellers(mockData.sellers)
  }
}

// Sportsbook Connections Hook - Use real data
export function useSportsbookConnections() {
  return useRealSportsbookConnections()
}

// Notifications Hook - Use real implementation
export function useNotifications() {
  return useRealNotifications()
}

// Utility Hooks (unchanged)
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// Debounced Value Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Dashboard Data Hook - Combines multiple data sources
export function useDashboardData() {
  const { profile, isLoading: profileLoading } = useUserProfile()
  const { metrics, isLoading: metricsLoading } = usePerformanceMetrics()
  const { bets, isLoading: betsLoading } = useBets()
  const { connections, isLoading: connectionsLoading } = useSportsbookConnections()

  const isLoading = profileLoading || metricsLoading || betsLoading || connectionsLoading

  return {
    profile,
    metrics,
    bets: bets.slice(0, 5), // Recent bets for dashboard
    connections,
    isLoading,
  }
}

// Bet Slip Toast Hook
export { useBetSlipToast } from './use-bet-slip-toast';