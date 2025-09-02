// FILE: src/lib/hooks/use-auth.tsx (Updated with better debugging)
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User as AuthUser, Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'
import { User } from '../types'

interface AuthContextType {
  user: AuthUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean // Add this for compatibility
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ error: string | null }>
  signUp: (userData: SignUpData) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  confirmPassword: string
  username: string
  displayName?: string
  termsAccepted: boolean
  ageVerified: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  // Get user profile with better error handling
  const fetchProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      try {
        console.log('Fetching profile for user ID:', userId)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Profile fetch error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })

          // If profile doesn't exist, try to create one
          if (error.code === 'PGRST116') {
            // Row not found
            console.log('Profile not found, attempting to create one...')

            const { data: userData } = await supabase.auth.getUser()
            if (userData.user) {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: userId,
                    username: userData.user.email?.split('@')[0] || 'user',
                    display_name: userData.user.email?.split('@')[0] || 'User',
                    email: userData.user.email || '',
                    is_verified: false,
                    seller_enabled: false,
                    verification_status: 'unverified',
                    total_followers: 0,
                    total_following: 0,
                    join_date: new Date().toISOString(),
                  },
                ])
                .select()
                .single()

              if (createError) {
                console.error('Error creating profile:', createError)
                return null
              }

              console.log('Profile created successfully:', newProfile)
              return newProfile
            }
          }

          return null
        }

        console.log('Profile fetched successfully:', data)
        return data
      } catch (error) {
        console.error('Profile fetch exception:', error)
        return null
      }
    },
    [supabase]
  )

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        console.log('Current session:', session?.user?.id ? 'User logged in' : 'No user')

        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            setSession(session)

            // Fetch user profile
            const userProfile = await fetchProfile(session.user.id)
            setProfile(userProfile)
          } else {
            setUser(null)
            setProfile(null)
            setSession(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)

      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        setSession(session)

        // Fetch user profile
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setUser(null)
        setProfile(null)
        setSession(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Sign in function
  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      setLoading(true)

      const response = await authApi.login(email, password, rememberMe)

      if (response.error) {
        return { error: response.error }
      }

      // Auth state will be updated via the listener
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  // Sign up function
  const signUp = async (userData: SignUpData) => {
    try {
      setLoading(true)

      const response = await authApi.signup(userData)

      if (response.error) {
        return { error: response.error }
      }

      // Auth state will be updated via the listener
      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)

      const response = await authApi.logout()

      if (response.error) {
        return { error: response.error }
      }

      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setSession(null)

      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      return { error: 'No user logged in' }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        return { error: 'Failed to update profile' }
      }

      // Update local profile state
      setProfile(data)

      return { error: null }
    } catch (error) {
      console.error('Profile update exception:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  // Refresh profile function
  const refreshProfile = async () => {
    if (!user) return

    try {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    } catch (error) {
      console.error('Profile refresh error:', error)
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user, // Add this for compatibility
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }
}

// Auth Provider Component
import React from 'react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
