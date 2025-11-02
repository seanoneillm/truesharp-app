import { NextResponse } from 'next/server'

export async function GET() {
  const privateKey = process.env.APPLE_PRIVATE_KEY || ''
  
  return NextResponse.json({
    keyLength: privateKey.length,
    keyStart: privateKey.substring(0, 50),
    keyEnd: privateKey.substring(privateKey.length - 50),
    hasNewlines: privateKey.includes('\n'),
    hasBackslashN: privateKey.includes('\\n'),
    keyId: process.env.APPLE_API_KEY_ID || 'MISSING',
    bundleId: process.env.APPLE_BUNDLE_ID || 'MISSING'
  })
}