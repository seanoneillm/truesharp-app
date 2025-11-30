import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing absolutely minimal signup...')
    
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Test with the most minimal signup possible
    const testEmail = `minimal-${Date.now()}@test.com`
    console.log('Attempting minimal signup with email:', testEmail)
    
    const { data, error } = await anonSupabase.auth.signUp({
      email: testEmail,
      password: 'simplepass123',
    })
    
    console.log('Minimal signup result:', {
      success: !!data.user,
      userId: data.user?.id,
      errorMessage: error?.message,
      errorCode: error?.status,
      errorDetails: error
    })
    
    // If successful, clean up
    if (data.user?.id) {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      try {
        await serviceSupabase.auth.admin.deleteUser(data.user.id)
        console.log('✅ Test user cleaned up')
      } catch (e) {
        console.log('⚠️ Cleanup failed:', e)
      }
    }

    return NextResponse.json({
      success: !!data.user,
      userId: data.user?.id || null,
      error: error?.message || null
    })

  } catch (error) {
    console.error('Simple signup test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}