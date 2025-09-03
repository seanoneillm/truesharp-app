/**
 * Shared query logic for fetching open bets per strategy
 * Used by both seller and subscriber views to ensure consistency
 */

import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Quick interfaces for database results
interface StrategyBetResult {
  strategy_id: string
  bets: unknown[]
}

export interface OpenBet {
  id: string
  sport: string
  league?: string
  home_team?: string
  away_team?: string
  bet_type: string
  bet_description: string
  line_value?: number
  odds: number
  stake: number
  potential_payout: number
  status: string
  placed_at: string
  game_date?: string
  sportsbook?: string
  strategy_id?: string
  side?: string
}

export interface StrategyWithOpenBets {
  id: string
  name: string
  description?: string
  user_id: string
  performance_roi?: number
  performance_win_rate?: number
  performance_total_bets?: number
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  subscriber_count?: number
  open_bets: OpenBet[]
  open_bets_count: number
  total_potential_profit: number
}

/**
 * Core function to fetch open bets for strategies
 * Logic: bets where status = 'pending' AND game_date > NOW()
 */
export async function getOpenBetsForStrategies(
  strategyIds: string[],
  supabaseClient?: SupabaseClient
): Promise<Record<string, OpenBet[]>> {
  const supabase = supabaseClient || createClient()

  console.log('🎯 getOpenBetsForStrategies - Starting with strategy IDs:', strategyIds)

  if (strategyIds.length === 0) {
    console.log('🎯 getOpenBetsForStrategies - No strategy IDs provided, returning empty')
    return {}
  }

  try {
    // Fetch strategy_bets with open bet filters
    const { data: strategyBets, error: strategyBetsError } = await supabase
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
          sportsbook,
          side
        )
      `
      )
      .in('strategy_id', strategyIds)
      .eq('bets.status', 'pending')
      .gt('bets.game_date', new Date().toISOString())

    console.log('🎯 getOpenBetsForStrategies - Strategy_bets query result:', {
      error: strategyBetsError?.message,
      dataCount: strategyBets?.length || 0,
      sampleData: strategyBets?.slice(0, 2),
      query: 'strategy_bets with inner join',
      strategyIds,
      currentTime: new Date().toISOString(),
    })

    if (!strategyBetsError && strategyBets && strategyBets.length > 0) {
      // Group bets by strategy_id
      const betsByStrategy: Record<string, OpenBet[]> = {}

      strategyBets.forEach((strategyBet: StrategyBetResult) => {
        if (!betsByStrategy[strategyBet.strategy_id]) {
          betsByStrategy[strategyBet.strategy_id] = []
        }

        // Handle each bet in the bets array
        strategyBet.bets.forEach((bet: unknown) => {
          betsByStrategy[strategyBet.strategy_id]?.push({
            ...(bet as object),
            strategy_id: strategyBet.strategy_id,
          } as OpenBet)
        })
      })

      console.log('🎯 getOpenBetsForStrategies - Grouped bets by strategy:', betsByStrategy)
      return betsByStrategy
    }

    // Fallback: use direct strategy_id relationship in bets table
    console.log('🎯 getOpenBetsForStrategies - Using fallback method')
    return await getOpenBetsDirectByStrategy(strategyIds, supabase)
  } catch (error) {
    console.error('Error fetching open bets for strategies:', error)
    return {}
  }
}

/**
 * Alternative method: fetch open bets directly from bets table by strategy_id
 * Use this if bets are directly linked to strategies via strategy_id column
 */
export async function getOpenBetsDirectByStrategy(
  strategyIds: string[],
  supabaseClient?: SupabaseClient
): Promise<Record<string, OpenBet[]>> {
  const supabase = supabaseClient || createClient()

  console.log('🎯 getOpenBetsDirectByStrategy - Starting with strategy IDs:', strategyIds)

  if (strategyIds.length === 0) {
    return {}
  }

  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select(
        `
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
        sportsbook,
        strategy_id,
        side
      `
      )
      .in('strategy_id', strategyIds)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())
      .order('placed_at', { ascending: false })

    console.log('🎯 getOpenBetsDirectByStrategy - Direct bets query result:', {
      error: error?.message,
      dataCount: bets?.length || 0,
      sampleData: bets?.slice(0, 2),
      query: 'direct bets table query',
      strategyIds,
      currentTime: new Date().toISOString(),
    })

    if (error) {
      console.error('Error fetching open bets:', error)
      return {}
    }

    // Group bets by strategy_id
    const betsByStrategy: Record<string, OpenBet[]> = {}

    bets?.forEach((bet: OpenBet) => {
      if (bet.strategy_id && !betsByStrategy[bet.strategy_id]) {
        betsByStrategy[bet.strategy_id] = []
      }
      if (bet.strategy_id) {
        betsByStrategy[bet.strategy_id]?.push(bet)
      }
    })

    console.log('🎯 getOpenBetsDirectByStrategy - Final grouped result:', betsByStrategy)
    return betsByStrategy
  } catch (error) {
    console.error('Error fetching open bets directly:', error)
    return {}
  }
}

/**
 * Fetch strategies with their open bets for seller dashboard
 */
export async function getSellerStrategiesWithOpenBets(
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<unknown[]> {
  const supabase = supabaseClient || createClient()

  try {
    // First, get user's strategies from leaderboard
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategy_leaderboard')
      .select(
        `
        strategy_id,
        strategy_name,
        user_id,
        roi_percentage,
        win_rate,
        total_bets,
        subscription_price_weekly,
        subscription_price_monthly,
        subscription_price_yearly,
        is_monetized
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (strategiesError || !strategies) {
      console.error('Error fetching strategies:', strategiesError)
      return []
    }

    const strategyIds = strategies.map((s: unknown) => (s as { strategy_id: string }).strategy_id)

    // Get open bets for these strategies - try strategy_bets first
    let openBetsByStrategy = await getOpenBetsForStrategies(strategyIds, supabase)

    // If no results, try direct approach
    if (Object.keys(openBetsByStrategy).length === 0) {
      openBetsByStrategy = await getOpenBetsDirectByStrategy(strategyIds, supabase)
    }

    // Combine strategies with their open bets
    const strategiesWithBets = strategies.map((strategy: unknown) => {
      const strategyObj = strategy as { strategy_id: string; [key: string]: unknown }
      const openBets = openBetsByStrategy[strategyObj.strategy_id] || []
      const totalPotentialProfit = openBets.reduce((sum, bet) => {
        return sum + Math.max(0, bet.potential_payout - bet.stake)
      }, 0)

      return {
        id: strategyObj.strategy_id,
        name: strategyObj.strategy_name,
        description: '', // Not available in leaderboard
        user_id: strategyObj.user_id,
        performance_roi: strategyObj.roi_percentage,
        performance_win_rate: (strategyObj.win_rate as number) * 100, // Convert from decimal to percentage
        performance_total_bets: strategyObj.total_bets,
        pricing_weekly: strategyObj.subscription_price_weekly,
        pricing_monthly: strategyObj.subscription_price_monthly,
        pricing_yearly: strategyObj.subscription_price_yearly,
        subscriber_count: 0, // Would need to join with subscriptions if needed
        open_bets: openBets,
        open_bets_count: openBets.length,
        total_potential_profit: totalPotentialProfit,
      }
    })

    return strategiesWithBets
  } catch (error) {
    console.error('Error fetching seller strategies with open bets:', error)
    return []
  }
}

/**
 * Fetch subscribed strategies with their open bets for subscriber dashboard
 */
export async function getSubscriberStrategiesWithOpenBets(
  subscriberId: string,
  supabaseClient?: SupabaseClient
): Promise<StrategyWithOpenBets[]> {
  const supabase = supabaseClient || createClient()

  try {
    console.log('🔍 getSubscriberStrategiesWithOpenBets - Starting for user:', subscriberId)

    // First, get user's active subscriptions (just basic subscription data)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id, strategy_id, status, subscriber_id')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    console.log('🔍 getSubscriberStrategiesWithOpenBets - Subscriptions query result:', {
      error: subscriptionsError?.message,
      dataCount: subscriptions?.length || 0,
      sampleData: subscriptions?.slice(0, 2),
    })

    if (subscriptionsError || !subscriptions) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return []
    }

    // Extract strategy IDs from subscriptions
    const strategyIds = subscriptions
      .map((sub: unknown) => (sub as { strategy_id: string }).strategy_id)
      .filter((id: unknown) => id !== null) // Filter out null strategy_ids

    console.log('🔍 getSubscriberStrategiesWithOpenBets - Extracted strategy IDs:', strategyIds)

    if (strategyIds.length === 0) {
      console.log('🔍 getSubscriberStrategiesWithOpenBets - No valid strategy IDs found')
      return []
    }

    // Now fetch the strategy details separately
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(
        `
        id,
        name,
        description,
        user_id,
        performance_roi,
        performance_win_rate,
        performance_total_bets,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        subscriber_count
      `
      )
      .in('id', strategyIds)

    console.log('🔍 getSubscriberStrategiesWithOpenBets - Strategies query result:', {
      error: strategiesError?.message,
      dataCount: strategies?.length || 0,
      sampleData: strategies?.slice(0, 2),
    })

    if (strategiesError || !strategies) {
      console.error('Error fetching strategies:', strategiesError)
      return []
    }

    // Get open bets for subscribed strategies
    const openBetsByStrategy = await getOpenBetsForStrategies(strategyIds, supabase)

    console.log(
      '🔍 getSubscriberStrategiesWithOpenBets - Open bets by strategy:',
      openBetsByStrategy
    )

    // Combine strategies with their open bets
    const strategiesWithBets = strategies.map((strategy: unknown) => {
      const strategyObj = strategy as { id: string; [key: string]: unknown }
      const openBets = openBetsByStrategy[strategyObj.id] || []
      const totalPotentialProfit = openBets.reduce((sum, bet) => {
        return sum + Math.max(0, bet.potential_payout - bet.stake)
      }, 0)

      console.log('🔍 getSubscriberStrategiesWithOpenBets - Processing strategy:', {
        id: strategyObj.id,
        name: strategyObj.name,
        openBetsCount: openBets.length,
      })

      return {
        id: strategyObj.id,
        name: (strategyObj as unknown as { name: string }).name,
        description: (strategyObj as unknown as { description?: string }).description || '',
        user_id: (strategyObj as unknown as { user_id: string }).user_id,
        performance_roi: (strategyObj as unknown as { performance_roi?: number }).performance_roi,
        performance_win_rate: (strategyObj as unknown as { performance_win_rate?: number }).performance_win_rate,
        performance_total_bets: (strategyObj as unknown as { performance_total_bets?: number }).performance_total_bets,
        pricing_weekly: (strategyObj as unknown as { pricing_weekly?: number }).pricing_weekly,
        pricing_monthly: (strategyObj as unknown as { pricing_monthly?: number }).pricing_monthly,
        pricing_yearly: (strategyObj as unknown as { pricing_yearly?: number }).pricing_yearly,
        subscriber_count: (strategyObj as unknown as { subscriber_count?: number }).subscriber_count,
        open_bets: openBets,
        open_bets_count: openBets.length,
        total_potential_profit: totalPotentialProfit,
      }
    })

    console.log(
      '🔍 getSubscriberStrategiesWithOpenBets - Final result:',
      strategiesWithBets.map((s: unknown) => ({
        id: (s as { id: string }).id,
        name: (s as { name: string }).name,
        open_bets_count: (s as { open_bets_count: number }).open_bets_count,
      }))
    )

    return strategiesWithBets as StrategyWithOpenBets[]
  } catch (error) {
    console.error('Error fetching subscriber strategies with open bets:', error)
    return []
  }
}

/**
 * Helper function to format bet information for display
 */
export function formatBetForDisplay(bet: OpenBet) {
  const gameInfo =
    bet.bet_description ||
    (bet.home_team && bet.away_team ? `${bet.away_team} @ ${bet.home_team}` : 'Unknown bet')

  const oddsDisplay = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`

  const potentialProfit = bet.potential_payout - bet.stake

  return {
    ...bet,
    gameInfo,
    oddsDisplay,
    potentialProfit,
    gameTime: bet.game_date ? new Date(bet.game_date).toLocaleString() : null,
  }
}
