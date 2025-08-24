// FILE: src/app/analytics/page.tsx
'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
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
  Zap
} from 'lucide-react'
import { useState } from 'react'

// Add the AnalyticsData type definition with bets property
type AnalyticsData = {
  bets: Bet[]
  dailyProfitData: any[]
  metrics: {
    roi: number
    winRate: number
    totalProfit: number
    totalBets: number
    totalStaked: number
    currentStreak: number
    streakType: string
    avgClv?: number
  }
  sportBreakdown: Array<{
    sport: string
    bets: number
    winRate: number
    roi: number
    profit: number
    clv?: number
  }>
}

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
const TrueSharpShield = ({ className = "h-6 w-6", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill={`url(#shieldGradient-${variant})`} 
      stroke={variant === "light" ? "#60a5fa" : "#3b82f6"} 
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
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="h-4 bg-slate-200 rounded mb-2"></div>
          <div className="h-8 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 bg-slate-200 rounded"></div>
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
  description?: string
  bet_type?: string
  odds?: number
  stake?: number
  potential_payout?: number
  actual_payout?: number
  status?: string
  sportsbook?: string
  teams?: string | string[] | null
  game_date?: string
  clv?: number
  closing_line?: number
  line_movement?: number
  expected_value?: number
}

interface BetsTableProps {
  bets: Bet[]
  isPro: boolean
  isLoading: boolean
}

const BetsTable = ({ bets, isPro, isLoading }: BetsTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-12 text-center shadow-lg">
        <List className="h-16 w-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Bets Found</h3>
        <p className="text-slate-600">
          Connect your sportsbook accounts or add manual bets to see your betting data here.
        </p>
      </div>
    )
  }

  // Define which columns are Pro-only
  const proColumns = [
    'clv',
    'line_movement',
    'steam_move',
    'market_consensus',
    'sharp_money',
    'closing_line',
    'expected_value'
  ]

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
      cancelled: 'bg-gray-100 text-gray-800'
    } as const

    type StatusKey = keyof typeof statusColors
    const safeStatus: StatusKey = (status && Object.keys(statusColors).includes(status) ? status : 'pending') as StatusKey

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[safeStatus]}`}>
        {safeStatus}
      </span>
    )
  }

  const BlurredCell = ({ children, isProColumn }: { children: React.ReactNode, isProColumn: boolean }) => {
    if (isProColumn && !isPro) {
      return (
        <td className="relative px-6 py-4 whitespace-nowrap text-sm text-slate-900">
          <div className="filter blur-sm select-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        </td>
      )
    }
    return (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
        {children}
      </td>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">All Bets ({bets.length})</h3>
          {!isPro && (
            <div className="flex items-center text-sm text-slate-500">
              <Lock className="h-4 w-4 mr-1" />
              Some data requires Pro
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-slate-200/50">
          <thead className="bg-slate-50/50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Bet Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Odds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Stake
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Potential Payout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actual Payout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sportsbook
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Teams
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Game Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center">
                  CLV
                  {!isPro && <Lock className="h-3 w-3 ml-1" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Closing Line
                  {!isPro && <Lock className="h-3 w-3 ml-1" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Line Movement
                  {!isPro && <Lock className="h-3 w-3 ml-1" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Expected Value
                  {!isPro && <Lock className="h-3 w-3 ml-1" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-slate-200/50">
            {bets.map((bet, index) => (
              <tr key={bet.id || index} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {formatDate(bet.placed_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {bet.sport || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                  {bet.description || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {bet.bet_type || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {formatOdds(bet.odds)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {formatCurrency(bet.stake)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {formatCurrency(bet.potential_payout)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={
                    (bet.actual_payout ?? 0) > 0
                      ? 'text-green-600'
                      : (bet.actual_payout ?? 0) < 0
                        ? 'text-red-600'
                        : 'text-slate-900'
                  }>
                    {formatCurrency(bet.actual_payout)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {getStatusBadge(bet.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {bet.sportsbook || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {bet.teams ? (
                    <div className="max-w-xs truncate">
                      {typeof bet.teams === 'string' ? bet.teams : JSON.stringify(bet.teams)}
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {formatDate(bet.game_date)}
                </td>
                <BlurredCell isProColumn={true}>
                  {bet.clv ? `${bet.clv > 0 ? '+' : ''}${bet.clv}%` : 'N/A'}
                </BlurredCell>
                <BlurredCell isProColumn={true}>
                  {formatOdds(bet.closing_line)}
                </BlurredCell>
                <BlurredCell isProColumn={true}>
                  {bet.line_movement ? `${bet.line_movement > 0 ? '+' : ''}${bet.line_movement}` : 'N/A'}
                </BlurredCell>
                <BlurredCell isProColumn={true}>
                  {bet.expected_value ? `${bet.expected_value > 0 ? '+' : ''}${bet.expected_value}%` : 'N/A'}
                </BlurredCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {bets.length > 10 && (
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-200/50">
          <p className="text-sm text-slate-500 text-center">
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
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [showProUpgrade, setShowProUpgrade] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const { analyticsData, isLoading, error, filters, updateFilters, totalBets, filteredBetsCount } = useAnalytics(user, isPro)
  // Extract bets array from analyticsData, fallback to empty array if not available
  const bets = analyticsData?.bets || []


  const timeframes = [
    { label: 'Last 7 Days', value: '7d', free: true },
    { label: 'Last 30 Days', value: '30d', free: true },
    { label: 'This Month', value: 'month', free: true },
    { label: 'Last 90 Days', value: '90d', free: false },
    { label: 'Year to Date', value: 'ytd', free: false },
    { label: 'All Time', value: 'all', free: false },
  ];

  const proFeatures = [
    "Unlimited filtering & custom date ranges",
    "Advanced profit, CLV, and correlation charts",
    "Custom report builder & export tools",
    "Performance by bet type, sportsbook, and more",
    "Real-time analytics & streak tracking",
    "Save and share filter presets",
    "Heatmaps and advanced breakdowns",
    "Priority support"
  ];

  const handleProFeatureClick = () => {
    if (!isPro) {
      setShowProUpgrade(true)
    }
  }

  const handleFilterToggle = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
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
      tags: []
    }
    setSavedFilters(prev => [...prev, newFilter])
  }

  type LoadFilterHandler = (filter: SavedFilter) => void

  const handleLoadFilter: LoadFilterHandler = (filter) => {
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
  if (authLoading) {
    return (
      <DashboardLayout current="Analytics">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading authentication...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Mock data for charts (will be replaced with real data)
  const mockProfitData = analyticsData.dailyProfitData.map(day => ({
    date: day.date,
    cumulativeProfit: day.cumulativeProfit,
    dailyProfit: day.profit,
    roi: analyticsData.metrics.roi,
    units: day.cumulativeProfit / 100, // Mock units conversion
    bets: day.bets
  }))

  const mockCLVData = analyticsData.dailyProfitData.map(day => ({
    date: day.date,
    clv: analyticsData.metrics.avgClv || 0.02,
    clvPositive: Math.floor(day.bets * 0.6),
    clvNegative: Math.floor(day.bets * 0.4),
    averageClv: analyticsData.metrics.avgClv || 0.025,
    sharpRatio: 0.65
  }))

  return (
    <DashboardLayout current="Analytics">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <TrueSharpShield className="h-8 w-8" variant="light" />
                <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
                {/* Pro/Free Toggle */}
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`text-sm font-medium ${!isPro ? 'text-blue-600' : 'text-slate-500'}`}>
                    Free
                  </span>
                  <button
                    onClick={() => setIsPro(!isPro)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPro ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPro ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${isPro ? 'text-blue-600' : 'text-slate-500'}`}>
                    Pro
                  </span>
                  {isPro && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
              </div>
              <p className="text-slate-600">
                {isPro 
                  ? "Advanced analytics with unlimited filtering and professional insights"
                  : "Deep dive into your verified betting performance with advanced analytics"
                }
              </p>
              {/* Data summary */}
              <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                <span>Total Bets: {totalBets}</span>
                <span>Filtered: {filteredBetsCount}</span>
                {analyticsData.metrics.totalStaked > 0 && (
                  <span>Total Staked: ${analyticsData.metrics.totalStaked.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'overview' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-1 inline" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('bets')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'bets' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="h-4 w-4 mr-1 inline" />
                  Bets
                </button>
                <button
                  onClick={() => isPro ? setActiveView('advanced') : handleProFeatureClick()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'advanced' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!isPro ? 'opacity-60' : ''}`}
                >
                  <BarChart3 className="h-4 w-4 mr-1 inline" />
                  Advanced
                  {!isPro && <Lock className="h-3 w-3 ml-1 inline" />}
                </button>
                <button
                  onClick={() => isPro ? setActiveView('reports') : handleProFeatureClick()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'reports' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!isPro ? 'opacity-60' : ''}`}
                >
                  <Settings className="h-4 w-4 mr-1 inline" />
                  Reports
                  {!isPro && <Lock className="h-3 w-3 ml-1 inline" />}
                </button>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={isPro ? undefined : handleProFeatureClick}
                className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105 ${!isPro ? 'opacity-75' : ''}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
                {!isPro && <Lock className="h-4 w-4 ml-1" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                  onLoadFilter={(filters) => {
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
              // Original Free Filters
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg sticky top-24">
                <div className="flex items-center space-x-2 mb-6">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                  {isPro && (
                    <div className="ml-auto">
                      <Zap className="h-4 w-4 text-yellow-500" />
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

                <div className="space-y-6">
                  {/* Timeframe Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Time Period
                    </label>
                    <div className="space-y-2">
                      {timeframes.map((timeframe) => (
                        <button
                          key={timeframe.value}
                          onClick={() => handleTimeframeChange(timeframe.value)}
                          disabled={!timeframe.free && !isPro}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                            selectedTimeframe === timeframe.value
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-600 shadow-lg'
                              : (timeframe.free || isPro) 
                                ? 'border-slate-300 hover:border-blue-300 hover:bg-blue-50'
                                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{timeframe.label}</span>
                            {!timeframe.free && !isPro && <Lock className="h-4 w-4" />}
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
                      onDeleteFilter={(id) => setSavedFilters(prev => prev.filter(f => f.id !== id))}
                      onUpdateFilter={(id, updates) => setSavedFilters(prev => prev.map(f => f.id === id ? {...f, ...updates} : f))}
                      onShareFilter={() => {}}
                      isPro={isPro}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Sign in Required</h3>
                    <p className="text-yellow-700 mt-1">Please sign in to view your betting analytics.</p>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'overview' && (
              <>
                {/* Performance Metrics */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Key Metrics</h2>
                  {isLoading ? (
                    <StatsSkeleton />
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                          <p className="text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : analyticsData && analyticsData.metrics.totalBets > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {/* ROI Card */}
                      <div className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          {isPro && <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Real-time</div>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">ROI</p>
                          <p className={`text-2xl font-bold mb-2 ${analyticsData.metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analyticsData.metrics.roi.toFixed(2)}%
                          </p>
                          <p className="text-xs text-slate-500">Return on investment</p>
                        </div>
                      </div>

                      {/* Win Rate Card */}
                      <div className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Win Rate</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{analyticsData.metrics.winRate.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">Percentage of bets won</p>
                        </div>
                      </div>

                      {/* Total Profit Card */}
                      <div className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl shadow-lg ${analyticsData.metrics.totalProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
                            <ArrowUpRight className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Profit</p>
                          <p className={`text-2xl font-bold mb-2 ${analyticsData.metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${analyticsData.metrics.totalProfit.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">Net profit/loss</p>
                        </div>
                      </div>

                      {/* Total Bets Card */}
                      <div className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Bets</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{analyticsData.metrics.totalBets}</p>
                          <p className="text-xs text-slate-500">{analyticsData.metrics.currentStreak > 0 ? `${analyticsData.metrics.currentStreak} ${analyticsData.metrics.streakType} streak` : 'No active streak'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                      <TrueSharpShield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No Betting Data Found</h3>
                      <p className="text-slate-600 mb-4">
                        {user ? "Connect your sportsbook accounts or add some sample bets to start tracking your betting performance." : "Sign in to view your betting analytics."}
                      </p>
                      {user && (
                        <div className="flex justify-center space-x-4">
                          <button 
                            onClick={() => window.location.href = '/settings'}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Connect Sportsbook
                          </button>
                          <button 
                            onClick={() => window.location.href = '/bets'}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                      data={mockProfitData}
                      isPro={isPro}
                      timeframe={selectedTimeframe}
                      onTimeframeChange={handleTimeframeChange}
                    />
                  </div>
                )}

                {/* Sport Breakdown */}
                {analyticsData.sportBreakdown.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-slate-900">Performance by Sport</h2>
                      <button
                        onClick={isPro ? () => setActiveView('advanced') : handleProFeatureClick}
                        className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                      >
                        View Advanced <ChevronRight className="h-4 w-4 ml-1" />
                        {!isPro && <Lock className="h-3 w-3 ml-1" />}
                      </button>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/50">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Sport
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Total Bets
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Win Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                ROI
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Profit
                              </th>
                              {isPro && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  CLV
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white/50 divide-y divide-slate-200/50">
                            {analyticsData.sportBreakdown.map((sport) => (
                              <tr key={sport.sport} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-900">{sport.sport}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {sport.bets}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {sport.winRate.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={sport.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {sport.roi.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={sport.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    ${sport.profit.toFixed(2)}
                                  </span>
                                </td>
                                {isPro && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                    <List className="h-5 w-5 mr-2" />
                    All Bets Data
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <span>Raw data from Supabase</span>
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-red-800">Error Loading Bets</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                        <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg mb-6">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Information</h3>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
                    <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                    <p>Error: {error ? 'Yes' : 'No'}</p>
                    <p>Bets Array: {bets ? `${bets.length} items` : 'Undefined/null'}</p>
                    <p>Analytics Data: {analyticsData ? 'Available' : 'Not available'}</p>
                    <p>Pro Mode: {isPro ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  {bets && bets.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-blue-800 cursor-pointer">View First Bet Raw Data</summary>
                      <pre className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(bets[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <BetsTable 
                  bets={bets || []} 
                  isPro={isPro} 
                  isLoading={isLoading}
                />
              </div>
            )}

            {activeView === 'advanced' && isPro && (
              <div className="space-y-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                  <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                  Advanced Analytics
                </h2>
                
                <CLVChart data={mockCLVData} isPro={isPro} />
                
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
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                  <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                  Custom Reports
                </h2>
                
                <CustomReportBuilder
                  isPro={isPro}
                  onReportGenerate={() => {}}
                  savedTemplates={[]}
                  onSaveTemplate={() => {}}
                />
                
                <ExportTools
                  isPro={isPro}
                  reportData={{}}
                  onExport={() => {}}
                />
              </div>
            )}

            {/* Pro Upgrade Banner - Only show if not Pro */}
            {!isPro && (
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <Crown className="h-8 w-8 text-yellow-300 mr-3" />
                      <h3 className="text-2xl font-bold">Unlock Advanced Analytics</h3>
                    </div>
                    <p className="text-blue-100 mb-6 max-w-2xl">
                      Get unlimited filtering, custom date ranges, and professional-grade analytics tools to maximize your edge.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl">
                      {proFeatures.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <TrueSharpShield className="h-4 w-4 mr-2" variant="light" />
                          <span className="text-sm text-blue-100">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="text-4xl font-bold mb-1">$19.99</div>
                      <div className="text-blue-200 text-sm">/month</div>
                    </div>
                    <button
                      onClick={() => setIsPro(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      Try Pro Mode
                      <ArrowUpRight className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pro Upgrade Modal */}
        {showProUpgrade && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-medium text-slate-900">Upgrade to Pro</h3>
                  </div>
                  <button
                    onClick={() => setShowProUpgrade(false)}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrueSharpShield className="h-5 w-5" variant="light" />
                    <span className="text-sm font-medium text-slate-900">This feature requires TrueSharp Pro</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Upgrade now for unlimited analytics and advanced features that help you maximize your betting edge.
                  </p>
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
                    <h4 className="text-sm font-medium text-slate-900 mb-3">What you'll get:</h4>
                    <div className="space-y-2">
                      {proFeatures.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-xs text-slate-700">{feature}</span>
                        </div>
                      ))}
                      <div className="text-xs text-slate-500 mt-2">+ {proFeatures.length - 4} more features</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowProUpgrade(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setIsPro(true);
                      setShowProUpgrade(false);
                    }}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105 shadow-lg"
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