import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('Debug login for:', email)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: undefined, // Use default storage
          flowType: 'pkce',
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Login debug result:', {
      success: !!data.session,
      error: error?.message,
      sessionExists: !!data.session,
      accessTokenLength: data.session?.access_token?.length || 0,
      refreshTokenLength: data.session?.refresh_token?.length || 0,
      expiresAt: data.session?.expires_at,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No session created',
        },
        { status: 400 }
      )
    }

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
      },
    })

    // Manually set auth cookies
    const maxAge = 60 * 60 * 24 * 7 // 7 days

    response.cookies.set(
      'sb-trsogafrxpptszxydycn-auth-token',
      JSON.stringify([data.session.access_token, data.session.refresh_token, null, null, null]),
      {
        maxAge,
        httpOnly: false,
        secure: false, // Set to true in production
        sameSite: 'lax',
        path: '/',
      }
    )

    console.log('Set auth cookie manually')

    return response
  } catch (error) {
    console.error('Debug login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
      },
      { status: 500 }
    )
  }
}
