import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing direct database user creation...')
    
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test 1: Can we insert directly into auth.users?
    const testUserId = '12345678-1234-1234-1234-123456789012'
    const testEmail = `direct-test-${Date.now()}@example.com`
    
    try {
      console.log('Testing direct auth.users insert...')
      
      // Try direct SQL insert into auth.users
      const { data: directInsert, error: directError } = await serviceSupabase
        .rpc('exec_sql', {
          sql: `
            INSERT INTO auth.users (
              id, 
              email, 
              encrypted_password, 
              email_confirmed_at, 
              created_at, 
              updated_at,
              raw_user_meta_data
            ) VALUES (
              '${testUserId}',
              '${testEmail}',
              crypt('testpassword', gen_salt('bf')),
              NOW(),
              NOW(),
              NOW(),
              '{"username": "directtest"}'::jsonb
            ) RETURNING id, email;
          `
        })
      
      if (directError) {
        console.log('❌ Direct auth.users insert failed:', directError)
      } else {
        console.log('✅ Direct auth.users insert succeeded:', directInsert)
        
        // Clean up
        await serviceSupabase.rpc('exec_sql', {
          sql: `DELETE FROM auth.users WHERE id = '${testUserId}';`
        })
      }
    } catch (e) {
      console.log('❌ Direct insert exception:', e)
    }
    
    // Test 2: Check if we can call auth admin functions at all
    try {
      console.log('Testing auth admin access...')
      
      const { data: usersList, error: listError } = await serviceSupabase.auth.admin.listUsers()
      
      if (listError) {
        console.log('❌ List users failed:', listError)
      } else {
        console.log('✅ List users succeeded, count:', usersList.users?.length || 0)
      }
    } catch (e) {
      console.log('❌ List users exception:', e)
    }
    
    // Test 3: Check project settings
    try {
      console.log('Testing project settings access...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
        }
      })
      
      console.log('Project access status:', response.status, response.statusText)
    } catch (e) {
      console.log('❌ Project access exception:', e)
    }

    return NextResponse.json({
      message: 'Direct user test completed - check console',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Direct test error:', error)
    return NextResponse.json({ error: 'Direct test failed' }, { status: 500 })
  }
}