'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { AnalyticsHeader } from '@/components/analytics/analytics-header'
import { FilterSystem, FilterOptions } from '@/components/analytics/filter-system'
import { TabNavigation, AnalyticsTab } from '@/components/analytics/tab-navigation'
import { OverviewTab } from '@/components/analytics/overview-tab'
import { BetsTab } from '@/components/analytics/bets-tab'
import { AnalyticsTab as AnalyticsTabComponent } from '@/components/analytics/analytics-tab'
import { StrategiesTab } from '@/components/analytics/strategies-tab'
import { ProUpgradePrompt } from '@/components/analytics/pro-upgrade-prompt'
import { useAuth } from '@/lib/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

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

const mockRecentBets = [
  {
    id: '1',
    sport: 'NFL',
    description: 'Kansas City Chiefs -7.5 vs Denver Broncos',
    odds: -110,
    stake: 100,
    potential_payout: 190.91,
    status: 'won' as const,
    profit: 90.91,
    placed_at: '2024-01-15T20:30:00Z',
    sportsbook: 'DraftKings',
    home_team: 'Denver Broncos',
    away_team: 'Kansas City Chiefs'
  },
  {
    id: '2',
    sport: 'NBA',
    description: 'Los Angeles Lakers +5.5 vs Boston Celtics',
    odds: +105,
    stake: 50,
    potential_payout: 102.50,
    status: 'lost' as const,
    profit: -50,
    placed_at: '2024-01-14T19:45:00Z',
    sportsbook: 'FanDuel'
  },
  {
    id: '3',
    sport: 'NHL',
    description: 'Toronto Maple Leafs ML vs Montreal Canadiens',
    odds: -130,
    stake: 75,
    potential_payout: 132.69,
    status: 'pending' as const,
    placed_at: '2024-01-16T18:00:00Z',
    sportsbook: 'BetMGM'
  }
]

const mockChartData = [
  { date: '2024-01-01', profit: 0, cumulative: 0 },
  { date: '2024-01-05', profit: 45, cumulative: 45 },
  { date: '2024-01-10', profit: -25, cumulative: 20 },
  { date: '2024-01-15', profit: 120, cumulative: 140 },
  { date: '2024-01-16', profit: 90, cumulative: 230 }
]

const mockAnalyticsData = {
  totalBets: 247,
  winRate: 58.3,
  roi: 12.4,
  netProfit: 1247.50,
  averageStake: 85.50,
  largestWin: 450.00,
  largestLoss: -125.00,
  currentStreak: { type: 'win' as const, count: 3 },
  sportBreakdown: [
    { sport: 'NFL', count: 89, profit: 567.25, winRate: 61.8 },
    { sport: 'NBA', count: 76, profit: 234.50, winRate: 55.3 },
    { sport: 'NHL', count: 45, profit: 289.75, winRate: 62.2 },
    { sport: 'MLB', count: 37, profit: 156.00, winRate: 54.1 }
  ],
  monthlyData: [
    { month: 'Sep', profit: 234, bets: 45, roi: 8.2 },
    { month: 'Oct', profit: 456, bets: 67, roi: 12.1 },
    { month: 'Nov', profit: 123, bets: 34, roi: 4.5 },
    { month: 'Dec', profit: 789, bets: 89, roi: 15.6 },
    { month: 'Jan', profit: 345, bets: 56, roi: 9.8 }
  ]
}

const mockStrategies = [
  {
    id: '1',
    name: 'NFL Road Favorites',
    description: 'Betting on NFL road teams favored by 3-7 points',
    filter_config: {
      sports: ['NFL'],
      betTypes: ['Spread'],
      status: ['All'],
      timeRange: 'All time',
      sportsbooks: []
    },
    monetized: true,
    pricing_weekly: 5,
    pricing_monthly: 15,
    pricing_yearly: 120,
    subscriber_count: 23,
    performance_roi: 18.5,
    performance_win_rate: 64.2,
    performance_total_bets: 67,
    created_at: '2023-09-15T10:00:00Z',
    updated_at: '2024-01-16T15:30:00Z'
  },
  {
    id: '2',
    name: 'NBA Totals System',
    description: 'Under betting strategy for NBA games with high totals',
    filter_config: {
      sports: ['NBA'],
      betTypes: ['Total'],
      status: ['All'],
      timeRange: 'All time',
      sportsbooks: []
    },
    monetized: false,
    subscriber_count: 0,
    performance_roi: 22.1,
    performance_win_rate: 59.8,
    performance_total_bets: 34,
    created_at: '2023-11-01T14:20:00Z',
    updated_at: '2024-01-10T09:15:00Z'
  }
]

const defaultFilters: FilterOptions = {
  sports: [],
  betTypes: [],
  status: ['All'],
  timeRange: 'All time',
  sportsbooks: []
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('This Month')
  const [isLoading, setIsLoading] = useState(true)
  
  // Mock auth data - replace with actual auth
  const user = mockUser
  const isPro = user.isPro

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    // TODO: Apply filters to data
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const handleCreateStrategy = async (strategy: any) => {
    // TODO: Implement strategy creation
    console.log('Creating strategy:', strategy)
  }

  const handleUpdateStrategy = async (id: string, updates: any) => {
    // TODO: Implement strategy update
    console.log('Updating strategy:', id, updates)
  }

  const handleDeleteStrategy = async (id: string) => {
    // TODO: Implement strategy deletion
    console.log('Deleting strategy:', id)
  }

  if (isLoading) {
    return (
      <DashboardLayout current="Analytics">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout current="Analytics">
      <div className="space-y-6">
        {/* Analytics Header */}
        <AnalyticsHeader
          username={user.username}
          totalBets={user.totalBets}
          winRate={user.winRate}
          totalProfit={user.totalProfit}
          roi={user.roi}
        />

        {/* Pro Upgrade Banner */}
        {!isPro && (
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
          isPro={isPro}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          betCount={mockRecentBets.length}
          strategyCount={mockStrategies.length}
        />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            recentBets={mockRecentBets}
            chartData={mockChartData}
            selectedTimePeriod={selectedTimePeriod}
            onTimePeriodChange={setSelectedTimePeriod}
            totalProfit={user.totalProfit}
            isLoading={false}
          />
        )}

        {activeTab === 'bets' && (
          <BetsTab
            bets={mockRecentBets}
            totalBets={user.totalBets}
            isLoading={false}
            hasMore={true}
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
            data={mockAnalyticsData}
            isPro={isPro}
            isLoading={false}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategiesTab
            strategies={mockStrategies}
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