import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log('Manual login test for:', email)

    // Use service role for this test to bypass any auth issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json({ error: 'Unable to check users' }, { status: 500 })
    }

    const user = userData.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
    })

    // Check if user has profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    console.log('Profile data:', profile)

    // Check if user has bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('count')
      .eq('user_id', user.id)

    if (betsError) {
      console.error('Bets error:', betsError)
    }

    const betCount = bets?.length || 0
    console.log('User bet count:', betCount)

    return NextResponse.json({
      userFound: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at,
      },
      profile: profile || null,
      betCount,
      profileError: profileError?.message,
      betsError: betsError?.message,
    })
  } catch (error) {
    console.error('Manual login test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
