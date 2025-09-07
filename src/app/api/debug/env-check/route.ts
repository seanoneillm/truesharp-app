import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    env_vars: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY_VALUE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'sk_...' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 10) : 'not found',
      NODE_ENV: process.env.NODE_ENV,
    }
  })
}