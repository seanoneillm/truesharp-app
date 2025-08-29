import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/context - Generate context ID for Booklink UI
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Context - Generating context ID')
    
    // Read request body once
    const body = await request.json().catch(() => ({}))
    const { userId: requestUserId, redirectUrl: baseRedirectUrl } = body

    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let effectiveUserId = user?.id
    
    // Handle service role fallback for authentication
    if (authError || !user) {
      if (requestUserId) {
        console.log('SharpSports Context - Using service role with userId:', requestUserId.substring(0, 8) + '...')
        effectiveUserId = requestUserId
      } else {
        console.log('SharpSports Context - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Context - API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Use sandbox API for development
    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.sharpsports.io' 
      : 'https://api.sharpsports.io' // SharpSports uses same API for sandbox

    // Build redirect URL with userId parameter so we can identify the user in the callback
    const redirectUrl = baseRedirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/api/sharpsports/accounts`
    const redirectWithUserId = `${redirectUrl}?userId=${effectiveUserId}`

    console.log(`🌐 SharpSports Context - Using API: ${apiBaseUrl}`)
    console.log(`🔄 SharpSports Context - Redirect URL: ${redirectWithUserId}`)

    // Generate context ID using SharpSports API
    const contextResponse = await fetch(`${apiBaseUrl}/v1/context`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        internalId: effectiveUserId,
        redirectUrl: redirectWithUserId
      })
    })

    if (!contextResponse.ok) {
      const errorText = await contextResponse.text()
      console.error(`SharpSports Context - API error: ${contextResponse.status} - ${errorText}`)
      return NextResponse.json({ 
        error: 'Failed to generate SharpSports context',
        details: errorText
      }, { status: contextResponse.status })
    }

    const contextData = await contextResponse.json()
    console.log('✅ SharpSports Context - API Response:', JSON.stringify(contextData, null, 2))

    // Try different possible field names for the context ID
    const contextId = contextData.id || contextData.contextId || contextData.cid || contextData.context_id

    if (!contextId) {
      console.error('SharpSports Context - No context ID found in response:', contextData)
      return NextResponse.json({ 
        error: 'No context ID returned from SharpSports API',
        response: contextData
      }, { status: 500 })
    }

    console.log('✅ SharpSports Context - Generated successfully, ID:', contextId)

    return NextResponse.json({
      contextId: contextId,
      success: true
    })

  } catch (error) {
    console.error('SharpSports Context - Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}