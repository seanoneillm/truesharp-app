import { createBrowserClient } from '@/lib/auth/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createBrowserClient()

    console.log('Checking session...')
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    console.log('Session check result:', {
      hasSession: !!session,
      error: error?.message,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          }
        : null,
    })

    if (session?.user) {
      // Test database access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      console.log('Profile check:', { profile, error: profileError?.message })

      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
        },
        profile,
        session: {
          expires_at: session.expires_at,
          access_token: session.access_token ? 'present' : 'missing',
        },
      })
    } else {
      return NextResponse.json({
        authenticated: false,
        error: error?.message || 'No session found',
      })
    }
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Session check failed',
      },
      { status: 500 }
    )
  }
}
