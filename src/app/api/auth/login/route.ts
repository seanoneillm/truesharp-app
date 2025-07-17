import { isValidEmail } from '@/lib/auth/auth-helpers'
import { createRouteHandlerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const { supabase, response } = createRouteHandlerSupabaseClient(request)

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      
      // Return user-friendly error messages
      let errorMessage = 'Login failed'
      
      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = 'Invalid email or password'
          break
        case 'Email not confirmed':
          errorMessage = 'Please verify your email address before logging in'
          break
        case 'Too many requests':
          errorMessage = 'Too many login attempts. Please try again later'
          break
        default:
          errorMessage = error.message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed - no user data' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Don't fail login if profile fetch fails
    }

    // Set session duration based on rememberMe
    if (rememberMe) {
      // Extend session to 30 days for "remember me"
      await supabase.auth.updateUser({
        data: { remember_me: true }
      })
    }

    // Log login event
    const loginEvent = {
      user_id: data.user.id,
      event_type: 'login',
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      remember_me: rememberMe || false
    }

    // Store login event (optional - for analytics)
    try {
      await supabase
        .from('user_sessions')
        .insert([loginEvent])
    } catch (sessionError) {
      // Don't fail login if session logging fails
      console.error('Session logging error:', sessionError)
    }

    // Return success response with user data
    const responseData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      },
      session: data.session,
      message: 'Login successful'
    }

    // Set response headers for the updated session
    response.headers.set('Content-Type', 'application/json')
    
    return NextResponse.json(responseData, { 
      status: 200,
      headers: response.headers
    })

  } catch (error) {
    console.error('Login API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
