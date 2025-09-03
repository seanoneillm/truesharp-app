import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Define routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/analytics',
  '/marketplace',
  '/subscriptions',
  '/sell',
  '/settings',
  '/profile/edit',
  '/picks',
  '/feed',
]

// Define routes that should redirect authenticated users
const authRoutes = ['/login', '/signup']

// Define admin routes
const adminRoutes = ['/admin']

// Define seller routes
const sellerRoutes = ['/sell']

// Create middleware-compatible Supabase client
function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value

          // Handle array format cookies - extract the JWT from ["jwt"] format
          if (
            name.includes('auth-token') &&
            !name.includes('code-verifier') &&
            value &&
            value.startsWith('[') &&
            value.endsWith(']')
          ) {
            try {
              const parsed = JSON.parse(value)
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0]
              }
            } catch (e) {
              console.log(`⚠️ Failed to parse array cookie in middleware:`, e)
            }
          }

          return value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareSupabaseClient(request)

    // Get the current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Middleware auth error:', error)
    }

    const url = request.nextUrl.clone()
    const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => url.pathname.startsWith(route))
    const isAdminRoute = adminRoutes.some(route => url.pathname.startsWith(route))
    const isSellerRoute = sellerRoutes.some(route => url.pathname.startsWith(route))

    // Handle protected routes
    if (isProtectedRoute && !user) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', url.pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes (login, signup) when user is already authenticated
    if (isAuthRoute && user) {
      // Check if there's a redirect URL from login
      const redirectTo = url.searchParams.get('redirectTo')
      const redirectUrl = new URL(redirectTo || '/dashboard', request.url)

      return NextResponse.redirect(redirectUrl)
    }

    // Handle admin routes
    if (isAdminRoute) {
      if (!user) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', url.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Check if user has admin privileges
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Handle seller routes
    if (isSellerRoute && user) {
      // Check if user has seller enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_enabled')
        .eq('id', user.id)
        .single()

      // If trying to access seller dashboard but seller not enabled, redirect to setup
      if (url.pathname === '/sell' && (!profile || !profile.seller_enabled)) {
        return NextResponse.redirect(new URL('/sell/setup', request.url))
      }
    }

    // Handle API routes authentication
    if (url.pathname.startsWith('/api/')) {
      // Allow auth endpoints without authentication
      if (url.pathname.startsWith('/api/auth/')) {
        return response
      }

      // Check for authentication on protected API routes
      const protectedApiRoutes = [
        '/api/users',
        '/api/bets',
        '/api/analytics',
        '/api/marketplace',
        '/api/picks',
        '/api/subscriptions',
        '/api/feed',
        '/api/profile',
      ]

      const isProtectedApiRoute = protectedApiRoutes.some(route => url.pathname.startsWith(route))

      if (isProtectedApiRoute && !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Check admin API routes
      if (url.pathname.startsWith('/api/admin/')) {
        if (!user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      }
    }

    // Log user activity for analytics
    if (user && !url.pathname.startsWith('/api/')) {
      try {
        // Track page view (fire and forget)
        supabase
          .from('user_activity')
          .insert([
            {
              user_id: user.id,
              activity_type: 'page_view',
              path: url.pathname,
              timestamp: new Date().toISOString(),
              user_agent: request.headers.get('user-agent') || 'unknown',
              ip_address:
                request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
            },
          ])
          .then(
            () => {
              // Success - no action needed
            },
            error => {
              // Don't fail the request if activity logging fails
              console.error('Activity logging error:', error)
            }
          )
      } catch (error) {
        // Don't fail the request if activity logging fails
        console.error('Activity logging exception:', error)
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)

    // Don't block the request if middleware fails
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
