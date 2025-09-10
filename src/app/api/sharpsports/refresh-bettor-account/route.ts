import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// SharpSports API types
interface BettorAccount {
  id: string
  balance: number
  verified: boolean
  access: string
  paused: boolean
  bettor: string
  book?: {
    name: string
  }
}

interface BetSlip {
  id: string
  bettor: string
}

// Create a simple SharpSports client following the SDK pattern from your snippet
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async refreshresponsesByBettor({
    limit,
    id,
  }: {
    limit?: string
    id: string
  }): Promise<{ data: BetSlip[] }> {
    const url = `${this.baseUrl}/bettors/${id}/betSlips?limit=${limit || '500'}`
    const response = await fetch(url, {
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    return { data }
  }

  async bettoraccountsList(): Promise<{ data: BettorAccount[] }> {
    const response = await fetch(`${this.baseUrl}/bettorAccounts`, {
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    return { data }
  }
}

const sharpsports = new SharpSportsClient()

// POST /api/sharpsports/refresh-bettor-account - Refresh bettor account data with SharpSports
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Refresh Bettor Account - Starting refresh')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id
    let querySupabase = supabase

    // Read request body once to get all parameters
    const body = await request.json().catch(() => ({}))
    const { userId: requestUserId, extensionAuthToken, extensionVersion } = body

    console.log('🔍 Extension data:', {
      hasToken: !!extensionAuthToken,
      version: extensionVersion,
    })

    // Handle service role fallback for authentication
    if (authError || !user) {
      const userId = requestUserId

      if (userId) {
        console.log(
          'SharpSports Refresh Bettor Account - Using service role with userId:',
          userId.substring(0, 8) + '...'
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

        effectiveUserId = userId
        querySupabase = serviceSupabase
      } else {
        console.log('SharpSports Refresh Bettor Account - No authentication available')
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
      console.log('SharpSports Refresh Bettor Account - User has no SharpSports bettor ID')
      return NextResponse.json({
        success: false,
        message: 'User has no SharpSports bettor ID configured',
        refreshed: 0,
      })
    }

    // Use same API key as step 4 (refresh-user-bets)
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Refresh Bettor Account - API key not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'SharpSports API key not configured',
        },
        { status: 500 }
      )
    }

    console.log(
      `SharpSports Refresh Bettor Account - Refreshing bettor: ${profile.sharpsports_bettor_id}`
    )

    // Auth with SharpSports SDK following your snippet pattern
    sharpsports.auth(`Token ${apiKey}`)

    try {
      // Step 1: Get the bettor's accounts first
      const { data: allAccounts } = await sharpsports.bettoraccountsList()

      // Filter accounts for this specific bettor
      const bettorAccounts: BettorAccount[] = allAccounts.filter(
        (account: BettorAccount) => account.bettor === profile.sharpsports_bettor_id
      )

      console.log(
        `� Found ${bettorAccounts.length} accounts for bettor ${profile.sharpsports_bettor_id}`
      )

      if (bettorAccounts.length === 0) {
        return NextResponse.json({
          success: true,
          message: `No accounts found for bettor ${profile.sharpsports_bettor_id}`,
          refreshedAccounts: 0,
        })
      }

      // Step 2: Refresh responses by bettor (the missing call!)
      console.log(`🔄 Calling refreshresponsesByBettor for ${profile.sharpsports_bettor_id}`)

      let refreshResponsesSuccess = false
      let refreshResponsesCount = 0

      try {
        const refreshResponsesResult = await sharpsports.refreshresponsesByBettor({
          limit: '500',
          id: profile.sharpsports_bettor_id,
        })

        refreshResponsesCount = refreshResponsesResult.data?.length || 0
        refreshResponsesSuccess = true

        console.log(
          `✅ refreshresponsesByBettor completed: ${refreshResponsesCount} responses refreshed`
        )
      } catch (refreshError) {
        console.error('❌ refreshresponsesByBettor failed:', refreshError)
        // Continue with account refresh even if this fails
      }

      // Step 3: Trigger actual refresh for each account (like the main refresh endpoint does)
      console.log(`🔄 Triggering refresh for ${bettorAccounts.length} accounts`)

      const refreshResults = []
      let successfulRefreshes = 0

      for (const account of bettorAccounts) {
        try {
          console.log(`🔄 Refreshing account: ${account.id} (${account.book?.name})`)

          // Build refresh payload with extension data
          const refreshPayload: Record<string, string> = {}
          if (extensionAuthToken) {
            refreshPayload.extensionAuthToken = extensionAuthToken
          }
          if (extensionVersion) {
            refreshPayload.extensionVersion = extensionVersion
          }

          const refreshResponse = await fetch(
            `https://api.sharpsports.io/v1/bettorAccount/${account.id}/refresh`,
            {
              method: 'POST',
              headers: {
                Authorization: `Token ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: Object.keys(refreshPayload).length > 0 ? JSON.stringify(refreshPayload) : null,
            }
          )

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            console.log(`✅ Successfully triggered refresh for account ${account.id}`)

            // Check for extension update requirements
            if (refreshData.extensionUpdateRequired) {
              console.log('🔄 Extension update required for account:', account.id)
              refreshResults.push({
                accountId: account.id,
                bookName: account.book?.name || 'Unknown',
                status: 'extension_update_required',
                extensionUpdateRequired: refreshData.extensionUpdateRequired,
                extensionDownloadUrl: refreshData.extensionDownloadUrl,
              })
            } else {
              refreshResults.push({
                accountId: account.id,
                bookName: account.book?.name || 'Unknown',
                status: 'initiated',
                refreshId: refreshData.id || 'unknown',
              })
            }
            successfulRefreshes++
          } else {
            const errorText = await refreshResponse.text()
            console.error(
              `❌ Failed to refresh account ${account.id}: ${refreshResponse.status} ${errorText}`
            )

            refreshResults.push({
              accountId: account.id,
              bookName: account.book?.name || 'Unknown',
              status: 'failed',
              error: `HTTP ${refreshResponse.status}: ${errorText}`,
            })
          }
        } catch (accountError) {
          console.error(`❌ Error refreshing account ${account.id}:`, accountError)
          refreshResults.push({
            accountId: account.id,
            bookName: account.book?.name || 'Unknown',
            status: 'error',
            error: accountError instanceof Error ? accountError.message : 'Unknown error',
          })
        }
      }

      // Step 3: Update our database with fresh account data after triggering refresh
      let updatedCount = 0
      for (const account of bettorAccounts) {
        const accountData = {
          balance: account.balance,
          verified: account.verified,
          access: account.access,
          paused: account.paused,
          latest_refresh_time: new Date().toISOString(),
        }

        const { error: updateError } = await querySupabase
          .from('bettor_accounts')
          .update(accountData)
          .eq('sharpsports_account_id', account.id)

        if (updateError) {
          console.error(`❌ Failed to update account ${account.id}:`, updateError)
        } else {
          console.log(`✅ Updated database for account: ${account.book?.name} (${account.id})`)
          updatedCount++
        }
      }

      // Check if any accounts require extension updates
      const extensionUpdateAccounts = refreshResults.filter(r => r.status === 'extension_update_required')
      const extensionUpdateRequired = extensionUpdateAccounts.length > 0
      
      const response: Record<string, any> = {
        success: true,
        message: `Refresh completed for bettor ${profile.sharpsports_bettor_id}: ${refreshResponsesSuccess ? refreshResponsesCount + ' responses refreshed, ' : 'responses refresh failed, '}${successfulRefreshes}/${bettorAccounts.length} accounts refreshed successfully`,
        refreshedAccounts: successfulRefreshes,
        updatedAccounts: updatedCount,
        totalAccounts: bettorAccounts.length,
        bettorId: profile.sharpsports_bettor_id,
        refreshResponsesSuccess,
        refreshResponsesCount,
        results: refreshResults,
      }

      // Add extension update info if needed
      if (extensionUpdateRequired) {
        response.extensionUpdateRequired = extensionUpdateAccounts.map(a => a.accountId)
        response.extensionDownloadUrl = extensionUpdateAccounts[0]?.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports'
        response.message += ` (${extensionUpdateAccounts.length} accounts require extension update)`
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('❌ SharpSports Refresh Bettor Account - Refresh error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to trigger refresh',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SharpSports Refresh Bettor Account - Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
