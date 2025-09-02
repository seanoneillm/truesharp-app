import { isValidEmail, isValidPassword, isValidUsername } from '@/lib/auth/auth-helpers'
import { createRouteHandlerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, username, displayName, termsAccepted, ageVerified } =
      await request.json()

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        },
        { status: 400 }
      )
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      return NextResponse.json({ error: 'You must accept the terms of service' }, { status: 400 })
    }

    // Validate age verification
    if (!ageVerified) {
      return NextResponse.json(
        { error: 'You must be 18 or older to use TrueSharp' },
        { status: 400 }
      )
    }

    const { supabase, response } = createRouteHandlerSupabaseClient(request)

    // Check if username is already taken
    const { data: existingUser, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle() // Use maybeSingle instead of single to avoid error if no results

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
      console.error('Username check error:', usernameCheckError)
      return NextResponse.json({ error: 'Database error checking username' }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName || username,
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Signup auth error:', authError)

      let errorMessage = 'Signup failed'

      switch (authError.message) {
        case 'User already registered':
          errorMessage = 'An account with this email already exists'
          break
        case 'Password should be at least 6 characters':
          errorMessage = 'Password must be at least 8 characters long'
          break
        case 'Signup is disabled':
          errorMessage = 'Account creation is temporarily disabled'
          break
        case 'Email rate limit exceeded':
          errorMessage = 'Too many signup attempts. Please try again later'
          break
        default:
          errorMessage = authError.message
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Signup failed - no user created' }, { status: 400 })
    }

    // First check if profile was created by trigger
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (!existingProfile) {
      // Profile wasn't created by trigger, return error
      console.error('Profile creation error: Profile not created by trigger')
      // Optionally, you can try to clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
      return NextResponse.json(
        { error: 'Profile was not created by trigger. Please contact support.' },
        { status: 500 }
      )
    } else {
      // Profile exists, update it with our data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          display_name: displayName || username,
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ error: 'Database error updating user profile' }, { status: 500 })
      }
    }

    // Log signup event
    const signupEvent = {
      user_id: authData.user.id,
      event_type: 'signup',
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      metadata: {
        username: username.toLowerCase(),
        email_confirmed: authData.user.email_confirmed_at ? true : false,
      },
    }

    // Store signup event (optional - for analytics)
    try {
      await supabase.from('user_events').insert([signupEvent])
    } catch (eventError) {
      // Don't fail signup if event logging fails
      console.error('Event logging error:', eventError)
    }

    // Return success response
    const responseData = {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: username.toLowerCase(),
        displayName: displayName || username,
        emailConfirmed: authData.user.email_confirmed_at ? true : false,
      },
      session: authData.session,
      message: authData.user.email_confirmed_at
        ? 'Account created successfully'
        : 'Account created! Please check your email to verify your account.',
    }

    return NextResponse.json(responseData, {
      status: 201,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Signup API error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
