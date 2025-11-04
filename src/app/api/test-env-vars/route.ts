import { NextResponse } from 'next/server'

export async function GET() {
  // Check what environment variables are actually available in Vercel
  const envCheck = {
    APPLE_API_KEY_ID: process.env.APPLE_API_KEY_ID ? 'SET' : 'MISSING',
    APPLE_ISSUER_ID: process.env.APPLE_ISSUER_ID ? 'SET' : 'MISSING', 
    APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID || 'MISSING',
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY ? 'SET' : 'MISSING',
    
    // Check lengths
    keyIdLength: process.env.APPLE_API_KEY_ID?.length || 0,
    issuerIdLength: process.env.APPLE_ISSUER_ID?.length || 0,
    bundleIdLength: process.env.APPLE_BUNDLE_ID?.length || 0,
    privateKeyLength: process.env.APPLE_PRIVATE_KEY?.length || 0,
    
    // Check formats
    keyIdValue: process.env.APPLE_API_KEY_ID || 'MISSING',
    bundleIdValue: process.env.APPLE_BUNDLE_ID || 'MISSING',
    privateKeyPrefix: process.env.APPLE_PRIVATE_KEY?.substring(0, 30) || 'MISSING',
    privateKeySuffix: process.env.APPLE_PRIVATE_KEY?.substring(process.env.APPLE_PRIVATE_KEY.length - 30) || 'MISSING',
    privateKeyHasNewlines: process.env.APPLE_PRIVATE_KEY?.includes('\n') || false,
  }
  
  return NextResponse.json(envCheck)
}