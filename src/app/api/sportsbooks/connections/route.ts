import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sportsbooks/connections - Get user's sportsbook connections
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: connections, error } = await supabase
      .from('sportsbook_connections')
      .select('*, sportsbooks(*)')
      .eq('user_id', user.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: connections || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sportsbooks/connections - Connect a sportsbook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { sportsbookId, credentials } = await request.json()
    // For now, we'll simulate a connection since we don't have real sportsbook APIs
    const { data: connection, error } = await supabase
      .from('sportsbook_connections')
      .upsert({
        user_id: user.id,
        sportsbook_id: sportsbookId,
        status: 'connected',
        last_sync: new Date().toISOString(),
        credentials_encrypted: JSON.stringify(credentials), // TODO: Encrypt properly
      })
      .select('*, sportsbooks(*)')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: connection })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
