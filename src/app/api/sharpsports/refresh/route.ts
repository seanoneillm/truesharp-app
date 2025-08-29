import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/refresh - Trigger refresh for all linked accounts
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Refresh API - Starting refresh request')
    
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let effectiveUserId = user?.id
    let querySupabase = supabase
    
    // Handle service role fallback for authentication
    if (authError || !user) {
      const body = await request.json().catch(() => ({}))
      const userId = body.userId
      
      if (userId) {
        console.log('SharpSports Refresh - Using service role with userId:', userId.substring(0, 8) + '...')
        
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        effectiveUserId = userId
        querySupabase = serviceSupabase
      } else {
        console.log('SharpSports Refresh - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('SharpSports Refresh - Fetching bettor accounts for user:', effectiveUserId?.substring(0, 8) + '...')

    // Get all linked bettor accounts for this user
    const { data: accounts, error: accountsError } = await querySupabase
      .from('bettor_account')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('verified', true)
      .eq('access', true)

    if (accountsError) {
      console.error('SharpSports Refresh - Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      console.log('SharpSports Refresh - No linked accounts found')
      return NextResponse.json({ 
        message: 'No linked sportsbook accounts found',
        refreshed: 0 
      })
    }

    console.log(`SharpSports Refresh - Found ${accounts.length} accounts to refresh`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Refresh - API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    const refreshResults = []
    
    // Refresh each account
    for (const account of accounts) {
      try {
        console.log(`SharpSports Refresh - Refreshing account ${account.sharpsports_account_id}`)
        
        // Use sandbox API for development
        const apiBaseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.sharpsports.io' 
          : 'https://sandbox-api.sharpsports.io'

        const refreshResponse = await fetch(
          `${apiBaseUrl}/v1/bettorAccount/${account.sharpsports_account_id}/refresh`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          console.log(`✅ SharpSports Refresh - Account ${account.sharpsports_account_id} refresh initiated`)
          
          refreshResults.push({
            accountId: account.sharpsports_account_id,
            bookName: account.book_name,
            status: 'initiated',
            refreshId: refreshData.id || 'unknown'
          })
        } else {
          const errorText = await refreshResponse.text()
          console.error(`❌ SharpSports Refresh - Account ${account.sharpsports_account_id} refresh failed:`, refreshResponse.status, errorText)
          
          refreshResults.push({
            accountId: account.sharpsports_account_id,
            bookName: account.book_name,
            status: 'failed',
            error: `HTTP ${refreshResponse.status}: ${errorText}`
          })
        }
      } catch (error) {
        console.error(`❌ SharpSports Refresh - Account ${account.sharpsports_account_id} refresh error:`, error)
        
        refreshResults.push({
          accountId: account.sharpsports_account_id,
          bookName: account.book_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = refreshResults.filter(r => r.status === 'initiated').length
    console.log(`🎉 SharpSports Refresh - Completed: ${successCount}/${accounts.length} accounts refreshed`)

    return NextResponse.json({
      message: `Refresh initiated for ${successCount} of ${accounts.length} accounts`,
      refreshed: successCount,
      total: accounts.length,
      results: refreshResults
    })

  } catch (error) {
    console.error('SharpSports Refresh - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}