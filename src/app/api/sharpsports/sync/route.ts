import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { processBetsWithParlayLogic } from '@/lib/utils/parlay-sync-handler'

// POST /api/sharpsports/sync - Manually sync betSlips for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Sync - Starting manual sync')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id
    let querySupabase = supabase

    // Read request body once to get all parameters
    const body = await request.json().catch(() => ({}))
    const { 
      userId: requestUserId, 
      extensionAuthToken,
      extensionVersion 
    } = body

    console.log('🔍 Extension data:', { 
      hasToken: !!extensionAuthToken, 
      version: extensionVersion 
    })

    // Handle service role fallback for authentication
    if (authError || !user) {
      if (requestUserId) {
        console.log(
          'SharpSports Sync - Using service role with userId:',
          requestUserId.substring(0, 8) + '...'
        )

        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        effectiveUserId = requestUserId
        querySupabase = serviceSupabase
      } else {
        console.log('SharpSports Sync - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // First get the user's SharpSports bettor ID from their profile
    const { data: profile, error: profileError } = await querySupabase
      .from('profiles')
      .select('sharpsports_bettor_id')
      .eq('id', effectiveUserId)
      .single()

    if (profileError || !profile?.sharpsports_bettor_id) {
      console.log('SharpSports Sync - User has no SharpSports bettor ID')
      return NextResponse.json({
        message: 'User has no SharpSports bettor ID configured',
        synced: 0,
      })
    }

    // Get all linked bettor accounts for this bettor
    const { data: accounts, error: accountsError } = await querySupabase
      .from('bettor_accounts')
      .select('*')
      .eq('bettor_id', profile.sharpsports_bettor_id)
      .eq('verified', true)

    if (accountsError) {
      console.error('SharpSports Sync - Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      console.log('SharpSports Sync - No linked accounts found')
      return NextResponse.json({
        message: 'No linked sportsbook accounts found',
        synced: 0,
      })
    }

    console.log(`SharpSports Sync - Found ${accounts.length} accounts to sync`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Sync - API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    let totalBetsProcessed = 0
    const syncResults = []

    // Sync each account
    for (const account of accounts) {
      try {
        console.log(`SharpSports Sync - Syncing account ${account.sharpsports_account_id}`)

        const betsProcessed = await syncBetSlipsForAccount(
          querySupabase,
          account.bettor_id,
          effectiveUserId!,
          extensionAuthToken,
          extensionVersion
        )
        totalBetsProcessed += betsProcessed

        syncResults.push({
          accountId: account.sharpsports_account_id,
          bookName: account.book_name,
          betsProcessed,
          status: 'success',
        })
      } catch (error) {
        console.error(
          `❌ SharpSports Sync - Account ${account.sharpsports_account_id} sync error:`,
          error
        )

        syncResults.push({
          accountId: account.sharpsports_account_id,
          bookName: account.book_name,
          betsProcessed: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`🎉 SharpSports Sync - Completed: ${totalBetsProcessed} total bets processed`)

    return NextResponse.json({
      message: `Successfully synced ${accounts.length} accounts`,
      totalBetsProcessed,
      accounts: accounts.length,
      results: syncResults,
    })
  } catch (error) {
    console.error('SharpSports Sync - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function syncBetSlipsForAccount(
  supabase: any,
  bettorId: string,
  userId: string,
  extensionAuthToken?: string,
  extensionVersion?: string
): Promise<number> {
  console.log(`🔄 SharpSports Sync - Syncing betSlips for bettor: ${bettorId}`)

  try {
    const apiKey = process.env.SHARPSPORTS_API_KEY!

    // Use sandbox API for development
    const apiBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.sharpsports.io'
        : 'https://sandbox-api.sharpsports.io'

    // Prepare headers with extension data if available
    const headers: Record<string, string> = {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    }

    // Add extension data to headers if available
    if (extensionAuthToken) {
      headers['X-Extension-Auth-Token'] = extensionAuthToken
    }
    if (extensionVersion) {
      headers['X-Extension-Version'] = extensionVersion
    }

    // Fetch betSlips from SharpSports API (include all statuses to get pending bets)
    const response = await fetch(`${apiBaseUrl}/v1/bettors/${bettorId}/betSlips?includeIncomplete=true`, {
      headers,
    })

    if (!response.ok) {
      console.error(`SharpSports Sync - Failed to fetch betSlips: ${response.status}`)
      const errorText = await response.text()
      console.error(`SharpSports Sync - Error details: ${errorText}`)
      throw new Error(`API request failed: ${response.status}`)
    }

    const betSlips = await response.json()
    console.log(`📊 SharpSports Sync - Fetched ${betSlips.length} betSlips`)

    // Use parlay-aware processing
    const syncResult = await processBetsWithParlayLogic(betSlips, userId, supabase)
    console.log(`✅ SharpSports Sync - Processed ${syncResult.processed} bets (${syncResult.updated} updated, ${syncResult.errors.length} errors)`)

    if (syncResult.errors.length > 0) {
      console.error('SharpSports Sync - Sync errors:', syncResult.errors)
    }

    return syncResult.processed
  } catch (error) {
    console.error('SharpSports Sync - Error syncing betSlips:', error)
    throw error
  }
}

