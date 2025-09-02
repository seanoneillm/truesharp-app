import { createRouteHandlerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const { supabase } = createRouteHandlerSupabaseClient(request)

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)

        // Redirect to login with error
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'verification_failed')
        redirectUrl.searchParams.set('message', 'Email verification failed. Please try again.')

        return NextResponse.redirect(redirectUrl)
      }

      if (data.user) {
        // Update user profile to mark email as verified
        try {
          await supabase
            .from('profiles')
            .update({
              email_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)
        } catch (profileError) {
          console.error('Profile update error:', profileError)
          // Don't fail the callback if profile update fails
        }

        // Log email verification event
        try {
          await supabase.from('user_events').insert([
            {
              user_id: data.user.id,
              event_type: 'email_verified',
              timestamp: new Date().toISOString(),
              ip_address:
                request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            },
          ])
        } catch (eventError) {
          console.error('Event logging error:', eventError)
          // Don't fail the callback if event logging fails
        }
      }

      // Successful verification - redirect to next page
      const redirectUrl = new URL(next, request.url)
      redirectUrl.searchParams.set('verified', 'true')

      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error('Auth callback exception:', error)

      // Redirect to login with error
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'callback_error')
      redirectUrl.searchParams.set('message', 'An error occurred during verification.')

      return NextResponse.redirect(redirectUrl)
    }
  }

  // No code parameter - redirect to login
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('error', 'no_code')
  redirectUrl.searchParams.set('message', 'Invalid verification link.')

  return NextResponse.redirect(redirectUrl)
}
