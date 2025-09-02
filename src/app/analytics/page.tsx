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
import { Button } from '@/components/ui/button'
import { useAnalytics, type Bet } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
import { RefreshCw, Link } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'


function calculateTrends(monthlyData: { roi: number }[]): {
  trend: 'up' | 'down' | 'flat'
  percentage: number
} {
  if (monthlyData.length < 2) return { trend: 'flat', percentage: 0 }

  const recent = monthlyData.slice(-3)
  if (recent.length < 2) return { trend: 'flat', percentage: 0 }

  const first = recent[0]?.roi || 0
  const last = recent[recent.length - 1]?.roi || 0
  const change = last - first

  if (Math.abs(change) < 1) return { trend: 'flat', percentage: 0 }
  return {
    trend: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  }
}

// Using interfaces from the analytics hook

interface UserProfile {
  username: string
  isPro: boolean
}

// Utility function to determine pro status from various formats
function determineProStatus(profile: any): boolean {
  if (!profile) return false

  // Check various possible pro status fields and formats
  const proFields = [
    profile.pro,
    profile.is_pro,
    profile.isPro,
    profile.is_premium,
    profile.premium,
  ]

  for (const field of proFields) {
    if (field === 'yes' || field === true || field === 1 || field === '1') {
      return true
    }
  }

  return false
}

// Using Bet interface from the analytics hook

interface Strategy {
  id: string
  name: string
  description: string
  filters: FilterOptions
  filter_config?: FilterOptions // Keep for backward compatibility 
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
  sports: [],
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreBets, setHasMoreBets] = useState(true)
  const [loadingMoreBets, setLoadingMoreBets] = useState(false)
  const [additionalBets, setAdditionalBets] = useState<Bet[]>([]) // State for additional loaded bets
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [strategiesLoading, setStrategiesLoading] = useState(false)
  const [isRefreshingBets, setIsRefreshingBets] = useState(false)
  const [isLinkingSportsbooks, setIsLinkingSportsbooks] = useState(false)
  const [refreshResult, setRefreshResult] = useState<string | null>(null)

  // Local filter state to prevent resets
  const [localFilters, setLocalFilters] = useState<FilterOptions>(defaultFilters)

  // Use the analytics hook
  const {
    analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    filters,
    updateFilters,
  } = useAnalytics(user, userProfile?.isPro || false)

  // Improved user profile fetching with better error handling
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        console.log('📊 Analytics - No user found, skipping profile fetch')
        return
      }

      console.log('📊 Analytics - Fetching profile for user:', user.email, 'ID:', user.id)

      // Set immediate fallback profile while fetching
      const immediateProfile = {
        username: user.name || user.email?.split('@')[0] || user.id.split('-')[0] || 'User',
        isPro: false,
      }
      setUserProfile(immediateProfile)

      try {
        const response = await fetch(`/api/profile?userId=${user.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log('📊 Analytics - Profile API response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          const profile = result.data
          console.log('📊 Analytics - Profile data received:', profile)

          if (profile) {
            const isPro = determineProStatus(profile)
            const enhancedProfile = {
              username:
                profile.username ||
                profile.display_name ||
                user.name ||
                user.email?.split('@')[0] ||
                user.id.substring(0, 8) ||
                'User',
              isPro: isPro,
            }
            console.log('📊 Analytics - Setting enhanced profile:', enhancedProfile)
            console.log('📊 Analytics - Pro status details:', {
              rawPro: profile.pro,
              type: typeof profile.pro,
              isPro: isPro,
              is_pro: profile.is_pro,
              allFields: { pro: profile.pro, is_pro: profile.is_pro, isPro: profile.isPro },
            })
            setUserProfile(enhancedProfile)
          } else {
            console.log('📊 Analytics - Profile data is null, keeping fallback')
          }
        } else {
          const errorText = await response.text()
          console.log('📊 Analytics - Profile fetch failed:', response.status, errorText)
          // Keep the immediate fallback profile we already set
        }
      } catch (error) {
        console.error('📊 Analytics - Profile fetch error:', error)
        // Keep the immediate fallback profile we already set
      }

      // Always fetch strategies if we have a user
      if (user.id) {
        fetchStrategies(user.id)
      }
    }

    fetchProfile()
  }, [user])

  const handleRefreshAllBets = async () => {
    if (!user?.id) {
      setRefreshResult('❌ User not authenticated')
      return
    }

    // Show professional warning popup
    const userConfirmed = window.confirm(
      'Bet Sync in Progress\n\n' +
        'This process will sync all your betting data and may take several minutes to complete.\n\n' +
        '⚠️ Please do not close this browser tab or navigate away until the sync is finished.\n\n' +
        'Click OK to continue or Cancel to abort.'
    )

    if (!userConfirmed) {
      return
    }

    setIsRefreshingBets(true)
    setRefreshResult(null)

    try {
      console.log('🔄 Starting combined SharpSports refresh for user', user.id)

      const response = await fetch('/api/sharpsports/refresh-all-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Combined refresh completed:', result.message)
        setRefreshResult(`✅ ${result.message}`)

        // Show detailed results if available
        if (result.results) {
          const { step1, step2, step3 } = result.results
          const details = []
          if (step1?.success) details.push(`✅ Fetched ${step1.stats?.totalBettors || 0} bettors`)
          if (step2?.success)
            details.push(`✅ Matched ${step2.stats?.matchedProfiles || 0} profiles`)
          if (step3?.success) details.push(`✅ Synced ${step3.stats?.newBets || 0} new bets`)

          if (details.length > 0) {
            setRefreshResult(`✅ Success: ${details.join(', ')}`)
          }
        }

        // Clear result after 5 seconds
        setTimeout(() => setRefreshResult(null), 5000)
      } else {
        console.error('❌ Combined refresh failed:', result.error)
        setRefreshResult(`❌ ${result.error || 'Refresh failed'}`)
      }
    } catch (error) {
      console.error('❌ Error during combined refresh:', error)
      setRefreshResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingBets(false)
    }
  }

  const handleLinkSportsbooks = async () => {
    if (!user?.id) return

    setIsLinkingSportsbooks(true)

    try {
      console.log('🔗 Generating SharpSports context for Booklink UI')

      const response = await fetch('/api/sharpsports/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          redirectUrl:
            window.location.hostname === 'localhost'
              ? 'https://ddb528ce02c4.ngrok-free.app/api/sharpsports/accounts'
              : `${window.location.origin}/api/sharpsports/accounts`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate context: ${response.status}`)
      }

      const { contextId } = await response.json()
      console.log('✅ Generated SharpSports context ID:', contextId)

      const booklinkUrl = `https://ui.sharpsports.io/link/${contextId}`

      console.log('📋 Opening Booklink UI:', booklinkUrl)

      const popup = window.open(
        booklinkUrl,
        'sharpsports-booklink',
        'width=700,height=800,scrollbars=yes,resizable=yes,location=yes'
      )

      if (!popup) {
        console.error('Popup blocked')
        return
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          console.log('📝 Booklink popup closed')
        }
      }, 1000)
    } catch (error) {
      console.error('Error generating SharpSports context:', error)
    } finally {
      setIsLinkingSportsbooks(false)
    }
  }

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
        credentials: 'include',
      })
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Strategies fetched successfully:', result.strategies?.length || 0)
        console.log('📋 Strategy data:', result.strategies)
        // Transform strategies to ensure filters property exists
        const transformedStrategies = (result.strategies || []).map((strategy: any) => ({
          ...strategy,
          filters: strategy.filters || strategy.filter_config || defaultFilters
        }))
        setStrategies(transformedStrategies)
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

  const loadMoreBets = async () => {
    if (loadingMoreBets || !hasMoreBets) return

    setLoadingMoreBets(true)

    try {
      // Simulate loading more bets by generating additional data
      const nextPage = currentPage + 1
      const additionalBets = Array.from({ length: 10 }, (_, i) => {
        const index = (nextPage - 1) * 10 + i
        const teamNames = [
          ['Lakers', 'Warriors'],
          ['Cowboys', 'Giants'],
          ['Yankees', 'Red Sox'],
          ['Chiefs', 'Broncos'],
          ['Celtics', 'Heat'],
          ['Rangers', 'Devils'],
          ['Dodgers', 'Padres'],
          ['Bills', 'Patriots'],
          ['Clippers', 'Suns'],
          ['Astros', 'Angels'],
          ['49ers', 'Seahawks'],
          ['Knicks', 'Nets'],
          ['Rams', 'Cardinals'],
          ['Packers', 'Bears'],
          ['Mets', 'Phillies'],
        ]

        const betTypes = ['Spread', 'Moneyline', 'Total Over', 'Total Under', 'Player Props']
        const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET']
        const sports = ['NFL', 'NBA', 'MLB', 'NHL']

        const teams = teamNames[index % teamNames.length] || ['Team A', 'Team B']
        const betType = betTypes[index % betTypes.length] || 'Moneyline'
        const sportsbook = sportsbooks[index % sportsbooks.length] || 'DraftKings'
        const sport = sports[index % sports.length] || 'NFL'

        const stakeAmount = 50 + Math.random() * 200
        const oddsValue =
          Math.random() > 0.5
            ? Math.round(100 + Math.random() * 300)
            : Math.round(-110 - Math.random() * 200)
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
            const playerNames = [
              'LeBron James',
              'Tom Brady',
              'Aaron Judge',
              'Connor McDavid',
              'Steph Curry',
            ]
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
          user_id: user?.id || '',
          sport: sport,
          league: sport,
          home_team: teams[1] || 'Home Team',
          away_team: teams[0] || 'Away Team',
          bet_type: betType,
          bet_description: betDescription,
          description: betDescription,
          line_value: lineValue !== 0 ? lineValue : undefined,
          odds: oddsValue,
          stake: Math.round(stakeAmount),
          potential_payout: Math.round(stakeAmount * (1 + Math.abs(oddsValue) / 100)),
          status: isWin ? ('won' as const) : ('lost' as const),
          profit: isWin
            ? Math.round((stakeAmount * Math.abs(oddsValue)) / 100)
            : -Math.round(stakeAmount),
          placed_at: placedDate,
          game_date: new Date(new Date(placedDate).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          sportsbook: sportsbook,
          settled_at: new Date(new Date(placedDate).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          bet_source: 'mock',
          is_copy_bet: false,
          is_parlay: false,
        } as Bet
      })

      setAdditionalBets(prev => [...prev, ...additionalBets])
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

  const handleFiltersChange = useCallback(
    (newFilters: FilterOptions) => {
      console.log('Filter change triggered:', newFilters)

      // Update local state immediately for UI responsiveness
      setLocalFilters(newFilters)

      // Convert FilterOptions to AnalyticsFilters format for the hook
      const sports: string[] = []
      const leagues: string[] = []
      const betTypes: string[] = []
      const results: string[] = []

      // Handle leagues filter - map to database league column
      if (newFilters.leagues && !newFilters.leagues.includes('All')) {
        leagues.push(...newFilters.leagues)
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

      console.log('Updating analytics filters:', { sports, leagues, betTypes })

      // Directly update filters - debouncing is now handled in the hook
      updateFilters({
        sports: [...new Set(sports)], // Remove duplicates
        leagues: [...new Set(leagues)], // Remove duplicates
        betTypes: [...new Set(betTypes)], // Remove duplicates
        sportsbooks: newFilters.sportsbooks || [],
        results: [...new Set(results)], // Use calculated results
        timeframe:
          newFilters.timeRange === '7 days'
            ? '7d'
            : newFilters.timeRange === '30 days'
              ? '30d'
              : newFilters.timeRange === '3 months'
                ? '90d'
                : newFilters.timeRange === 'This Year'
                  ? 'ytd'
                  : 'all',
        dateRange: {
          start: newFilters.customStartDate || null,
          end: newFilters.customEndDate || null,
        },
        minOdds: newFilters.oddsRange?.min || null,
        maxOdds: newFilters.oddsRange?.max || null,
        minStake: newFilters.stakeRange?.min || null,
        maxStake: newFilters.stakeRange?.max || null,
        // New database-specific filters
        isParlay:
          newFilters.isParlays && !newFilters.isParlays.includes('All')
            ? newFilters.isParlays.includes('true')
            : null,
        side:
          newFilters.sides && !newFilters.sides.includes('All') ? newFilters.sides.join(',') : null,
        oddsType:
          newFilters.oddsTypes && !newFilters.oddsTypes.includes('All')
            ? newFilters.oddsTypes.join(',')
            : null,
      })
    },
    [updateFilters]
  )

  const handleClearFilters = useCallback(() => {
    console.log('Clearing all filters')

    // Reset local state immediately
    setLocalFilters(defaultFilters)

    // Update analytics filters directly - debouncing is handled in the hook
    updateFilters({
      sports: [],
      leagues: [],
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
      oddsType: null,
    })
  }, [updateFilters])


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
        statuses: strategy.filters.statuses || ['All'],
      }

      const requestBody = {
        name: strategy.name,
        description: strategy.description,
        filter_config: filtersWithDefaults, // Map filters to filter_config for API
        monetized: strategy.monetized,
        pricing_weekly: strategy.pricing_weekly,
        pricing_monthly: strategy.pricing_monthly,
        pricing_yearly: strategy.pricing_yearly,
        userId: user?.id, // Include user ID as fallback
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

  // Show loading state - improved to handle user recognition better
  if (authLoading || analyticsLoading) {
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

  // If no user is authenticated, show error
  if (!user) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-red-600">Please sign in to view your analytics</p>
          <button
            onClick={() => (window.location.href = '/auth/signin')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // Show minimal loading if user profile is still loading
  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-2xl font-bold">Loading your analytics...</h1>
                <p className="text-lg text-blue-100">Please wait while we fetch your data</p>
              </div>
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (analyticsError) {
    console.log('Showing error - error:', analyticsError)
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-red-600">Error loading analytics: {analyticsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
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
    currentStreak: 0,
  }

  const dailyProfitData = analyticsData?.dailyProfitData || []
  const monthlyData = analyticsData?.monthlyData || []
  const recentBets = [...(analyticsData?.recentBets || []), ...additionalBets]

  // Transform chart data for overview with enhanced calculations
  const chartData = dailyProfitData.map(item => ({
    date: item.date,
    profit: item.profit,
    cumulative: item.cumulativeProfit,
  }))

  // Enhanced monthly data for trends
  const enhancedMonthlyData =
    monthlyData.length > 0
      ? monthlyData
      : dailyProfitData.map(item => ({
          month: item.date,
          profit: item.profit,
          roi: metrics.avgStake > 0 ? (item.profit / metrics.avgStake) * 100 : 0,
          volume: metrics.avgStake,
          bets: item.bets,
          wins: item.profit > 0 ? 1 : 0,
        }))

  // Calculate current streak from analytics data - map 'none' to 'loss' for compatibility
  const currentStreak = {
    type:
      metrics.streakType === 'none' ? ('loss' as const) : (metrics.streakType as 'win' | 'loss'),
    count: metrics.streakType === 'none' ? 0 : metrics.currentStreak,
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
      roi: sport.roi,
    })),
    betTypeBreakdown: analyticsData.betTypeBreakdown,
    sideBreakdown: analyticsData.sideBreakdown,
    monthlyData: enhancedMonthlyData,
    trends: calculateTrends(enhancedMonthlyData),
    // Enhanced CLV and line movement data (Pro features)
    clvData: userProfile.isPro
      ? analyticsData.lineMovementData.map(item => ({
          date: item.date,
          clv: item.clv,
          profit: item.profit,
        }))
      : [],
    lineMovementData: userProfile.isPro
      ? analyticsData.lineMovementData.map(item => ({
          betId: `bet-${item.date}`,
          openingLine: item.odds,
          closingLine: item.lineValue,
          movement: 'sharp' as const,
          profit: item.profit,
        }))
      : [],
    // Enhanced analytics data from SQL functions
    roiOverTime: analyticsData.roiOverTime || [],
    leagueBreakdown: analyticsData.leagueBreakdown || [],
    winRateVsExpected: analyticsData.winRateVsExpected || [],
    monthlyPerformance: analyticsData.monthlyPerformance || [],
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
          {(() => {
            console.log('📊 Analytics - Checking Pro banner display:', {
              userProfile: userProfile,
              isPro: userProfile.isPro,
              shouldShowBanner: !userProfile.isPro,
            })
            return (
              !userProfile.isPro && (
                <ProUpgradePrompt
                  variant="banner"
                  context="general"
                  onUpgrade={() => {
                    // TODO: Implement Stripe checkout
                    console.log('Upgrade to Pro clicked')
                  }}
                />
              )
            )
          })()}

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
              recentBets={recentBets.map(bet => ({
                ...bet,
                odds: typeof bet.odds === 'number' ? bet.odds.toString() : bet.odds,
                status: bet.status === 'cancelled' ? 'void' as const : bet.status
              }))}
              chartData={chartData}
              selectedTimePeriod={
                filters.timeframe === '7d'
                  ? '7 days'
                  : filters.timeframe === '30d'
                    ? '30 days'
                    : filters.timeframe === '90d'
                      ? '3 months'
                      : filters.timeframe === 'ytd'
                        ? 'This Year'
                        : 'All time'
              }
              onTimePeriodChange={period => {
                const timeframe =
                  period === '7 days'
                    ? '7d'
                    : period === '30 days'
                      ? '30d'
                      : period === '3 months'
                        ? '90d'
                        : period === 'This Year'
                          ? 'ytd'
                          : 'all'
                updateFilters({ ...filters, timeframe })
              }}
              totalProfit={analyticsData?.metrics?.totalProfit || 0}
              isLoading={analyticsLoading}
              analyticsData={analyticsData}
            />
          )}

          {activeTab === 'bets' && (
            <BetsTab
              bets={recentBets.map(bet => ({
                ...bet,
                odds: bet.odds.toString(),
                status:
                  bet.status === 'cancelled'
                    ? ('void' as const)
                    : (bet.status as 'pending' | 'won' | 'lost' | 'void'),
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

          {activeTab === 'analytics' &&
            (() => {
              console.log(
                '📊 Analytics - Rendering AnalyticsTabComponent with isPro:',
                userProfile.isPro
              )
              console.log('📊 Enhanced Analytics Data:', {
                roiOverTime: transformedAnalytics.roiOverTime,
                leagueBreakdown: transformedAnalytics.leagueBreakdown,
                winRateVsExpected: transformedAnalytics.winRateVsExpected,
                monthlyPerformance: transformedAnalytics.monthlyPerformance,
              })
              return (
                <AnalyticsTabComponent
                  data={transformedAnalytics}
                  isPro={userProfile.isPro}
                  isLoading={false}
                  user={user as any}
                />
              )
            })()}

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

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Refresh Result Toast */}
            {refreshResult && (
              <div
                className={`mb-3 max-w-sm rounded-lg p-3 text-sm shadow-lg ${
                  refreshResult.startsWith('✅')
                    ? 'border border-green-200 bg-green-50 text-green-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {refreshResult}
              </div>
            )}

            {/* Link Sportsbooks Button */}
            <Button
              onClick={handleLinkSportsbooks}
              disabled={isLinkingSportsbooks}
              size="lg"
              className="bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            >
              {isLinkingSportsbooks ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Link className="mr-2 h-5 w-5" />
              )}
              Link Sportsbooks
            </Button>

            {/* Refresh Bets Button */}
            <Button
              onClick={handleRefreshAllBets}
              disabled={isRefreshingBets}
              size="lg"
              className="bg-green-600 text-white shadow-lg hover:bg-green-700"
            >
              {isRefreshingBets ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-5 w-5" />
              )}
              Refresh Bets
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
