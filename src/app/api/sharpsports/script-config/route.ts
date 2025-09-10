import { NextRequest, NextResponse } from 'next/server'

// GET /api/sharpsports/script-config - Provide configuration for extension script
export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Providing SharpSports script configuration')

    // For SDK extensions, sometimes the private key is needed
    // This is a controlled endpoint that only provides the key for script injection
    const privateKey = process.env.SHARPSPORTS_API_KEY
    const publicKey = process.env.SHARPSPORTS_PUBLIC_API_KEY

    if (!privateKey && !publicKey) {
      console.error('Script Config - No SharpSports keys configured')
      return NextResponse.json({ 
        error: 'SharpSports keys not configured' 
      }, { status: 500 })
    }

    // Determine the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL

    // Return the public key and context endpoint for frontend use
    return NextResponse.json({
      success: true,
      publicKey: publicKey,
      contextEndpoint: `${baseUrl}/api/sharpsports/context`,
      note: 'Configuration provided for extension script - public key and context endpoint'
    })
  } catch (error) {
    console.error('Script Config - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}