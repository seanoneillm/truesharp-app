import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { rankStrategies, isStrategyEligible, type StrategyLeaderboardData } from '@/lib/marketplace/ranking'

export async function POST() {
  try {
    const supabase = createClient()
    
    // First, get all strategies with their associated user and bet data
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        user_id,
        name,
        description,
        primary_sport,
        strategy_type,
        bet_type,
        is_monetized,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        subscriber_count,
        created_at,
        updated_at,
        profiles!strategies_user_id_fkey (
          username,
          display_name,
          is_verified_seller
        )
      `)
      .eq('is_active', true)

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 })
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json({ message: 'No strategies found' }, { status: 200 })
    }

    const leaderboardData: StrategyLeaderboardData[] = []

    // Process each strategy to calculate performance metrics
    for (const strategy of strategies) {
      // Get bet statistics for this strategy
      const { data: betStats, error: betError } = await supabase
        .from('user_bets')
        .select('outcome, odds, stake, potential_payout')
        .eq('strategy_id', strategy.id)
        .not('outcome', 'is', null) // Only settled bets

      if (betError) {
        console.warn(`Error fetching bets for strategy ${strategy.id}:`, betError)
        continue
      }

      // Calculate performance metrics
      const totalBets = betStats?.length || 0
      const winningBets = betStats?.filter(bet => bet.outcome === 'win').length || 0
      const losingBets = betStats?.filter(bet => bet.outcome === 'loss').length || 0
      const pushBets = betStats?.filter(bet => bet.outcome === 'push').length || 0
      
      // Ensure bet counts add up correctly (fix constraint violation)
      const calculatedTotal = winningBets + losingBets + pushBets
      const adjustedTotal = Math.max(totalBets, calculatedTotal)
      const adjustedLosing = adjustedTotal - winningBets - pushBets
      
      const winRate = adjustedTotal > 0 ? winningBets / adjustedTotal : 0
      
      // Calculate ROI
      const totalStaked = betStats?.reduce((sum, bet) => sum + (bet.stake || 0), 0) || 0
      const totalPayout = betStats?.reduce((sum, bet) => {
        if (bet.outcome === 'win') return sum + (bet.potential_payout || 0)
        if (bet.outcome === 'push') return sum + (bet.stake || 0)
        return sum
      }, 0) || 0
      
      const roiPercentage = totalStaked > 0 ? ((totalPayout - totalStaked) / totalStaked) * 100 : 0

      // Get the most recent bet date (currently unused but may be needed later)
      // const { data: lastBet } = await supabase
      //   .from('user_bets')
      //   .select('created_at')
      //   .eq('strategy_id', strategy.id)
      //   .order('created_at', { ascending: false })
      //   .limit(1)

      // Prepare leaderboard entry
      const leaderboardEntry: StrategyLeaderboardData = {
        id: crypto.randomUUID(),
        strategy_id: strategy.id,
        user_id: strategy.user_id,
        strategy_name: strategy.name,
        username: strategy.profiles?.username || 'unknown',
        is_verified_seller: strategy.profiles?.is_verified_seller || false,
        total_bets: adjustedTotal,
        winning_bets: winningBets,
        losing_bets: adjustedLosing,
        push_bets: pushBets,
        roi_percentage: roiPercentage,
        win_rate: winRate,
        primary_sport: strategy.primary_sport,
        strategy_type: strategy.strategy_type,
        bet_type: strategy.bet_type,
        is_eligible: false, // Will be calculated below
        minimum_bets_met: adjustedTotal >= 100,
        verification_status: strategy.profiles?.is_verified_seller ? 'verified' : 'unverified',
        is_monetized: strategy.is_monetized,
        subscription_price_weekly: strategy.pricing_weekly,
        subscription_price_monthly: strategy.pricing_monthly,
        subscription_price_yearly: strategy.pricing_yearly,
        created_at: strategy.created_at,
        updated_at: strategy.updated_at,
        last_calculated_at: new Date().toISOString()
      }

      // Check eligibility
      leaderboardEntry.is_eligible = isStrategyEligible(leaderboardEntry)
      
      leaderboardData.push(leaderboardEntry)
    }

    // Rank all strategies
    const rankedStrategies = rankStrategies(leaderboardData)

    // Add sport-specific rankings
    const sportsRankings = new Map<string, number>()
    
    for (const sport of ['NBA', 'NFL', 'MLB', 'NHL', 'Multi-Sport']) {
      const sportStrategies = rankedStrategies.filter(s => 
        s.primary_sport === sport && s.is_eligible
      )
      
      sportStrategies.forEach((strategy, index) => {
        sportsRankings.set(`${strategy.strategy_id}_${sport}`, index + 1)
      })
    }

    // Clear existing leaderboard data
    const { error: deleteError } = await supabase
      .from('strategy_leaderboard')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.warn('Error clearing leaderboard:', deleteError)
    }

    // Insert new leaderboard data in batches
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < rankedStrategies.length; i += batchSize) {
      const batch = rankedStrategies.slice(i, i + batchSize).map(strategy => ({
        id: strategy.id,
        strategy_id: strategy.strategy_id,
        user_id: strategy.user_id,
        strategy_name: strategy.strategy_name,
        username: strategy.username,
        is_verified_seller: strategy.is_verified_seller,
        total_bets: strategy.total_bets,
        winning_bets: strategy.winning_bets,
        losing_bets: strategy.losing_bets,
        push_bets: strategy.push_bets,
        roi_percentage: strategy.roi_percentage,
        win_rate: strategy.win_rate,
        overall_rank: strategy.overall_rank,
        sport_rank: sportsRankings.get(`${strategy.strategy_id}_${strategy.primary_sport}`) || null,
        primary_sport: strategy.primary_sport,
        strategy_type: strategy.strategy_type,
        bet_type: strategy.bet_type,
        is_eligible: strategy.is_eligible,
        minimum_bets_met: strategy.minimum_bets_met,
        verification_status: strategy.verification_status,
        is_monetized: strategy.is_monetized,
        subscription_price_weekly: strategy.subscription_price_weekly,
        subscription_price_monthly: strategy.subscription_price_monthly,
        subscription_price_yearly: strategy.subscription_price_yearly,
        created_at: strategy.created_at,
        updated_at: strategy.updated_at,
        last_calculated_at: strategy.last_calculated_at
      }))

      const { error: insertError } = await supabase
        .from('strategy_leaderboard')
        .insert(batch)

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
        continue
      }

      insertedCount += batch.length
    }

    return NextResponse.json({
      success: true,
      message: `Leaderboard populated successfully`,
      stats: {
        totalStrategies: strategies.length,
        eligibleStrategies: rankedStrategies.filter(s => s.is_eligible).length,
        insertedEntries: insertedCount
      }
    })

  } catch (error) {
    console.error('Leaderboard population error:', error)
    return NextResponse.json({ 
      error: 'Failed to populate leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current leaderboard status
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: leaderboardStats, error } = await supabase
      .from('strategy_leaderboard')
      .select('id, is_eligible, verification_status, overall_rank, last_calculated_at')
      .order('overall_rank', { ascending: true, nullsLast: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = {
      totalEntries: leaderboardStats?.length || 0,
      eligibleEntries: leaderboardStats?.filter(s => s.is_eligible).length || 0,
      verifiedEntries: leaderboardStats?.filter(s => s.verification_status === 'verified').length || 0,
      lastCalculated: leaderboardStats?.[0]?.last_calculated_at || null
    }

    return NextResponse.json({
      success: true,
      stats,
      topStrategies: leaderboardStats?.filter(s => s.is_eligible).slice(0, 10) || []
    })

  } catch (error) {
    console.error('Leaderboard status error:', error)
    return NextResponse.json({ error: 'Failed to get leaderboard status' }, { status: 500 })
  }
}
