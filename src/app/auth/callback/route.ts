import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient(request)
    
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
        // Profile update not needed - email verification is handled by Supabase auth
        console.log('✅ Email verification successful for user:', data.user.id)
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