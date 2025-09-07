import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Get all seller stripe accounts for seanoneill715
    const seanUserId = "28991397-dae7-42e8-a822-0dffc6ff49b7"
    
    const { data: allAccounts, error: accountsError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')
      .eq('user_id', seanUserId)

    const { data: allAccountsInTable, error: allError } = await supabase
      .from('seller_stripe_accounts')
      .select('*')

    return NextResponse.json({
      sean_user_id: seanUserId,
      sean_accounts: allAccounts || [],
      sean_accounts_error: accountsError?.message,
      all_accounts: allAccountsInTable || [],
      all_accounts_error: allError?.message,
      count_for_sean: allAccounts?.length || 0,
    })
  } catch (error) {
    console.error('Check accounts error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}