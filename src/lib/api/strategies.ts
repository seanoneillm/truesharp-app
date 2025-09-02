import type { StrategyData } from '@/components/seller/professional-strategy-card'
import { createBrowserClient } from '@/lib/auth/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Strategy {
  id: string
  name: string
  description?: string
}

export interface StrategyUpdateData {
  name?: string
  description?: string
  monetized?: boolean
  pricing_weekly?: number | null
  pricing_monthly?: number | null
  pricing_yearly?: number | null
}

export async function getStrategies(): Promise<Strategy[]> {
  // Strategy API logic here
  return []
}

// Helper function to create leaderboard entry for a strategy
async function createLeaderboardEntry(strategyId: string, supabase: SupabaseClient) {
  // First get the strategy details
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select(
      'user_id, name, monetized, pricing_weekly, pricing_monthly, pricing_yearly, performance_roi, performance_win_rate, performance_total_bets'
    )
    .eq('id', strategyId)
    .single()

  if (strategyError || !strategy) {
    console.error('Error fetching strategy for leaderboard creation:', strategyError)
    throw new Error('Strategy not found for leaderboard creation')
  }

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('username, is_verified_seller')
    .eq('id', strategy.user_id)
    .single()

  if (userError || !user) {
    console.error('Error fetching user for leaderboard creation:', userError)
    throw new Error('User not found for leaderboard creation')
  }

  // Create leaderboard entry
  const { error: insertError } = await supabase.from('strategy_leaderboard').insert({
    strategy_id: strategyId,
    user_id: strategy.user_id,
    strategy_name: strategy.name,
    username: user.username,
    is_verified_seller: user.is_verified_seller || false,
    total_bets: strategy.performance_total_bets || 0,
    winning_bets: 0, // Will be calculated by triggers
    losing_bets: 0,
    push_bets: 0,
    roi_percentage: strategy.performance_roi || 0,
    win_rate: (strategy.performance_win_rate || 0) / 100, // Convert percentage to decimal
    is_monetized: strategy.monetized || false,
    subscription_price_weekly: strategy.pricing_weekly,
    subscription_price_monthly: strategy.pricing_monthly,
    subscription_price_yearly: strategy.pricing_yearly,
    is_eligible: (strategy.performance_total_bets || 0) >= 10, // Example threshold
    minimum_bets_met: (strategy.performance_total_bets || 0) >= 10,
  })

  if (insertError) {
    console.error('Error creating leaderboard entry:', insertError)
    throw new Error(`Failed to create leaderboard entry: ${insertError.message}`)
  }

  console.log('Created leaderboard entry for strategy:', strategyId)
}

export async function fetchUserStrategies(userId: string): Promise<StrategyData[]> {
  const supabase = createBrowserClient()

  console.log('Fetching strategies from leaderboard for user:', userId)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  try {
    const { data, error } = await supabase
      .from('strategy_leaderboard')
      .select(
        `
        strategy_id,
        strategy_name,
        is_monetized,
        subscription_price_weekly,
        subscription_price_monthly,
        subscription_price_yearly,
        roi_percentage,
        win_rate,
        total_bets,
        created_at,
        updated_at,
        start_date
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`Failed to fetch strategies: ${error.message || JSON.stringify(error)}`)
    }

    console.log('Strategies fetched successfully:', data)

    if (!data || data.length === 0) {
      return []
    }

    // Get subscriber counts from subscriptions table for each strategy
    const strategyIds = data.map(strategy => strategy.strategy_id)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('strategy_id, frequency, status')
      .in('strategy_id', strategyIds)
      .eq('status', 'active')

    if (subscriptionsError) {
      console.error('Error fetching subscription counts:', subscriptionsError)
    }

    // Calculate subscriber counts by frequency for each strategy
    const subscriberCounts = subscriptions
      ? subscriptions.reduce(
          (acc, sub) => {
            if (!acc[sub.strategy_id]) {
              acc[sub.strategy_id] = {
                total: 0,
                weekly: 0,
                monthly: 0,
                yearly: 0,
              }
            }

            const strategyCount = acc[sub.strategy_id]!
            strategyCount.total++

            if (sub.frequency === 'weekly') {
              strategyCount.weekly++
            } else if (sub.frequency === 'monthly') {
              strategyCount.monthly++
            } else if (sub.frequency === 'yearly') {
              strategyCount.yearly++
            }

            return acc
          },
          {} as Record<string, { total: number; weekly: number; monthly: number; yearly: number }>
        )
      : {}

    // Map leaderboard data to StrategyData format and add subscriber counts
    const strategiesWithSubscriberCounts = data.map(strategy => ({
      id: strategy.strategy_id,
      name: strategy.strategy_name,
      description: '', // Not available in leaderboard, could join with strategies table if needed
      monetized: strategy.is_monetized || false,
      pricing_weekly: strategy.subscription_price_weekly,
      pricing_monthly: strategy.subscription_price_monthly,
      pricing_yearly: strategy.subscription_price_yearly,
      performance_roi: strategy.roi_percentage,
      performance_win_rate: strategy.win_rate * 100, // Convert from decimal to percentage
      performance_total_bets: strategy.total_bets,
      created_at: strategy.created_at,
      updated_at: strategy.updated_at,
      start_date: strategy.start_date,
      subscriber_count: subscriberCounts[strategy.strategy_id]?.total || 0,
      weekly_subscribers: subscriberCounts[strategy.strategy_id]?.weekly || 0,
      monthly_subscribers: subscriberCounts[strategy.strategy_id]?.monthly || 0,
      yearly_subscribers: subscriberCounts[strategy.strategy_id]?.yearly || 0,
    }))

    return strategiesWithSubscriberCounts
  } catch (networkError) {
    console.error('Network/connection error:', networkError)
    throw new Error(
      `Connection error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`
    )
  }
}

export async function updateStrategy(
  strategyId: string,
  updates: StrategyUpdateData
): Promise<void> {
  console.log('Updating strategy via API:', strategyId, 'with updates:', updates)

  try {
    const response = await fetch('/api/strategies', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: strategyId,
        ...updates,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('API error response:', errorData)
      throw new Error(`Failed to update strategy: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Strategy updated successfully:', result)
  } catch (error) {
    console.error('Error updating strategy:', error)
    throw error
  }
}

export async function deleteStrategy(strategyId: string): Promise<void> {
  const supabase = createBrowserClient()

  // Delete the strategy - cascade should handle related records
  const { error } = await supabase.from('strategies').delete().eq('id', strategyId)

  if (error) {
    console.error('Error deleting strategy:', error)
    throw new Error('Failed to delete strategy')
  }
}

export async function createStrategy(
  userId: string,
  strategyData: Omit<StrategyUpdateData, 'id'> & {
    name: string
    filter_config: Record<string, unknown>
  }
): Promise<StrategyData> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: userId,
      name: strategyData.name,
      description: strategyData.description || '',
      monetized: strategyData.monetized || false,
      pricing_weekly: strategyData.pricing_weekly,
      pricing_monthly: strategyData.pricing_monthly,
      pricing_yearly: strategyData.pricing_yearly,
      filter_config: strategyData.filter_config || {},
      performance_roi: null,
      performance_win_rate: null,
      performance_total_bets: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating strategy:', error)
    throw new Error('Failed to create strategy')
  }

  // Create corresponding leaderboard entry
  try {
    await createLeaderboardEntry(data.id, supabase)
  } catch (leaderboardError) {
    console.error('Error creating leaderboard entry for new strategy:', leaderboardError)
    // Don't throw here - strategy was created successfully
    console.warn('Strategy created but leaderboard entry failed')
  }

  // Add subscriber counts to new strategy data (should be 0 for new strategies)
  return {
    ...data,
    subscriber_count: 0,
    weekly_subscribers: 0,
    monthly_subscribers: 0,
    yearly_subscribers: 0,
  }
}
