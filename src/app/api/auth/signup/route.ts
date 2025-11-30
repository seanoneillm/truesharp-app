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

    // Create user with service role admin API and then manually handle profile
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Creating user with service role admin API...')

    // Use service role to create user with a unique identifier to avoid trigger conflicts
    const uniqueEmail = email
    const tempPassword = password
    
    let authData, authError
    let userCreated = false

    // Try creating user with service role admin
    try {
      const result = await serviceSupabase.auth.admin.createUser({
        email: uniqueEmail,
        password: tempPassword,
        user_metadata: {
          username: username,
          signup_method: 'manual_api'
        },
        email_confirm: false
      })
      
      authData = result.data
      authError = result.error
      
      if (!authError && authData.user) {
        userCreated = true
        console.log('✅ User created with service role:', authData.user.id)
      }
    } catch (error) {
      console.log('Service role user creation failed, trying fallback...')
      authError = error as any
    }

    // If service role failed, try normal signup but ignore trigger errors
    if (!userCreated) {
      console.log('Trying normal signup as fallback...')
      
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const fallbackResult = await anonSupabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      })
      
      authData = fallbackResult.data
      authError = fallbackResult.error
      
      if (!authError && authData.user) {
        userCreated = true
        console.log('✅ User created with normal signup:', authData.user.id)
      }
    }

    console.log('Final signup response:', { 
      user: authData?.user?.id || 'none', 
      error: authError?.message || 'none',
      userCreated 
    })

    if (authError && !userCreated) {
      console.error('All signup methods failed:', authError)

      let errorMessage = 'Signup failed'

      const errorMsg = authError.message || ''
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        errorMessage = 'An account with this email already exists'
      } else if (errorMsg.includes('Password')) {
        errorMessage = 'Password must be at least 8 characters long'
      } else if (errorMsg.includes('rate limit')) {
        errorMessage = 'Too many signup attempts. Please try again later'
      } else {
        errorMessage = errorMsg || 'Signup failed'
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (!authData?.user) {
      return NextResponse.json({ error: 'Signup failed - no user created' }, { status: 400 })
    }

    // Create profile directly using service role (no trigger dependency)
    console.log('Creating profile for user:', authData.user.id)

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
