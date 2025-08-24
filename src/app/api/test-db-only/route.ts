import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, username } = await request.json()

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username required' },
        { status: 400 }
      )
    }

    // Test service role database access
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Testing direct database insert...')
    
    // Generate a test UUID (proper format)
    const testUserId = '00000000-0000-4000-8000-' + Date.now().toString().slice(-12)
    
    const { data, error } = await serviceSupabase
      .from('profiles')
      .insert({
        id: testUserId,
        username: username,
        email: email,
        bio: null,
        is_seller: false,
        is_verified_seller: false,
        pro: 'no',
        profile_picture_url: null,
        public_profile: false
      })
      .select()

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json(
        { error: 'Database insert failed', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Direct database insert successful')
    
    // Clean up test record
    await serviceSupabase
      .from('profiles')
      .delete()
      .eq('id', testUserId)

    return NextResponse.json({ 
      success: true, 
      message: 'Database test successful',
      testUserId 
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}