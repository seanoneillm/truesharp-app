// DEBUG: Profile update testing endpoint
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Check table structure
    const { data: tableInfo } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .single()

    return NextResponse.json({
      user_id: user.id,
      profile: profile,
      profile_error: profileError,
      auth_user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
    })
  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testData } = await request.json()

    console.log('DEBUG: Attempting to update profile with:', testData)

    // Try to update with service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // First, let's see what columns actually exist
    const { data: existingProfile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('DEBUG: Existing profile:', existingProfile)

    // Try updating with service role
    const { data: updatedProfile, error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        bio: testData?.bio || 'Test bio from debug endpoint',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()

    console.log('DEBUG: Update result:', { updatedProfile, updateError })

    // Also try with regular client
    const { data: regularUpdate, error: regularError } = await supabase
      .from('profiles')
      .update({
        bio: testData?.bio || 'Test bio from regular client',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()

    return NextResponse.json({
      user_id: user.id,
      existing_profile: existingProfile,
      service_role_update: {
        data: updatedProfile,
        error: updateError,
      },
      regular_client_update: {
        data: regularUpdate,
        error: regularError,
      },
    })
  } catch (error) {
    console.error('Debug profile POST error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
