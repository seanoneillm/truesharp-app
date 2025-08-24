import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Use service role to create a temporary auth session for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const testUserId = '28991397-dae7-42e8-a822-0dffc6ff49b7'

    // Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId)
    
    if (authError || !authUser.user) {
      // Create auth user if doesn't exist
      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'analytics-test@example.com',
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          test_user_id: testUserId
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        return NextResponse.json({ 
          error: 'Failed to create test user', 
          details: createError.message 
        }, { status: 500 })
      }

      console.log('Created auth user:', createdUser.user?.id)
    } else {
      console.log('Auth user already exists:', authUser.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Test auth user setup completed',
      testUserId,
      instructions: 'You can now log in with email: analytics-test@example.com and password: testpassword123',
      loginInfo: {
        email: 'analytics-test@example.com',
        password: 'testpassword123',
        userId: testUserId
      }
    })

  } catch (error) {
    console.error('Test auth setup error:', error)
    return NextResponse.json({ error: 'Failed to setup test auth' }, { status: 500 })
  }
}
