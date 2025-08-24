// FILE: src/lib/hooks/use-user-data.ts
// User data management hook with real-time updates

import { authenticatedRequest, supabaseDirect } from '@/lib/api/client'
import { Profile } from '@/lib/auth/supabase'
import { useCallback, useEffect, useState } from 'react'

interface UserData {
  profile: Profile | null
  performance: {
    totalBets: number
    winRate: number
    roi: number
    profit: number
    currentStreak: { type: 'win' | 'loss', count: number }
  } | null
}

interface UseUserDataReturn {
  userData: UserData
  isLoading: boolean
  error: string | null
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
  refreshData: () => Promise<void>
  enableSelling: () => Promise<boolean>
  disableSelling: () => Promise<boolean>
}

export function useUserData(userId?: string): UseUserDataReturn {
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    performance: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user profile
  const fetchProfile = useCallback(async (targetUserId?: string) => {
    try {
      let query = supabaseDirect
        .from('profiles')
        .select('*')

      if (targetUserId) {
        query = query.eq('id', targetUserId)
      } else {
        const { data: { user } } = await supabaseDirect.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        query = query.eq('id', user.id)
      }

      const { data, error } = await query.single()

      if (error) throw error
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch profile')
    }
  }, [])

  // Fetch user performance metrics
  const fetchPerformance = useCallback(async (targetUserId?: string) => {
    try {
      let query = supabaseDirect
        .from('user_performance_cache')
        .select('*')
        .single()

      if (targetUserId) {
        query = query.eq('user_id', targetUserId)
      } else {
        const { data: { user } } = await supabaseDirect.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error
      }

      return data || {
        total_bets: 0,
        win_rate: 0,
        roi: 0,
        profit: 0,
        current_streak_type: 'win',
        current_streak_count: 0
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch performance')
    }
  }, [])

  // Main data fetching function
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [profile, performance] = await Promise.all([
        fetchProfile(userId),
        fetchPerformance(userId)
      ])

      setUserData({
        profile,
        performance: {
          totalBets: performance.total_bets,
          winRate: performance.win_rate,
          roi: performance.roi,
          profit: performance.profit,
          currentStreak: {
            type: performance.current_streak_type as 'win' | 'loss' || 'win',
            count: performance.current_streak_count
          }
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data')
    } finally {
      setIsLoading(false)
    }
  }, [userId, fetchProfile, fetchPerformance])

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('profiles')
        .update(updates)
        .eq('id', currentUserId)
        .select()
        .single()
    })

    if (response.success && response.data) {
      setUserData(prev => ({
        ...prev,
        profile: response.data ? (response.data as Profile) : null
      }))
      return true
    } else {
      setError(response.error || 'Failed to update profile')
      return false
    }
  }, [])

  // Enable selling function
  const enableSelling = useCallback(async (): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      // Update profile to enable selling
      const { data: profileData, error: profileError } = await supabaseDirect
        .from('profiles')
        .update({ seller_enabled: true })
        .eq('id', currentUserId)
        .select()
        .single()

      if (profileError) throw profileError

      // Create seller settings record
      const { data: settingsData, error: settingsError } = await supabaseDirect
        .from('seller_settings')
        .upsert({
          user_id: currentUserId,
          is_selling_enabled: true,
          bronze_price: 25,
          silver_price: 45,
          premium_price: 75
        })
        .select()
        .single()

      if (settingsError) throw settingsError

      return profileData
    })

    if (response.success && response.data) {
      setUserData(prev => ({
        ...prev,
        profile: response.data as Profile
      }))
      return true
    } else {
      setError(response.error || 'Failed to enable selling')
      return false
    }
  }, [])

  // Disable selling function
  const disableSelling = useCallback(async (): Promise<boolean> => {
    const response = await authenticatedRequest(async (currentUserId) => {
      return await supabaseDirect
        .from('profiles')
        .update({ seller_enabled: false })
        .eq('id', currentUserId)
        .select()
        .single()
    })

    if (response.success && response.data) {
      setUserData(prev => ({
        ...prev,
        profile: response.data
      }))
      return true
    } else {
      setError(response.error || 'Failed to disable selling')
      return false
    }
  }, [])

  // Refresh data function
  const refreshData = useCallback(async () => {
    await fetchUserData()
  }, [fetchUserData])

  // Initial load
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Set up real-time subscription for profile changes
  useEffect(() => {
    let channel: ReturnType<typeof supabaseDirect.channel> | null = null;

    supabaseDirect.auth.getUser().then(({ data: { user } }) => {
      if (!user && !userId) return;

      channel = supabaseDirect
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId || user?.id}`
          },
          (payload) => {
            setUserData(prev => ({
              ...prev,
              profile: payload.new as Profile
            }))
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabaseDirect.removeChannel(channel);
      }
    };
  }, [userId]);

  return {
    userData,
    isLoading,
    error,
    updateProfile,
    refreshData,
    enableSelling,
    disableSelling
  }
}