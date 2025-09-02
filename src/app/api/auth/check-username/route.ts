import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { available: false, error: 'Username must be 3-20 characters' },
        { status: 400 }
      )
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters and numbers' },
        { status: 400 }
      )
    }

    // Await cookies() for Next.js 15 compatibility
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    // Check if username already exists in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which means username is available
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to check username availability' }, { status: 500 })
    }

    const available = !data

    return NextResponse.json({ available })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
