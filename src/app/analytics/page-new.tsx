'use client'

import { AnalyticsHeader } from '@/components/analytics/analytics-header'
import { AnalyticsTab as AnalyticsTabComponent } from '@/components/analytics/analytics-tab'
import { BetsTab } from '@/components/analytics/bets-tab'
import { FilterOptions, FilterSystem } from '@/components/analytics/filter-system'
import { OverviewTab } from '@/components/analytics/overview-tab'
import { ProUpgradePrompt } from '@/components/analytics/pro-upgrade-prompt'
import { StrategiesTab } from '@/components/analytics/strategies-tab'
import { AnalyticsTab, TabNavigation } from '@/components/analytics/tab-navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCallback, useEffect, useState } from 'react'

interface AnalyticsData {
  overview: {
    totalBets: number
    winRate: number
    roi: number
    netProfit: number
    avgBetSize: number
    totalStake: number
  }
  sportBreakdown: Array<{
    sport: string
    totalBets: number
    winRate: number
    roi: number
    netProfit: number
  }>
  profitData: Array<{
    date: string
    profit: number
  }>
  recentForm: Array<{
    date: string
    result: string
    sport: string
    roi: number
  }>
}

interface UserProfile {
  username: string
  isPro: boolean
}

interface Bet {
  id: string
  sport: string
  bet_description: string
  odds: string
  stake: number
  potential_payout: number
  status: 'won' | 'lost' | 'pending'
  profit: number
  placed_at: string
  sportsbook: string
  home_team?: string
  away_team?: string
  bet_type?: string
}

const defaultFilters: FilterOptions = {
  sports: [],
  betTypes: [],
  leagues: [],
  statuses: ['All'],
  isParlays: ['All'],
  sides: ['All'],
  oddsTypes: ['All'],
  timeRange: 'All time',
  sportsbooks: [],
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [recentBets, setRecentBets] = useState<Bet[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Build query parameters based on filters
      const params = new URLSearchParams()
      params.append(
        'timeframe',
        filters.timeRange === 'All time'
          ? 'all'
          : filters.timeRange === '7 days'
            ? '7d'
            : filters.timeRange === '30 days'
              ? '30d'
              : filters.timeRange === '3 months'
                ? '90d'
                : filters.timeRange === 'This Year'
                  ? 'ytd'
                  : '30d'
      )

      if (filters.sports.length > 0) {
        params.append('sport', filters.sports.join(','))
      }
      if (filters.betTypes.length > 0) {
        params.append('bet_type', filters.betTypes.join(','))
      }

      const response = await fetch(`/api/analytics?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      setAnalyticsData(result.data)

      // Transform recent form data to bet format
      const transformedBets: Bet[] = result.data.recentForm
        .slice(0, 10)
        .map(
          (form: { sport: string; roi: number; result: string; date: string }, index: number) => ({
            id: `${index + 1}`,
            sport: form.sport || 'MLB',
            bet_description: `${form.sport} Bet`,
            odds: form.roi > 0 ? `+${Math.round(Math.abs(form.roi) * 10)}` : `-110`,
            stake: result.data.overview.avgBetSize || 100,
            potential_payout:
              (result.data.overview.avgBetSize || 100) * (1 + Math.abs(form.roi) / 100),
            status: form.result as 'won' | 'lost' | 'pending',
            profit: ((result.data.overview.avgBetSize || 100) * form.roi) / 100,
            placed_at: form.date,
            sportsbook: 'DraftKings',
            home_team: 'Team A',
            away_team: 'Team B',
            bet_type: 'Moneyline',
          })
        )

      setRecentBets(transformedBets)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  const fetchUserProfile = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const profile = await response.json()
        setUserProfile({
          username: profile.username || user.email?.split('@')[0] || 'User',
          isPro: profile.pro === 'yes',
        })
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      // Set default values if profile fetch fails
      setUserProfile({
        username: user.email?.split('@')[0] || 'User',
        isPro: false,
      })
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) {
      fetchAnalyticsData()
      fetchUserProfile()
    }
  }, [user, authLoading, filters, fetchAnalyticsData, fetchUserProfile])

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleCreateStrategy = async (strategy: unknown) => {
    // TODO: Implement strategy creation
    console.log('Creating strategy:', strategy)
  }

  const handleUpdateStrategy = async (id: string, updates: unknown) => {
    // TODO: Implement strategy updates
    console.log('Updating strategy:', id, updates)
  }

  const handleDeleteStrategy = async (id: string) => {
    // TODO: Implement strategy deletion
    console.log('Deleting strategy:', id)
  }

  if (authLoading || loading) {
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your analytics.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-red-600">Error loading analytics: {error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (!analyticsData || !userProfile) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p>Loading analytics data...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Transform chart data for overview
  const chartData = analyticsData.profitData.map((item, index) => ({
    date: item.date,
    profit: item.profit,
    cumulative: analyticsData.profitData.slice(0, index + 1).reduce((sum, p) => sum + p.profit, 0),
  }))

  // Transform analytics data for components
  const transformedAnalytics = {
    totalBets: analyticsData.overview.totalBets,
    winRate: analyticsData.overview.winRate,
    roi: analyticsData.overview.roi,
    netProfit: analyticsData.overview.netProfit,
    averageStake: analyticsData.overview.avgBetSize,
    largestWin: Math.max(...recentBets.filter(b => b.profit > 0).map(b => b.profit), 0),
    largestLoss: Math.min(...recentBets.filter(b => b.profit < 0).map(b => b.profit), 0),
    currentStreak: { type: 'win' as const, count: 0 },
    sportBreakdown: analyticsData.sportBreakdown.map(sport => ({
      sport: sport.sport,
      count: sport.totalBets,
      profit: sport.netProfit,
      winRate: sport.winRate,
    })),
    monthlyData: [], // Will be populated from profit data if needed
    leagueBreakdown: [],
    roiOverTime: [],
    winRateVsExpected: [],
    monthlyPerformance: [],
  }

  const strategies: Array<{
    id: string
    name: string
    description: string
    filters: FilterOptions
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
  }> = [] // TODO: Implement strategies from database

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Analytics Header */}
        <AnalyticsHeader
          username={userProfile.username}
          totalBets={analyticsData.overview.totalBets}
          winRate={analyticsData.overview.winRate}
          totalProfit={analyticsData.overview.netProfit}
          roi={analyticsData.overview.roi}
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
          filters={filters}
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
            selectedTimePeriod={filters.timeRange}
            onTimePeriodChange={period => setFilters({ ...filters, timeRange: period })}
            totalProfit={analyticsData.overview.netProfit}
            isLoading={false}
          />
        )}

        {activeTab === 'bets' && (
          <BetsTab
            bets={recentBets}
            totalBets={analyticsData.overview.totalBets}
            isLoading={false}
            hasMore={false}
            onLoadMore={() => {
              // TODO: Implement pagination
              console.log('Load more bets')
            }}
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
            isLoading={false}
            onCreateStrategy={handleCreateStrategy}
            onUpdateStrategy={handleUpdateStrategy}
            onDeleteStrategy={handleDeleteStrategy}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
