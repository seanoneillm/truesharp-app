import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/sharpsports/mobile-auth-token - Generate mobile auth token for iOS SharpSports SDK
export async function GET(request: NextRequest) {
  try {
    console.log('🔑 SharpSports Mobile Auth - Generating mobile auth token for iOS')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id

    // Handle service role fallback for authentication
    if (authError || !user) {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')

      if (userId) {
        console.log(
          'Mobile Auth - Using service role with userId:',
          userId.substring(0, 8) + '...'
        )
        effectiveUserId = userId
      } else {
        console.log('Mobile Auth - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const url = new URL(request.url)
    const internalId = url.searchParams.get('internalId') || effectiveUserId

    // Get API key from environment (reuse the same key as web app)
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('Mobile Auth - SHARPSPORTS_API_KEY not configured')
      return NextResponse.json({ 
        error: 'SharpSports API key not configured' 
      }, { status: 500 })
    }

    console.log('🔄 Mobile Auth - Requesting mobile auth token from SharpSports API')

    // Generate mobile auth token by calling SharpSports mobile auth endpoint
    const response = await fetch('https://api.sharpsports.io/v1/mobile-auth', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        internalId: internalId
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `❌ Mobile Auth - Failed to generate mobile auth token: ${response.status}`,
        errorText
      )
      
      // For 404 errors, this might mean the mobile-auth endpoint doesn't exist yet
      // Return a graceful fallback that allows the app to continue working
      if (response.status === 404) {
        console.log('⚠️ Mobile Auth - mobile-auth endpoint not found, trying alternative endpoints')
        
        // Try alternative endpoints for mobile auth
        const alternativeEndpoints = [
          'https://api.sharpsports.io/v1/mobile/auth',
          'https://api.sharpsports.io/v1/mobile/token',
          'https://api.sharpsports.io/v1/token/mobile',
          'https://api.sharpsports.io/v1/auth/mobile',
        ]

        for (const altEndpoint of alternativeEndpoints) {
          console.log(`🔄 Mobile Auth - Trying: ${altEndpoint}`)
          
          try {
            const altResponse = await fetch(altEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Token ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                internalId: internalId
              }),
            })

            if (altResponse.ok) {
              const altData = await altResponse.json()
              console.log('✅ Mobile Auth - Alternative endpoint worked:', altEndpoint)
              
              const mobileAuthToken = altData.token || altData.mobileAuthToken || altData.id
              
              if (mobileAuthToken) {
                return NextResponse.json({
                  success: true,
                  mobileAuthToken: mobileAuthToken,
                  expiresAt: altData.expiresAt,
                  internalId: internalId,
                })
              }
            }
          } catch (altError) {
            console.log(`❌ Mobile Auth - Alternative endpoint error:`, altError)
          }
        }
        
        console.log('⚠️ Mobile Auth - All endpoints failed, returning graceful fallback')
        return NextResponse.json({
          success: false,
          error: 'Mobile auth tokens not available - SDK features may be limited',
          note: 'The mobile auth endpoint may not be available in your current SharpSports plan',
          internalId: internalId,
        }, { status: 404 })
      }
      
      return NextResponse.json({
        error: `Failed to generate mobile auth token: HTTP ${response.status}`,
        details: errorText,
      }, { status: response.status })
    }

    const tokenData = await response.json()
    console.log('✅ Mobile Auth - Successfully generated mobile auth token')

    const mobileAuthToken = tokenData.token || tokenData.mobileAuthToken || tokenData.id

    if (!mobileAuthToken) {
      console.error('Mobile Auth - No mobile auth token found in response:', tokenData)
      return NextResponse.json({
        error: 'No mobile auth token returned from SharpSports API',
        response: tokenData,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mobileAuthToken: mobileAuthToken,
      expiresAt: tokenData.expiresAt,
      internalId: internalId,
    })
  } catch (error) {
    console.error('Mobile Auth - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST method for consistency with other endpoints
export async function POST(request: NextRequest) {
  return GET(request)
}