import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Current user's strategy IDs from logs
    const strategyIds = [
      'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
      '8bff6189-e315-4864-9318-f99307c7019d',
      'c867d015-75fa-4563-b695-b6756376aa3d',
    ]

    const nowISO = new Date().toISOString()
    console.log('Testing strategy_bets query with time:', nowISO)

    // Step 1: Check strategy_bets entries for these strategies
    const { data: allStrategyBets, error: allError } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets (
          id,
          bet_description,
          status,
          game_date
        )
      `
      )
      .in('strategy_id', strategyIds)

    console.log('1. All strategy_bets entries:', allStrategyBets)

    // Step 2: Test the exact query used in getOpenBetsForStrategies
    const { data: strategyBetsWithFilter, error: filterError } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets!inner (
          id,
          sport,
          league,
          home_team,
          away_team,
          bet_type,
          bet_description,
          line_value,
          odds,
          stake,
          potential_payout,
          status,
          placed_at,
          game_date,
          sportsbook
        )
      `
      )
      .in('strategy_id', strategyIds)
      .eq('bets.status', 'pending')
      .gt('bets.game_date', nowISO)

    console.log('2. Strategy_bets with filters:', strategyBetsWithFilter)
    console.log('2. Filter error:', filterError)

    // Step 3: Test without the time filter to isolate the issue
    const { data: strategyBetsNoTime, error: noTimeError } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets!inner (
          id,
          bet_description,
          status,
          game_date
        )
      `
      )
      .in('strategy_id', strategyIds)
      .eq('bets.status', 'pending')

    console.log('3. Strategy_bets without time filter:', strategyBetsNoTime)
    console.log('3. No time error:', noTimeError)

    // Step 4: Test just the time filter separately
    const { data: strategyBetsOnlyTime, error: onlyTimeError } = await supabase
      .from('strategy_bets')
      .select(
        `
        strategy_id,
        bet_id,
        bets!inner (
          id,
          bet_description,
          status,
          game_date
        )
      `
      )
      .in('strategy_id', strategyIds)
      .gt('bets.game_date', nowISO)

    console.log('4. Strategy_bets with only time filter:', strategyBetsOnlyTime)
    console.log('4. Only time error:', onlyTimeError)

    return NextResponse.json({
      success: true,
      debug: {
        currentTime: nowISO,
        strategyIds,
        allStrategyBets: allStrategyBets?.length || 0,
        strategyBetsWithFilter: strategyBetsWithFilter?.length || 0,
        strategyBetsNoTime: strategyBetsNoTime?.length || 0,
        strategyBetsOnlyTime: strategyBetsOnlyTime?.length || 0,
        details: {
          allEntries: allStrategyBets,
          withFilters: strategyBetsWithFilter,
          noTimeFilter: strategyBetsNoTime,
          onlyTimeFilter: strategyBetsOnlyTime,
        },
        errors: {
          allError: allError?.message,
          filterError: filterError?.message,
          noTimeError: noTimeError?.message,
          onlyTimeError: onlyTimeError?.message,
        },
      },
    })
  } catch (error) {
    console.error('Debug strategy bets query error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
