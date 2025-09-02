import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/set-pro-status - Set user pro status for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Set Pro Status API - Starting request')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('Set Pro Status API - Auth check:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...' || 'none',
      error: authError?.message || 'none',
    })

    let effectiveUserId = user?.id

    // If session auth fails, try to get userId from request body or query
    if (authError || !user) {
      const body = await request.json()
      const userId = body.userId || request.nextUrl.searchParams.get('userId')

      if (userId) {
        console.log(
          'Set Pro Status API - Session auth failed, using service role with userId:',
          userId.substring(0, 8) + '...'
        )

        // Use service role client for admin operations
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        effectiveUserId = userId

        const { proStatus } = body

        if (!['yes', 'no'].includes(proStatus)) {
          return NextResponse.json(
            { error: 'Invalid pro status. Must be "yes" or "no"' },
            { status: 400 }
          )
        }

        console.log(
          'Set Pro Status API - Updating pro status to:',
          proStatus,
          'for user:',
          effectiveUserId.substring(0, 8) + '...'
        )

        const { data: profile, error } = await serviceSupabase
          .from('profiles')
          .update({
            pro: proStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', effectiveUserId)
          .select()
          .single()

        if (error) {
          console.error('Set Pro Status API - Update error:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('Set Pro Status API - Successfully updated pro status:', profile?.pro)

        return NextResponse.json({
          success: true,
          data: profile,
          message: `Pro status set to: ${proStatus}`,
        })
      } else {
        console.log('Set Pro Status API - No userId provided and no session')
        return NextResponse.json(
          { error: 'Unauthorized - no user session or userId provided' },
          { status: 401 }
        )
      }
    }

    // Normal authenticated flow
    const { proStatus } = await request.json()

    if (!['yes', 'no'].includes(proStatus)) {
      return NextResponse.json(
        { error: 'Invalid pro status. Must be "yes" or "no"' },
        { status: 400 }
      )
    }

    console.log('Set Pro Status API - Updating pro status via session auth to:', proStatus)

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        pro: proStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', effectiveUserId)
      .select()
      .single()

    if (error) {
      console.error('Set Pro Status API - Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Set Pro Status API - Successfully updated pro status:', profile?.pro)

    return NextResponse.json({
      success: true,
      data: profile,
      message: `Pro status set to: ${proStatus}`,
    })
  } catch (error) {
    console.error('Set Pro Status API - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
