import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookies = request.headers.get('cookie') || ''

  // Parse cookies manually to see what's there
  const cookieObject: Record<string, string> = {}
  cookies.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookieObject[name] = rest.join('=')
    }
  })

  // Look for auth-related cookies
  const authCookies = Object.entries(cookieObject).filter(
    ([name]) => name.includes('auth') || name.includes('supabase') || name.includes('sb-')
  )

  return NextResponse.json({
    allCookies: cookieObject,
    authCookies: Object.fromEntries(authCookies),
    cookieCount: Object.keys(cookieObject).length,
    timestamp: new Date().toISOString(),
  })
}
