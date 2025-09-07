import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all sellers and their Stripe accounts for debugging
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, is_seller')
      .eq('is_seller', true)

    const { data: stripeAccounts, error: accountsError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')

    return NextResponse.json({
      current_user: {
        id: user.id,
        email: user.email,
      },
      sellers: profiles || [],
      stripe_accounts: stripeAccounts || [],
      errors: {
        profiles: profilesError?.message,
        accounts: accountsError?.message,
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}