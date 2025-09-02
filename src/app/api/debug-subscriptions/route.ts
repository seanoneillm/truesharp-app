import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check all subscriptions in the database
    const { data: allSubscriptions, error: allSubsError } = await serviceSupabase
      .from('subscriptions')
      .select('id, subscriber_id, strategy_id, status, created_at')
      .limit(10)

    // Check all users with subscriptions
    const { data: subscriberUsers, error: usersError } = await serviceSupabase
      .from('subscriptions')
      .select('subscriber_id')
      .limit(10)

    const uniqueSubscribers = [...new Set(subscriberUsers?.map(s => s.subscriber_id) || [])]

    // Get user details for these subscribers
    let userDetails = []
    if (uniqueSubscribers.length > 0) {
      const { data: users, error: profilesError } = await serviceSupabase
        .from('profiles')
        .select('id, email, username')
        .in('id', uniqueSubscribers)

      userDetails = users || []
    }

    return NextResponse.json({
      success: true,
      currentUserFromRequest: '0e16e4f5-f206-4e62-8282-4188ff8af48a',
      database_analysis: {
        total_subscriptions: allSubscriptions?.length || 0,
        total_unique_subscribers: uniqueSubscribers.length,
        sample_subscriptions:
          allSubscriptions?.map(s => ({
            id: s.id,
            subscriber_id: s.subscriber_id,
            status: s.status,
            created_at: s.created_at,
          })) || [],
        subscriber_users: userDetails.map(u => ({
          id: u.id,
          email: u.email,
          username: u.username,
        })),
      },
      errors: {
        allSubsError: allSubsError?.message,
        usersError: usersError?.message,
      },
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
