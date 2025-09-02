import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic database connection
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Testing Supabase connection...')

    // Test 1: Basic database query
    const { data: profiles, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .limit(1)

    console.log('Profiles query result:', { profiles, profileError })

    // Test 2: Auth users table access (this might fail due to permissions)
    const { data: users, error: usersError } = await serviceSupabase
      .from('auth.users')
      .select('*')
      .limit(1)

    console.log('Users query result:', { users, usersError })

    return NextResponse.json({
      success: true,
      tests: {
        profiles: { data: profiles, error: profileError?.message },
        users: { data: users, error: usersError?.message },
      },
    })
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({ error: 'Connection test failed', details: error }, { status: 500 })
  }
}
