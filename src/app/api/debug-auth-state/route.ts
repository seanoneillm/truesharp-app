import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Check cookies directly
    const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value
    
    let jwtInfo = null
    if (authTokenCookie) {
      try {
        let jwt = authTokenCookie
        if (authTokenCookie.startsWith('[') && authTokenCookie.endsWith(']')) {
          const parsed = JSON.parse(authTokenCookie)
          if (Array.isArray(parsed) && parsed.length > 0) {
            jwt = parsed[0]
          }
        }
        
        if (jwt && jwt.length > 100) {
          const parts = jwt.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            const now = Math.floor(Date.now() / 1000)
            
            jwtInfo = {
              isValid: parts.length === 3,
              expiresAt: payload.exp,
              issuedAt: payload.iat,
              currentTime: now,
              isExpired: payload.exp ? payload.exp < now : 'no_expiry',
              userId: payload.sub,
              email: payload.email
            }
          }
        }
      } catch (e) {
        jwtInfo = { error: e instanceof Error ? e.message : 'Unknown JWT parsing error' }
      }
    }
    
    return NextResponse.json({
      serverAuth: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        error: authError?.message
      },
      cookies: {
        hasAuthToken: !!authTokenCookie,
        authTokenLength: authTokenCookie?.length,
        authTokenPreview: authTokenCookie?.substring(0, 50) + '...',
        jwtInfo
      },
      debug: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}