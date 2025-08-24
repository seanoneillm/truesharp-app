// FILE: src/app/api/profile/route.ts
// User profile API endpoints

import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const updates = await request.json()
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        bio: updates.bio,
        location: updates.location,
        website: updates.website,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
