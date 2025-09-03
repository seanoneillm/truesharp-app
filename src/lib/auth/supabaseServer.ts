// FILE: src/lib/auth/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from './supabase'

// For API routes and server components
export const createServerSupabaseClient = async (request?: NextRequest) => {
  if (request) {
    // For API routes - try multiple authentication methods
    console.log('🔄 Creating server Supabase client for API route')

    // Debug: Log all available cookies (RequestCookies doesn't have entries/forEach)
    console.log('🍪 Cookies available:', request.cookies.size, 'total cookies')

    // Method 1: Try to extract JWT from auth-token cookie
    const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value
    console.log('Auth token cookie found:', !!authTokenCookie)

    if (authTokenCookie) {
      // Extract JWT from array format
      let jwt = authTokenCookie
      if (authTokenCookie.startsWith('[') && authTokenCookie.endsWith(']')) {
        try {
          const parsed = JSON.parse(authTokenCookie)
          if (Array.isArray(parsed) && parsed.length > 0) {
            jwt = parsed[0]
            console.log('🚀 Using direct JWT authorization for API route')

            // Create client with direct Authorization header
            const { createClient } = await import('@supabase/supabase-js')
            return createClient<Database>(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                global: {
                  headers: {
                    Authorization: `Bearer ${jwt}`,
                  },
                },
              }
            )
          }
        } catch (e) {
          console.log('⚠️ Failed to parse JWT from cookie, falling back to cookie method')
        }
      } else if (typeof jwt === 'string' && jwt.length > 100) {
        // Direct JWT string - validate it first
        try {
          // Simple JWT validation - check if it has 3 parts and isn't expired
          const parts = jwt.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1] || ''))
            const now = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp > now) {
              console.log('🚀 Using validated JWT string authorization for API route')
              const { createClient } = await import('@supabase/supabase-js')
              return createClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  global: {
                    headers: {
                      Authorization: `Bearer ${jwt}`,
                    },
                  },
                }
              )
            } else {
              console.log('⚠️ JWT token expired, falling back to cookie method')
            }
          } else {
            console.log('⚠️ Invalid JWT format, falling back to cookie method')
          }
        } catch (e) {
          console.log('⚠️ JWT validation failed, falling back to cookie method')
        }
      }
    }

    // Fallback to cookie-based approach
    console.log(`🔄 Using cookie-based auth for API route`)
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value
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
                console.log(`⚠️ Failed to parse array cookie:`, e)
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

    return supabase
  } else {
    // For server components - use Next.js cookies
    const cookieStore = await cookies()

    const supabaseClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value

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
                console.log(`⚠️ Failed to parse array cookie in server component:`, e)
              }
            }

            return value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            try {
              cookieStore.set(name, value, options as any)
            } catch {
              // Ignore for Server Components
            }
          },
          remove(name: string, options: Record<string, unknown>) {
            try {
              cookieStore.set(name, '', options as any)
            } catch {
              // Ignore for Server Components
            }
          },
        },
      }
    )

    return supabaseClient
  }
}

// For middleware
export const createMiddlewareSupabaseClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
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

// Export alias for backward compatibility
export const createRouteHandlerSupabaseClient = createServerSupabaseClient
