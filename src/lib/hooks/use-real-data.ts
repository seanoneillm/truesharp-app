// FILE: src/lib/hooks/use-real-data.ts
// Real data hooks that replace mock data with Supabase calls

'use client'
import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'
import type {
  Bet,
  FilterOptions,
  PaginationParams,
  PerformanceMetrics,
  Pick,
  Subscription,
  User
} from '../types'

// User Profile Hook
export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getProfile(userId)
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setError(null)
      const updatedProfile = await apiClient.updateProfile(updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update profile'
      setError(error)
      throw err
    }
  }, [])

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  }
}

// Bets Hook (replaces mock data)
export function useBets(filters?: FilterOptions, pagination?: PaginationParams) {
  const [bets, setBets] = useState<Bet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paginationInfo, setPaginationInfo] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({ page: 1, limit: 50, total: 0, totalPages: 0 })

  const fetchBets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getBets({ filters, pagination })
      setBets(response.data)
      if (response.pagination) {
        setPaginationInfo(response.pagination)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bets')
      setBets([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination])

  useEffect(() => {
    fetchBets()
  }, [fetchBets])

  const createBet = useCallback(async (betData: Omit<Bet, 'id' | 'userId' | 'createdAt'>) => {
    try {
      setError(null)
      const newBet = await apiClient.createBet(betData)
      setBets(prev => [newBet, ...prev])
      return newBet
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create bet'
      setError(error)
      throw err
    }
  }, [])

  return {
    bets,
    isLoading,
    error,
    pagination: paginationInfo,
    refetch: fetchBets,
    createBet,
  }
}

// Performance Metrics Hook (replaces mock data)
export function usePerformanceMetrics(filters?: FilterOptions) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getPerformanceMetrics(filters)
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics')
      setMetrics(null)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  }
}

// Picks Hook (replaces mock data)
export function usePicks(sellerId?: string, tier?: 'free' | 'bronze' | 'silver' | 'premium', pagination?: PaginationParams) {
  const [picks, setPicks] = useState<Pick[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paginationInfo, setPaginationInfo] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const fetchPicks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getPicks({ sellerId, tier, pagination })
      setPicks(response.data)
      if (response.pagination) {
        setPaginationInfo(response.pagination)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch picks')
      setPicks([])
    } finally {
      setIsLoading(false)
    }
  }, [sellerId, tier, pagination])

  useEffect(() => {
    fetchPicks()
  }, [fetchPicks])

  const createPick = useCallback(async (pickData: Omit<Pick, 'id' | 'userId' | 'engagement' | 'postedAt'>) => {
    try {
      setError(null)
      const newPick = await apiClient.createPick(pickData)
      setPicks(prev => [newPick, ...prev])
      return newPick
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create pick'
      setError(error)
      throw err
    }
  }, [])

  return {
    picks,
    isLoading,
    error,
    pagination: paginationInfo,
    refetch: fetchPicks,
    createPick,
  }
}

// Subscriptions Hook (replaces mock data)
export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getSubscriptions()
      setSubscriptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions')
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const createSubscription = useCallback(async (sellerId: string, tier: 'bronze' | 'silver' | 'premium', price: number) => {
    try {
      setError(null)
      const newSubscription = await apiClient.createSubscription(sellerId, tier, price)
      setSubscriptions(prev => [newSubscription, ...prev])
      return newSubscription
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create subscription'
      setError(error)
      throw err
    }
  }, [])

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      setError(null)
      // TODO: Implement cancel subscription API call
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: 'cancelled' as const }
            : sub
        )
      )
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to cancel subscription'
      setError(error)
      throw err
    }
  }, [])

  return {
    subscriptions,
    isLoading,
    error,
    refetch: fetchSubscriptions,
    createSubscription,
    cancelSubscription,
  }
}

// Sportsbook Connections Hook
export function useSportsbookConnections() {
  const [connections, setConnections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getSportsbookConnections()
      setConnections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sportsbook connections')
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const connectSportsbook = useCallback(async (sportsbookId: string, credentials: any) => {
    try {
      setError(null)
      const connection = await apiClient.connectSportsbook(sportsbookId, credentials)
      setConnections(prev => {
        const existing = prev.find(c => c.sportsbook_id === sportsbookId)
        if (existing) {
          return prev.map(c => c.id === existing.id ? connection : c)
        }
        return [...prev, connection]
      })
      return connection
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to connect sportsbook'
      setError(error)
      throw err
    }
  }, [])

  return {
    connections,
    isLoading,
    error,
    refetch: fetchConnections,
    connectSportsbook,
  }
}

// Sellers Hook (for marketplace)
export function useSellers(filters?: any) {
  const [sellers, setSellers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSellers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // TODO: Implement proper sellers API
      // For now, we'll simulate with a delay and return empty array
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSellers([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sellers')
      setSellers([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchSellers()
  }, [fetchSellers])

  return {
    sellers,
    isLoading,
    error,
    refetch: fetchSellers,
  }
}

// Notifications Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])

  const addNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    autoClose?: boolean
    duration?: number
  }) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000,
    }

    setNotifications(prev => [newNotification, ...prev])

    if (newNotification.autoClose) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}

// Combined Data Hook (for components that need multiple data sources)
export function useDashboardData() {
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile()
  const { metrics, isLoading: metricsLoading, error: metricsError } = usePerformanceMetrics()
  const { bets, isLoading: betsLoading, error: betsError } = useBets()
  const { connections, isLoading: connectionsLoading, error: connectionsError } = useSportsbookConnections()

  const isLoading = profileLoading || metricsLoading || betsLoading || connectionsLoading
  const error = profileError || metricsError || betsError || connectionsError

  return {
    profile,
    metrics,
    bets: bets.slice(0, 5), // Recent bets for dashboard
    connections,
    isLoading,
    error,
  }
}

// Local Storage Hook (unchanged)
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