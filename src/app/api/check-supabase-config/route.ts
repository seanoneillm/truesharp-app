import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Supabase configuration...')
    
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check auth settings
    try {
      const { data: authConfig } = await serviceSupabase
        .from('auth.config')
        .select('*')
      
      console.log('Auth config:', authConfig)
    } catch (e) {
      console.log('Could not read auth config:', e)
    }

    // Check if signups are enabled
    try {
      // Try to get auth settings via admin API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const settings = await response.json()
        console.log('Auth settings:', settings)
      } else {
        console.log('Auth settings fetch failed:', response.status, response.statusText)
      }
    } catch (e) {
      console.log('Auth settings error:', e)
    }

    // Test direct database access to auth schema
    try {
      const testQuery = `
        SELECT 
          current_user as current_user,
          session_user as session_user,
          current_database() as current_db,
          version() as pg_version
      `
      
      const { data: dbInfo, error: dbError } = await serviceSupabase.rpc('sql', { 
        query: testQuery 
      })
      
      if (dbError) {
        console.log('Database info error:', dbError)
      } else {
        console.log('Database info:', dbInfo)
      }
    } catch (e) {
      console.log('Database info exception:', e)
    }

    return NextResponse.json({
      message: 'Configuration check completed - see console logs',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    })

  } catch (error) {
    console.error('Config check error:', error)
    return NextResponse.json({ error: 'Config check failed' }, { status: 500 })
  }
}