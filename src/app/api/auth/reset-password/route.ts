import { isValidEmail } from '@/lib/auth/auth-helpers'
import { createRouteHandlerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const { supabase } = createRouteHandlerSupabaseClient(request)

    // Check if user exists (optional - for security, we might want to always return success)
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password-confirm`,
    })

    if (error) {
      console.error('Reset password error:', error)

      // Handle specific errors
      switch (error.message) {
        case 'Email rate limit exceeded':
          return NextResponse.json(
            { error: 'Too many reset attempts. Please try again later.' },
            { status: 429 }
          )
        case 'Invalid email':
          return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
        default:
          // For security, we might want to always return success
          // even if the email doesn't exist
          break
      }
    }

    // Log password reset attempt
    if (existingUser) {
      try {
        await supabase.from('user_events').insert([
          {
            user_id: existingUser.id,
            event_type: 'password_reset_requested',
            timestamp: new Date().toISOString(),
            ip_address:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            metadata: { email },
          },
        ])
      } catch (eventError) {
        console.error('Event logging error:', eventError)
      }
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link.',
      success: true,
    })
  } catch (error) {
    console.error('Reset password API error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
