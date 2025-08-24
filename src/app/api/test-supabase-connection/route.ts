import { createBrowserClient } from '@/lib/auth/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createBrowserClient()
    
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log('Auth test:', { authData, authError })
    
    // Test strategies table access
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name')
      .limit(1)
    
    console.log('Strategies test:', { strategiesData, strategiesError })
    
    // Test strategy_leaderboard table access
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('strategy_leaderboard')
      .select('id, strategy_id')
      .limit(1)
    
    console.log('Leaderboard test:', { leaderboardData, leaderboardError })
    
    return NextResponse.json({
      success: true,
      auth: { data: authData, error: authError },
      strategies: { data: strategiesData, error: strategiesError },
      leaderboard: { data: leaderboardData, error: leaderboardError }
    })
    
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}