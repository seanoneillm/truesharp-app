import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthError, AuthResponse, AuthUser } from '@supabase/supabase-js'
import { User } from '../types'

export const supabase = createClientComponentClient()

// Authentication functions
export async function signUp(email: string, password: string, userData?: {
  username: string
  displayName: string
}): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData?.username,
          display_name: userData?.displayName,
        },
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return { user: null, error }
    }

    // Create profile record if signup successful
    if (data.user && userData) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username: userData.username,
            display_name: userData.displayName,
            email: data.user.email,
          },
        ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Signup exception:', error)
    return { user: null, error: error as AuthError }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (response.error) {
      console.error('Signin error:', response.error)
    }

    return response
  } catch (error) {
    console.error('Signin exception:', error)
    return { data: { user: null, session: null }, error: error as AuthError }
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Signout error:', error)
    }
    
    return { error }
  } catch (error) {
    console.error('Signout exception:', error)
    return { error: error as AuthError }
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      console.error('Reset password error:', error)
    }
    
    return { error }
  } catch (error) {
    console.error('Reset password exception:', error)
    return { error: error as AuthError }
  }
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) {
      console.error('Update password error:', error)
    }
    
    return { error }
  } catch (error) {
    console.error('Update password exception:', error)
    return { error: error as AuthError }
  }
}

// Profile functions
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Get current user error:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Get current user exception:', error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Get user profile error:', error)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Get user profile exception:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<{ data: User | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Update profile error:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Update profile exception:', error)
    return { data: null, error }
  }
}

// Session management
export async function refreshSession(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Refresh session error:', error)
    }
    
    return { error }
  } catch (error) {
    console.error('Refresh session exception:', error)
    return { error: error as AuthError }
  }
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// Error handling
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return 'An unknown error occurred'
  
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 8 characters long'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Email rate limit exceeded':
      return 'Too many requests. Please try again later'
    default:
      return error.message || 'An error occurred during authentication'
  }
}