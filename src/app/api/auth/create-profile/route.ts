import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, username, email } = await request.json()

    // Validate required fields
    if (!userId || !username || !email) {
      return NextResponse.json(
        { error: 'User ID, username, and email are required' },
        { status: 400 }
      )
    }

    // Debug environment variables
    console.log('SUPABASE_URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SERVICE_ROLE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not available')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert profile using service role - match exact schema
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        bio: null,
        is_seller: false,
        is_verified_seller: false,
        email: email,
        pro: 'no',
        profile_picture_url: null,
        public_profile: false
        // created_at and updated_at will be set by defaults
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
