import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Use service role to bypass auth for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Use the existing user ID that already has bets
    const testUserId = '28991397-dae7-42e8-a822-0dffc6ff49b7'

    console.log('Checking existing data for user:', testUserId)

    // Check if profile exists and update/create it
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileFetchError)
    }

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          username: 'testuser_analytics',
          bio: 'Test user for analytics demo',
          email: 'analytics-test@example.com',
          is_seller: false,
          is_verified_seller: false,
          pro: 'no',
          public_profile: true
        })

      if (profileError) {
        console.error('Profile insert error:', profileError)
      } else {
        console.log('Created profile for existing user')
      }
    } else {
      console.log('Profile already exists for user')
    }

    // Check existing bets
    const { data: existingBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', testUserId)

    if (betsError) {
      console.error('Error fetching bets:', betsError)
      return NextResponse.json({ error: betsError.message }, { status: 500 })
    }

    console.log(`Found ${existingBets?.length || 0} existing bets for user ${testUserId}`)

    return NextResponse.json({
      success: true,
      message: 'Test user setup completed',
      testUserId,
      existingBets: existingBets?.length || 0,
      profileExists: !!existingProfile,
      sampleBets: existingBets?.slice(0, 3) || [],
      instructions: 'This user already has betting data. You can now test the analytics page by simulating login with this user ID.',
      loginInfo: {
        userId: testUserId,
        note: 'Use this user ID to test the analytics functionality'
      }
    })

  } catch (error) {
    console.error('Test data setup error:', error)
    return NextResponse.json({ error: 'Failed to setup test data' }, { status: 500 })
  }
}
