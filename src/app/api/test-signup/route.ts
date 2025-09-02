import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    // Test creating user directly using a different approach
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Testing alternative signup method for:', email)

    // Method 1: Try with minimal admin createUser
    try {
      const { data: userData, error: userError } = await serviceSupabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {},
      })

      console.log('Admin createUser result:', { userData, userError })

      if (userError) {
        return NextResponse.json({
          success: false,
          method: 'admin_createUser',
          error: userError.message,
          details: userError,
        })
      }

      if (userData.user) {
        // Now try to create profile manually
        const { data: profileData, error: profileError } = await serviceSupabase
          .from('profiles')
          .insert({
            id: userData.user.id,
            username: username || email.split('@')[0],
            email: email,
            bio: null,
            is_seller: false,
            is_verified_seller: false,
            pro: 'no',
            profile_picture_url: null,
            public_profile: false,
          })
          .select()

        console.log('Profile creation result:', { profileData, profileError })

        return NextResponse.json({
          success: true,
          method: 'admin_createUser_with_manual_profile',
          user: userData.user,
          profile: profileData,
          profileError: profileError?.message,
        })
      }
    } catch (adminError) {
      console.error('Admin createUser failed:', adminError)
      return NextResponse.json({
        success: false,
        method: 'admin_createUser',
        error: 'Admin createUser failed',
        details: adminError,
      })
    }

    return NextResponse.json({
      success: false,
      error: 'No user created',
    })
  } catch (error) {
    console.error('Test signup error:', error)
    return NextResponse.json({ error: 'Test signup failed', details: error }, { status: 500 })
  }
}
