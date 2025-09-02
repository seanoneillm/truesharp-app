import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    // Use the regular server client (with authentication) like the subscriptions page does
    const supabase = await createServerClient()

    // Test strategy IDs for debugging
    const strategyIds = [
      'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
      '8bff6189-e315-4864-9318-f99307c7019d',
      'c867d015-75fa-4563-b695-b6756376aa3d',
    ]
    console.log('Testing with strategy IDs:', strategyIds)

    console.log('Testing RLS permissions with authenticated client...')

    // Test 1: Can we read strategy_bets at all?
    const { data: strategyBetsTest, error: strategyBetsError } = await supabase
      .from('strategy_bets')
      .select('*')
      .limit(5)

    console.log('1. strategy_bets basic read:', {
      error: strategyBetsError?.message,
      count: strategyBetsTest?.length || 0,
    })

    // Test 2: Can we read bets?
    const { data: betsTest, error: betsError } = await supabase.from('bets').select('*').limit(5)

    console.log('2. bets basic read:', {
      error: betsError?.message,
      count: betsTest?.length || 0,
    })

    // Test 3: Can we do the join?
    const { data: joinTest, error: joinError } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets (
          id,
          bet_description,
          status
        )
      `
      )
      .limit(5)

    console.log('3. strategy_bets join test:', {
      error: joinError?.message,
      count: joinTest?.length || 0,
    })

    // Test 4: Current user info
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('4. Current user:', {
      userId: user?.id,
      error: userError?.message,
    })

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: user?.id,
        strategyBetsBasicRead: strategyBetsTest?.length || 0,
        betsBasicRead: betsTest?.length || 0,
        joinTest: joinTest?.length || 0,
        errors: {
          strategyBets: strategyBetsError?.message,
          bets: betsError?.message,
          join: joinError?.message,
          user: userError?.message,
        },
        sampleData: {
          strategyBets: strategyBetsTest?.slice(0, 2),
          bets: betsTest?.slice(0, 2),
          join: joinTest?.slice(0, 2),
        },
      },
    })
  } catch (error) {
    console.error('RLS permissions debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
