import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

// iOS marketplace ranking algorithm - exact copy from iOS app
function calculateIOSMarketplaceScore(strategy: any): number {
  const roi = strategy.roi_percentage || 0
  const winRate = strategy.win_rate || 0
  const totalBets = strategy.total_bets || 0
  const subscriberCount = strategy.subscriber_count || 0
  
  // Get longevity date - use created_at if start_date not available
  const longevityDate = strategy.start_date ? new Date(strategy.start_date) : new Date(strategy.created_at)
  
  // Exact iOS marketplace weights from supabaseAnalytics.ts
  const weights = {
    roi: 0.4,        // 40% - Highest weight for profitability
    winRate: 0.1,    // 10% - Reduced from 25% (win rate not always indicative of good ROI)  
    betVolume: 0.25, // 25% - New component for amount of bets (increased strength)
    longevity: 0.2,  // 20% - Increased from 10% (long term record is crucial)
    subscribers: 0.05 // 5% - Market validation (kept same)
  }

  // 1. ROI Score (40% weight) - exact iOS logic
  let roiScore = 0
  if (roi < 0) {
    roiScore = 0 // Negative ROI is very bad - no score
  } else {
    roiScore = Math.min(100, ((roi + 20) * 2.5))
  }

  // 2. Win Rate Score (10% weight) - exact iOS logic
  const winRateScore = winRate * 100

  // 3. Bet Volume Score (25% weight) - exact iOS logic with ROI boost
  let betVolumeScore = 0
  
  // Base volume score
  if (totalBets >= 1000) betVolumeScore = 100 // 1000+ bets = excellent
  else if (totalBets >= 500) betVolumeScore = 85 // 500+ bets = very good
  else if (totalBets >= 250) betVolumeScore = 70 // 250+ bets = good
  else if (totalBets >= 100) betVolumeScore = 55 // 100+ bets = decent
  else if (totalBets >= 50) betVolumeScore = 40 // 50+ bets = some track record
  else if (totalBets >= 20) betVolumeScore = 25 // 20+ bets = minimal
  else betVolumeScore = totalBets * 1.25 // Linear scaling for < 20 bets
  
  // BOOST bet volume score if ROI is positive
  if (roi > 0) {
    const roiMultiplier = Math.min(1.5, 1 + (roi / 100)) // Up to 50% boost for high ROI
    betVolumeScore = Math.min(100, betVolumeScore * roiMultiplier)
  }

  // 4. Longevity Score (20% weight) - exact iOS logic using start_date or created_at
  let longevityScore = 0
  const now = new Date()
  const daysActive = (now.getTime() - longevityDate.getTime()) / (1000 * 60 * 60 * 24)

  if (daysActive >= 730) longevityScore = 100 // 2+ years = max score
  else if (daysActive >= 365) longevityScore = 90 // 1+ year = excellent
  else if (daysActive >= 180) longevityScore = 70 // 6+ months = good
  else if (daysActive >= 90) longevityScore = 50 // 3+ months = decent
  else if (daysActive >= 30) longevityScore = 30 // 1+ month = some credit
  else longevityScore = Math.max(5, daysActive * 1) // Reduced linear scaling for < 30 days

  // 5. Subscriber Score (5% weight) - exact iOS logic
  let subscriberScore = 0
  if (subscriberCount >= 1000) subscriberScore = 100 // 1000+ = max
  else if (subscriberCount >= 500) subscriberScore = 85 // 500+ = excellent
  else if (subscriberCount >= 100) subscriberScore = 70 // 100+ = good
  else if (subscriberCount >= 25) subscriberScore = 50 // 25+ = decent
  else if (subscriberCount >= 5) subscriberScore = 30 // 5+ = some validation
  else subscriberScore = subscriberCount * 6 // Linear scaling for < 5

  // Calculate weighted score
  let finalScore = (
    roiScore * weights.roi +
    winRateScore * weights.winRate +
    betVolumeScore * weights.betVolume +
    longevityScore * weights.longevity +
    subscriberScore * weights.subscribers
  )

  // Apply iOS penalties - SEVERE PENALTY for negative ROI - multiply final score by 0.1
  if (roi < 0) {
    finalScore = finalScore * 0.1 // 90% penalty for negative ROI
  }

  // Subtle penalty for low win rate + high ROI (likely from few lucky parlays/high odds bets)
  if (winRate < 0.3 && roi > 15) {
    // This pattern suggests unsustainable luck rather than skill
    // Apply graduated penalty based on how low the win rate is
    const winRatePenalty = Math.max(0.6, 1 - ((0.3 - winRate) * 2)) // 40% max penalty
    finalScore = finalScore * winRatePenalty
  }

  return Math.round(finalScore * 100) / 100 // Round to 2 decimal places
}

export async function GET() {
  try {
    console.log('Starting top-strategies API call...')
    
    // Create supabase client with service role for public data access
    const supabase = await createServiceRoleClient()
    
    // Try to fetch from strategy_leaderboard first
    let strategies = null
    let error = null
    let usingFallback = false

    try {
      // Get all eligible strategies to calculate iOS scores and then sort
      const { data: leaderboardStrategies, error: leaderboardError } = await supabase
        .from('strategy_leaderboard')
        .select(`
          id,
          strategy_id,
          user_id,
          username,
          strategy_name,
          roi_percentage,
          win_rate,
          winning_bets,
          losing_bets,
          push_bets,
          total_bets,
          verification_status,
          is_monetized,
          subscription_price_weekly,
          subscription_price_monthly,
          subscription_price_yearly,
          marketplace_rank_score,
          primary_sport,
          is_eligible,
          minimum_bets_met,
          created_at
        `)
        .eq('is_monetized', true)
        .gte('total_bets', 5)

      if (!leaderboardError && leaderboardStrategies && leaderboardStrategies.length > 0) {
        console.log(`Found ${leaderboardStrategies.length} strategies from strategy_leaderboard`)
        
        // Get subscriber counts from strategies table for iOS algorithm
        const strategyIds = leaderboardStrategies.map(s => s.strategy_id)
        const { data: strategiesData } = await supabase
          .from('strategies')
          .select('id, subscriber_count, start_date')
          .in('id', strategyIds)
        
        const strategiesMap = new Map(strategiesData?.map(s => [s.id, s]) || [])
        
        // Calculate iOS marketplace scores and sort
        const strategiesWithScores = leaderboardStrategies.map(strategy => {
          const strategyData = strategiesMap.get(strategy.strategy_id)
          const enhancedStrategy = {
            ...strategy,
            subscriber_count: strategyData?.subscriber_count || 0,
            start_date: strategyData?.start_date || strategy.created_at
          }
          
          const iosScore = calculateIOSMarketplaceScore(enhancedStrategy)
          console.log(`Strategy "${strategy.strategy_name}" iOS score: ${iosScore}`)
          
          return {
            ...enhancedStrategy,
            marketplace_rank_score: iosScore
          }
        })
        
        // Sort by iOS calculated score (highest first) and take top 10
        strategiesWithScores.sort((a, b) => (b.marketplace_rank_score || 0) - (a.marketplace_rank_score || 0))
        strategies = strategiesWithScores.slice(0, 10)
        
        console.log('Top 3 strategies after iOS ranking:')
        strategies.slice(0, 3).forEach((s, i) => {
          console.log(`${i + 1}. ${s.strategy_name} - Score: ${s.marketplace_rank_score}`)
        })
        
      } else {
        console.log('strategy_leaderboard empty or error, trying with relaxed filters...')
        
        // Try with relaxed filters - same as iOS fallback logic
        const { data: relaxedStrategies, error: relaxedError } = await supabase
          .from('strategy_leaderboard')
          .select(`
            id,
            strategy_id,
            user_id,
            username,
            strategy_name,
            roi_percentage,
            win_rate,
            winning_bets,
            losing_bets,
            push_bets,
            total_bets,
            verification_status,
            is_monetized,
            subscription_price_weekly,
            subscription_price_monthly,
            subscription_price_yearly,
            marketplace_rank_score,
            primary_sport,
            is_eligible,
            minimum_bets_met,
            created_at
          `)
          .gte('total_bets', 5)

        if (!relaxedError && relaxedStrategies && relaxedStrategies.length > 0) {
          console.log(`Found ${relaxedStrategies.length} strategies with relaxed filters`)
          // Apply same iOS scoring to relaxed results
          const strategyIds = relaxedStrategies.map(s => s.strategy_id)
          const { data: strategiesData } = await supabase
            .from('strategies')
            .select('id, subscriber_count, start_date')
            .in('id', strategyIds)
          
          const strategiesMap = new Map(strategiesData?.map(s => [s.id, s]) || [])
          
          const strategiesWithScores = relaxedStrategies.map(strategy => {
            const strategyData = strategiesMap.get(strategy.strategy_id)
            const enhancedStrategy = {
              ...strategy,
              subscriber_count: strategyData?.subscriber_count || 0,
              start_date: strategyData?.start_date || strategy.created_at
            }
            return {
              ...enhancedStrategy,
              marketplace_rank_score: calculateIOSMarketplaceScore(enhancedStrategy)
            }
          })
          
          strategiesWithScores.sort((a, b) => (b.marketplace_rank_score || 0) - (a.marketplace_rank_score || 0))
          strategies = strategiesWithScores.slice(0, 10)
        } else {
          console.log('strategy_leaderboard completely empty or error:', relaxedError?.message || leaderboardError?.message || 'no data')
          throw new Error('strategy_leaderboard not available')
        }
      }
    } catch (leaderboardFetchError) {
      console.log('strategy_leaderboard failed, trying strategies table fallback...')
      usingFallback = true
      
      // Fallback: Use strategies table with calculated metrics - join with profiles by user_id
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select(`
          id,
          name,
          user_id,
          sport,
          monetized,
          performance_roi,
          performance_win_rate,
          performance_total_bets,
          created_at
        `)
        .eq('monetized', true)
        .not('user_id', 'is', null)
        .limit(50) // Get more to filter and calculate
        
      if (strategiesError) {
        console.error('Error fetching from strategies table:', strategiesError)
        throw strategiesError
      }

      console.log(`Found ${strategiesData?.length || 0} strategies from strategies table`)

      // Get user profiles for the strategies
      const userIds = strategiesData?.map(s => s.user_id).filter(Boolean) || []
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', userIds)

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])

      // Use existing performance metrics or calculate from strategy_bets
      const strategiesWithMetrics = strategiesData?.map(strategy => {
        const profile = profilesMap.get(strategy.user_id)
        
        // First try to use cached performance metrics
        if (strategy.performance_total_bets && strategy.performance_total_bets > 0) {
          const strategyData = {
            id: strategy.id,
            strategy_id: strategy.id,
            user_id: strategy.user_id,
            username: profile?.username || 'unknown',
            strategy_name: strategy.name,
            roi_percentage: strategy.performance_roi || 0,
            win_rate: (strategy.performance_win_rate || 0) / 100, // Convert to decimal
            winning_bets: 0, // Would need to calculate from bets
            losing_bets: 0,  // Would need to calculate from bets
            push_bets: 0,    // Would need to calculate from bets
            total_bets: strategy.performance_total_bets,
            verification_status: 'verified',
            is_monetized: strategy.monetized,
            primary_sport: strategy.sport,
            created_at: strategy.created_at,
            profile_picture_url: profile?.profile_picture_url,
            marketplace_rank_score: 0 // Will calculate with iOS algorithm
          }
          
          // Calculate iOS marketplace score for cached metrics
          strategyData.marketplace_rank_score = calculateIOSMarketplaceScore(strategyData)
          
          return strategyData
        }
        
        // Fallback: Calculate from strategy_bets if no cached metrics
        const strategyBets = strategy.strategy_bets || []
        const bets = strategyBets.flatMap(sb => sb.bets ? [sb.bets] : [])
        const totalBets = bets.length
        
        if (totalBets === 0) return null
        
        let winningBets = 0
        let losingBets = 0
        let pushBets = 0
        let totalWagered = 0
        let totalProfit = 0
        
        bets.forEach(bet => {
          const wager = bet.stake || 0
          totalWagered += wager
          totalProfit += (bet.profit || 0)
          
          if (bet.status === 'won') {
            winningBets++
          } else if (bet.status === 'lost') {
            losingBets++
          } else if (bet.status === 'void' || bet.status === 'cancelled') {
            pushBets++
          }
        })
        
        const winRate = totalBets > 0 ? winningBets / totalBets : 0
        const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0
        
        const strategyData = {
          id: strategy.id,
          strategy_id: strategy.id,
          user_id: strategy.user_id,
          username: profile?.username || 'unknown',
          strategy_name: strategy.name,
          roi_percentage: roi,
          win_rate: winRate,
          winning_bets: winningBets,
          losing_bets: losingBets,
          push_bets: pushBets,
          total_bets: totalBets,
          verification_status: 'verified',
          is_monetized: strategy.monetized,
          primary_sport: strategy.sport,
          created_at: strategy.created_at,
          profile_picture_url: profile?.profile_picture_url,
          marketplace_rank_score: 0 // Will calculate with iOS algorithm
        }
        
        // Calculate iOS marketplace score for calculated metrics
        strategyData.marketplace_rank_score = calculateIOSMarketplaceScore(strategyData)
        
        return strategyData
      }).filter(s => s !== null && s.total_bets >= 1)
      .sort((a, b) => (b?.marketplace_rank_score || 0) - (a?.marketplace_rank_score || 0))
      .slice(0, 10)

      strategies = strategiesWithMetrics || []
      console.log(`Calculated metrics for ${strategies.length} strategies`)
    }

    if (!strategies || strategies.length === 0) {
      console.log('No strategies found from any source')
      return NextResponse.json({ 
        strategies: [], 
        message: 'No strategies found',
        usingFallback 
      }, { status: 200 })
    }

    // Get seller profile pictures for the final strategies
    try {
      const strategyUserIds = strategies.map(s => s.user_id).filter(Boolean)
      const { data: sellerProfiles } = await supabase
        .from('seller_profiles')
        .select('user_id, profile_img')
        .in('user_id', strategyUserIds)

      // Merge seller profile pictures into strategies
      const sellerProfilesMap = new Map(sellerProfiles?.map(sp => [sp.user_id, sp]) || [])
      
      strategies = strategies.map(strategy => ({
        ...strategy,
        seller_profiles: sellerProfilesMap.get(strategy.user_id) || null
      }))
      
      console.log(`Added seller profile pictures for ${sellerProfiles?.length || 0} strategies`)
    } catch (sellerProfileError) {
      console.log('Error fetching seller profiles:', sellerProfileError)
      // Continue without seller profiles
    }

    console.log(`Returning ${strategies.length} strategies (fallback: ${usingFallback})`)
    return NextResponse.json({ 
      strategies, 
      usingFallback,
      source: usingFallback ? 'strategies_table' : 'strategy_leaderboard'
    }, { 
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error in top-strategies API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}