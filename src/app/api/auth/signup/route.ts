import { isValidEmail, isValidPassword, isValidUsername } from '@/lib/auth/auth-helpers'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
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

    // Create supabase client for API route
    const supabase = await createServerSupabaseClient(request)

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

    // Try with normal anon client signup first
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Attempting normal signup with anon client...')

    // Try normal signup first
    const { data: authData, error: authError } = await anonSupabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    console.log('Normal signup response:', { data: authData, error: authError })

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

    // Create profile directly using service role (no trigger dependency)
    console.log('Creating profile for user:', authData.user.id)

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: profileError } = await serviceSupabase.from('profiles').insert({
      id: authData.user.id,
      username: username.toLowerCase(),
      email: email,
      // Let other fields use their defaults
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)

      // Clean up the auth user if profile creation fails
      try {
        await serviceSupabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Database error creating user profile: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ Profile created successfully')

    // Signup event logging removed for now - user_events table doesn't exist yet

    // Return success response
    const responseData = {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: username.toLowerCase(),
        displayName: displayName || username,
        emailConfirmed: authData.user.email_confirmed_at ? true : false,
      },
      message: authData.user.email_confirmed_at
        ? 'Account created successfully'
        : 'Account created! Please check your email to verify your account.',
    }

    return NextResponse.json(responseData, {
      status: 201,
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
