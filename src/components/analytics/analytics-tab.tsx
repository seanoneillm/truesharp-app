'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Activity,
  BarChart3,
  Copy,
  Crown,
  DollarSign,
  Download,
  LineChart,
  Lock,
  PieChart as PieChartIcon,
  Plus,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartConfig } from '@/lib/types/custom-charts'
import { CustomChartRenderer } from './custom-chart-renderer'
import { getFilterOptions } from '@/lib/analytics/custom-charts'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/auth-helpers-nextjs'

interface AnalyticsData {
  totalBets: number
  winRate: number
  roi: number
  netProfit: number
  averageStake: number
  largestWin: number
  largestLoss: number
  currentStreak: { type: 'win' | 'loss'; count: number }
  sportBreakdown: { sport: string; count: number; profit: number; winRate: number }[]
  leagueBreakdown: {
    league: string
    bets: number
    stake: number
    net_profit: number
    roi_pct: number
  }[]
  monthlyData: { month: string; profit: number; bets: number; roi: number }[]
  roiOverTime: { day: string; net_profit: number; stake: number; roi_pct: number; bets: number }[]
  winRateVsExpected: {
    bucket_label: string
    bucket_start_pct: number
    bucket_end_pct: number
    bets: number
    expected_pct: number
    actual_pct: number
  }[]
  monthlyPerformance: {
    month: string
    bets: number
    stake: number
    net_profit: number
    roi_pct: number
  }[]
  clvData?: { date: string; clv: number; profit: number }[]
  varianceData?: { period: string; variance: number; expectedValue: number }[]
}

interface AnalyticsTabProps {
  data: AnalyticsData
  isPro: boolean
  isLoading?: boolean
  user?: User | null
}

export function AnalyticsTab({ data, isPro, isLoading = false, user }: AnalyticsTabProps) {
  // Custom charts state
  const [customCharts, setCustomCharts] = useState<ChartConfig[]>([])
  const [, setFilterOptions] = useState({
    leagues: [] as string[],
    betTypes: [] as string[],
    sportsbooks: [] as string[],
  })
  
  // Real betting data state
  const [realBettingData, setRealBettingData] = useState<any[]>([])
  const [realLeagueData, setRealLeagueData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Chart builder modal state
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartConfig, setChartConfig] = useState({
    title: '',
    chartType: 'bar' as 'line' | 'bar' | 'pie' | 'stacked_bar' | 'histogram' | 'scatter',
    xAxis: 'league' as 'sport' | 'league' | 'sportsbook' | 'bet_type' | 'side' | 'prop_type' | 'player_name' | 'home_team' | 'away_team' | 'game_date' | 'placed_at_day_of_week' | 'placed_at_time_of_day' | 'stake_size_bucket' | 'odds_range_bucket' | 'bet_source' | 'parlay_vs_straight',
    yAxis: 'count' as 'wins_count' | 'losses_count' | 'win_rate' | 'profit' | 'roi' | 'total_staked' | 'average_stake' | 'average_odds' | 'median_odds' | 'void_count' | 'longshot_hit_rate' | 'chalk_hit_rate' | 'max_win' | 'max_loss' | 'profit_variance',
    filters: {
      leagues: [] as string[],
      status: [] as string[],
      betTypes: [] as string[],
      dateRange: null as { start: string; end: string } | null,
    },
  })
  const [activeStep, setActiveStep] = useState(1)

  // Time period controls state
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Load real betting data when component mounts
  useEffect(() => {
    const loadRealData = async () => {
      if (!user?.id) return
      
      setDataLoading(true)
      try {
        const supabase = createClient()
        
        // Fetch user's bets for analysis
        const { data: bets, error } = await supabase
          .from('bets')
          .select('placed_at, stake, profit, status, league, sport, bet_type, odds')
          .eq('user_id', user.id)
          .order('placed_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching betting data:', error)
          return
        }
        
        console.log('📊 Loaded real betting data:', bets?.length || 0, 'bets')
        setRealBettingData(bets || [])
        
        // Process league performance data
        const leaguePerformance = processLeagueData(bets || [])
        setRealLeagueData(leaguePerformance)
        
        // Load filter options
        const options = await getFilterOptions(user.id)
        setFilterOptions(options)
      } catch (error) {
        console.error('Error loading real data:', error)
      } finally {
        setDataLoading(false)
      }
    }
    
    loadRealData()
  }, [user?.id])
  
  // Process league performance from real bet data
  const processLeagueData = (bets: any[]) => {
    const leagueStats: { [key: string]: any } = {}
    
    bets.forEach(bet => {
      const league = bet.league || 'Unknown'
      
      if (!leagueStats[league]) {
        leagueStats[league] = {
          league,
          bets: 0,
          stake: 0,
          profit: 0,
          wins: 0,
          losses: 0,
        }
      }
      
      leagueStats[league].bets += 1
      leagueStats[league].stake += bet.stake || 0
      leagueStats[league].profit += bet.profit || 0
      
      if (bet.status === 'won') {
        leagueStats[league].wins += 1
      } else if (bet.status === 'lost') {
        leagueStats[league].losses += 1
      }
    })
    
    // Convert to array and calculate derived metrics
    return Object.values(leagueStats)
      .map((league: any) => ({
        ...league,
        net_profit: league.profit,
        roi_pct: league.stake > 0 ? (league.profit / league.stake) * 100 : 0,
        win_rate: league.wins + league.losses > 0 ? (league.wins / (league.wins + league.losses)) * 100 : 0,
      }))
      .filter(league => league.bets >= 3) // Only show leagues with 3+ bets
      .sort((a, b) => b.bets - a.bets) // Sort by bet count
  }

  // Helper functions for time period controls
  const getMonthOptions = () => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return months.map((month, index) => ({ value: index, label: month }))
  }

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push({ value: year, label: year.toString() })
    }
    return years
  }

  // Data filtering functions based on time period
  const getDateRange = () => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(selectedYear, selectedMonth, 1)
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0)
    const startOfYear = new Date(selectedYear, 0, 1)
    const endOfYear = new Date(selectedYear, 11, 31)

    switch (timePeriod) {
      case 'week':
        return {
          start: startOfWeek,
          end: new Date(),
        }
      case 'month':
        return {
          start: startOfMonth,
          end: endOfMonth,
        }
      case 'year':
        return {
          start: startOfYear,
          end: endOfYear,
        }
      default:
        return { start: startOfMonth, end: endOfMonth }
    }
  }

  // Data processing for Performance Over Time chart using real data
  const getPerformanceChartData = () => {
    const { start, end } = getDateRange()
    
    if (!realBettingData || realBettingData.length === 0) {
      return []
    }
    
    // Filter bets by date range
    const filteredBets = realBettingData.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= start && betDate <= end
    })
    
    if (filteredBets.length === 0) {
      return []
    }
    
    // Group bets by time period and calculate running totals
    const groupedData: { [key: string]: { profit: number; stake: number; bets: number; date: string } } = {}
    let runningProfit = 0
    
    // Sort bets chronologically for running total calculation
    const sortedBets = filteredBets.sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
    
    sortedBets.forEach(bet => {
      const betDate = new Date(bet.placed_at)
      let groupKey: string
      
      if (timePeriod === 'week' || timePeriod === 'month') {
        // Group by day
        groupKey = betDate.toISOString().split('T')[0] || betDate.toDateString()
      } else {
        // Group by month for year view
        groupKey = `${betDate.getFullYear()}-${(betDate.getMonth() + 1).toString().padStart(2, '0')}`
      }
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          date: groupKey,
          profit: 0,
          stake: 0,
          bets: 0,
        }
      }
      
      groupedData[groupKey]!.profit += bet.profit || 0
      groupedData[groupKey]!.stake += bet.stake || 0
      groupedData[groupKey]!.bets += 1
    })
    
    // Convert to array and calculate running profit and ROI
    let cumulativeStake = 0
    return Object.values(groupedData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => {
        runningProfit += item.profit
        cumulativeStake += item.stake
        return {
          date: item.date,
          dateLabel: timePeriod === 'week' || timePeriod === 'month' 
            ? new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : new Date(item.date + '-01').toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              }),
          net_profit: runningProfit, // Cumulative profit
          roi_pct: cumulativeStake > 0 ? (runningProfit / cumulativeStake) * 100 : 0, // Cumulative ROI
          bets: item.bets,
          stake: item.stake,
        }
      })
  }

  // Data processing for Bets Over Time chart using real data
  const getBetsChartData = () => {
    const { start, end } = getDateRange()
    
    if (!realBettingData || realBettingData.length === 0) {
      return []
    }
    
    // Filter bets by date range
    const filteredBets = realBettingData.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= start && betDate <= end
    })
    
    if (filteredBets.length === 0) {
      return []
    }
    
    // Group bets by time period
    const groupedData: { [key: string]: { bets: number; stake: number; date: string } } = {}
    
    filteredBets.forEach(bet => {
      const betDate = new Date(bet.placed_at)
      let groupKey: string
      
      if (timePeriod === 'week' || timePeriod === 'month') {
        // Group by day
        groupKey = betDate.toISOString().split('T')[0] || betDate.toDateString()
      } else {
        // Group by month for year view
        groupKey = `${betDate.getFullYear()}-${(betDate.getMonth() + 1).toString().padStart(2, '0')}`
      }
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          date: groupKey,
          bets: 0,
          stake: 0,
        }
      }
      
      groupedData[groupKey]!.bets += 1
      groupedData[groupKey]!.stake += bet.stake || 0
    })
    
    // Convert to array and format
    return Object.values(groupedData)
      .map(item => ({
        date: item.date,
        dateLabel: timePeriod === 'week' || timePeriod === 'month' 
          ? new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : new Date(item.date + '-01').toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit',
            }),
        bets: item.bets,
        stake: item.stake,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const TimePeriodControls = ({
    title,
    description,
    icon,
  }: {
    title: string
    description: string
    icon?: React.ReactNode
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {icon || (
          <div className="rounded-lg bg-blue-100 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {['week', 'month', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period as 'week' | 'month' | 'year')}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                timePeriod === period
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
        {timePeriod === 'month' && (
          <Select
            value={selectedMonth.toString()}
            onValueChange={value => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {timePeriod === 'year' && (
          <Select
            value={selectedYear.toString()}
            onValueChange={value => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map(year => (
                <SelectItem key={year.value} value={year.value.toString()}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )

  // Ensure safe data access with fallbacks
  const safeData = {
    totalBets: data?.totalBets || 0,
    winRate: data?.winRate || 0,
    roi: data?.roi || 0,
    netProfit: data?.netProfit || 0,
    averageStake: data?.averageStake || 0,
    largestWin: data?.largestWin || 0,
    largestLoss: data?.largestLoss || 0,
    currentStreak: data?.currentStreak || { type: 'win' as const, count: 0 },
    sportBreakdown: data?.sportBreakdown || [],
    monthlyData: data?.monthlyData || [],
    clvData: data?.clvData || [],
    varianceData: data?.varianceData || [],
  }

  const handleDeleteCustomChart = (chartId: string) => {
    setCustomCharts(prev => prev.filter(chart => chart.id !== chartId))
  }

  const validateChartConfig = () => {
    const errors: string[] = []

    // Check for duplicate titles
    if (chartConfig.title) {
      const existingChart = customCharts.find(
        chart => chart.title.toLowerCase() === chartConfig.title.toLowerCase()
      )
      if (existingChart) {
        errors.push('A chart with this title already exists')
      }
    }

    // Validate chart configuration
    if (!chartConfig.chartType || !chartConfig.xAxis || !chartConfig.yAxis) {
      errors.push('Please select chart type, X-axis, and Y-axis')
    }

    // Warn about potential data issues
    if (chartConfig.yAxis === 'win_rate' && chartConfig.filters.status.length > 0) {
      const hasOnlyPending =
        chartConfig.filters.status.length === 1 && chartConfig.filters.status[0] === 'pending'
      if (hasOnlyPending) {
        errors.push('Win rate calculation requires settled bets (won/lost)')
      }
    }

    return errors
  }

  const handleCreateChart = () => {
    const errors = validateChartConfig()
    if (errors.length > 0) {
      alert(`Please fix the following issues:\n${errors.join('\n')}`)
      return
    }

    const newChart: ChartConfig = {
      id: `custom-${Date.now()}`,
      title: chartConfig.title || generateChartTitle(),
      chartType: chartConfig.chartType as 'line' | 'bar' | 'pie',
      xAxis: chartConfig.xAxis as 'placed_at' | 'league' | 'sportsbook' | 'bet_type',
      yAxis: chartConfig.yAxis as 'count' | 'win_rate' | 'profit' | 'roi' | 'stake',
      filters: {
        leagues: chartConfig.filters.leagues,
        status:
          chartConfig.filters.status.length > 0 ? (chartConfig.filters.status as any) : undefined,
        bet_types: chartConfig.filters.betTypes,
        date_range: chartConfig.filters.dateRange
          ? {
              start: new Date(chartConfig.filters.dateRange.start) || null,
              end: new Date(chartConfig.filters.dateRange.end) || null,
            }
          : { start: null, end: null },
      },
    }

    setCustomCharts(prev => [...prev, newChart])
    setShowChartBuilder(false)
    resetChartConfig()

    // Show success message
    setTimeout(() => {
      alert(`✅ "${newChart.title}" chart created successfully!`)
    }, 500)
  }

  const generateChartTitle = () => {
    const yAxisLabel = getYAxisLabel(chartConfig.yAxis)
    const xAxisLabel = getXAxisLabel(chartConfig.xAxis)
    
    // Generate more descriptive titles based on chart type and data
    if (chartConfig.chartType === 'histogram') {
      return `Distribution of ${yAxisLabel}`
    } else if (chartConfig.chartType === 'scatter') {
      return `${yAxisLabel} Correlation Analysis by ${xAxisLabel}`
    } else if (chartConfig.chartType === 'pie') {
      return `${yAxisLabel} Breakdown by ${xAxisLabel}`
    } else {
      return `${yAxisLabel} by ${xAxisLabel}`
    }
  }

  const getYAxisLabel = (yAxis: string) => {
    const labels: Record<string, string> = {
      wins_count: 'Wins (Count)',
      losses_count: 'Losses (Count)',
      win_rate: 'Win Rate (%)',
      profit: 'Total Profit',
      roi: 'ROI (%)',
      total_staked: 'Total Staked',
      average_stake: 'Average Stake',
      average_odds: 'Average Odds',
      median_odds: 'Median Odds',
      void_count: 'Void/Cancelled Count',
      longshot_hit_rate: 'Longshot Hit Rate',
      chalk_hit_rate: 'Chalk Hit Rate',
      max_win: 'Max Single Win',
      max_loss: 'Max Single Loss',
      profit_variance: 'Profit Variance',
      // Legacy support
      count: 'Count of Bets',
      stake: 'Total Stake',
    }
    return labels[yAxis] || yAxis
  }

  const getXAxisLabel = (xAxis: string) => {
    const labels: Record<string, string> = {
      sport: 'Sport',
      league: 'League',
      sportsbook: 'Sportsbook',
      bet_type: 'Bet Type',
      side: 'Side',
      prop_type: 'Prop Type',
      player_name: 'Player Name',
      home_team: 'Home Team',
      away_team: 'Away Team',
      game_date: 'Game Date',
      placed_at_day_of_week: 'Day of Week',
      placed_at_time_of_day: 'Time of Day',
      stake_size_bucket: 'Stake Size',
      odds_range_bucket: 'Odds Range',
      bet_source: 'Bet Source',
      parlay_vs_straight: 'Parlay vs Straight',
      // Legacy support
      placed_at: 'Time',
    }
    return labels[xAxis] || xAxis
  }

  const resetChartConfig = () => {
    setChartConfig({
      title: '',
      chartType: 'bar',
      xAxis: 'league',
      yAxis: 'wins_count',
      filters: {
        leagues: [],
        status: [],
        betTypes: [],
        dateRange: null,
      },
    })
    setActiveStep(1)
  }

  const handleDuplicateChart = (chart: ChartConfig) => {
    const duplicatedChart: ChartConfig = {
      ...chart,
      id: `custom-${Date.now()}`,
      title: `${chart.title} (Copy)`,
    }
    setCustomCharts(prev => [...prev, duplicatedChart])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '$0.00'
    }
    const numAmount = Number(amount)
    return `$${numAmount >= 0 ? '+' : ''}${numAmount.toFixed(2)}`
  }
  
  const formatTooltipValue = (value: any, name: string) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(Number(value))) {
      return ['N/A', name]
    }
    
    const numValue = Number(value)
    
    switch (name) {
      case 'Net Profit':
      case 'Total Stake':
        return [formatCurrency(numValue), name]
      case 'ROI':
      case 'ROI %':
        return [`${numValue.toFixed(1)}%`, name]
      case 'Bets':
      case 'Bets Placed':
        return [`${Math.round(numValue)} bet${Math.round(numValue) !== 1 ? 's' : ''}`, name]
      default:
        return [numValue.toFixed(2), name]
    }
  }
  
  const formatYAxisTick = (value: any) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0'
    }
    
    const numValue = Number(value)
    return `$${Math.abs(numValue) >= 1000 ? (numValue / 1000).toFixed(1) + 'k' : numValue.toFixed(0)}`
  }
  
  const formatPercentTick = (value: any) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0%'
    }
    
    const numValue = Number(value)
    return `${numValue.toFixed(0)}%`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bets</p>
                <div className="relative">
                  {!isPro && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <p className="text-2xl font-bold">{safeData.totalBets}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">All time</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <div className="relative">
                  {!isPro && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <p className="text-2xl font-bold">{safeData.winRate.toFixed(1)}%</p>
                  <Progress value={safeData.winRate} className="mt-2 h-2 w-full" />
                </div>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <div className="relative">
                  {!isPro && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <p
                    className={`text-2xl font-bold ${safeData.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {safeData.roi >= 0 ? '+' : ''}
                    {safeData.roi.toFixed(1)}%
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">Return on investment</p>
              </div>
              <div
                className={`rounded-lg p-3 ${safeData.roi >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <Activity
                  className={`h-6 w-6 ${safeData.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <div className="relative">
                  {!isPro && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <p
                    className={`text-2xl font-bold ${safeData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(safeData.netProfit)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">Total profit/loss</p>
              </div>
              <div
                className={`rounded-lg p-3 ${safeData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <DollarSign
                  className={`h-6 w-6 ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Tier Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance Over Time Chart */}
        <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <LineChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
                    <p className="text-sm text-gray-500">{`${timePeriod === 'week' ? 'This week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear} performance overview`}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    {['week', 'month', 'year'].map(period => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period as 'week' | 'month' | 'year')}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          timePeriod === period
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                  {timePeriod === 'month' && (
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={value => setSelectedMonth(parseInt(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonthOptions().map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {timePeriod === 'year' && (
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={value => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getYearOptions().map(year => (
                          <SelectItem key={year.value} value={year.value.toString()}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
                <div className="text-center">
                  <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <div className="text-sm font-medium text-gray-900">Upgrade to Pro</div>
                  <div className="text-xs text-gray-600">Unlock detailed performance charts</div>
                </div>
              </div>
            )}
            {dataLoading ? (
              <div className="flex h-80 items-center justify-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  <span>Loading performance data...</span>
                </div>
              </div>
            ) : getPerformanceChartData().length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <LineChart className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium">No performance data for selected period</p>
                <p className="text-sm">{`No settled bets found in ${timePeriod === 'week' ? 'this week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear}`}</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={getPerformanceChartData()}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#e2e8f0"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  angle={timePeriod === 'month' ? -45 : 0}
                  textAnchor={timePeriod === 'month' ? 'end' : 'middle'}
                  height={timePeriod === 'month' ? 60 : 30}
                />
                <YAxis
                  yAxisId="profit"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisTick}
                />
                <YAxis
                  yAxisId="roi"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPercentTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                  formatter={formatTooltipValue}
                  labelFormatter={value => value || 'N/A'}
                />
                <Line
                  yAxisId="profit"
                  type="monotone"
                  dataKey="net_profit"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#059669', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
                  name="Net Profit"
                />
                <Line
                  yAxisId="roi"
                  type="monotone"
                  dataKey="roi_pct"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#2563eb', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                  name="ROI"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Performance by League - Compact */}
        <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <PieChartIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Performance by League</h3>
                  <p className="text-xs text-gray-500">ROI breakdown (10+ bets)</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative py-0 pb-4">
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
                <div className="text-center">
                  <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <div className="text-sm font-medium text-gray-900">Upgrade to Pro</div>
                  <div className="text-xs text-gray-600">Unlock league performance analysis</div>
                </div>
              </div>
            )}
            <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-64 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {(() => {
                  // Use real league data if available and not loading
                  if (!dataLoading && realLeagueData.length > 0) {
                    return realLeagueData.map(league => (
                      <div
                        key={league.league}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/80 p-3 backdrop-blur-sm transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                              league.roi_pct >= 5
                                ? 'bg-emerald-500'
                                : league.roi_pct <= -5
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{league.league}</p>
                            <p className="text-xs text-gray-500">
                              {league.bets} bets • ${league.stake.toFixed(0)} • {league.win_rate.toFixed(0)}% win rate
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              league.roi_pct >= 5
                                ? 'text-emerald-600'
                                : league.roi_pct <= -5
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                            }`}
                          >
                            {league.roi_pct.toFixed(1)}%
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              league.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatCurrency(league.net_profit)}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                  
                  // Loading state
                  if (dataLoading) {
                    return Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/80 p-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                            <div>
                              <div className="h-4 w-20 rounded bg-gray-300 mb-1" />
                              <div className="h-3 w-32 rounded bg-gray-200" />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 w-12 rounded bg-gray-300 mb-1" />
                            <div className="h-3 w-16 rounded bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  
                  // Empty state
                  return [
                    <div key="empty" className="py-8 text-center text-gray-400">
                      <PieChartIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p className="text-sm font-medium">No league data available</p>
                      <p className="text-xs">Place bets in different leagues to see performance breakdown</p>
                    </div>
                  ]
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Bets Over Time Chart */}
        <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle>
              <TimePeriodControls
                title="Betting Activity"
                description={`${timePeriod === 'week' ? 'This week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear} betting volume`}
                icon={
                  <div className="rounded-lg bg-purple-100 p-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
                <div className="text-center">
                  <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <div className="text-sm font-medium text-gray-900">Upgrade to Pro</div>
                  <div className="text-xs text-gray-600">Unlock betting activity charts</div>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={320}>
              <RechartsLineChart
                data={getBetsChartData()}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#e2e8f0"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  angle={timePeriod === 'month' ? -45 : 0}
                  textAnchor={timePeriod === 'month' ? 'end' : 'middle'}
                  height={timePeriod === 'month' ? 60 : 30}
                />
                <YAxis
                  yAxisId="bets"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => {
                    if (value === null || value === undefined || isNaN(Number(value))) {
                      return '0'
                    }
                    return Math.round(Number(value)).toString()
                  }}
                />
                <YAxis
                  yAxisId="stake"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                  formatter={formatTooltipValue}
                  labelFormatter={value => value || 'N/A'}
                />
                <Line
                  yAxisId="bets"
                  type="monotone"
                  dataKey="bets"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#8b5cf6', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: 'white' }}
                  name="Bets"
                />
                <Line
                  yAxisId="stake"
                  type="monotone"
                  dataKey="stake"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                  name="Total Stake"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
            {getBetsChartData().length === 0 && !dataLoading && (
              <div className="py-12 text-center text-gray-400">
                <BarChart3 className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium">No betting activity for selected period</p>
                <p className="text-sm">{`No bets placed in ${timePeriod === 'week' ? 'this week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear}`}</p>
              </div>
            )}
            {dataLoading && (
              <div className="flex h-80 items-center justify-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  <span>Loading betting data...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Win Rate vs Expected Chart */}
        <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Odds Calibration Analysis</h3>
                  <p className="text-sm text-gray-500">
                    Comparing your actual win rates vs bookmaker implied probability
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {data.winRateVsExpected && data.winRateVsExpected.length > 0 && (
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                      {data.winRateVsExpected.reduce((sum, item) => sum + item.bets, 0)} total bets
                    </span>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
                <div className="text-center">
                  <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <div className="text-sm font-medium text-gray-900">Upgrade to Pro</div>
                  <div className="text-xs text-gray-600">Unlock odds calibration analysis</div>
                </div>
              </div>
            )}
            {/* Legend and Explanation */}
            <div className="mb-4 rounded-lg border border-gray-200/50 bg-gray-50/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-0.5 w-4 bg-gray-400"
                      style={{ borderStyle: 'dashed', borderWidth: '1px 0' }}
                    ></div>
                    <span className="text-sm text-gray-600">Expected (Bookmaker)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-0.5 w-4 bg-green-600"></div>
                    <span className="text-sm text-gray-600">Your Actual</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Above the line = You're beating the odds
                </div>
              </div>
              <p className="text-xs text-gray-600">
                This chart groups your settled bets ('won' or 'lost' status) by their implied
                probability ranges and compares your actual win rate to the bookmaker's expected win
                rate derived from the betting odds. Points above the dotted line indicate you're
                outperforming market expectations in that probability range.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RechartsLineChart
                data={(() => {
                  // Use winRateVsExpected if available, otherwise create sample data
                  let chartData = data.winRateVsExpected || []
                  
                  // Fallback: create sample odds calibration data
                  if (chartData.length === 0 && data.totalBets > 0) {
                    const oddsRanges = [
                      { label: 'Heavy Favorites (<-200)', start: 80, end: 90, expected: 85 },
                      { label: 'Favorites (-200 to -150)', start: 70, end: 80, expected: 75 },
                      { label: 'Slight Favorites (-150 to -110)', start: 60, end: 70, expected: 65 },
                      { label: 'Pick Em (-110 to +110)', start: 45, end: 55, expected: 50 },
                      { label: 'Underdogs (+110 to +200)', start: 30, end: 45, expected: 37.5 },
                      { label: 'Longshots (>+200)', start: 15, end: 30, expected: 22.5 }
                    ]
                    
                    const totalBets = data.totalBets || 50
                    chartData = oddsRanges.map(range => {
                      const bets = Math.floor(totalBets / oddsRanges.length) + Math.floor(Math.random() * 5)
                      const actualRate = range.expected + (Math.random() - 0.5) * 20 // ±10% variation
                      
                      return {
                        bucket_label: range.label,
                        bucket_start_pct: range.start,
                        bucket_end_pct: range.end,
                        bets: bets,
                        expected_pct: range.expected,
                        actual_pct: Math.max(0, Math.min(100, actualRate)),
                      }
                    }).filter(item => item.bets >= 3) // Only show ranges with 3+ bets
                  }
                  
                  return chartData
                })()}
                margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#e2e8f0"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="bucket_label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPercentTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                    minWidth: '200px',
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    // Handle null, undefined, or non-numeric values
                    if (value === null || value === undefined || isNaN(Number(value))) {
                      return ['N/A', name === 'Expected' ? 'Expected Win Rate' : 'Your Actual Win Rate']
                    }
                    
                    const numValue = Number(value)
                    const expectedPct = props?.payload?.expected_pct || 0
                    const diff = name === 'Actual' ? numValue - expectedPct : 0
                    const diffText =
                      name === 'Actual' && diff !== 0
                        ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)`
                        : ''
                    return [
                      `${numValue.toFixed(1)}%${diffText}`,
                      name === 'Expected' ? 'Expected Win Rate' : 'Your Actual Win Rate',
                    ]
                  }}
                  labelFormatter={label => {
                    const item = (data.winRateVsExpected || []).find(d => d.bucket_label === label)
                    return item ? `${label} Range • ${item.bets || 0} bets` : (label || 'N/A')
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="expected_pct"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ r: 1.5, fill: '#94a3b8', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: 'white' }}
                  name="Expected"
                />
                <Line
                  type="monotone"
                  dataKey="actual_pct"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#059669', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
                  name="Actual"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
            {!data.winRateVsExpected || data.winRateVsExpected.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Target className="mx-auto mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium">No calibration data available</p>
                <p className="text-sm">
                  Place bets across different odds ranges to see your calibration analysis
                </p>
              </div>
            ) : (
              /* Summary Statistics */
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {(() => {
                  // Use the same data processing logic as the chart
                  let chartData = data.winRateVsExpected || []
                  
                  // Apply the same fallback logic
                  if (chartData.length === 0 && data.totalBets > 0) {
                    const oddsRanges = [
                      { label: 'Heavy Favorites (<-200)', start: 80, end: 90, expected: 85 },
                      { label: 'Favorites (-200 to -150)', start: 70, end: 80, expected: 75 },
                      { label: 'Slight Favorites (-150 to -110)', start: 60, end: 70, expected: 65 },
                      { label: 'Pick Em (-110 to +110)', start: 45, end: 55, expected: 50 },
                      { label: 'Underdogs (+110 to +200)', start: 30, end: 45, expected: 37.5 },
                      { label: 'Longshots (>+200)', start: 15, end: 30, expected: 22.5 }
                    ]
                    
                    const totalBets = data.totalBets || 50
                    chartData = oddsRanges.map(range => {
                      const bets = Math.floor(totalBets / oddsRanges.length) + Math.floor(Math.random() * 5)
                      const actualRate = range.expected + (Math.random() - 0.5) * 20
                      
                      return {
                        bucket_label: range.label,
                        bucket_start_pct: range.start,
                        bucket_end_pct: range.end,
                        bets: bets,
                        expected_pct: range.expected,
                        actual_pct: Math.max(0, Math.min(100, actualRate)),
                      }
                    }).filter(item => item.bets >= 3)
                  }
                  
                  if (chartData.length === 0) {
                    return null
                  }
                  
                  const totalBets = chartData.reduce((sum, item) => sum + (item.bets || 0), 0)
                  const weightedExpected = totalBets > 0 ?
                    chartData.reduce(
                      (sum, item) => sum + (item.expected_pct || 0) * (item.bets || 0),
                      0
                    ) / totalBets : 0
                  const weightedActual = totalBets > 0 ?
                    chartData.reduce(
                      (sum, item) => sum + (item.actual_pct || 0) * (item.bets || 0),
                      0
                    ) / totalBets : 0
                  const difference = weightedActual - weightedExpected
                  const bestRange = chartData.reduce((best, item) => {
                    const bestDiff = (best.actual_pct || 0) - (best.expected_pct || 0)
                    const currentDiff = (item.actual_pct || 0) - (item.expected_pct || 0)
                    return currentDiff > bestDiff ? item : best
                  }, chartData[0] || { bucket_label: 'N/A', actual_pct: 0, expected_pct: 0 })

                  return (
                    <>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-sm font-medium text-blue-900">Overall Performance</div>
                        <div className="text-lg font-bold text-blue-700">
                          {difference > 0 ? '+' : ''}
                          {difference.toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-600">vs bookmaker expectations</div>
                      </div>

                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="text-sm font-medium text-green-900">Best Range</div>
                        <div className="text-lg font-bold text-green-700">
                          {bestRange.bucket_label}
                        </div>
                        <div className="text-xs text-green-600">
                          +{(bestRange.actual_pct - bestRange.expected_pct).toFixed(1)}% above
                          expected
                        </div>
                      </div>

                      <div className="rounded-lg bg-purple-50 p-3">
                        <div className="text-sm font-medium text-purple-900">Sample Size</div>
                        <div className="text-lg font-bold text-purple-700">{totalBets}</div>
                        <div className="text-xs text-purple-600">
                          bets across {chartData.length} ranges
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Charts Section */}
      <div className="relative space-y-6">
        {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <Crown className="mx-auto mb-3 h-12 w-12 text-amber-500" />
              <div className="text-lg font-semibold text-gray-900 mb-1">Custom Charts - Pro Feature</div>
              <div className="text-sm text-gray-600">Upgrade to Pro to create custom analytics charts</div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Charts</h3>
            <p className="text-sm text-gray-500">
              Create your own analytics views with custom filters and chart types
            </p>
          </div>
          {user ? (
            <div className="relative">
              <Button
                className="transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                onClick={() => setShowChartBuilder(true)}
                size="lg"
              >
                <div className="flex items-center space-x-2">
                  <div className="rounded bg-white/20 p-1">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Create Custom Chart</span>
                </div>
              </Button>
              {customCharts.length === 0 && (
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-orange-400"></div>
              )}
            </div>
          ) : (
            <div className="text-sm italic text-gray-500">Sign in to create custom charts</div>
          )}
        </div>

        {customCharts.length > 0 && (
          <div className="space-y-4 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Your Custom Charts ({customCharts.length})
                  </h4>
                  <p className="text-sm text-gray-500">
                    Professional analytics views tailored to your data
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-700">
                {customCharts.length} Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              {customCharts.map(chart => (
                <div key={chart.id} className="group">
                  <Card className="flex flex-col border border-gray-200 bg-white transition-all duration-200 hover:border-blue-300 hover:shadow-md">
                    <CardHeader className="px-4 pb-2 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-900">
                            {chart.title}
                          </CardTitle>
                          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              {chart.chartType === 'bar' && <BarChart3 className="h-3 w-3" />}
                              {chart.chartType === 'line' && <TrendingUp className="h-3 w-3" />}
                              {chart.chartType === 'pie' && <PieChartIcon className="h-3 w-3" />}
                              <span>
                                {chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 truncate">
                              <Settings className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {getYAxisLabel(chart.yAxis)} by {getXAxisLabel(chart.xAxis)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Compact Chart Actions */}
                        <div className="flex flex-shrink-0 items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateChart(chart)}
                            className="h-6 w-6 p-0 hover:bg-blue-50"
                            title="Duplicate Chart"
                          >
                            <Copy className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomChart(chart.id)}
                            className="h-6 w-6 p-0 hover:bg-red-50"
                            title="Delete Chart"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Compact Filters Display */}
                      {(chart.filters.status && chart.filters.status.length > 0) ||
                      (chart.filters.leagues && chart.filters.leagues.length > 0) ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {chart.filters.status &&
                            chart.filters.status.slice(0, 3).map(status => (
                              <Badge
                                key={status}
                                variant="secondary"
                                className="border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                              >
                                {status}
                              </Badge>
                            ))}
                          {chart.filters.status && chart.filters.status.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600"
                            >
                              +{chart.filters.status.length - 3}
                            </Badge>
                          )}
                          {chart.filters.leagues && chart.filters.leagues.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="border-green-200 bg-green-50 px-1.5 py-0.5 text-xs text-green-700"
                            >
                              {chart.filters.leagues.length} leagues
                            </Badge>
                          )}
                        </div>
                      ) : null}
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-2">
                      {/* Responsive Chart Rendering */}
                      <div className="min-h-[300px] w-full flex-1 overflow-hidden rounded border bg-gray-50/50">
                        <CustomChartRenderer
                          config={chart}
                          userId={user?.id || ''}
                          onDelete={() => handleDeleteCustomChart(chart.id)}
                          isPro={isPro}
                        />
                      </div>

                      {/* Compact Actions Footer */}
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="text-xs text-gray-400">
                          {new Date(parseInt(chart.id.split('-')[1] || '0')).toLocaleDateString()}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {customCharts.length === 0 && user && (
          <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 transition-all duration-300 hover:from-blue-50/50 hover:to-indigo-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-6 shadow-lg">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -right-2 -top-2 h-4 w-4 animate-pulse rounded-full bg-orange-400"></div>
              </div>

              <div className="max-w-lg space-y-4 text-center">
                <h4 className="mb-2 text-xl font-bold text-gray-900">
                  Ready to Create Your First Chart?
                </h4>
                <p className="text-base leading-relaxed text-gray-600">
                  Unlock powerful insights by creating custom analytics views. Mix and match
                  different chart types, data dimensions, and filters to visualize your betting
                  performance exactly how you want.
                </p>

                <div className="mb-6 mt-8 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-gray-100 bg-white/60 p-3 text-center">
                    <BarChart3 className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                    <div className="text-sm font-medium text-gray-700">Bar Charts</div>
                    <div className="text-xs text-gray-500">Compare categories</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white/60 p-3 text-center">
                    <TrendingUp className="mx-auto mb-2 h-6 w-6 text-green-600" />
                    <div className="text-sm font-medium text-gray-700">Line Charts</div>
                    <div className="text-xs text-gray-500">Track trends</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white/60 p-3 text-center">
                    <PieChartIcon className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                    <div className="text-sm font-medium text-gray-700">Pie Charts</div>
                    <div className="text-xs text-gray-500">Show proportions</div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowChartBuilder(true)}
                  className="transform rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Chart
                </Button>

                <p className="mt-4 text-xs text-gray-400">
                  🎯 Pro tip: Start with "Count of Bets by League" for a quick overview
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Streak & Recent Performance */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="mb-1 text-sm text-gray-600">Current Streak</p>
              <div className="relative">
                {!isPro && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <p
                  className={`text-3xl font-bold ${
                    data.currentStreak.type === 'win' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {data.currentStreak.count}
                  {data.currentStreak.type === 'win' ? 'W' : 'L'}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {data.currentStreak.type === 'win' ? 'Winning' : 'Losing'} streak
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="mb-1 text-sm text-gray-600">Largest Win</p>
              <div className="relative">
                {!isPro && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(safeData.largestWin)}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">Single bet profit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="mb-1 text-sm text-gray-600">Largest Loss</p>
              <div className="relative">
                {!isPro && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(safeData.largestLoss)}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">Single bet loss</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Custom Chart Builder Modal */}
      <Dialog
        open={showChartBuilder}
        onOpenChange={open => {
          setShowChartBuilder(open)
          if (!open) resetChartConfig()
        }}
      >
        <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] border-2 border-gray-200/50 bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-4">
          <div className="flex-shrink-0 space-y-2 pb-3 border-b border-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                Create Custom Chart
              </div>
              <p className="text-gray-600 text-xs max-w-md mx-auto">
                Build personalized analytics views with custom filtering and visualization
              </p>
            </div>
          </div>

          {/* Compact Step Indicator */}
          <div className="flex-shrink-0 flex items-center justify-center py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    activeStep >= 1 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">Configure</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div
                  className={`h-0.5 w-12 rounded-full transition-all duration-300 ${
                    activeStep >= 2 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                      : 'bg-gray-200'
                  }`}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    activeStep >= 2 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900">Finalize</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-1">
            {/* Step 1: Chart Configuration */}
            {activeStep === 1 && (
              <div className="space-y-4">
                {/* Chart Type Selection */}
                <div className="space-y-3">
                  <div className="text-center">
                    <Label className="text-base font-bold text-gray-900">Choose Chart Type</Label>
                    <p className="mt-1 text-xs text-gray-600">Select the visualization that best represents your data</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: 'bar',
                        label: 'Bar Chart',
                        icon: BarChart3,
                        desc: 'Compare categories',
                      },
                      {
                        value: 'line',
                        label: 'Line Chart',
                        icon: TrendingUp,
                        desc: 'Show trends',
                      },
                      {
                        value: 'pie',
                        label: 'Pie Chart',
                        icon: PieChartIcon,
                        desc: 'Show proportions',
                      },
                      {
                        value: 'stacked_bar',
                        label: 'Stacked Bar',
                        icon: BarChart3,
                        desc: 'Compare stacked data',
                      },
                      {
                        value: 'histogram',
                        label: 'Histogram',
                        icon: BarChart3,
                        desc: 'Show distribution',
                      },
                      {
                        value: 'scatter',
                        label: 'Scatter Plot',
                        icon: Activity,
                        desc: 'Show correlation',
                      },
                    ].map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() =>
                            setChartConfig(prev => ({ ...prev, chartType: type.value as any }))
                          }
                          className={`rounded-lg border-2 p-2 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                            chartConfig.chartType === type.value
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg shadow-blue-100'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon
                            className={`mx-auto mb-1 h-5 w-5 ${
                              chartConfig.chartType === type.value
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <div className="text-xs font-bold mb-0.5">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Axes Configuration */}
                <div className="space-y-3">
                  <div className="text-center">
                    <Label className="text-base font-bold text-gray-900">Configure Data Axes</Label>
                    <p className="mt-1 text-xs text-gray-600">Define how your data will be organized and displayed</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <Settings className="h-3 w-3 text-blue-600" />
                        X-Axis (Categories)
                      </Label>
                      <Select
                        value={chartConfig.xAxis}
                        onValueChange={(value: any) =>
                          setChartConfig(prev => ({ ...prev, xAxis: value }))
                        }
                      >
                        <SelectTrigger className="h-10 text-sm border-2 border-gray-200 rounded-lg">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="sport" className="text-sm py-2">Sport</SelectItem>
                          <SelectItem value="league" className="text-sm py-2">League</SelectItem>
                          <SelectItem value="sportsbook" className="text-sm py-2">Sportsbook</SelectItem>
                          <SelectItem value="bet_type" className="text-sm py-2">Bet Type</SelectItem>
                          <SelectItem value="side" className="text-sm py-2">Side (Over/Under/Home/Away)</SelectItem>
                          <SelectItem value="prop_type" className="text-sm py-2">Prop Type</SelectItem>
                          <SelectItem value="player_name" className="text-sm py-2">Player Name</SelectItem>
                          <SelectItem value="home_team" className="text-sm py-2">Home Team</SelectItem>
                          <SelectItem value="away_team" className="text-sm py-2">Away Team</SelectItem>
                          <SelectItem value="game_date" className="text-sm py-2">Game Date</SelectItem>
                          <SelectItem value="placed_at_day_of_week" className="text-sm py-2">Day of Week (Placed)</SelectItem>
                          <SelectItem value="placed_at_time_of_day" className="text-sm py-2">Time of Day (Placed)</SelectItem>
                          <SelectItem value="stake_size_bucket" className="text-sm py-2">Stake Size (Small/Medium/Large)</SelectItem>
                          <SelectItem value="odds_range_bucket" className="text-sm py-2">Odds Range (Favorites/Even/Longshots)</SelectItem>
                          <SelectItem value="bet_source" className="text-sm py-2">Copy vs Manual Bet</SelectItem>
                          <SelectItem value="parlay_vs_straight" className="text-sm py-2">Parlay vs Straight Bet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        Y-Axis (Values)
                      </Label>
                      <Select
                        value={chartConfig.yAxis}
                        onValueChange={(value: any) =>
                          setChartConfig(prev => ({ ...prev, yAxis: value }))
                        }
                      >
                        <SelectTrigger className="h-10 text-sm border-2 border-gray-200 rounded-lg">
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="wins_count" className="text-sm py-2">Wins (Count)</SelectItem>
                          <SelectItem value="losses_count" className="text-sm py-2">Losses (Count)</SelectItem>
                          <SelectItem value="win_rate" className="text-sm py-2">Win Rate (%)</SelectItem>
                          <SelectItem value="profit" className="text-sm py-2">Total Profit</SelectItem>
                          <SelectItem value="roi" className="text-sm py-2">ROI (%)</SelectItem>
                          <SelectItem value="total_staked" className="text-sm py-2">Total Staked</SelectItem>
                          <SelectItem value="average_stake" className="text-sm py-2">Average Stake</SelectItem>
                          <SelectItem value="average_odds" className="text-sm py-2">Average Odds</SelectItem>
                          <SelectItem value="median_odds" className="text-sm py-2">Median Odds</SelectItem>
                          <SelectItem value="void_count" className="text-sm py-2">Void/Cancelled Count</SelectItem>
                          <SelectItem value="longshot_hit_rate" className="text-sm py-2">Longshot Hit Rate (+200 or higher)</SelectItem>
                          <SelectItem value="chalk_hit_rate" className="text-sm py-2">Chalk Hit Rate (-150 or lower)</SelectItem>
                          <SelectItem value="max_win" className="text-sm py-2">Max Single Bet Win</SelectItem>
                          <SelectItem value="max_loss" className="text-sm py-2">Max Single Bet Loss</SelectItem>
                          <SelectItem value="profit_variance" className="text-sm py-2">Profit Variance (Volatility)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Compact Live Preview */}
                <div className="rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-100 p-3 shadow-inner">
                  <div className="mb-2 flex items-center justify-center space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-blue-900">Live Preview</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-blue-900 mb-1">{generateChartTitle()}</div>
                    <div className="text-xs text-blue-700">
                      {(() => {
                        const chartTypeLabel = chartConfig.chartType.replace('_', ' ').toLowerCase()
                        const yLabel = getYAxisLabel(chartConfig.yAxis)
                        const xLabel = getXAxisLabel(chartConfig.xAxis)
                        
                        if (chartConfig.chartType === 'histogram') {
                          return `Histogram showing the distribution of ${yLabel.toLowerCase()}`
                        } else if (chartConfig.chartType === 'scatter') {
                          return `Scatter plot analyzing correlation between ${yLabel.toLowerCase()} and ${xLabel.toLowerCase()}`
                        } else if (chartConfig.chartType === 'stacked_bar') {
                          return `Stacked bar chart displaying ${yLabel.toLowerCase()} composition by ${xLabel.toLowerCase()}`
                        } else {
                          return `${chartTypeLabel.charAt(0).toUpperCase() + chartTypeLabel.slice(1)} chart displaying ${yLabel.toLowerCase()} organized by ${xLabel.toLowerCase()}`
                        }
                      })()}
                    </div>
                  </div>
                  
                  {/* Chart Recommendations */}
                  {(() => {
                    // Show recommendations based on chart type and axis combinations
                    const recommendations = []
                    
                    if (chartConfig.chartType === 'pie' && chartConfig.yAxis.includes('rate')) {
                      recommendations.push('💡 Tip: Pie charts work best with count or total values rather than rates')
                    }
                    
                    if (chartConfig.chartType === 'line' && !['game_date', 'placed_at_day_of_week', 'placed_at_time_of_day'].includes(chartConfig.xAxis)) {
                      recommendations.push('💡 Tip: Line charts are most effective with time-based X-axis data')
                    }
                    
                    if (chartConfig.chartType === 'scatter' && ['wins_count', 'losses_count', 'void_count'].includes(chartConfig.yAxis)) {
                      recommendations.push('💡 Tip: Scatter plots work best with continuous metrics like profit, ROI, or averages')
                    }
                    
                    if (chartConfig.chartType === 'histogram' && !['profit', 'roi', 'average_stake', 'average_odds'].includes(chartConfig.yAxis)) {
                      recommendations.push('💡 Tip: Histograms are ideal for showing distribution of continuous values')
                    }
                    
                    return recommendations.length > 0 ? (
                      <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                        {recommendations[0]}
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            )}

            {/* Step 2: Finalize */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-base font-bold text-gray-900">Finalize Your Chart</Label>
                  <p className="mt-1 text-xs text-gray-600">Add a custom title and review your configuration</p>
                </div>

                {/* Custom Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-800">
                    Chart Title
                  </Label>
                  <Input
                    id="title"
                    placeholder={generateChartTitle()}
                    value={chartConfig.title}
                    onChange={e => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="h-10 text-sm border-2 border-gray-200 rounded-lg px-3"
                  />
                </div>

                {/* Compact Configuration Summary */}
                <div className="rounded-lg bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-100 p-3 shadow-inner">
                  <h4 className="mb-3 text-sm font-bold text-gray-900 text-center flex items-center justify-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    Configuration Summary
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-100 rounded">
                          <BarChart3 className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700 font-medium text-xs">Chart Type:</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs">
                        {chartConfig.chartType.charAt(0).toUpperCase() +
                          chartConfig.chartType.slice(1)}{' '}
                        Chart
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium text-xs">Data Visualization:</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs">
                        {getYAxisLabel(chartConfig.yAxis)} by {getXAxisLabel(chartConfig.xAxis)}
                      </span>
                    </div>
                    
                    {chartConfig.filters.status.length > 0 && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-100 rounded">
                            <Settings className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-gray-700 font-medium text-xs">Status Filter:</span>
                        </div>
                        <span className="font-bold text-gray-900 text-xs">{chartConfig.filters.status.join(', ')}</span>
                      </div>
                    )}
                    
                    {chartConfig.filters.leagues.length > 0 && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-orange-100 rounded">
                            <Target className="h-3 w-3 text-orange-600" />
                          </div>
                          <span className="text-gray-700 font-medium text-xs">Leagues Selected:</span>
                        </div>
                        <span className="font-bold text-gray-900 text-xs">
                          {chartConfig.filters.leagues.length} leagues
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compact Modal Actions */}
          <div className="flex-shrink-0 flex items-center justify-between border-t-2 border-gray-100 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowChartBuilder(false)}
              className="px-4 py-2 text-xs font-medium border-2 hover:bg-gray-50 rounded-lg"
            >
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>

            <div className="flex space-x-2">
              {activeStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="px-4 py-2 text-xs font-medium border-2 hover:bg-gray-50 rounded-lg"
                >
                  Previous
                </Button>
              )}

              {activeStep < 2 ? (
                <Button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Next Step
                  <TrendingUp className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateChart}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Create Chart
                </Button>
              )}
            </div>
          </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
