import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use service role to list users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json({ error: 'Unable to list users' }, { status: 500 })
    }

    const users = userData.users.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed: !!user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
    }))

    console.log('Found users:', users.length)

    return NextResponse.json({
      userCount: users.length,
      users: users,
    })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}
