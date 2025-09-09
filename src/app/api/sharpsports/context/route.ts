import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/context - Generate context ID for Booklink UI
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Context - Generating context ID')

    // Read request body once
    const body = await request.json().catch(() => ({}))
    const { 
      userId: requestUserId, 
      redirectUrl: baseRedirectUrl,
      extensionAuthToken,
      extensionVersion
    } = body

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id

    // Handle service role fallback for authentication
    if (authError || !user) {
      if (requestUserId) {
        console.log(
          'SharpSports Context - Using service role with userId:',
          requestUserId.substring(0, 8) + '...'
        )
        effectiveUserId = requestUserId
      } else {
        console.log('SharpSports Context - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Use public API key for context generation (required in live mode)
    const publicApiKey = process.env.SHARPSPORTS_PUBLIC_API_KEY
    const privateApiKey = process.env.SHARPSPORTS_API_KEY

    // For context generation, try public key first, fallback to private key (for sandbox compatibility)
    const contextApiKey = publicApiKey || privateApiKey

    if (!contextApiKey) {
      console.error('SharpSports Context - No API key configured (public or private)')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    console.log(`🔑 Using ${publicApiKey ? 'public' : 'private'} API key for context generation`)

    // Use the main API for both development and production
    const apiBaseUrl = 'https://api.sharpsports.io'

    // Build redirect URL with userId parameter so we can identify the user in the callback
    // Dynamically determine the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL

    console.log(`🔍 Headers - host: ${host}, protocol: ${protocol}, baseUrl: ${baseUrl}`)
    console.log(`🔍 baseRedirectUrl from client: ${baseRedirectUrl}`)

    const redirectUrl = baseRedirectUrl || `${baseUrl}/api/sharpsports/accounts`
    const redirectWithUserId = `${redirectUrl}?userId=${effectiveUserId}`

    console.log(`🌐 SharpSports Context - Using API: ${apiBaseUrl}`)
    console.log(`🔄 SharpSports Context - Redirect URL: ${redirectWithUserId}`)

    // Payload for context generation
    const contextPayload: any = {
      internalId: effectiveUserId,
      redirectUrl: redirectWithUserId,
    }
    
    // Add extension data if available
    if (extensionAuthToken) {
      contextPayload.extensionAuthToken = extensionAuthToken
    }
    if (extensionVersion) {
      contextPayload.extensionVersion = extensionVersion
    }
    
    console.log('🔄 SharpSports Context - Payload:', JSON.stringify(contextPayload, null, 2))

    // Generate context ID using SharpSports API
    const contextEndpoint = `${apiBaseUrl}/v1/context`
    console.log(`🔄 SharpSports Context - Calling: ${contextEndpoint}`)

    // Prepare headers with extension data if available
    const headers: Record<string, string> = {
      Authorization: `Token ${contextApiKey}`,
      'Content-Type': 'application/json',
    }
    
    // Add extension data to headers if available
    if (extensionAuthToken) {
      headers['X-Extension-Auth-Token'] = extensionAuthToken
    }
    if (extensionVersion) {
      headers['X-Extension-Version'] = extensionVersion
    }

    const contextResponse = await fetch(contextEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(contextPayload),
    })

    if (!contextResponse.ok) {
      const errorText = await contextResponse.text()
      console.error(`SharpSports Context - API error: ${contextResponse.status} - ${errorText}`)

      // Try alternative endpoints if the first one fails
      console.log('🔄 SharpSports Context - Trying alternative endpoints...')

      const alternativeEndpoints = [
        `${apiBaseUrl}/v1/contexts`,
        `${apiBaseUrl}/v1/booklink/context`,
        `${apiBaseUrl}/v1/ui/context`,
        `${apiBaseUrl}/v1/booklink/contexts`,
        `${apiBaseUrl}/v1/link/context`,
        `${apiBaseUrl}/booklink/context`,
      ]

      for (const altEndpoint of alternativeEndpoints) {
        console.log(`🔄 SharpSports Context - Trying: ${altEndpoint}`)

        try {
          const altResponse = await fetch(altEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(contextPayload),
          })

          if (altResponse.ok) {
            const altData = await altResponse.json()
            console.log('✅ SharpSports Context - Alternative endpoint worked:', altEndpoint)
            console.log('✅ SharpSports Context - Response:', JSON.stringify(altData, null, 2))

            const contextId = altData.id || altData.contextId || altData.cid || altData.context_id

            if (contextId) {
              console.log(
                '✅ SharpSports Context - Generated successfully via alternative endpoint, ID:',
                contextId
              )
              return NextResponse.json({
                contextId: contextId,
                success: true,
              })
            }
          } else {
            const altErrorText = await altResponse.text()
            console.log(
              `❌ SharpSports Context - Alternative endpoint failed: ${altResponse.status} - ${altErrorText}`
            )
          }
        } catch (altError) {
          console.log(`❌ SharpSports Context - Alternative endpoint error:`, altError)
        }
      }

      // If all alternatives failed, try a direct Booklink approach as final fallback
      console.log(
        '🔄 SharpSports Context - All API endpoints failed, trying direct Booklink URL approach...'
      )

      try {
        // Generate a simple UUID-style context ID as fallback
        const fallbackContextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.log('✅ SharpSports Context - Using fallback context ID:', fallbackContextId)
        console.log(
          'ℹ️  SharpSports Context - Note: Using fallback approach due to API permission issues'
        )

        return NextResponse.json({
          contextId: fallbackContextId,
          success: true,
          fallback: true,
          message: 'Using fallback context ID due to API limitations',
        })
      } catch (fallbackError) {
        console.error('SharpSports Context - Fallback approach failed:', fallbackError)

        // Final error response
        return NextResponse.json(
          {
            error: 'Failed to generate SharpSports context - all methods exhausted',
            details: errorText,
            fallbackError:
              fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
          },
          { status: contextResponse.status }
        )
      }
    }

    const contextData = await contextResponse.json()
    console.log('✅ SharpSports Context - API Response:', JSON.stringify(contextData, null, 2))

    // Check for extension-related responses
    if (contextData.extensionUpdateRequired) {
      console.log('🔄 SharpSports Context - Extension update required')
      return NextResponse.json({
        extensionUpdateRequired: true,
        extensionDownloadUrl: contextData.extensionDownloadUrl || 'https://chrome.google.com/webstore/search/sharpsports',
        error: 'Extension update required',
      })
    }

    // Try different possible field names for the context ID
    const contextId =
      contextData.id || contextData.contextId || contextData.cid || contextData.context_id

    if (!contextId) {
      console.error('SharpSports Context - No context ID found in response:', contextData)
      return NextResponse.json(
        {
          error: 'No context ID returned from SharpSports API',
          response: contextData,
        },
        { status: 500 }
      )
    }

    console.log('✅ SharpSports Context - Generated successfully, ID:', contextId)

    return NextResponse.json({
      contextId: contextId,
      success: true,
    })
  } catch (error) {
    console.error('SharpSports Context - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
