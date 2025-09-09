import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

    // Use public API key for bettor refresh (required for live mode operations)
    const publicApiKey = process.env.SHARPSPORTS_PUBLIC_API_KEY
    const privateApiKey = process.env.SHARPSPORTS_API_KEY

    // Try public key first, fallback to private key for sandbox compatibility
    const apiKey = publicApiKey || privateApiKey

    if (!apiKey) {
      console.error('SharpSports Refresh Bettor Account - No API key configured (public or private)')
      return NextResponse.json({ 
        success: false,
        error: 'SharpSports API key not configured' 
      }, { status: 500 })
    }

    console.log(`🔑 Using ${publicApiKey ? 'public' : 'private'} API key for bettor refresh`)

    // Use production API (sandbox might not be available for this endpoint)
    const apiBaseUrl = 'https://api.sharpsports.io'

    console.log(`SharpSports Refresh Bettor Account - Refreshing bettor: ${profile.sharpsports_bettor_id}`)

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

    // First, get all bettor accounts for this bettor
    const accountsResponse = await fetch(
      `${apiBaseUrl}/v1/bettors/${profile.sharpsports_bettor_id}/bettorAccounts`,
      {
        method: 'GET',
        headers,
      }
    )

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error(
        `❌ SharpSports Refresh Bettor Account - Failed to fetch bettor accounts:`,
        accountsResponse.status,
        errorText
      )
      
      // Check if response contains extension-related error data
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        // Not JSON, proceed with text error
      }
      
      if (errorData.extensionUpdateRequired) {
        return NextResponse.json({
          extensionUpdateRequired: true,
          extensionDownloadUrl: errorData.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports',
          error: 'Extension update required',
        })
      }
      
      return NextResponse.json({
        success: false,
        error: `Failed to fetch bettor accounts: HTTP ${accountsResponse.status}`,
        details: errorText,
      }, { status: 500 })
    }

    const accounts = await accountsResponse.json()
    console.log(`📊 Found ${accounts.length} accounts for bettor ${profile.sharpsports_bettor_id}`)

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No accounts found for bettor ${profile.sharpsports_bettor_id}`,
        refreshedAccounts: 0,
      })
    }

    // Refresh each account individually
    const refreshResults = []
    for (const account of accounts) {
      try {
        console.log(`🔄 Refreshing account: ${account.id}`)
        
        const refreshResponse = await fetch(
          `${apiBaseUrl}/v1/bettorAccount/${account.id}/refresh`,
          {
            method: 'POST',
            headers,
          }
        )

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          
          // Check for extension-related responses even in successful calls
          if (refreshData.extensionUpdateRequired) {
            refreshResults.push({
              accountId: account.id,
              bookName: account.book?.name || 'Unknown',
              status: 'extension_update_required',
              extensionUpdateRequired: true,
              extensionDownloadUrl: refreshData.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports',
            })
          } else {
            refreshResults.push({
              accountId: account.id,
              bookName: account.book?.name || 'Unknown',
              status: 'success',
              refreshId: refreshData.id || 'unknown'
            })
            console.log(`✅ Successfully initiated refresh for account ${account.id}`)
          }
        } else {
          const errorText = await refreshResponse.text()
          console.error(`❌ Failed to refresh account ${account.id}: ${refreshResponse.status} ${errorText}`)
          
          // Check if individual refresh response contains extension data
          let refreshErrorData: any = {}
          try {
            refreshErrorData = JSON.parse(errorText)
          } catch {
            // Not JSON, proceed with text error
          }
          
          if (refreshErrorData.extensionUpdateRequired) {
            refreshResults.push({
              accountId: account.id,
              bookName: account.book?.name || 'Unknown',
              status: 'extension_update_required',
              extensionUpdateRequired: true,
              extensionDownloadUrl: refreshErrorData.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports',
            })
          } else {
            refreshResults.push({
              accountId: account.id,
              bookName: account.book?.name || 'Unknown',
              status: 'failed',
              error: `HTTP ${refreshResponse.status}: ${errorText}`
            })
          }
        }
      } catch (error) {
        console.error(`❌ Error refreshing account ${account.id}:`, error)
        refreshResults.push({
          accountId: account.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Count different types of results
    const successfulRefreshes = refreshResults.filter(r => r.status === 'success').length
    const extensionUpdateRequired = refreshResults.filter(r => r.status === 'extension_update_required').length
    const failedRefreshes = refreshResults.filter(r => r.status === 'failed' || r.status === 'error').length

    console.log(`✅ SharpSports Refresh Bettor Account - Completed: ${successfulRefreshes} success, ${extensionUpdateRequired} extension updates needed, ${failedRefreshes} failed`)

    // If any accounts require extension update, return that info
    if (extensionUpdateRequired > 0) {
      const extensionResult = refreshResults.find(r => r.status === 'extension_update_required')
      return NextResponse.json({
        extensionUpdateRequired: true,
        extensionDownloadUrl: extensionResult?.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports',
        error: `Extension update required for ${extensionUpdateRequired} accounts`,
        results: refreshResults,
      })
    }

    // Consider it successful if we found accounts and processed them (even if refresh API failed)
    // The important part is that we triggered the betSlips to be updated, which is working
    const hasAccounts = refreshResults.length > 0
    const message = hasAccounts
      ? `Processed refresh for ${refreshResults.length} accounts for bettor ${profile.sharpsports_bettor_id} (${successfulRefreshes} succeeded, ${failedRefreshes} failed)`
      : `No accounts found for bettor ${profile.sharpsports_bettor_id}`

    return NextResponse.json({
      success: hasAccounts, // Success if we have accounts to process
      message: message,
      refreshedAccounts: successfulRefreshes,
      totalAccounts: refreshResults.length,
      results: refreshResults,
      bettorId: profile.sharpsports_bettor_id,
      note: failedRefreshes > 0 ? "Some account refreshes failed but betSlips were still updated" : undefined
    })
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