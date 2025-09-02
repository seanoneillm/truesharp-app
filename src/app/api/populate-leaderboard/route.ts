import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import {
  calculateLeaderboardScore,
  isStrategyEligible,
  type StrategyLeaderboardData,
} from '@/lib/marketplace/ranking'

export async function POST() {
  try {
    const supabase = await createServerClient()

    // First, ensure the leaderboard_score column exists
    console.log("Adding leaderboard_score column if it doesn't exist...")

    try {
      const { error: columnError } = await supabase.rpc('exec_sql', {
        sql_text: `
          ALTER TABLE public.strategy_leaderboard 
          ADD COLUMN IF NOT EXISTS leaderboard_score numeric(8, 2) NULL;
          
          CREATE INDEX IF NOT EXISTS idx_strategy_leaderboard_score_desc 
          ON public.strategy_leaderboard USING btree (leaderboard_score DESC);
        `,
      })

      if (columnError) {
        console.log('Column creation result:', columnError)
      }
    } catch (err) {
      console.log('Could not execute SQL directly, continuing...')
    }

    // Get existing leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('strategy_leaderboard')
      .select('*')

    if (leaderboardError) {
      console.error('Error fetching leaderboard data:', leaderboardError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
    }

    if (!leaderboardData || leaderboardData.length === 0) {
      return NextResponse.json({ message: 'No leaderboard data found' }, { status: 200 })
    }

    console.log(`Found ${leaderboardData.length} strategies in leaderboard`)

    // Calculate leaderboard scores for each strategy
    let updatedCount = 0
    let errorCount = 0

    for (const strategy of leaderboardData) {
      try {
        // Calculate the leaderboard score using our algorithm
        const score = calculateLeaderboardScore({
          id: strategy.id,
          strategy_id: strategy.strategy_id,
          user_id: strategy.user_id,
          strategy_name: strategy.strategy_name,
          username: strategy.username,
          is_verified_seller: strategy.is_verified_seller || false,
          total_bets: strategy.total_bets || 0,
          winning_bets: strategy.winning_bets || 0,
          losing_bets: strategy.losing_bets || 0,
          push_bets: strategy.push_bets || 0,
          roi_percentage: parseFloat(strategy.roi_percentage?.toString() || '0'),
          win_rate: parseFloat(strategy.win_rate?.toString() || '0'),
          overall_rank: strategy.overall_rank,
          sport_rank: strategy.sport_rank,
          leaderboard_score: strategy.leaderboard_score,
          primary_sport: strategy.primary_sport,
          strategy_type: strategy.strategy_type,
          bet_type: strategy.bet_type,
          is_eligible: strategy.is_eligible || false,
          minimum_bets_met: strategy.minimum_bets_met || false,
          verification_status: strategy.verification_status || 'unverified',
          is_monetized: strategy.is_monetized || false,
          subscription_price_weekly: strategy.subscription_price_weekly,
          subscription_price_monthly: strategy.subscription_price_monthly,
          subscription_price_yearly: strategy.subscription_price_yearly,
          created_at: strategy.created_at || new Date().toISOString(),
          updated_at: strategy.updated_at || new Date().toISOString(),
          last_calculated_at: strategy.last_calculated_at || new Date().toISOString(),
        })

        // Check eligibility
        const eligible = isStrategyEligible({
          id: strategy.id,
          strategy_id: strategy.strategy_id,
          user_id: strategy.user_id,
          strategy_name: strategy.strategy_name,
          username: strategy.username,
          is_verified_seller: strategy.is_verified_seller || false,
          total_bets: strategy.total_bets || 0,
          winning_bets: strategy.winning_bets || 0,
          losing_bets: strategy.losing_bets || 0,
          push_bets: strategy.push_bets || 0,
          roi_percentage: parseFloat(strategy.roi_percentage?.toString() || '0'),
          win_rate: parseFloat(strategy.win_rate?.toString() || '0'),
          overall_rank: strategy.overall_rank,
          sport_rank: strategy.sport_rank,
          leaderboard_score: strategy.leaderboard_score,
          primary_sport: strategy.primary_sport,
          strategy_type: strategy.strategy_type,
          bet_type: strategy.bet_type,
          is_eligible: strategy.is_eligible || false,
          minimum_bets_met: strategy.minimum_bets_met || false,
          verification_status: strategy.verification_status || 'unverified',
          is_monetized: strategy.is_monetized || false,
          subscription_price_weekly: strategy.subscription_price_weekly,
          subscription_price_monthly: strategy.subscription_price_monthly,
          subscription_price_yearly: strategy.subscription_price_yearly,
          created_at: strategy.created_at || new Date().toISOString(),
          updated_at: strategy.updated_at || new Date().toISOString(),
          last_calculated_at: strategy.last_calculated_at || new Date().toISOString(),
        })

        // Update the strategy with the calculated score
        const { error: updateError } = await supabase
          .from('strategy_leaderboard')
          .update({
            leaderboard_score: score,
            is_eligible: eligible,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', strategy.id)

        if (updateError) {
          console.error(`Error updating strategy ${strategy.strategy_name}:`, updateError)
          errorCount++
        } else {
          updatedCount++
          if (updatedCount % 10 === 0) {
            console.log(`Updated ${updatedCount} strategies...`)
          }
        }
      } catch (error) {
        console.error(`Error processing strategy ${strategy.strategy_name}:`, error)
        errorCount++
      }
    }

    // Now update the overall ranks based on leaderboard scores
    const { data: scoredStrategies, error: fetchScoredError } = await supabase
      .from('strategy_leaderboard')
      .select('id, leaderboard_score, is_eligible')
      .not('leaderboard_score', 'is', null)
      .order('leaderboard_score', { ascending: false })

    if (!fetchScoredError && scoredStrategies) {
      const eligibleStrategies = scoredStrategies.filter(s => s.is_eligible)

      for (let i = 0; i < eligibleStrategies.length; i++) {
        const { error: rankError } = await supabase
          .from('strategy_leaderboard')
          .update({ overall_rank: i + 1 })
          .eq('id', eligibleStrategies[i].id)

        if (rankError) {
          console.error(`Error updating rank for strategy ${eligibleStrategies[i].id}:`, rankError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Leaderboard scores calculated successfully`,
      stats: {
        totalStrategies: leaderboardData.length,
        updatedStrategies: updatedCount,
        errorCount: errorCount,
        eligibleStrategies: scoredStrategies?.filter(s => s.is_eligible).length || 0,
      },
    })
  } catch (error) {
    console.error('Leaderboard population error:', error)
    return NextResponse.json(
      {
        error: 'Failed to populate leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
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
      verifiedEntries:
        leaderboardStats?.filter(s => s.verification_status === 'verified').length || 0,
      lastCalculated: leaderboardStats?.[0]?.last_calculated_at || null,
    }

    return NextResponse.json({
      success: true,
      stats,
      topStrategies: leaderboardStats?.filter(s => s.is_eligible).slice(0, 10) || [],
    })
  } catch (error) {
    console.error('Leaderboard status error:', error)
    return NextResponse.json({ error: 'Failed to get leaderboard status' }, { status: 500 })
  }
}
