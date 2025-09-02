import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSellerStrategiesWithOpenBets } from '@/lib/queries/open-bets'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const strategyId = params.id

    console.log('Fetching open bets for strategy:', strategyId)

    // Use the exact same function that works for professional strategy cards

    // Get the strategy owner's user_id first
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('user_id')
      .eq('id', strategyId)
      .single()

    console.log('Strategy owner query:', { strategy, strategyError })

    let openBets = []

    if (strategy && strategy.user_id) {
      // Use the exact same logic as professional strategy cards
      const strategiesWithBets = await getSellerStrategiesWithOpenBets(strategy.user_id, supabase)
      console.log('Strategies with bets from shared function:', strategiesWithBets)

      // Find our specific strategy
      const targetStrategy = strategiesWithBets.find(s => s.id === strategyId)
      console.log('Target strategy found:', targetStrategy)

      if (targetStrategy && targetStrategy.open_bets) {
        // Format to match expected structure for modal
        openBets = targetStrategy.open_bets.map(bet => ({
          id: `shared-${bet.id}`,
          added_at: null,
          bet_id: bet.id,
          bets: bet,
        }))
      }
    }

    console.log('Final open bets for modal:', { openBets, count: openBets.length })

    // Also fetch strategy details for branding
    const { data: strategyDetails, error: strategyDetailsError } = await supabase
      .from('strategies')
      .select(
        `
        id,
        name,
        user_id
      `
      )
      .eq('id', strategyId)
      .single()

    if (strategyDetailsError) {
      console.error('Error fetching strategy details:', strategyDetailsError)
      return NextResponse.json({ error: 'Failed to fetch strategy details' }, { status: 500 })
    }

    // Fetch user profile separately
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', strategyDetails.user_id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Continue without profile data rather than failing
    }

    return NextResponse.json({
      strategy: {
        ...strategyDetails,
        profiles: profile || { username: 'Unknown' },
      },
      openBets: openBets || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
