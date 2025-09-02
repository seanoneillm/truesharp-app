import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)

    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'No authorization header',
        authenticated: false,
      })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Try to get the user from the token
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
        userError: userError?.message,
        authenticated: false,
      })
    }

    console.log('User authenticated:', user.id, user.email)

    // Test query for bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('placed_at, stake, profit, status')
      .eq('user_id', user.id)
      .gte('placed_at', '2024-01-01T00:00:00Z')
      .lte('placed_at', '2024-12-31T23:59:59Z')
      .in('status', ['won', 'lost'])
      .limit(5)

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      betsQuery: {
        error: betsError?.message || null,
        count: bets?.length || 0,
        sampleBets: bets || [],
      },
    })
  } catch (err) {
    console.error('Session check error:', err)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      authenticated: false,
    })
  }
}
