'use client'

import { createClient } from '@/lib/supabase'
import React, { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

// Create Supabase client once using the consistent client
const supabase = createClient()

// Global auth state
const globalAuthState = {
  initialized: false,
  user: null as User | null,
  loading: true,
  initPromise: null as Promise<void> | null,
  listeners: new Set<() => void>()
}

const notifyListeners = () => {
  console.log('Notifying', globalAuthState.listeners.size, 'auth listeners')
  globalAuthState.listeners.forEach(listener => listener())
}

// Initialize auth once globally
const initializeAuth = async () => {
  if (globalAuthState.initPromise) {
    return globalAuthState.initPromise
  }

  globalAuthState.initPromise = (async () => {
    try {
      console.log('Initializing auth globally')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('Auth session result:', { 
        hasSession: !!session, 
        error,
        sessionDetails: session ? {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: session.expires_at
        } : null
      })
      
      let currentUser = null
      if (!error && session?.user) {
        // Check if session is expired
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
          console.log('Session has expired, refreshing...')
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError || !refreshedSession) {
            console.log('Failed to refresh session, signing out')
            await supabase.auth.signOut()
            currentUser = null
          } else {
            console.log('Session refreshed successfully')
            session = refreshedSession
          }
        }

        if (session?.user) {
          currentUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email
          }
          console.log('User found:', currentUser.email, 'User ID:', currentUser.id)
          
          // Verify the session is still valid by making a test query
          try {
            const { error: testError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single()
              
            if (testError) {
              console.error('Session validation failed:', testError)
              console.log('Clearing invalid session...')
              await supabase.auth.signOut()
              currentUser = null
            } else {
              console.log('Session validated successfully')
            }
          } catch (sessionError) {
            console.error('Session validation error:', sessionError)
            console.log('Clearing invalid session...')
            await supabase.auth.signOut()
            currentUser = null
          }
        }
      } else {
        console.log('No user session found')
      }
      
      globalAuthState.user = currentUser
      globalAuthState.loading = false
      globalAuthState.initialized = true
      
      console.log('Auth initialization complete:', { hasUser: !!currentUser, loading: false })
      notifyListeners()
    } catch (error) {
      console.error('Auth initialization failed:', error)
      globalAuthState.user = null
      globalAuthState.loading = false
      globalAuthState.initialized = true
      notifyListeners()
    }
  })()

  return globalAuthState.initPromise
}

// Set up auth state listener once
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, 'Session exists:', !!session)
  let currentUser = null
  if (session?.user) {
    currentUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email
    }
    console.log('Auth state change - User ID:', currentUser.id, 'Email:', currentUser.email)
  } else {
    console.log('Auth state change - No user found')
  }
  
  globalAuthState.user = currentUser
  globalAuthState.loading = false
  notifyListeners()
})

export function useAuth() {
  console.log('useAuth called')
  const [user, setUser] = useState<User | null>(globalAuthState.user)
  const [loading, setLoading] = useState(globalAuthState.loading)
  const [, forceUpdate] = useState({})
  
  // Force re-render when global state changes
  useEffect(() => {
    const listener = () => {
      console.log('Auth listener triggered, updating local state')
      setUser(globalAuthState.user)
      setLoading(globalAuthState.loading)
      forceUpdate({}) // Force re-render
    }
    
    globalAuthState.listeners.add(listener)
    return () => {
      globalAuthState.listeners.delete(listener)
    }
  }, [])
  
  // Initialize auth if not already done
  if (!globalAuthState.initialized && !globalAuthState.initPromise) {
    console.log('Starting auth initialization')
    initializeAuth()
  }

  const signIn = async (userData: {
    email: string
    password: string
    rememberMe?: boolean
  }) => {
    try {
      // Ensure we have clean string values
      const email = String(userData.email || '').trim()
      const password = String(userData.password || '')
      
      // Validate inputs
      if (!email || !password) {
        return { error: 'Email and password are required' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // Provide more user-friendly error messages
        let errorMessage = error.message
        
        if (error.message === 'Email not confirmed') {
          errorMessage = 'Please check your email and click the confirmation link before signing in.'
        } else if (error.message === 'Invalid login credentials') {
          errorMessage = 'Invalid email or password. Please try again.'
        } else if (error.message.includes('Email rate limit exceeded')) {
          errorMessage = 'Too many login attempts. Please try again later.'
        }
        
        return { error: errorMessage }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'An unexpected error occurred during sign in' }
    }
  }

  const signUp = async (userData: {
    email: string
    password: string
    username: string
    displayName: string
    termsAccepted?: boolean
    ageVerified?: boolean
  }) => {
    try {
      console.log('Starting signup with data:', {
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName
      })

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
        // Temporarily remove metadata to see if that's causing the issue
      })

      console.log('Supabase auth response:', { data, error })

      if (error) {
        console.error('Supabase auth error:', error)
        return { error: error.message }
      }

      if (data.user) {
        console.log('User created successfully, creating profile for:', data.user.id)
        
        // Create user profile via API route to use service role securely
        try {
          const profileResponse = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              username: userData.username,
              email: userData.email
            })
          })

          console.log('Profile API response status:', profileResponse.status)

          if (!profileResponse.ok) {
            const profileError = await profileResponse.json()
            console.error('Profile creation error:', profileError)
            return { error: 'Database error saving new user' }
          }

          const profileResult = await profileResponse.json()
          console.log('Profile created successfully:', profileResult)
        } catch (fetchError) {
          console.error('Profile creation fetch error:', fetchError)
          return { error: 'Database error saving new user' }
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: 'An unexpected error occurred during signup' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { error: error.message }
      }
      // Clear global state immediately
      globalAuthState.user = null
      globalAuthState.loading = false
      setUser(null)
      notifyListeners()
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'An unexpected error occurred during sign out' }
    }
  }

  const refreshAuth = async () => {
    try {
      console.log('Manually refreshing auth state...')
      globalAuthState.initialized = false
      globalAuthState.initPromise = null
      await initializeAuth()
      return { error: null }
    } catch (error) {
      console.error('Auth refresh error:', error)
      return { error: 'Failed to refresh authentication' }
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshAuth
  }
}

// AuthProvider component for layout
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize auth when provider mounts
  useEffect(() => {
    if (!globalAuthState.initialized && !globalAuthState.initPromise) {
      initializeAuth()
    }
  }, [])

  return React.createElement(React.Fragment, null, children)
}