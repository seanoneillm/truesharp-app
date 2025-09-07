// FILE: src/app/analytics/page.tsx
'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Crown,
  Download,
  Eye,
  Filter,
  List,
  Lock,
  RefreshCw,
  Settings,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'


// Import the new components
import { AdvancedProfitChart } from '@/components/analytics/charts/advanced-profit-chart'
import CLVChart from '@/components/analytics/charts/clv-chart'
// Ensure CLVChart accepts props: data and isPro
import { CorrelationMatrix } from '@/components/analytics/charts/correlation-matrix'
import { HeatMapChart } from '@/components/analytics/charts/heat-map-chart'
import { AdvancedFilterPanel } from '@/components/analytics/filters/advanced-filter-panel'
import { QuickFilters } from '@/components/analytics/filters/quick-filters'
import { SavedFilters } from '@/components/analytics/filters/saved-filters'
import { CustomReportBuilder } from '@/components/analytics/reports/custom-report-builder'
import { ExportTools } from '@/components/analytics/reports/export-tools'

// Shield SVG Component
const TrueSharpShield = ({ className = 'h-6 w-6', variant = 'default' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
        <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill={`url(#shieldGradient-${variant})`}
      stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
      strokeWidth="2"
    />
    <path
      d="M35 45 L45 55 L65 35"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

// Loading skeleton component
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map(i => (
      <div
        key={i}
        className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm"
      >
        <div className="animate-pulse">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-slate-200"></div>
          </div>
          <div className="mb-2 h-4 rounded bg-slate-200"></div>
          <div className="mb-2 h-8 rounded bg-slate-200"></div>
          <div className="h-3 rounded bg-slate-200"></div>
        </div>
      </div>
    ))}
  </div>
)

// Bets Table Component
type Bet = {
  id?: string | number
  placed_at?: string
  sport?: string
  league?: string
  description?: string
  bet_description?: string
  bet_type?: string
  odds?: number
  stake?: number
  potential_payout?: number
  actual_payout?: number | null
  profit?: number | null
  status?: string
  sportsbook?: string
  teams?: string | string[] | null
  home_team?: string
  away_team?: string
  game_date?: string
  strategy_id?: string
  line_value?: number
  prop_type?: string
  player_name?: string
  side?: string
  clv?: number | null
  closing_line?: number | null
  line_movement?: number | null
  expected_value?: number | null
}

interface BetsTableProps {
  bets: Bet[]
  isPro: boolean
  isLoading: boolean
}

const BetsTable = ({ bets, isPro, isLoading }: BetsTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded bg-slate-200"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-12 text-center shadow-lg backdrop-blur-sm">
        <List className="mx-auto mb-4 h-16 w-16 text-slate-400" />
        <h3 className="mb-2 text-lg font-medium text-slate-900">No Bets Found</h3>
        <p className="text-slate-600">
          Connect your sportsbook accounts or add manual bets to see your betting data here.
        </p>
      </div>
    )
  }


  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A'
    return `$${Number(amount).toFixed(2)}`
  }

  const formatOdds = (odds: number | null | undefined) => {
    if (odds === null || odds === undefined) return 'N/A'
    return odds > 0 ? `+${odds}` : `${odds}`
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string | undefined) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    } as const

    type StatusKey = keyof typeof statusColors
    const safeStatus: StatusKey = (
      status && Object.keys(statusColors).includes(status) ? status : 'pending'
    ) as StatusKey

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[safeStatus]}`}
      >
        {safeStatus}
      </span>
    )
  }

  const BlurredCell = ({
    children,
    isProColumn,
  }: {
    children: React.ReactNode
    isProColumn: boolean
  }) => {
    if (isProColumn && !isPro) {
      return (
        <td className="relative whitespace-nowrap px-6 py-4 text-sm text-slate-900">
          <div className="select-none blur-sm filter">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        </td>
      )
    }
    return <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{children}</td>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
      <div className="border-b border-slate-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">All Bets ({bets.length})</h3>
          {!isPro && (
            <div className="flex items-center text-sm text-slate-500">
              <Lock className="mr-1 h-4 w-4" />
              Some data requires Pro
            </div>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/50">
          <thead className="sticky top-0 bg-slate-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Date Placed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Sport / League
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Matchup & Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Bet Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Odds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Stake
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Sportsbook
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Strategy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <div className="flex items-center">
                  CLV
                  {!isPro && <Lock className="ml-1 h-3 w-3" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <div className="flex items-center">
                  Closing Line
                  {!isPro && <Lock className="ml-1 h-3 w-3" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <div className="flex items-center">
                  Line Movement
                  {!isPro && <Lock className="ml-1 h-3 w-3" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <div className="flex items-center">
                  Expected Value
                  {!isPro && <Lock className="ml-1 h-3 w-3" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 bg-white/50">
            {bets.map((bet, index) => {
              // Build teams display
              let teamsDisplay = 'N/A'
              if (bet.home_team && bet.away_team) {
                teamsDisplay = `${bet.away_team} @ ${bet.home_team}`
              } else if (bet.teams) {
                teamsDisplay = typeof bet.teams === 'string' ? bet.teams : JSON.stringify(bet.teams)
              }

              // Use bet_description as primary display and supplement with additional details
              const buildCompleteBetDescription = (bet: Bet) => {
                // Start with bet_description from the database (this should be the main description)
                let primaryDescription = bet.bet_description || 'N/A'
                
                // Build supplementary details array for additional context
                const supplementaryDetails = []
                
                // Add teams if available
                if (bet.home_team && bet.away_team) {
                  supplementaryDetails.push(`${bet.away_team} @ ${bet.home_team}`)
                }
                
                // Add bet type and side together for context
                const betTypeAndSide = []
                if (bet.bet_type) {
                  betTypeAndSide.push(bet.bet_type.replace('_', ' ').toUpperCase())
                }
                if (bet.side) {
                  betTypeAndSide.push(bet.side.toUpperCase())
                }
                if (betTypeAndSide.length > 0) {
                  supplementaryDetails.push(betTypeAndSide.join(' '))
                }
                
                // Add line value with proper formatting
                if (bet.line_value !== undefined && bet.line_value !== null) {
                  supplementaryDetails.push(bet.line_value > 0 ? `+${bet.line_value}` : `${bet.line_value}`)
                }
                
                // Add player info for props
                if (bet.player_name) {
                  const playerInfo = [bet.player_name]
                  if (bet.prop_type) {
                    playerInfo.push(bet.prop_type)
                  }
                  supplementaryDetails.push(playerInfo.join(' '))
                }
                
                // Combine primary description with supplementary details
                if (supplementaryDetails.length > 0) {
                  return `${primaryDescription} | ${supplementaryDetails.join(' | ')}`
                }
                
                return primaryDescription
              }
              
              const betDetails = buildCompleteBetDescription(bet)

              // Calculate profit for display
              const profit = bet.profit ?? (
                bet.status === 'won' ? (bet.potential_payout || 0) - (bet.stake || 0) :
                bet.status === 'lost' ? -(bet.stake || 0) :
                0
              )

              return (
                <tr key={bet.id || index} className="transition-colors hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {formatDate(bet.placed_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {bet.sport || 'N/A'}
                      </span>
                      {bet.league && (
                        <div className="text-xs text-slate-500">{bet.league}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="space-y-1 max-w-xs">
                      <div className="font-medium text-slate-700">{teamsDisplay}</div>
                      <div className="text-xs text-slate-600 truncate">{betDetails}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {bet.bet_type || 'N/A'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {formatOdds(bet.odds)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {formatCurrency(bet.stake)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : bet.status === 'void' ? 'Void' : 'Pending'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <span
                      className={
                        profit > 0
                          ? 'text-green-600'
                          : profit < 0
                            ? 'text-red-600'
                            : 'text-slate-900'
                      }
                    >
                      {formatCurrency(profit)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {getStatusBadge(bet.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {bet.sportsbook || 'Manual'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    {bet.strategy_id ? (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        Strategy Bet
                      </span>
                    ) : (
                      <span className="text-slate-500">Manual</span>
                    )}
                  </td>
                  <BlurredCell isProColumn={true}>
                    {bet.clv ? `${bet.clv > 0 ? '+' : ''}${bet.clv}%` : 'N/A'}
                  </BlurredCell>
                  <BlurredCell isProColumn={true}>{formatOdds(bet.closing_line)}</BlurredCell>
                  <BlurredCell isProColumn={true}>
                    {bet.line_movement
                      ? `${bet.line_movement > 0 ? '+' : ''}${bet.line_movement}`
                      : 'N/A'}
                  </BlurredCell>
                  <BlurredCell isProColumn={true}>
                    {bet.expected_value
                      ? `${bet.expected_value > 0 ? '+' : ''}${bet.expected_value}%`
                      : 'N/A'}
                  </BlurredCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {bets.length > 10 && (
        <div className="border-t border-slate-200/50 bg-slate-50/50 px-6 py-3">
          <p className="text-center text-sm text-slate-500">
            Showing {bets.length} bets • Scroll to see more columns
          </p>
        </div>
      )}
    </div>
  )
}

import type { FilterState } from '@/components/analytics/filters/advanced-filter-panel'

interface SavedFilter {
  id: string
  name: string
  description: string
  filters: FilterState
  createdAt: Date
  useCount: number
  isFavorite: boolean
  isShared: boolean
  tags: string[]
}

export default function EnhancedAnalyticsPage() {
  const { user, loading: authLoading } = useAuth() // Use the correct useAuth hook
  const { profile, loading: profileLoading } = useProfile()
  const [selectedTimeframe, setSelectedTimeframe] = useState('all')
  const [showProUpgrade, setShowProUpgrade] = useState(false)
  const [showBankrollGuide, setShowBankrollGuide] = useState(false)

  // Use actual Pro status from profile
  const isPro = profile?.pro === 'yes'
  const [activeView, setActiveView] = useState('overview')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const { analyticsData, isLoading, error, filters, updateFilters, totalBets, filteredBetsCount } =
    useAnalytics(user)
  // Extract bets array from analyticsData, fallback to empty array if not available
  const bets = analyticsData?.bets || []

  const timeframes = [
    { label: 'Last 7 Days', value: '7d', free: true },
    { label: 'Last 30 Days', value: '30d', free: true },
    { label: 'This Month', value: 'month', free: true },
    { label: 'Last 90 Days', value: '90d', free: false },
    { label: 'Year to Date', value: 'ytd', free: false },
    { label: 'All Time', value: 'all', free: false },
  ]

  const proFeatures = [
    'Unlimited filtering & custom date ranges',
    'Advanced profit, CLV, and correlation charts',
    'Custom report builder & export tools',
    'Performance by bet type, sportsbook, and more',
    'Real-time analytics & streak tracking',
    'Save and share filter presets',
    'Heatmaps and advanced breakdowns',
    'Priority support',
  ]

  const handleProFeatureClick = () => {
    if (!isPro) {
      setShowProUpgrade(true)
    }
  }

  const handleFilterToggle = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId) ? prev.filter(id => id !== filterId) : [...prev, filterId]
    )
  }

  const handleFiltersChange = (filters: FilterState) => {
    // Implement filter logic here if needed
    console.log('Filters changed:', filters)
  }

  const handleSaveFilter = (name: string, filters: FilterState) => {
    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}`,
      name,
      description: `Custom filter with ${Object.keys(filters).length} criteria`,
      filters,
      createdAt: new Date(),
      useCount: 0,
      isFavorite: false,
      isShared: false,
      tags: [],
    }
    setSavedFilters(prev => [...prev, newFilter])
  }

  type LoadFilterHandler = (filter: SavedFilter) => void

  const handleLoadFilter: LoadFilterHandler = filter => {
    handleFiltersChange(filter.filters)
  }

  const handleTimeframeChange = (newTimeframe: string) => {
    const timeframe = timeframes.find(t => t.value === newTimeframe)
    if (timeframe && (timeframe.free || isPro)) {
      setSelectedTimeframe(newTimeframe)
      updateFilters({ timeframe: newTimeframe })
    } else if (!isPro) {
      handleProFeatureClick()
    }
  }

  // Show loading if auth is still loading
  if (authLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Loading authentication...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Transform analytics data to chart format - this data is already filtered by the useAnalytics hook
  const profitChartData = analyticsData.dailyProfitData.map(day => ({
    date: day.date,
    cumulativeProfit: day.cumulativeProfit, // This should be actual calculated profit, not potential
    dailyProfit: day.profit, // Daily profit change
    roi: analyticsData.metrics.roi,
    units: day.cumulativeProfit / (analyticsData.metrics.avgStake || 100), // Convert to units based on average stake
    bets: day.bets,
  }))


  return (
    <DashboardLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center space-x-3">
                <TrueSharpShield className="h-8 w-8" variant="light" />
                <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
                {/* Pro/Free Toggle */}
                <div className="ml-4 flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${!isPro ? 'text-blue-600' : 'text-slate-500'}`}
                  >
                    Free
                  </span>
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      isPro ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPro ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${isPro ? 'text-blue-600' : 'text-slate-500'}`}
                  >
                    Pro
                  </span>
                  {isPro && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
              <p className="text-slate-600">
                {isPro
                  ? 'Advanced analytics with unlimited filtering and professional insights'
                  : 'Deep dive into your verified betting performance with advanced analytics'}
              </p>
              {/* Data summary with loading indicator */}
              <div className="mt-3 flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  {isLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  )}
                  <span className={`${isLoading ? 'text-blue-600 animate-pulse' : 'text-slate-500'}`}>
                    Total Bets: {totalBets}
                  </span>
                </div>
                <span className={`${isLoading ? 'text-blue-600 animate-pulse' : 'text-slate-500'}`}>
                  Filtered: {filteredBetsCount}
                </span>
                {analyticsData.metrics.totalStaked > 0 && (
                  <span className={`${isLoading ? 'text-blue-600 animate-pulse' : 'text-slate-500'}`}>
                    Total Staked: ${analyticsData.metrics.totalStaked.toFixed(2)}
                  </span>
                )}
                {isLoading && (
                  <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Refreshing data...
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bankroll Guide Button */}
              <button
                onClick={() => setShowBankrollGuide(true)}
                className="inline-flex items-center rounded-xl border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-all hover:from-green-100 hover:to-emerald-100 hover:shadow-md"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Bankroll Guide
              </button>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeView === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="mr-1 inline h-4 w-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('bets')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeView === 'bets'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="mr-1 inline h-4 w-4" />
                  Bets
                </button>
                <button
                  onClick={() => (isPro ? setActiveView('advanced') : handleProFeatureClick())}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeView === 'advanced'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!isPro ? 'opacity-60' : ''}`}
                >
                  <BarChart3 className="mr-1 inline h-4 w-4" />
                  Advanced
                  {!isPro && <Lock className="ml-1 inline h-3 w-3" />}
                </button>
                <button
                  onClick={() => (isPro ? setActiveView('reports') : handleProFeatureClick())}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeView === 'reports'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!isPro ? 'opacity-60' : ''}`}
                >
                  <Settings className="mr-1 inline h-4 w-4" />
                  Reports
                  {!isPro && <Lock className="ml-1 inline h-3 w-3" />}
                </button>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={isPro ? undefined : handleProFeatureClick}
                className={`inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500 ${!isPro ? 'opacity-75' : ''}`}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
                {!isPro && <Lock className="ml-1 h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {isPro && activeView === 'advanced' ? (
              // Advanced Pro Filters
              <div className="space-y-6">
                <AdvancedFilterPanel
                  isPro={isPro}
                  onFiltersChange={handleFiltersChange}
                  savedFilters={savedFilters}
                  onSaveFilter={handleSaveFilter}
                  onLoadFilter={filters => {
                    // If passed a SavedFilter, extract .filters, otherwise assume it's already FilterState
                    if ('filters' in filters) {
                      handleFiltersChange(filters.filters as FilterState)
                    } else {
                      handleFiltersChange(filters)
                    }
                  }}
                />
              </div>
            ) : (
              // Organized Filters Panel
              <div className="sticky top-24 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white/90 to-slate-50/90 p-6 shadow-xl backdrop-blur-md">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-2.5">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Filters</h3>
                      <p className="text-xs text-slate-500">Customize your analytics view</p>
                    </div>
                  </div>
                  {isPro && (
                    <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1.5">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Quick Filters for Pro */}
                {isPro && (
                  <div className="mb-6">
                    <QuickFilters
                      activeFilters={activeFilters}
                      onFilterToggle={handleFilterToggle}
                      onFilterApply={handleFiltersChange}
                      isPro={isPro}
                    />
                  </div>
                )}

                <div className="space-y-8">
                  {/* Date Range Filter - Pro Feature */}
                  {isPro && (
                    <div className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
                      <label className="mb-4 flex items-center text-sm font-bold text-slate-800">
                        <div className="mr-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 p-2">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        Custom Date Range
                        <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">PRO</span>
                      </label>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-medium text-slate-700">Start Date</label>
                            <input
                              type="date"
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateFilters({ 
                                    dateRange: { 
                                      start: e.target.value, 
                                      end: filters.dateRange.end 
                                    } 
                                  })
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-medium text-slate-700">End Date</label>
                            <input
                              type="date"
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateFilters({ 
                                    dateRange: { 
                                      start: filters.dateRange.start, 
                                      end: e.target.value 
                                    } 
                                  })
                                }
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => updateFilters({ dateRange: { start: null, end: null } })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Clear Date Range
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Timeframe Filter */}
                  <div>
                    <label className="mb-4 flex items-center text-sm font-bold text-slate-800">
                      <div className="mr-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
                        <RefreshCw className="h-4 w-4 text-white" />
                      </div>
                      {isPro ? 'Quick Time Period' : 'Time Period'}
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {timeframes.map(timeframe => (
                        <button
                          key={timeframe.value}
                          onClick={() => handleTimeframeChange(timeframe.value)}
                          disabled={!timeframe.free && !isPro}
                          className={`group relative rounded-xl border p-4 text-left transition-all duration-200 ${
                            selectedTimeframe === timeframe.value
                              ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                              : timeframe.free || isPro
                                ? 'border-slate-200 bg-white hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-md'
                                : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-semibold">{timeframe.label}</span>
                              {selectedTimeframe === timeframe.value && (
                                <div className="mt-1 text-xs text-blue-100">Currently active</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {!timeframe.free && !isPro && (
                                <Lock className="h-4 w-4 text-slate-400" />
                              )}
                              {selectedTimeframe === timeframe.value && (
                                <CheckCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Saved Filters for Pro */}
                {isPro && savedFilters.length > 0 && (
                  <div className="mt-6">
                    <SavedFilters
                      savedFilters={savedFilters}
                      onLoadFilter={handleLoadFilter}
                      onDeleteFilter={id => setSavedFilters(prev => prev.filter(f => f.id !== id))}
                      onUpdateFilter={(id, updates) =>
                        setSavedFilters(prev =>
                          prev.map(f => (f.id === id ? { ...f, ...updates } : f))
                        )
                      }
                      onShareFilter={() => {}}
                      isPro={isPro}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-8 lg:col-span-3">
            {!user && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-lg">
                <div className="flex items-center">
                  <AlertCircle className="mr-3 h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Sign in Required</h3>
                    <p className="mt-1 text-yellow-700">
                      Please sign in to view your betting analytics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'overview' && (
              <>
                {/* Performance Metrics */}
                <div>
                  <h2 className="mb-6 text-lg font-semibold text-slate-900">Key Metrics</h2>
                  {isLoading ? (
                    <StatsSkeleton />
                  ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-lg">
                      <div className="flex items-center">
                        <AlertCircle className="mr-3 h-6 w-6 text-red-600" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                          <p className="mt-1 text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : analyticsData && analyticsData.metrics.totalBets > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {/* ROI Card */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 p-3 shadow-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          {isPro && (
                            <div className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                              Real-time
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-medium text-slate-600">ROI</p>
                          <p
                            className={`mb-2 text-2xl font-bold ${analyticsData.metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {analyticsData.metrics.roi.toFixed(2)}%
                          </p>
                          <p className="text-xs text-slate-500">Return on investment</p>
                        </div>
                      </div>

                      {/* Win Rate Card */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 shadow-lg">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-medium text-slate-600">Win Rate</p>
                          <p className="mb-2 text-2xl font-bold text-slate-900">
                            {analyticsData.metrics.winRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500">Percentage of bets won</p>
                        </div>
                      </div>

                      {/* Total Profit Card */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div
                            className={`rounded-2xl p-3 shadow-lg ${analyticsData.metrics.totalProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}
                          >
                            <ArrowUpRight className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-medium text-slate-600">Total Profit</p>
                          <p
                            className={`mb-2 text-2xl font-bold ${analyticsData.metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            ${analyticsData.metrics.totalProfit.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">Net profit/loss</p>
                        </div>
                      </div>

                      {/* Total Bets Card */}
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 p-3 shadow-lg">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-medium text-slate-600">Total Bets</p>
                          <p className="mb-2 text-2xl font-bold text-slate-900">
                            {analyticsData.metrics.totalBets}
                          </p>
                          <p className="text-xs text-slate-500">
                            {analyticsData.metrics.currentStreak > 0
                              ? `${analyticsData.metrics.currentStreak} ${analyticsData.metrics.streakType} streak`
                              : 'No active streak'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center shadow-lg">
                      <TrueSharpShield className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <h3 className="mb-2 text-lg font-medium text-slate-900">
                        No Betting Data Found
                      </h3>
                      <p className="mb-4 text-slate-600">
                        {user
                          ? 'Connect your sportsbook accounts or add some sample bets to start tracking your betting performance.'
                          : 'Sign in to view your betting analytics.'}
                      </p>
                      {user && (
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => (window.location.href = '/settings')}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                          >
                            Connect Sportsbook
                          </button>
                          <button
                            onClick={() => (window.location.href = '/bets')}
                            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Add Manual Bet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Charts Section */}
                {analyticsData.metrics.totalBets > 0 && (
                  <div className="space-y-8">
                    <AdvancedProfitChart
                      key={`chart-${selectedTimeframe}-${JSON.stringify(filters)}`}
                      data={profitChartData}
                      isPro={isPro}
                      timeframe={selectedTimeframe}
                      onTimeframeChange={handleTimeframeChange}
                    />
                  </div>
                )}

                {/* Sport Breakdown */}
                {analyticsData.sportBreakdown.length > 0 && (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">Performance by Sport</h2>
                      <button
                        onClick={isPro ? () => setActiveView('advanced') : handleProFeatureClick}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-500"
                      >
                        View Advanced <ChevronRight className="ml-1 h-4 w-4" />
                        {!isPro && <Lock className="ml-1 h-3 w-3" />}
                      </button>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/50">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Sport
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Total Bets
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Win Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                ROI
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                Profit
                              </th>
                              {isPro && (
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                  CLV
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 bg-white/50">
                            {analyticsData.sportBreakdown.map(sport => (
                              <tr
                                key={sport.sport}
                                className="transition-colors hover:bg-slate-50/50"
                              >
                                <td className="whitespace-nowrap px-6 py-4">
                                  <span className="text-sm font-medium text-slate-900">
                                    {sport.sport}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                                  {sport.bets}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                                  {sport.winRate.toFixed(1)}%
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                  <span
                                    className={sport.roi >= 0 ? 'text-green-600' : 'text-red-600'}
                                  >
                                    {sport.roi.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                  <span
                                    className={
                                      sport.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                    }
                                  >
                                    ${sport.profit.toFixed(2)}
                                  </span>
                                </td>
                                {isPro && (
                                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                                    {sport.clv ? `+${sport.clv.toFixed(3)}` : 'N/A'}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeView === 'bets' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center text-lg font-semibold text-slate-900">
                    <List className="mr-2 h-5 w-5" />
                    All Bets Data
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <span>Raw data from Supabase</span>
                    {isLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-lg">
                    <div className="flex items-center">
                      <AlertCircle className="mr-3 h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="text-lg font-medium text-red-800">Error Loading Bets</h3>
                        <p className="mt-1 text-red-700">{error}</p>
                        <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-2 text-xs text-red-600">
                          {JSON.stringify(error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug Information */}
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-lg">
                  <h3 className="mb-2 text-sm font-medium text-blue-800">Debug Information</h3>
                  <div className="space-y-1 text-xs text-blue-700">
                    <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
                    <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                    <p>Error: {error ? 'Yes' : 'No'}</p>
                    <p>Bets Array: {bets ? `${bets.length} items` : 'Undefined/null'}</p>
                    <p>Analytics Data: {analyticsData ? 'Available' : 'Not available'}</p>
                    <p>Pro Mode: {isPro ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  {bets && bets.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-blue-800">
                        View First Bet Raw Data
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-x-auto rounded bg-blue-100 p-2 text-xs text-blue-600">
                        {JSON.stringify(bets[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <BetsTable bets={bets as any || []} isPro={isPro} isLoading={isLoading} />
              </div>
            )}

            {activeView === 'advanced' && isPro && (
              <div className="space-y-8">
                <h2 className="mb-6 flex items-center text-lg font-semibold text-slate-900">
                  <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                  Advanced Analytics
                </h2>


                <CLVChart />

                <HeatMapChart
                  data={[]} // Add mock heat map data
                  isPro={isPro}
                  metric="roi"
                  onMetricChange={() => {}}
                />

                <CorrelationMatrix
                  data={[]} // Add mock correlation data
                  isPro={isPro}
                  selectedMetrics={['Odds', 'Win Rate', 'ROI']}
                  onMetricsChange={() => {}}
                />
              </div>
            )}

            {activeView === 'reports' && isPro && (
              <div className="space-y-8">
                <h2 className="mb-6 flex items-center text-lg font-semibold text-slate-900">
                  <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                  Custom Reports
                </h2>

                <CustomReportBuilder
                  isPro={isPro}
                  onReportGenerate={() => {}}
                  savedTemplates={[]}
                  onSaveTemplate={() => {}}
                />

                <ExportTools isPro={isPro} reportData={{}} onExport={() => {}} />
              </div>
            )}

            {/* Pro Upgrade Banner - Only show if not Pro */}
            {!isPro && (
              <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-4 flex items-center">
                      <Crown className="mr-3 h-8 w-8 text-yellow-300" />
                      <h3 className="text-2xl font-bold">Unlock Advanced Analytics</h3>
                    </div>
                    <p className="mb-6 max-w-2xl text-blue-100">
                      Get unlimited filtering, custom date ranges, and professional-grade analytics
                      tools to maximize your edge.
                    </p>
                    <div className="mb-6 grid max-w-2xl grid-cols-2 gap-4">
                      {proFeatures.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <TrueSharpShield className="mr-2 h-4 w-4" variant="light" />
                          <span className="text-sm text-blue-100">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="mb-1 text-4xl font-bold">$19.99</div>
                      <div className="text-sm text-blue-200">/month</div>
                    </div>
                    <button
                      className="inline-flex items-center rounded-xl border border-transparent bg-white px-6 py-3 text-base font-medium text-blue-600 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-50"
                    >
                      Try Pro Mode
                      <ArrowUpRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bankroll Guide Modal */}
        {showBankrollGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <div className="flex items-center space-x-3">
                  <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-2">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">📊 Bankroll Basics & Finding Your Edge</h3>
                    <p className="text-sm text-green-700">Essential guide for responsible betting</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBankrollGuide(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto p-8">
                <div className="prose max-w-none">
                  <div className="mb-8">
                    <h2 className="mb-4 flex items-center text-2xl font-bold text-slate-900">
                      What is a Bankroll?
                    </h2>
                    <p className="text-slate-700">
                      Your bankroll is the amount of money you've set aside strictly for sports betting. Think of it as your "betting budget." The most important rule is simple: <strong>never bet money you can't afford to lose</strong>. Your bankroll should be separate from bills, savings, or everyday spending.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">How Big Should Your Bankroll Be?</h2>
                    <p className="text-slate-700">
                      There's no universal number. Some bettors set aside $500, others $5,000. The key is comfort — you should be fine if it all disappeared tomorrow. Start small and grow your bankroll with consistent discipline.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Units & Bet Sizing</h2>
                    <p className="text-slate-700">
                      To stay consistent, bettors use "units." One unit is usually 1–2% of your bankroll. For example, if your bankroll is $1,000, one unit might be $10–20. Betting in units makes your results easy to track, compare, and analyze — no matter the size of your bankroll.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Why Small Bets Win Long-Term</h2>
                    <p className="text-slate-700">
                      It's tempting to chase a big win by betting more, but large swings wipe out bankrolls quickly. By sticking to flat betting (same unit size every time) or a small variation (1–3 units depending on confidence), you protect yourself from losing streaks.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Analyzing Your Bet History</h2>
                    <p className="text-slate-700 mb-4">
                      Your analytics dashboard shows you more than just wins and losses. By looking deeper into your performance, you can identify:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700">
                      <li><strong>Your ROI (Return on Investment):</strong> How much you're earning per dollar risked.</li>
                      <li><strong>Best & Worst Sports/Markets:</strong> Maybe you crush NBA totals but struggle with MLB moneylines.</li>
                      <li><strong>Bet Types That Work:</strong> Some bettors thrive on spreads, others on props.</li>
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Tracking Bets = Finding Your Edge</h2>
                    <p className="text-slate-700">
                      Tracking every wager is what separates disciplined bettors from casual gamblers. Over time, patterns emerge. Maybe you're profitable when betting underdogs but lose when you back heavy favorites. With data, you can double down on what works and cut out what doesn't.
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 p-6">
                    <p className="text-lg font-semibold text-green-900">
                      👉 <strong>Bottom line:</strong> Your bankroll is your foundation, your units are your safety net, and your data is your roadmap. Respect those three, and you give yourself the best chance to succeed while betting responsibly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pro Upgrade Modal */}
        {showProUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white/95 shadow-2xl backdrop-blur-xl">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-medium text-slate-900">Upgrade to Pro</h3>
                  </div>
                  <button
                    onClick={() => setShowProUpgrade(false)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-6">
                  <div className="mb-3 flex items-center space-x-2">
                    <TrueSharpShield className="h-5 w-5" variant="light" />
                    <span className="text-sm font-medium text-slate-900">
                      This feature requires TrueSharp Pro
                    </span>
                  </div>
                  <p className="mb-4 text-sm text-slate-600">
                    Upgrade now for unlimited analytics and advanced features that help you maximize
                    your betting edge.
                  </p>
                  <div className="rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                    <h4 className="mb-3 text-sm font-medium text-slate-900">What you'll get:</h4>
                    <div className="space-y-2">
                      {proFeatures.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-xs text-slate-700">{feature}</span>
                        </div>
                      ))}
                      <div className="mt-2 text-xs text-slate-500">
                        + {proFeatures.length - 4} more features
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowProUpgrade(false)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setShowProUpgrade(false)
                    }}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500"
                  >
                    Try Pro Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
