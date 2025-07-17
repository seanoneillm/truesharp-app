// Test endpoint to check Supabase connection
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Test database connection by checking the bets table
    const { data, error, count } = await supabase
      .from('bets')
      .select('*', { count: 'exact' })
      .limit(5) // Get first 5 bets instead of just checking existence
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Failed to connect to bets table'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      totalBets: count || 0,
      sampleBets: data || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Server error during database test'
    }, { status: 500 })
  }
}
