import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/subscriptions - Get user's subscriptions
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*, profiles!subscriptions_seller_id_fkey(username, display_name, is_verified)')
      .eq('subscriber_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: subscriptions || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { sellerId, tier, price } = await request.json()
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: user.id,
        seller_id: sellerId,
        tier,
        price,
        status: 'active',
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: subscription })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
