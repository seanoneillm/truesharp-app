import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email = 'test@example.com', password = 'testpassword123' } = await request.json()

    console.log('🔍 Debug signup test started...')
    
    // Test 1: Service role connectivity
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('✅ Service role client created')
    
    // Test 2: Check if we can query the profiles table
    try {
      const { data: profileTest, error: profileTestError } = await serviceSupabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (profileTestError) {
        console.log('❌ Profiles table query failed:', profileTestError)
      } else {
        console.log('✅ Profiles table accessible:', profileTest?.length || 0, 'rows found')
      }
    } catch (e) {
      console.log('❌ Profiles table query exception:', e)
    }
    
    // Test 3: Check auth.users table access
    try {
      const { data: usersTest, error: usersTestError } = await serviceSupabase
        .from('auth.users')
        .select('id')
        .limit(1)
      
      if (usersTestError) {
        console.log('❌ Auth users query failed:', usersTestError)
      } else {
        console.log('✅ Auth users accessible')
      }
    } catch (e) {
      console.log('❌ Auth users query exception:', e)
    }
    
    // Test 4: Check if the trigger exists and what it does
    try {
      const { data: triggerCheck, error: triggerError } = await serviceSupabase
        .rpc('pg_get_triggerdef', { trigger_oid: 'create_profile_on_signup' })
        
      console.log('🔍 Trigger check result:', { triggerCheck, triggerError })
    } catch (e) {
      console.log('❌ Trigger check failed:', e)
    }

    // Test 5: Try creating a minimal user to see exact error
    try {
      console.log('🔍 Attempting minimal user creation...')
      
      const testEmail = `test-${Date.now()}@example.com`
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email: testEmail,
        password: 'testpass123',
        email_confirm: false,
      })
      
      if (authError) {
        console.log('❌ Minimal user creation failed:', {
          message: authError.message,
          code: authError.status,
          details: authError
        })
      } else {
        console.log('✅ Minimal user created successfully:', authData.user?.id)
        
        // Clean up the test user
        if (authData.user?.id) {
          await serviceSupabase.auth.admin.deleteUser(authData.user.id)
          console.log('🗑️ Test user cleaned up')
        }
      }
    } catch (e) {
      console.log('❌ Minimal user creation exception:', e)
    }

    // Test 6: Check Supabase environment and config
    console.log('🔍 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    })

    return NextResponse.json({
      message: 'Debug tests completed - check console logs',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({ error: 'Debug test failed' }, { status: 500 })
  }
}