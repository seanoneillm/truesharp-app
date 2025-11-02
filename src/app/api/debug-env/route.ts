import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Simple environment check endpoint
  const appleVars = {
    APPLE_API_KEY_ID: process.env.APPLE_API_KEY_ID ? 'SET' : 'MISSING',
    APPLE_ISSUER_ID: process.env.APPLE_ISSUER_ID ? 'SET' : 'MISSING', 
    APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID ? 'SET' : 'MISSING',
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY ? 'SET' : 'MISSING'
  }
  
  const keyLengths = {
    APPLE_API_KEY_ID: process.env.APPLE_API_KEY_ID?.length || 0,
    APPLE_ISSUER_ID: process.env.APPLE_ISSUER_ID?.length || 0,
    APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID?.length || 0,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY?.length || 0
  }
  
  const keyPreviews = {
    APPLE_API_KEY_ID: process.env.APPLE_API_KEY_ID?.substring(0, 4) + '...' || 'N/A',
    APPLE_ISSUER_ID: process.env.APPLE_ISSUER_ID?.substring(0, 8) + '...' || 'N/A',
    APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID || 'N/A',
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY?.substring(0, 20) + '...' || 'N/A'
  }
  
  return NextResponse.json({
    status: 'Environment Variable Check',
    variables: appleVars,
    lengths: keyLengths,
    previews: keyPreviews,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}