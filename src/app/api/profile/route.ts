// FILE: src/app/api/profile/route.ts
// User profile API endpoints

import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔄 Profile API - Starting authentication check')
    console.log('Profile API - Auth result:', { 
      hasUser: !!user, 
      userId: user?.id?.substring(0, 8) + '...' || 'none',
      email: user?.email || 'none',
      error: authError?.message || 'none' 
    })
    
    // Try to get userId from query parameter as fallback
    const userIdParam = request.nextUrl.searchParams.get('userId')
    
    if (authError || !user) {
      if (userIdParam) {
        console.log('Profile API - Session auth failed, checking with userId parameter:', userIdParam.substring(0, 8) + '...')
        
        // Use service role client for admin operations
        const { createClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        const { data: profile, error } = await serviceSupabase
          .from('profiles')
          .select('*')
          .eq('id', userIdParam)
          .single()
          
        if (error) {
          console.error('Profile API - Service role query error:', error)
          if (error.code === 'PGRST116') {
            return NextResponse.json({ 
              error: 'Profile not found',
              details: 'No profile exists for this user'
            }, { status: 404 })
          }
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        console.log('Profile API - Successfully fetched profile via service role:', {
          username: profile.username,
          email: profile.email,
          isPro: profile.pro
        })
        
        return NextResponse.json({ data: profile })
      }
      
      console.error('Profile API - Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError?.message || 'No session and no userId parameter provided'
      }, { status: 401 })
    }
    
    console.log('Profile API - Fetching profile for user:', user.id)
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    if (error) {
      console.error('Profile API - Database error:', error)
      
      // If profile doesn't exist, create a basic one
      if (error.code === 'PGRST116') {
        console.log('Profile API - No profile found, creating basic profile')
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || user.id.substring(0, 8),
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          pro: 'no',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()
          
        if (createError) {
          console.error('Profile API - Failed to create profile:', createError)
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
        }
        
        console.log('Profile API - Created new profile:', createdProfile)
        return NextResponse.json({ data: createdProfile })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Profile API - Successfully fetched profile:', {
      username: profile.username,
      email: profile.email,
      isPro: profile.pro
    })
    
    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('Profile API - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const updates = await request.json()
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        bio: updates.bio,
        location: updates.location,
        website: updates.website,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
