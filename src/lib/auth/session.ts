import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface SessionUser {
  id: string
  email: string
  username?: string
  displayName?: string
  profilePicture?: string
}

export class SessionManager {
  private supabase = createClientComponentClient()

  async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      // Get additional profile data
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('username, profile_picture_url')
        .eq('id', user.id)
        .single()

      return {
        id: user.id,
        email: user.email || '',
        username: profile?.username,
        displayName: user.user_metadata?.display_name || profile?.username || user.email,
        profilePicture: profile?.profile_picture_url,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async refreshSession(): Promise<void> {
    try {
      await this.supabase.auth.refreshSession()
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: 'An unexpected error occurred during sign out' }
    }
  }

  async extendSession(): Promise<void> {
    try {
      // Refresh the session to extend its lifetime
      await this.supabase.auth.refreshSession()
    } catch (error) {
      console.error('Error extending session:', error)
    }
  }

  onAuthStateChange(callback: (user: SessionUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const sessionUser = await this.getCurrentUser()
        callback(sessionUser)
      } else {
        callback(null)
      }
    })
  }
}

export const sessionManager = new SessionManager()

// Helper functions for session management
export async function getCurrentUser(): Promise<SessionUser | null> {
  return sessionManager.getCurrentUser()
}

export async function refreshSession(): Promise<void> {
  return sessionManager.refreshSession()
}

export async function signOut(): Promise<{ error: string | null }> {
  return sessionManager.signOut()
}

export async function extendSession(): Promise<void> {
  return sessionManager.extendSession()
}

export function onAuthStateChange(callback: (user: SessionUser | null) => void) {
  return sessionManager.onAuthStateChange(callback)
}
