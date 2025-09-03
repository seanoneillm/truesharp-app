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

export async function middleware(request: NextRequest) {
  try {
    // Simple middleware that just passes through for now
    console.log('Middleware processing:', request.nextUrl.pathname)

    // Basic environment check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Middleware: Missing Supabase environment variables')
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()

    // Only handle very basic auth redirects for now
    const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))

    if (isProtectedRoute) {
      // For now, just redirect to login without checking auth
      // We can add auth checking back once basic middleware works
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', url.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // Always pass through on error
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
