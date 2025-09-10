import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
// import { createClient } from '@supabase/supabase-js' // Not needed for this endpoint
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Generating SharpSports extension auth token')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id
    // let querySupabase = supabase // Not used in this endpoint

    // Handle service role fallback for authentication
    if (authError || !user) {
      const body = await request.json().catch(() => ({}))
      const userId = body.userId

      if (userId) {
        console.log(
          'Extension Auth - Using service role with userId:',
          userId.substring(0, 8) + '...'
        )

        // Service supabase not needed for this endpoint
        // const serviceSupabase = createClient(
        //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
        //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
        //   {
        //     auth: {
        //       autoRefreshToken: false,
        //       persistSession: false,
        //     },
        //   }
        // )

        effectiveUserId = userId
        // querySupabase = serviceSupabase // Not used in this endpoint
      } else {
        console.log('Extension Auth - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get API key from environment
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('Extension Auth - SHARPSPORTS_API_KEY not configured')
      return NextResponse.json({ 
        error: 'SharpSports API key not configured' 
      }, { status: 500 })
    }

    // Generate extension auth token by calling SharpSports extension/auth endpoint
    const response = await fetch('https://api.sharpsports.io/v1/extension/auth', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internalId: effectiveUserId
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `❌ Extension Auth - Failed to generate auth token: ${response.status}`,
        errorText
      )
      
      // For 404 errors, this might mean the auth-tokens endpoint doesn't exist yet
      // Return a graceful fallback that allows the app to continue working
      if (response.status === 404) {
        console.log('⚠️ Extension Auth - auth-tokens endpoint not found, continuing without extension token')
        return NextResponse.json({
          success: true,
          extensionAuthToken: null,
          note: 'Extension auth tokens not available - SDK features may be limited',
          userId: effectiveUserId,
        })
      }
      
      return NextResponse.json({
        error: `Failed to generate extension auth token: HTTP ${response.status}`,
        details: errorText,
      }, { status: response.status })
    }

    const tokenData = await response.json()
    console.log('✅ Extension Auth - Successfully generated auth token')

    return NextResponse.json({
      success: true,
      extensionAuthToken: tokenData.token || tokenData.extensionAuthToken || tokenData.id,
      expiresAt: tokenData.expiresAt,
      userId: effectiveUserId,
    })
  } catch (error) {
    console.error('Extension Auth - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET method for client-side fetching
export async function GET(request: NextRequest) {
  return POST(request)
}