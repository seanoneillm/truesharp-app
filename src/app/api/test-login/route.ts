import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Attempting login for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    console.log('Login successful for user:', data.user?.id)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: {
        access_token: data.session?.access_token ? 'present' : 'missing',
      },
    })
  } catch (err) {
    console.error('Unexpected login error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error during login',
      },
      { status: 500 }
    )
  }
}
