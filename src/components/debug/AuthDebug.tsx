// FILE: src/components/debug/AuthDebug.tsx
// Simple component to debug authentication state

'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
  session?: Session | null | undefined
  user?: User | null | undefined
  sessionError?: string | undefined
  userError?: string | undefined
  error?: string | undefined
  timestamp?: string | undefined
}

export function AuthDebug() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== AUTH DEBUG START ===')
        
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', { session: session?.user?.id, sessionError })
        
        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User check:', { user: user?.id, userError })
        
        setAuthState({
          session: session,
          user: user,
          sessionError: sessionError?.message,
          userError: userError?.message,
          timestamp: new Date().toISOString()
        })
        
        console.log('=== AUTH DEBUG END ===')
      } catch (error) {
        console.error('Auth debug error:', error)
        setAuthState({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      checkAuth()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800">Checking Authentication...</h3>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-blue-800 mb-2">Authentication Debug Info</h3>
      <div className="text-sm text-blue-700 space-y-1">
        <p><strong>User ID:</strong> {authState?.user?.id || 'None'}</p>
        <p><strong>User Email:</strong> {authState?.user?.email || 'None'}</p>
        <p><strong>Session Valid:</strong> {authState?.session ? 'Yes' : 'No'}</p>
        <p><strong>Session Error:</strong> {authState?.sessionError || 'None'}</p>
        <p><strong>User Error:</strong> {authState?.userError || 'None'}</p>
        <p><strong>General Error:</strong> {authState?.error || 'None'}</p>
        <p><strong>Last Check:</strong> {authState?.timestamp}</p>
      </div>
      
      {authState?.user && (
        <div className="mt-3 p-2 bg-green-100 rounded">
          <p className="text-sm text-green-800">✅ User is authenticated and ready for data fetching</p>
        </div>
      )}
      
      {!authState?.user && (
        <div className="mt-3 p-2 bg-red-100 rounded">
          <p className="text-sm text-red-800">❌ No authenticated user - please sign in</p>
        </div>
      )}
      
      <details className="mt-3">
        <summary className="text-sm text-blue-800 cursor-pointer">View Raw Auth Data</summary>
        <pre className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded overflow-x-auto max-h-40">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </details>
    </div>
  )
}