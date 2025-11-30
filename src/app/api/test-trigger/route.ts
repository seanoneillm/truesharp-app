import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing trigger function directly...')
    
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test 1: Check if the trigger function exists
    try {
      const { data: functionExists } = await serviceSupabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'create_profile_for_new_user')
      
      console.log('🔍 Trigger function exists:', functionExists?.length > 0)
    } catch (e) {
      console.log('❌ Could not check function existence:', e)
    }

    // Test 2: Check current triggers on auth.users
    try {
      const { data: triggers } = await serviceSupabase
        .from('information_schema.triggers')
        .select('*')
        .eq('event_object_table', 'users')
        .eq('trigger_schema', 'auth')
      
      console.log('🔍 Triggers on auth.users:', triggers)
    } catch (e) {
      console.log('❌ Could not check triggers:', e)
    }

    // Test 3: Check profiles table structure and constraints
    try {
      const { data: profilesSchema } = await serviceSupabase
        .from('information_schema.columns')
        .select('column_name, is_nullable, column_default, data_type')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public')
      
      console.log('🔍 Profiles table schema:', profilesSchema)
    } catch (e) {
      console.log('❌ Could not check profiles schema:', e)
    }

    // Test 4: Check for any constraints that might be failing
    try {
      const { data: constraints } = await serviceSupabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'profiles')
      
      console.log('🔍 Profiles table constraints:', constraints)
    } catch (e) {
      console.log('❌ Could not check constraints:', e)
    }

    // Test 5: Try to manually run the trigger function
    try {
      console.log('🔍 Testing manual trigger function...')
      
      // First, let's see if we can call the function directly
      const testUserId = '00000000-0000-0000-0000-000000000001'
      const testEmail = 'trigger-test@example.com'
      
      const { data: manualResult, error: manualError } = await serviceSupabase
        .rpc('create_profile_for_new_user')
      
      if (manualError) {
        console.log('❌ Manual trigger function call failed:', manualError)
      } else {
        console.log('✅ Manual trigger function succeeded:', manualResult)
      }
    } catch (e) {
      console.log('❌ Manual trigger test exception:', e)
    }

    return NextResponse.json({
      message: 'Trigger tests completed - check console logs',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trigger test error:', error)
    return NextResponse.json({ error: 'Trigger test failed' }, { status: 500 })
  }
}