import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// interface RecentSignup {
//   id: string
//   username: string | null
//   email: string | null
//   created_at: string | null
//   pro: string | null
//   stripe_customer_id: string | null
//   stripe_connect_account_id: string | null
//   sharpsports_bettor_id: string | null
//   is_seller: boolean | null
//   is_verified_seller: boolean | null
// }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    
    const supabase = await createServiceRoleClient()
    
    console.log(`🔍 Admin Recent Signups - Fetching last ${limit} signups`)

    // Get the most recent signups from the profiles table
    const { data: recentSignups, error: signupsError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        pro,
        stripe_customer_id,
        stripe_connect_account_id,
        sharpsports_bettor_id,
        is_seller,
        is_verified_seller
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (signupsError) {
      console.error('❌ Error fetching recent signups:', signupsError)
      return NextResponse.json({ error: signupsError.message }, { status: 500 })
    }

    const signups = recentSignups || []
    console.log(`📊 Fetched ${signups.length} recent signups`)

    // Transform the data to include computed fields
    const enrichedSignups = signups.map((signup: any) => ({
      ...signup,
      subscriptionStatus: signup.pro === 'yes' ? 'Subscribed' : 'Free',
      hasStripeCustomer: !!signup.stripe_customer_id,
      hasStripeConnect: !!signup.stripe_connect_account_id,
      hasSharpSports: !!signup.sharpsports_bettor_id,
      accountType: signup.is_verified_seller ? 'Verified Seller' : 
                   signup.is_seller ? 'Seller' : 'User'
    }))

    console.log(`✅ Recent signups data processed successfully`)

    return NextResponse.json({ 
      success: true, 
      data: enrichedSignups,
      metadata: {
        limit,
        count: signups.length,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Admin Recent Signups API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}