import { createRouteHandlerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient(request)

    // Get current user before logout for logging
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error getting user for logout:', userError)
    }

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)

      return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }

    // Log logout event if we had a user
    if (user) {
      const logoutEvent = {
        user_id: user.id,
        event_type: 'logout',
        ip_address:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      }

      // Store logout event (optional - for analytics)
      try {
        await supabase.from('user_events').insert([logoutEvent])
      } catch (eventError) {
        // Don't fail logout if event logging fails
        console.error('Event logging error:', eventError)
      }
    }

    // Clear any additional session data and return success
    return NextResponse.json(
      { message: 'Logout successful' },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error('Logout API error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle sign out with redirect
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient(request)

    // Get current user before logout for logging
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Sign out the user
    await supabase.auth.signOut()

    // Log logout event if we had a user
    if (user) {
      try {
        const logoutEvent = {
          user_id: user.id,
          event_type: 'logout',
          ip_address:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString(),
        }

        await supabase.from('user_events').insert([logoutEvent])
      } catch (eventError) {
        console.error('Event logging error:', eventError)
      }
    }

    // Redirect to home page after logout
    const redirectUrl = new URL('/', request.url)

    return NextResponse.redirect(redirectUrl, {
      status: 302,
    })
  } catch (error) {
    console.error('Logout redirect error:', error)

    // Still redirect even if there was an error
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl, { status: 302 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
