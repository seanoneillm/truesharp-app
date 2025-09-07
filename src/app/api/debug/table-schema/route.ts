import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Try to get basic table info by attempting a select with limit 0
    const { error: sellerSampleError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')
      .limit(0)

    const { error: profileSampleError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0)

    // Get seller accounts columns from the existing insert statement
    const sellerAccountColumns = [
      'user_id (uuid)',
      'stripe_account_id (text)',
      'details_submitted (boolean)',
      'charges_enabled (boolean)',
      'payouts_enabled (boolean)',
      'requirements_due (text[])',
      'created_at (timestamp)',
      'updated_at (timestamp)'
    ]

    const profileColumns = [
      'id (uuid)',
      'username (text)',
      'email (text)',
      'is_seller (boolean)',
      'stripe_connect_account_id (text)',
      'stripe_customer_id (text)'
    ]

    const sellerPolicies = 'RLS policies exist but not accessible via regular queries'

    return NextResponse.json({
      seller_stripe_accounts: {
        columns: sellerAccountColumns,
        table_exists: !sellerSampleError,
        sample_error: sellerSampleError?.message,
        policies: sellerPolicies
      },
      profiles: {
        columns: profileColumns,
        table_exists: !profileSampleError,
        sample_error: profileSampleError?.message,
      },
      analysis: {
        seller_stripe_accounts_accessible: !sellerSampleError,
        profiles_accessible: !profileSampleError,
        note: "Based on code analysis and existing API patterns"
      }
    })
  } catch (error) {
    console.error('Table schema error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}