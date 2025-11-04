import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    APPLE_API_KEY_ID: process.env.APPLE_API_KEY_ID,
    APPLE_ISSUER_ID: process.env.APPLE_ISSUER_ID,
    APPLE_BUNDLE_ID: process.env.APPLE_BUNDLE_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY
  }
  
  const status = {
    keyId: envVars.APPLE_API_KEY_ID ? 'SET' : 'MISSING',
    issuerId: envVars.APPLE_ISSUER_ID ? 'SET' : 'MISSING',
    bundleId: envVars.APPLE_BUNDLE_ID ? 'SET' : 'MISSING',
    privateKey: envVars.APPLE_PRIVATE_KEY ? 'SET' : 'MISSING',
    keyIdValue: envVars.APPLE_API_KEY_ID || 'MISSING',
    issuerIdValue: envVars.APPLE_ISSUER_ID || 'MISSING',
    bundleIdValue: envVars.APPLE_BUNDLE_ID || 'MISSING',
    privateKeyLength: envVars.APPLE_PRIVATE_KEY?.length || 0
  }
  
  return NextResponse.json(status)
}