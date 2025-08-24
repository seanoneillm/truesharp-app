'use client'

import { AnalyticsHeader } from '@/components/analytics/analytics-header'
import { AnalyticsTab as AnalyticsTabComponent } from '@/components/analytics/analytics-tab'
import { BetsTab } from '@/components/analytics/bets-tab'
import { FilterOptions, FilterSystem } from '@/components/analytics/filter-system'
import { OverviewTab } from '@/components/analytics/overview-tab'
import { ProUpgradePrompt } from '@/components/analytics/pro-upgrade-prompt'
import { StrategiesTab } from '@/components/analytics/strategies-tab'
import { AnalyticsTab, TabNavigation } from '@/components/analytics/tab-navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics, type Bet } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCallback, useEffect, useState } from 'react'

// Helper functions for enhanced analytics
function calculateCurrentStreak(bets: Bet[]): { type: 'win' | 'loss' | 'none', count: number } {
  if (!bets.length) return { type: 'none', count: 0 }
  
  const sortedBets = [...bets]
    .filter(bet => bet.status === 'won' || bet.status === 'lost')
    .sort((a, b) => new Date(b.placed_at || 0).getTime() - new Date(a.placed_at || 0).getTime())
  
  if (!sortedBets.length) return { type: 'none', count: 0 }
  
  const currentResult = sortedBets[0]?.status === 'won' ? 'win' : 'loss'
  let count = 1
  
  for (let i = 1; i < sortedBets.length; i++) {
    const betResult = sortedBets[i]?.status === 'won' ? 'win' : 'loss'
    if (betResult === currentResult) {
      count++
    } else {
      break
    }
  }
  
  return { type: currentResult, count }
}

function calculateTrends(monthlyData: { roi: number }[]): { trend: 'up' | 'down' | 'flat', percentage: number } {
  if (monthlyData.length < 2) return { trend: 'flat', percentage: 0 }
  
  const recent = monthlyData.slice(-3)
  if (recent.length < 2) return { trend: 'flat', percentage: 0 }
  
  const first = recent[0]?.roi || 0
  const last = recent[recent.length - 1]?.roi || 0
  const change = last - first
  
  if (Math.abs(change) < 1) return { trend: 'flat', percentage: 0 }
  return { 
    trend: change > 0 ? 'up' : 'down', 
    percentage: Math.abs(change) 
  }
}

// Using interfaces from the analytics hook

interface UserProfile {
  username: string
  isPro: boolean
}

// Using Bet interface from the analytics hook

interface Strategy {
  id: string
  name: string
  description: string
  filter_config: FilterOptions
  monetized: boolean
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  subscriber_count: number
  performance_roi: number
  performance_win_rate: number
  performance_total_bets: number
  created_at: string
  updated_at: string
  // Additional leaderboard fields
  winning_bets: number
  losing_bets: number
  push_bets: number
  primary_sport?: string
  bet_type?: string
  verification_status?: string
  is_verified_seller?: boolean
  overall_rank?: number
  sport_rank?: number
  is_eligible?: boolean
  minimum_bets_met?: boolean
}

const defaultFilters: FilterOptions = {
  // Core database filters - now arrays for multi-select
  betTypes: ['All'],
  leagues: ['All'],
  statuses: ['All'],
  isParlays: ['All'],
  sides: ['All'],
  oddsTypes: ['All'],
  
  // Time and sportsbook filters
  timeRange: 'All time',
  sportsbooks: [],
  
  // Legacy filters (keep for backward compatibility)
  sports: []
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('strategies')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreBets, setHasMoreBets] = useState(true)
  const [loadingMoreBets, setLoadingMoreBets] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [strategiesLoading, setStrategiesLoading] = useState(false)
  
  // Get userId from URL parameters
  const [urlUserId, setUrlUserId] = useState<string | null>(null)
  
  useEffect(() => {
    // Extract userId from URL parameters
    const searchParams = new URLSearchParams(window.location.search)
    const userIdParam = searchParams.get('userId')
    if (userIdParam) {
      setUrlUserId(userIdParam)
      console.log('Found userId in URL:', userIdParam.substring(0, 8) + '...')
    }
  }, [])
  
  // Local filter state to prevent resets
  const [localFilters, setLocalFilters] = useState<FilterOptions>(defaultFilters)

  // Use the analytics hook
  const { 
    analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError, 
    filters, 
    updateFilters, 
    totalBets 
  } = useAnalytics(user, userProfile?.isPro || false)

  // TEMPORARY: Development mode to show analytics without auth - FORCED UPDATE
  const isDev = process.env.NODE_ENV === 'development'
  const DEV_USER_ID = '28991397-dae7-42e8-a822-0dffc6ff49b7'

  useEffect(() => {
    console.log('🔥 Analytics useEffect triggered!')
    console.log('📊 Analytics useEffect - authLoading:', authLoading, 'user:', user?.id || 'no user', 'isDev:', isDev, 'urlUserId:', urlUserId?.substring(0, 8) + '...' || 'none')
    
    // In development mode, skip auth check
    if (isDev) {
      console.log('🚀 Development mode: set default profile')
      setUserProfile({
        username: 'DevUser',
        isPro: true // Force Pro status in development for testing
      })
      
      // Also fetch strategies in development mode using URL userId if available
      if (urlUserId) {
        console.log('🎯 Development mode: fetching strategies for URL userId:', urlUserId)
        fetchStrategies(urlUserId)
      } else {
        console.log('❌ No urlUserId available for fetching strategies')
        // Try fetchStrategies anyway with the DEV_USER_ID
        fetchStrategies('28991397-dae7-42e8-a822-0dffc6ff49b7')
      }
      return
    }
    
    // Production mode: wait for auth to complete
    if (!authLoading && user) {
      console.log('User authenticated, fetching profile for:', user.id)
      fetchUserProfile(user.id)
      fetchStrategies(user.id)
    } else if (!authLoading && !user) {
      console.log('No user found after auth loading complete')
    }
  }, [user, authLoading, isDev, urlUserId])

  const fetchStrategies = async (userId?: string) => {
    console.log('🎯 fetchStrategies called with userId:', userId?.substring(0, 8) + '...')
    setStrategiesLoading(true)
    try {
      // Use provided userId or fallback to authenticated user
      const effectiveUserId = userId || user?.id
      const url = effectiveUserId ? `/api/strategies?userId=${effectiveUserId}` : '/api/strategies'
      console.log('Fetching strategies with URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Strategies fetched successfully:', result.strategies?.length || 0)
        console.log('📋 Strategy data:', result.strategies)
        setStrategies(result.strategies || [])
      } else {
        console.error('Failed to fetch strategies:', response.status)
        setStrategies([])
      }
    } catch (error) {
      console.error('Error fetching strategies:', error)
      setStrategies([])
    } finally {
      setStrategiesLoading(false)
    }
  }

  const fetchUserProfile = async (userId?: string) => {
    const effectiveUserId = userId || user?.id
    console.log('fetchUserProfile called with:', effectiveUserId)
    if (!effectiveUserId) return
    
    try {
      console.log('Attempting to fetch profile from /api/profile (relative URL)')
      const response = await fetch('/api/profile')
      console.log('Profile API response:', response.status, response.ok, 'URL:', response.url)
      if (response.ok) {
        const result = await response.json()
        const profile = result.data
        const fallbackProfile = {
          username: profile.username || (user?.email?.split('@')[0]) || effectiveUserId.split('-')[0] || 'User',
          isPro: profile.pro === 'yes'
        }
        console.log('Setting profile from API:', fallbackProfile)
        setUserProfile(fallbackProfile)
      } else {
        console.log('Profile API failed with status:', response.status, '- using fallback profile')
        // Set default values if profile fetch fails (including 401 auth errors)
        const fallbackProfile = {
          username: (user?.email?.split('@')[0]) || effectiveUserId.split('-')[0] || 'TestUser',
          isPro: false
        }
        console.log('Setting fallback profile:', fallbackProfile)
        setUserProfile(fallbackProfile)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      // Set default values if profile fetch fails
      const fallbackProfile = {
        username: (user?.email?.split('@')[0]) || effectiveUserId.split('-')[0] || 'TestUser',
        isPro: false
      }
      console.log('Setting error fallback profile:', fallbackProfile)
      setUserProfile(fallbackProfile)
    }
  }

  const loadMoreBets = async () => {
    if (loadingMoreBets || !hasMoreBets) return
    
    setLoadingMoreBets(true)
    
    try {
      // Simulate loading more bets by generating additional data
      const nextPage = currentPage + 1
      const additionalBets = Array.from({ length: 10 }, (_, i) => {
        const index = (nextPage - 1) * 10 + i
        const teamNames = [
          ['Lakers', 'Warriors'], ['Cowboys', 'Giants'], ['Yankees', 'Red Sox'], 
          ['Chiefs', 'Broncos'], ['Celtics', 'Heat'], ['Rangers', 'Devils'],
          ['Dodgers', 'Padres'], ['Bills', 'Patriots'], ['Clippers', 'Suns'],
          ['Astros', 'Angels'], ['49ers', 'Seahawks'], ['Knicks', 'Nets'],
          ['Rams', 'Cardinals'], ['Packers', 'Bears'], ['Mets', 'Phillies']
        ]
        
        const betTypes = ['Spread', 'Moneyline', 'Total Over', 'Total Under', 'Player Props']
        const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET']
        const sports = ['NFL', 'NBA', 'MLB', 'NHL']
        
        const teams = teamNames[index % teamNames.length] || ['Team A', 'Team B']
        const betType = betTypes[index % betTypes.length] || 'Moneyline'
        const sportsbook = sportsbooks[index % sportsbooks.length] || 'DraftKings'
        const sport = sports[index % sports.length] || 'NFL'
        
        const stakeAmount = 50 + Math.random() * 200
        const oddsValue = Math.random() > 0.5 ? Math.round(100 + Math.random() * 300) : Math.round(-110 - Math.random() * 200)
        const isWin = Math.random() > 0.4 // 60% win rate
        
        let betDescription = ''
        let lineValue = 0
        
        switch (betType) {
          case 'Spread':
            lineValue = (Math.random() - 0.5) * 14
            betDescription = `${teams[0]} ${lineValue > 0 ? '+' : ''}${lineValue.toFixed(1)}`
            break
          case 'Moneyline':
            betDescription = `${teams[0]} to Win`
            break
          case 'Total Over':
            lineValue = 45 + Math.random() * 10
            betDescription = `Over ${lineValue.toFixed(1)} Total Points`
            break
          case 'Total Under':
            lineValue = 45 + Math.random() * 10
            betDescription = `Under ${lineValue.toFixed(1)} Total Points`
            break
          case 'Player Props':
            const playerNames = ['LeBron James', 'Tom Brady', 'Aaron Judge', 'Connor McDavid', 'Steph Curry']
            const props = ['Points', 'Yards', 'Home Runs', 'Goals', 'Assists']
            const player = playerNames[Math.floor(Math.random() * playerNames.length)]
            const prop = props[Math.floor(Math.random() * props.length)]
            lineValue = 1.5 + Math.random() * 3
            betDescription = `${player} Over ${lineValue.toFixed(1)} ${prop}`
            break
        }

        const placedDate = new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000).toISOString()
        
        return {
          id: `bet-${index + 11}`,
          sport: sport,
          league: sport,
          home_team: teams[1] || 'Home Team',
          away_team: teams[0] || 'Away Team',
          bet_type: betType,
          bet_description: betDescription,
          description: betDescription,
          line_value: lineValue !== 0 ? lineValue : undefined,
          odds: oddsValue > 0 ? `+${oddsValue}` : `${oddsValue}`,
          stake: Math.round(stakeAmount),
          potential_payout: Math.round(stakeAmount * (1 + Math.abs(oddsValue) / 100)),
          status: isWin ? 'won' as const : 'lost' as const,
          profit: isWin ? Math.round(stakeAmount * Math.abs(oddsValue) / 100) : -Math.round(stakeAmount),
          placed_at: placedDate,
          game_date: new Date(new Date(placedDate).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          sportsbook: sportsbook,
          settled_at: new Date(new Date(placedDate).getTime() + 3 * 60 * 60 * 1000).toISOString()
        } as Bet
      })
      
      setRecentBets(prev => [...prev, ...additionalBets])
      setCurrentPage(nextPage)
      
      // Simulate reaching the end after a few pages
      if (nextPage >= 5) {
        setHasMoreBets(false)
      }
      
    } catch (err) {
      console.error('Error loading more bets:', err)
    } finally {
      setLoadingMoreBets(false)
    }
  }

  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    console.log('Filter change triggered:', newFilters)
    
    // Update local state immediately for UI responsiveness
    setLocalFilters(newFilters)
    
    // Convert FilterOptions to AnalyticsFilters format for the hook
    const sports: string[] = []
    const betTypes: string[] = []
    const results: string[] = []
    
    // Handle leagues filter - map to database sport column (which contains leagues)
    if (newFilters.leagues && !newFilters.leagues.includes('All')) {
      sports.push(...newFilters.leagues)
    }
    
    // Handle bet types filter - map to database bet_type column
    if (newFilters.betTypes && !newFilters.betTypes.includes('All')) {
      betTypes.push(...newFilters.betTypes)
    }
    
    // Handle statuses filter - map to database status column
    if (newFilters.statuses && !newFilters.statuses.includes('All')) {
      results.push(...newFilters.statuses)
    } else {
      results.push('won', 'lost', 'pending', 'void', 'cancelled')
    }
    
    // Include legacy filters for backward compatibility
    if (newFilters.sports) {
      sports.push(...newFilters.sports)
    }
    
    console.log('Updating analytics filters:', { sports, betTypes })
    
    // Directly update filters - debouncing is now handled in the hook
    updateFilters({
      sports: [...new Set(sports)], // Remove duplicates
      betTypes: [...new Set(betTypes)], // Remove duplicates
      sportsbooks: newFilters.sportsbooks || [],
      results: [...new Set(results)], // Use calculated results
      timeframe: newFilters.timeRange === '7 days' ? '7d' : 
                 newFilters.timeRange === '30 days' ? '30d' :
                 newFilters.timeRange === '3 months' ? '90d' :
                 newFilters.timeRange === 'This Year' ? 'ytd' : 'all',
      dateRange: { 
        start: newFilters.customStartDate || null, 
        end: newFilters.customEndDate || null 
      },
      minOdds: newFilters.oddsRange?.min || null,
      maxOdds: newFilters.oddsRange?.max || null,
      minStake: newFilters.stakeRange?.min || null,
      maxStake: newFilters.stakeRange?.max || null,
      // New database-specific filters
      isParlay: newFilters.isParlays && !newFilters.isParlays.includes('All') ? newFilters.isParlays.includes('true') : null,
      side: newFilters.sides && !newFilters.sides.includes('All') ? newFilters.sides.join(',') : null,
      oddsType: newFilters.oddsTypes && !newFilters.oddsTypes.includes('All') ? newFilters.oddsTypes.join(',') : null
    })
  }, [updateFilters])

  const handleClearFilters = useCallback(() => {
    console.log('Clearing all filters')
    
    // Reset local state immediately
    setLocalFilters(defaultFilters)
    
    // Update analytics filters directly - debouncing is handled in the hook
    updateFilters({
      sports: [],
      betTypes: [],
      sportsbooks: [],
      results: ['won', 'lost', 'pending', 'void', 'cancelled'],
      timeframe: 'all',
      dateRange: { start: null, end: null },
      minOdds: null,
      maxOdds: null,
      minStake: null,
      maxStake: null,
      isParlay: null,
      side: null,
      oddsType: null
    })
  }, [updateFilters])

  const handleExportData = async () => {
    // TODO: Implement data export functionality
    console.log('Exporting analytics data...')
  }

  const handleCreateStrategy = async (strategy: {
    name: string
    description: string
    filters: FilterOptions
    monetized: boolean
    pricing_weekly?: number
    pricing_monthly?: number
    pricing_yearly?: number
  }) => {
    try {
      // Include user ID for fallback authentication like in betslip
      // Ensure statuses is always set to ['All'] for strategy creation
      const filtersWithDefaults = {
        ...strategy.filters,
        statuses: strategy.filters.statuses || ['All']
      }
      
      const requestBody = {
        name: strategy.name,
        description: strategy.description,
        filter_config: filtersWithDefaults, // Map filters to filter_config for API
        monetized: strategy.monetized,
        pricing_weekly: strategy.pricing_weekly,
        pricing_monthly: strategy.pricing_monthly,
        pricing_yearly: strategy.pricing_yearly,
        userId: user?.id // Include user ID as fallback
      }

      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create strategy')
      }

      const result = await response.json()
      console.log('Strategy created successfully:', result)
      
      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error creating strategy:', error)
      throw error
    }
  }

  const handleUpdateStrategy = async (id: string, updates: Partial<Strategy>) => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update strategy')
      }

      console.log('Strategy updated successfully')
      
      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error updating strategy:', error)
      throw error
    }
  }

  const handleDeleteStrategy = async (id: string) => {
    try {
      const response = await fetch(`/api/strategies?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete strategy')
      }

      console.log('Strategy deleted successfully')
      
      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error deleting strategy:', error)
      throw error
    }
  }

  if (authLoading || analyticsLoading) {
    console.log('Showing loading skeleton - authLoading:', authLoading, 'analyticsLoading:', analyticsLoading)
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user && !authLoading && !isDev) {
    console.log('Showing login prompt - user:', user, 'authLoading:', authLoading, 'analyticsLoading:', analyticsLoading, 'isDev:', isDev)
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please Log In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view your analytics.
          </p>
          <a 
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </DashboardLayout>
    )
  }

  if (analyticsError) {
    console.log('Showing error - error:', analyticsError)
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading analytics: {analyticsError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (!analyticsData || !userProfile) {
    console.log('Showing analytics loading - analyticsData:', !!analyticsData, 'userProfile:', !!userProfile)
    console.log('Current userProfile state:', userProfile)
    console.log('Current analyticsData state:', analyticsData ? 'loaded' : 'null')
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p>Loading analytics data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Data: {analyticsData ? '✓' : '⏳'} Profile: {userProfile ? '✓' : '⏳'}
          </p>
        </div>
      </DashboardLayout>
    )
  }

  console.log('Rendering main analytics content')
  console.log('Analytics data metrics:', analyticsData?.metrics)
  console.log('User profile:', userProfile)

  // Safety check for analytics data structure
  const metrics = analyticsData?.metrics || {
    totalBets: 0,
    winRate: 0,
    roi: 0,
    totalProfit: 0,
    avgStake: 0,
    biggestWin: 0,
    biggestLoss: 0,
    expectedValue: 0,
    avgClv: 0,
    straightBetsCount: 0,
    parlayBetsCount: 0,
    voidBetsCount: 0,
    streakType: 'none' as const,
    currentStreak: 0
  }

  const dailyProfitData = analyticsData?.dailyProfitData || []
  const monthlyData = analyticsData?.monthlyData || []
  const recentBets = analyticsData?.recentBets || []

  // Transform chart data for overview with enhanced calculations
  const chartData = dailyProfitData.map((item) => ({
    date: item.date,
    profit: item.profit,
    cumulative: item.cumulativeProfit
  }))

  // Enhanced monthly data for trends
  const enhancedMonthlyData = monthlyData.length > 0 ? monthlyData : 
    dailyProfitData.map((item) => ({
      month: item.date,
      profit: item.profit,
      roi: metrics.avgStake > 0 ? (item.profit / metrics.avgStake) * 100 : 0,
      volume: metrics.avgStake,
      bets: item.bets,
      wins: item.profit > 0 ? 1 : 0
    }))

  // Calculate current streak from analytics data - map 'none' to 'loss' for compatibility
  const currentStreak = {
    type: metrics.streakType === 'none' ? 'loss' as const : metrics.streakType as 'win' | 'loss',
    count: metrics.streakType === 'none' ? 0 : metrics.currentStreak
  }

  // Use enhanced analytics data directly
  const transformedAnalytics = {
    totalBets: metrics.totalBets,
    winRate: metrics.winRate,
    roi: metrics.roi,
    netProfit: metrics.totalProfit,
    averageStake: metrics.avgStake,
    largestWin: metrics.biggestWin,
    largestLoss: metrics.biggestLoss,
    currentStreak,
    expectedValue: metrics.expectedValue,
    avgClv: metrics.avgClv,
    straightBetsCount: metrics.straightBetsCount,
    parlayBetsCount: metrics.parlayBetsCount,
    voidBetsCount: metrics.voidBetsCount,
    sportBreakdown: analyticsData.sportBreakdown.map(sport => ({
      sport: sport.sport,
      count: sport.bets,
      profit: sport.profit,
      winRate: sport.winRate,
      roi: sport.roi
    })),
    betTypeBreakdown: analyticsData.betTypeBreakdown,
    sideBreakdown: analyticsData.sideBreakdown,
    monthlyData: enhancedMonthlyData,
    trends: calculateTrends(enhancedMonthlyData),
    // Enhanced CLV and line movement data (Pro features)
    clvData: userProfile.isPro ? analyticsData.lineMovementData.map(item => ({
      date: item.date,
      clv: item.clv,
      profit: item.profit
    })) : [],
    lineMovementData: userProfile.isPro ? analyticsData.lineMovementData.map(item => ({
      betId: `bet-${item.date}`,
      openingLine: item.odds,
      closingLine: item.lineValue,
      movement: 'sharp' as const,
      profit: item.profit
    })) : []
  }


  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Analytics Header */}
        <AnalyticsHeader
          username={userProfile.username}
          totalBets={metrics.totalBets}
          winRate={metrics.winRate}
          totalProfit={metrics.totalProfit}
          roi={metrics.roi}
        />

        {/* Pro Upgrade Banner */}
        {!userProfile.isPro && (
          <ProUpgradePrompt
            variant="banner"
            context="general"
            onUpgrade={() => {
              // TODO: Implement Stripe checkout
              console.log('Upgrade to Pro clicked')
            }}
          />
        )}

        {/* Universal Filter System */}
        <FilterSystem
          isPro={userProfile.isPro}
          filters={localFilters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          betCount={recentBets.length}
          strategyCount={strategies.length}
        />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            recentBets={recentBets}
            chartData={chartData}
            selectedTimePeriod={filters.timeframe === '7d' ? '7 days' :
                               filters.timeframe === '30d' ? '30 days' :
                               filters.timeframe === '90d' ? '3 months' :
                               filters.timeframe === 'ytd' ? 'This Year' : 'All time'}
            onTimePeriodChange={(period) => {
              const timeframe = period === '7 days' ? '7d' :
                               period === '30 days' ? '30d' :
                               period === '3 months' ? '90d' :
                               period === 'This Year' ? 'ytd' : 'all'
              updateFilters({...filters, timeframe})
            }}
            totalProfit={analyticsData?.metrics?.totalProfit || 0}
            isLoading={analyticsLoading}
          />
        )}

        {activeTab === 'bets' && (
          <BetsTab
            bets={recentBets.map(bet => ({
              ...bet,
              odds: bet.odds.toString(),
              status: bet.status === 'cancelled' ? 'void' as const : bet.status as 'pending' | 'won' | 'lost' | 'void'
            }))}
            totalBets={metrics.totalBets}
            isLoading={loadingMoreBets}
            hasMore={hasMoreBets}
            onLoadMore={loadMoreBets}
            onSort={(field, direction) => {
              // TODO: Implement sorting
              console.log('Sort:', field, direction)
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTabComponent
            data={transformedAnalytics}
            isPro={userProfile.isPro}
            isLoading={false}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategiesTab
            strategies={strategies}
            isLoading={strategiesLoading}
            currentFilters={localFilters}
            onCreateStrategy={handleCreateStrategy}
            onUpdateStrategy={handleUpdateStrategy}
            onDeleteStrategy={handleDeleteStrategy}
            onFiltersChange={handleFiltersChange}
          />
        )}
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
