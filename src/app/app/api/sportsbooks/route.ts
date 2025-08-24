import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextResponse } from 'next/server'

// GET /api/sportsbooks - Get available sportsbooks
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: sportsbooks, error } = await supabase
      .from('sportsbooks')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: sportsbooks || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
