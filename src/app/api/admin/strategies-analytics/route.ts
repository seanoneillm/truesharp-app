import { createServiceRoleClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface StrategyAnalytics {
  // Overview metrics
  totalStrategies: number
  activeStrategies: number
  inactiveStrategies: number
  monetizedStrategies: number
  verifiedStrategies: number
  
  // Performance metrics
  averageROI: number
  averageWinRate: number
  averageTotalBets: number
  totalSubscribers: number
  
  // Top creators
  topCreators: Array<{
    userId: string
    username: string
    strategyCount: number
    averageROI: number
    averageWinRate: number
    totalBets: number
    subscribers: number
    isVerified: boolean
  }>
  
  // Leaderboard data
  topPerformingStrategies: Array<{
    id: string
    strategyId: string
    strategyName: string
    username: string
    isVerifiedSeller: boolean
    totalBets: number
    winningBets: number
    losingBets: number
    roiPercentage: number
    winRate: number
    overallRank: number
    primarySport: string
    strategyType: string
    betType: string
    isMonetized: boolean
    subscriptionPriceMonthly: number
    verificationStatus: string
    marketplaceRankScore: number
  }>
  
  // Strategy distribution
  sportDistribution: Array<{
    sport: string
    count: number
    averageROI: number
    averageWinRate: number
  }>
  
  betTypeDistribution: Array<{
    betType: string
    count: number
    averageROI: number
    averageWinRate: number
  }>
  
  verificationDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  
  // Time series data
  strategiesOverTime: Array<{
    date: string
    dateLabel: string
    totalStrategies: number
    activeStrategies: number
    monetizedStrategies: number
  }>
  
  performanceOverTime: Array<{
    date: string
    dateLabel: string
    averageROI: number
    averageWinRate: number
    totalBets: number
  }>
  
  // Creator analytics
  creatorPerformance: Array<{
    username: string
    strategyCount: number
    totalROI: number
    averageWinRate: number
    totalBets: number
  }>
  
  // Monetization metrics
  monetizationMetrics: {
    averageSubscriptionPrice: number
    conversionRate: number
    topEarningStrategies: Array<{
      strategyName: string
      username: string
      monthlyPrice: number
      subscriberCount: number
    }>
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const userClient = await createServerSupabaseClient(request)
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    const adminUserIds = [
      '0e16e4f5-f206-4e62-8282-4188ff8af48a',
      '28991397-dae7-42e8-a822-0dffc6ff49b7', 
      'dfd44121-8e88-4c83-ad95-9fb8a4224908'
    ]
    
    if (!adminUserIds.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    console.log(`🔑 Admin user ${user.id} accessing strategies analytics`)
    
    const supabase = await createServiceRoleClient()
    
    // Fetch strategies data
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(`
        id,
        user_id,
        name,
        sport,
        league,
        bet_type,
        monetized,
        subscriber_count,
        performance_roi,
        performance_win_rate,
        performance_total_bets,
        leaderboard_score,
        pricing_monthly,
        pricing_weekly,
        pricing_yearly,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
    
    if (strategiesError) {
      throw new Error(`Error fetching strategies: ${strategiesError.message}`)
    }

    // Fetch strategy leaderboard data
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('strategy_leaderboard')
      .select(`
        id,
        strategy_id,
        user_id,
        strategy_name,
        username,
        is_verified_seller,
        total_bets,
        winning_bets,
        losing_bets,
        push_bets,
        roi_percentage,
        win_rate,
        overall_rank,
        sport_rank,
        primary_sport,
        strategy_type,
        bet_type,
        is_eligible,
        minimum_bets_met,
        verification_status,
        is_monetized,
        subscription_price_monthly,
        subscription_price_weekly,
        subscription_price_yearly,
        marketplace_rank_score,
        created_at,
        updated_at
      `)
      .order('marketplace_rank_score', { ascending: false })
    
    if (leaderboardError) {
      throw new Error(`Error fetching leaderboard: ${leaderboardError.message}`)
    }

    const allStrategies = strategies || []
    const allLeaderboard = leaderboard || []

    console.log(`📊 Processing ${allStrategies.length} strategies and ${allLeaderboard.length} leaderboard entries`)

    // Basic metrics
    const totalStrategies = allStrategies.length
    const activeStrategies = allStrategies.filter(s => s.performance_total_bets > 0).length
    const inactiveStrategies = totalStrategies - activeStrategies
    const monetizedStrategies = allStrategies.filter(s => s.monetized).length
    const verifiedStrategies = allLeaderboard.filter(l => l.verification_status === 'verified').length

    // Performance metrics
    const validROIs = allLeaderboard.filter(l => l.roi_percentage !== null && l.total_bets > 0)
    const averageROI = validROIs.length > 0 ? 
      validROIs.reduce((sum, l) => sum + Number(l.roi_percentage), 0) / validROIs.length : 0
    
    const validWinRates = allLeaderboard.filter(l => l.win_rate !== null && l.total_bets > 0)
    const averageWinRate = validWinRates.length > 0 ? 
      validWinRates.reduce((sum, l) => sum + Number(l.win_rate), 0) / validWinRates.length : 0
    
    const averageTotalBets = allLeaderboard.length > 0 ? 
      allLeaderboard.reduce((sum, l) => sum + Number(l.total_bets), 0) / allLeaderboard.length : 0
    
    const totalSubscribers = allStrategies.reduce((sum, s) => sum + (s.subscriber_count || 0), 0)

    // Top creators analysis
    const creatorMap = new Map<string, {
      userId: string
      username: string
      strategyCount: number
      totalROI: number
      totalWinRate: number
      totalBets: number
      subscribers: number
      isVerified: boolean
    }>()

    allLeaderboard.forEach(l => {
      const existing = creatorMap.get(l.user_id) || {
        userId: l.user_id,
        username: l.username,
        strategyCount: 0,
        totalROI: 0,
        totalWinRate: 0,
        totalBets: 0,
        subscribers: 0,
        isVerified: l.is_verified_seller || false
      }
      
      existing.strategyCount += 1
      existing.totalROI += Number(l.roi_percentage) || 0
      existing.totalWinRate += Number(l.win_rate) || 0
      existing.totalBets += Number(l.total_bets) || 0
      
      // Get subscribers from strategies table
      const userStrategies = allStrategies.filter(s => s.user_id === l.user_id)
      existing.subscribers = userStrategies.reduce((sum, s) => sum + (s.subscriber_count || 0), 0)
      
      creatorMap.set(l.user_id, existing)
    })

    const topCreators = Array.from(creatorMap.values())
      .map(creator => ({
        ...creator,
        averageROI: creator.strategyCount > 0 ? creator.totalROI / creator.strategyCount : 0,
        averageWinRate: creator.strategyCount > 0 ? creator.totalWinRate / creator.strategyCount : 0
      }))
      .sort((a, b) => b.averageROI - a.averageROI)
      .slice(0, 10)

    // Top performing strategies (first 20 from leaderboard)
    const topPerformingStrategies = allLeaderboard.slice(0, 20).map(l => ({
      id: l.id,
      strategyId: l.strategy_id,
      strategyName: l.strategy_name,
      username: l.username,
      isVerifiedSeller: l.is_verified_seller || false,
      totalBets: Number(l.total_bets),
      winningBets: Number(l.winning_bets),
      losingBets: Number(l.losing_bets),
      roiPercentage: Number(l.roi_percentage) || 0,
      winRate: Number(l.win_rate) || 0,
      overallRank: Number(l.overall_rank) || 0,
      primarySport: l.primary_sport || 'Unknown',
      strategyType: l.strategy_type || 'Unknown',
      betType: l.bet_type || 'Unknown',
      isMonetized: l.is_monetized || false,
      subscriptionPriceMonthly: Number(l.subscription_price_monthly) || 0,
      verificationStatus: l.verification_status || 'unverified',
      marketplaceRankScore: Number(l.marketplace_rank_score) || 0
    }))

    // Sport distribution
    const sportGroups = allLeaderboard.reduce((acc, l) => {
      const sport = l.primary_sport || 'Unknown'
      if (!acc[sport]) {
        acc[sport] = { count: 0, totalROI: 0, totalWinRate: 0, validEntries: 0 }
      }
      acc[sport].count += 1
      if (l.roi_percentage !== null && l.total_bets > 0) {
        acc[sport].totalROI += Number(l.roi_percentage)
        acc[sport].totalWinRate += Number(l.win_rate)
        acc[sport].validEntries += 1
      }
      return acc
    }, {} as Record<string, any>)

    const sportDistribution = Object.entries(sportGroups).map(([sport, data]) => ({
      sport,
      count: data.count,
      averageROI: data.validEntries > 0 ? data.totalROI / data.validEntries : 0,
      averageWinRate: data.validEntries > 0 ? data.totalWinRate / data.validEntries : 0
    })).sort((a, b) => b.count - a.count)

    // Bet type distribution
    const betTypeGroups = allLeaderboard.reduce((acc, l) => {
      const betType = l.bet_type || 'Unknown'
      if (!acc[betType]) {
        acc[betType] = { count: 0, totalROI: 0, totalWinRate: 0, validEntries: 0 }
      }
      acc[betType].count += 1
      if (l.roi_percentage !== null && l.total_bets > 0) {
        acc[betType].totalROI += Number(l.roi_percentage)
        acc[betType].totalWinRate += Number(l.win_rate)
        acc[betType].validEntries += 1
      }
      return acc
    }, {} as Record<string, any>)

    const betTypeDistribution = Object.entries(betTypeGroups).map(([betType, data]) => ({
      betType,
      count: data.count,
      averageROI: data.validEntries > 0 ? data.totalROI / data.validEntries : 0,
      averageWinRate: data.validEntries > 0 ? data.totalWinRate / data.validEntries : 0
    })).sort((a, b) => b.count - a.count)

    // Verification status distribution
    const verificationGroups = allLeaderboard.reduce((acc, l) => {
      const status = l.verification_status || 'unverified'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const verificationDistribution = Object.entries(verificationGroups).map(([status, count]) => ({
      status,
      count,
      percentage: totalStrategies > 0 ? (count / totalStrategies) * 100 : 0
    }))

    // Time series data (last 30 days)
    const now = new Date()
    const strategiesOverTime = []
    const performanceOverTime = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Count strategies created up to this date
      const strategiesUpToDate = allStrategies.filter(s => {
        const createdAt = new Date(s.created_at || '')
        return createdAt <= date
      })

      const activeUpToDate = strategiesUpToDate.filter(s => s.performance_total_bets > 0)
      const monetizedUpToDate = strategiesUpToDate.filter(s => s.monetized)

      strategiesOverTime.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalStrategies: strategiesUpToDate.length,
        activeStrategies: activeUpToDate.length,
        monetizedStrategies: monetizedUpToDate.length
      })

      // Performance metrics for this date
      const leaderboardUpToDate = allLeaderboard.filter(l => {
        const createdAt = new Date(l.created_at || '')
        return createdAt <= date && l.total_bets > 0
      })

      const avgROI = leaderboardUpToDate.length > 0 ? 
        leaderboardUpToDate.reduce((sum, l) => sum + Number(l.roi_percentage), 0) / leaderboardUpToDate.length : 0
      const avgWinRate = leaderboardUpToDate.length > 0 ? 
        leaderboardUpToDate.reduce((sum, l) => sum + Number(l.win_rate), 0) / leaderboardUpToDate.length : 0
      const totalBets = leaderboardUpToDate.reduce((sum, l) => sum + Number(l.total_bets), 0)

      performanceOverTime.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        averageROI: Math.round(avgROI * 100) / 100,
        averageWinRate: Math.round(avgWinRate * 10000) / 100, // Convert to percentage
        totalBets
      })
    }

    // Creator performance for charts
    const creatorPerformance = Array.from(creatorMap.values())
      .map(creator => ({
        username: creator.username,
        strategyCount: creator.strategyCount,
        totalROI: creator.totalROI,
        averageWinRate: creator.strategyCount > 0 ? (creator.totalWinRate / creator.strategyCount) * 100 : 0,
        totalBets: creator.totalBets
      }))
      .sort((a, b) => b.strategyCount - a.strategyCount)
      .slice(0, 15)

    // Monetization metrics (pricing analytics only)
    const monetizedLeaderboard = allLeaderboard.filter(l => l.is_monetized && l.subscription_price_monthly)
    
    const averageSubscriptionPrice = monetizedLeaderboard.length > 0 ? 
      monetizedLeaderboard.reduce((sum, l) => sum + Number(l.subscription_price_monthly), 0) / monetizedLeaderboard.length : 0

    const conversionRate = totalStrategies > 0 ? (monetizedStrategies / totalStrategies) * 100 : 0

    const topEarningStrategies = monetizedLeaderboard
      .map(l => {
        const strategy = allStrategies.find(s => s.id === l.strategy_id)
        const subscribers = strategy?.subscriber_count || 0
        const monthlyPrice = Number(l.subscription_price_monthly) || 0
        return {
          strategyName: l.strategy_name,
          username: l.username,
          monthlyPrice,
          subscriberCount: subscribers
        }
      })
      .sort((a, b) => b.monthlyPrice - a.monthlyPrice) // Sort by price instead of revenue
      .slice(0, 10)

    const analytics: StrategyAnalytics = {
      // Overview metrics
      totalStrategies,
      activeStrategies,
      inactiveStrategies,
      monetizedStrategies,
      verifiedStrategies,
      
      // Performance metrics
      averageROI: Math.round(averageROI * 100) / 100,
      averageWinRate: Math.round(averageWinRate * 10000) / 100, // Convert to percentage
      averageTotalBets: Math.round(averageTotalBets),
      totalSubscribers,
      
      // Top creators
      topCreators,
      
      // Leaderboard data
      topPerformingStrategies,
      
      // Distributions
      sportDistribution,
      betTypeDistribution,
      verificationDistribution,
      
      // Time series
      strategiesOverTime,
      performanceOverTime,
      
      // Creator analytics
      creatorPerformance,
      
      // Monetization
      monetizationMetrics: {
        averageSubscriptionPrice: Math.round(averageSubscriptionPrice * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topEarningStrategies
      }
    }

    console.log(`✅ Strategies analytics calculated for admin ${user.id}`)
    console.log(`📈 Key metrics: ${totalStrategies} strategies, ${activeStrategies} active, ${monetizedStrategies} monetized`)

    return NextResponse.json({ 
      success: true, 
      data: analytics,
      metadata: {
        generatedAt: now.toISOString(),
        totalStrategiesProcessed: allStrategies.length,
        totalLeaderboardEntriesProcessed: allLeaderboard.length,
        adminUserId: user.id
      }
    })

  } catch (error) {
    console.error('❌ Strategies Analytics API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}