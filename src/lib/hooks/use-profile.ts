'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCallback, useEffect, useState } from 'react'

interface UserProfile {
  id: string
  username: string | null
  bio: string | null
  is_seller: boolean | null
  created_at: string | null
  updated_at: string | null
  is_verified_seller: boolean | null
  email: string | null
  pro: string | null
  profile_picture_url: string | null
  public_profile: boolean | null
  sharpsports_bettor_id: string | null
  display_name: string | null
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError(profileError.message)
        setProfile(null)
      } else {
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Load profile when user changes
  useEffect(() => {
    if (!authLoading) {
      loadProfile()
    }
  }, [user, authLoading, loadProfile])

  // Refresh profile data
  const refreshProfile = useCallback(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    loading: loading || authLoading,
    error,
    refreshProfile,
  }
}
