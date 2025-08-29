import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/accounts - Store a new linked bettor account
export async function POST(request: NextRequest) {
  try {
    console.log('🔗 SharpSports Accounts - Storing new linked account')
    
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let effectiveUserId = user?.id
    let querySupabase = supabase
    
    // Handle service role fallback for authentication
    const body = await request.json()
    
    if (authError || !user) {
      const userId = body.userId
      
      if (userId) {
        console.log('SharpSports Accounts - Using service role with userId:', userId.substring(0, 8) + '...')
        
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
        console.log('SharpSports Accounts - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { bettorAccount } = body

    if (!bettorAccount) {
      return NextResponse.json({ error: 'Missing bettorAccount data' }, { status: 400 })
    }

    console.log('SharpSports Accounts - Processing account:', bettorAccount.id, 'for user:', effectiveUserId?.substring(0, 8) + '...')

    // Map SharpSports bettorAccount to our bettor_account table
    const accountData = {
      user_id: effectiveUserId,
      sharpsports_account_id: bettorAccount.id,
      bettor_id: bettorAccount.bettorId,
      book_id: bettorAccount.book?.id || 'unknown',
      book_name: bettorAccount.book?.name || 'Unknown',
      book_abbr: bettorAccount.book?.abbr || 'UNK',
      region_id: bettorAccount.region?.id || null,
      region_name: bettorAccount.region?.name || null,
      region_abbr: bettorAccount.region?.abbr || null,
      balance: bettorAccount.balance ? parseFloat(bettorAccount.balance) : null,
      verified: bettorAccount.verified || false,
      access: bettorAccount.access || false,
      paused: bettorAccount.paused || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('SharpSports Accounts - Inserting account data:', {
      ...accountData,
      user_id: accountData.user_id?.substring(0, 8) + '...'
    })

    // Insert the new bettor account (or update if it already exists)
    const { data: insertedAccount, error: insertError } = await querySupabase
      .from('bettor_account')
      .upsert(accountData, { 
        onConflict: 'sharpsports_account_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (insertError) {
      console.error('SharpSports Accounts - Error storing account:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('✅ SharpSports Accounts - Successfully stored account:', bettorAccount.id)

    return NextResponse.json({ 
      success: true,
      account: insertedAccount,
      message: 'Bettor account successfully linked'
    })

  } catch (error) {
    console.error('SharpSports Accounts - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/sharpsports/accounts - Handle SharpSports callback or fetch linked accounts
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const params = url.searchParams
    
    // Check if this is a SharpSports callback with account data
    const bettorAccountId = params.get('bettorAccountId') || params.get('accountId')
    const contextId = params.get('contextId') || params.get('cid')
    const userId = params.get('userId')
    
    if (bettorAccountId || contextId) {
      console.log('🔗 SharpSports Accounts - Handling callback with params:', Object.fromEntries(params))
      
      // This is a callback from SharpSports - fetch the account data and store it
      return await handleSharpSportsCallback(request, params)
    }
    
    // Regular request to fetch linked accounts
    console.log('📋 SharpSports Accounts - Fetching linked accounts')
    
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let effectiveUserId = user?.id
    let querySupabase = supabase
    
    // Handle service role fallback for authentication
    if (authError || !user) {
      const userIdParam = params.get('userId')
      
      if (userIdParam) {
        console.log('SharpSports Accounts - Using service role with userId:', userIdParam.substring(0, 8) + '...')
        
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
        
        effectiveUserId = userIdParam
        querySupabase = serviceSupabase
      } else {
        console.log('SharpSports Accounts - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('SharpSports Accounts - Fetching accounts for user:', effectiveUserId?.substring(0, 8) + '...')

    const { data: accounts, error: accountsError } = await querySupabase
      .from('bettor_account')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })

    if (accountsError) {
      console.error('SharpSports Accounts - Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    console.log(`📊 SharpSports Accounts - Found ${accounts?.length || 0} linked accounts`)

    return NextResponse.json({ 
      accounts: accounts || [],
      count: accounts?.length || 0
    })

  } catch (error) {
    console.error('SharpSports Accounts - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle SharpSports callback and fetch account data
async function handleSharpSportsCallback(request: NextRequest, params: URLSearchParams) {
  try {
    console.log('🔄 SharpSports Callback - Processing account link callback')
    
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Callback - API key not configured')
      return new Response('SharpSports API key not configured', { status: 500 })
    }

    // Extract parameters from the callback
    const bettorAccountId = params.get('bettorAccountId') || params.get('accountId')
    const contextId = params.get('contextId') || params.get('cid')
    const userId = params.get('userId') // This should be our internal user ID
    
    console.log('SharpSports Callback - Parameters:', { bettorAccountId, contextId, userId })

    if (!bettorAccountId) {
      console.error('SharpSports Callback - No bettor account ID in callback')
      return new Response('Missing bettor account ID', { status: 400 })
    }

    // Use sandbox API for development
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.sharpsports.io' 
      : 'https://api.sharpsports.io'

    // Fetch the bettor account details from SharpSports
    const accountResponse = await fetch(`${apiBaseUrl}/v1/bettorAccounts/${bettorAccountId}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      console.error(`SharpSports Callback - Failed to fetch account: ${accountResponse.status} - ${errorText}`)
      return new Response(`Failed to fetch account details: ${errorText}`, { status: accountResponse.status })
    }

    const bettorAccount = await accountResponse.json()
    console.log('SharpSports Callback - Retrieved account data:', bettorAccount)

    // Store the account using the same logic as the POST endpoint
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

    // Map SharpSports bettorAccount to our bettor_account table
    const accountData = {
      user_id: userId, // Use the userId from the callback
      sharpsports_account_id: bettorAccount.id,
      bettor_id: bettorAccount.bettorId,
      book_id: bettorAccount.book?.id || 'unknown',
      book_name: bettorAccount.book?.name || 'Unknown',
      book_abbr: bettorAccount.book?.abbr || 'UNK',
      region_id: bettorAccount.region?.id || null,
      region_name: bettorAccount.region?.name || null,
      region_abbr: bettorAccount.region?.abbr || null,
      balance: bettorAccount.balance ? parseFloat(bettorAccount.balance) : null,
      verified: bettorAccount.verified || false,
      access: bettorAccount.access || false,
      paused: bettorAccount.paused || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('SharpSports Callback - Inserting account data for user:', userId)

    // Insert the new bettor account (or update if it already exists)
    const { data: insertedAccount, error: insertError } = await serviceSupabase
      .from('bettor_account')
      .upsert(accountData, { 
        onConflict: 'sharpsports_account_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (insertError) {
      console.error('SharpSports Callback - Error storing account:', insertError)
      return new Response(`Error storing account: ${insertError.message}`, { status: 500 })
    }

    console.log('✅ SharpSports Callback - Successfully stored account:', bettorAccount.id)

    // Return a success page that closes the popup
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Successfully Linked!</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .details { color: #666; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="success">✅ Successfully Linked!</div>
        <div class="details">
          Your ${bettorAccount.book?.name || 'sportsbook'} account has been linked to TrueSharp.
          <br>You can now close this window.
        </div>
        <script>
          // Close the popup after a short delay
          setTimeout(() => {
            if (window.opener) {
              window.close();
            }
          }, 2000);
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('SharpSports Callback - Unexpected error:', error)
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}