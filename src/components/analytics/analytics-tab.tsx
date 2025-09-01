'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Activity,
  BarChart3,
  Calendar,
  Copy,
  DollarSign,
  Download,
  Edit3,
  Filter,
  LineChart,
  PieChart as PieChartIcon,
  Plus,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  X
} from "lucide-react"
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { CustomChartBuilder } from './custom-chart-builder'
import type { ChartConfig } from '@/lib/types/custom-charts'
import { CustomChartRenderer } from './custom-chart-renderer'
import { getFilterOptions } from '@/lib/analytics/custom-charts'
import type { User } from '@supabase/auth-helpers-nextjs'

interface AnalyticsData {
  totalBets: number
  winRate: number
  roi: number
  netProfit: number
  averageStake: number
  largestWin: number
  largestLoss: number
  currentStreak: { type: 'win' | 'loss', count: number }
  sportBreakdown: { sport: string; count: number; profit: number; winRate: number }[]
  leagueBreakdown: { league: string; bets: number; stake: number; net_profit: number; roi_pct: number }[]
  monthlyData: { month: string; profit: number; bets: number; roi: number }[]
  roiOverTime: { day: string; net_profit: number; stake: number; roi_pct: number; bets: number }[]
  winRateVsExpected: { bucket_label: string; bucket_start_pct: number; bucket_end_pct: number; bets: number; expected_pct: number; actual_pct: number }[]
  monthlyPerformance: { month: string; bets: number; stake: number; net_profit: number; roi_pct: number }[]
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
  const [filterOptions, setFilterOptions] = useState({
    leagues: [] as string[],
    betTypes: [] as string[],
    sportsbooks: [] as string[]
  })

  // Chart builder modal state
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartConfig, setChartConfig] = useState({
    title: '',
    chartType: 'bar' as 'line' | 'bar' | 'pie',
    xAxis: 'league' as 'placed_at' | 'league' | 'bet_type' | 'sportsbook',
    yAxis: 'count' as 'count' | 'profit' | 'stake' | 'win_rate' | 'roi',
    filters: {
      leagues: [] as string[],
      status: [] as string[],
      betTypes: [] as string[],
      dateRange: null as { start: string; end: string } | null
    }
  })
  const [activeStep, setActiveStep] = useState(1)

  // Time period controls state
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Load filter options when component mounts
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (user?.id) {
        const options = await getFilterOptions(user.id)
        setFilterOptions(options)
      }
    }
    loadFilterOptions()
  }, [user?.id])

  // Helper functions for time period controls
  const getMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
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
          end: new Date()
        }
      case 'month':
        return {
          start: startOfMonth,
          end: endOfMonth
        }
      case 'year':
        return {
          start: startOfYear,
          end: endOfYear
        }
      default:
        return { start: startOfMonth, end: endOfMonth }
    }
  }

  const filterDataByTimeRange = (data: any[], dateKey: string = 'day') => {
    const { start, end } = getDateRange()
    return data.filter(item => {
      const itemDate = new Date(item[dateKey] || item.month || item.date)
      return itemDate >= start && itemDate <= end
    })
  }

  // Data processing for Performance Over Time chart (ROI + Profit)
  const getPerformanceChartData = () => {
    const { start, end } = getDateRange()
    
    // Use the more granular roiOverTime data as the source of truth
    const sourceData = data.roiOverTime || []
    const filteredData = sourceData.filter(item => {
      const itemDate = new Date(item.day)
      return itemDate >= start && itemDate <= end
    })

    if (timePeriod === 'week' || timePeriod === 'month') {
      // For week/month view, show daily data
      return filteredData.map(item => ({
        date: item.day,
        dateLabel: new Date(item.day).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        net_profit: item.net_profit,
        roi_pct: item.roi_pct,
        bets: item.bets,
        stake: item.stake
      }))
    } else {
      // For year view, aggregate by month
      const monthlyAgg: { [key: string]: any } = {}
      
      filteredData.forEach(item => {
        const date = new Date(item.day)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!monthlyAgg[monthKey]) {
          monthlyAgg[monthKey] = {
            date: monthKey,
            dateLabel: date.toLocaleDateString('en-US', { 
              month: 'short', 
              year: '2-digit' 
            }),
            net_profit: 0,
            bets: 0,
            stake: 0
          }
        }
        
        monthlyAgg[monthKey].net_profit += item.net_profit
        monthlyAgg[monthKey].bets += item.bets
        monthlyAgg[monthKey].stake += item.stake
      })
      
      return Object.values(monthlyAgg).map((month: any) => ({
        ...month,
        roi_pct: month.stake > 0 ? (month.net_profit / month.stake) * 100 : 0
      })).sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  // Data processing for Bets Over Time chart
  const getBetsChartData = () => {
    const { start, end } = getDateRange()
    
    const sourceData = data.roiOverTime || []
    const filteredData = sourceData.filter(item => {
      const itemDate = new Date(item.day)
      return itemDate >= start && itemDate <= end
    })

    if (timePeriod === 'week' || timePeriod === 'month') {
      // For week/month view, show daily data
      return filteredData.map(item => ({
        date: item.day,
        dateLabel: new Date(item.day).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        bets: item.bets,
        stake: item.stake
      }))
    } else {
      // For year view, aggregate by month
      const monthlyAgg: { [key: string]: any } = {}
      
      filteredData.forEach(item => {
        const date = new Date(item.day)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!monthlyAgg[monthKey]) {
          monthlyAgg[monthKey] = {
            date: monthKey,
            dateLabel: date.toLocaleDateString('en-US', { 
              month: 'short', 
              year: '2-digit' 
            }),
            bets: 0,
            stake: 0
          }
        }
        
        monthlyAgg[monthKey].bets += item.bets
        monthlyAgg[monthKey].stake += item.stake
      })
      
      return Object.values(monthlyAgg).sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  const TimePeriodControls = ({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {icon || (
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period as 'week' | 'month' | 'year')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
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
            onValueChange={(value) => setSelectedYear(parseInt(value))}
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
    varianceData: data?.varianceData || []
  }

  // Custom chart handlers
  const handleAddCustomChart = (config: ChartConfig) => {
    setCustomCharts(prev => [...prev, config])
  }

  const handleDeleteCustomChart = (chartId: string) => {
    setCustomCharts(prev => prev.filter(chart => chart.id !== chartId))
  }

  const validateChartConfig = () => {
    const errors: string[] = []
    
    // Check for duplicate titles
    if (chartConfig.title) {
      const existingChart = customCharts.find(chart => 
        chart.title.toLowerCase() === chartConfig.title.toLowerCase()
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
      const hasOnlyPending = chartConfig.filters.status.length === 1 && 
                           chartConfig.filters.status[0] === 'pending'
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
      chartType: chartConfig.chartType,
      xAxis: chartConfig.xAxis,
      yAxis: chartConfig.yAxis,
      filters: {
        leagues: chartConfig.filters.leagues,
        status: chartConfig.filters.status.length > 0 ? chartConfig.filters.status as any : undefined,
        bet_types: chartConfig.filters.betTypes,
        date_range: chartConfig.filters.dateRange ? {
          start: new Date(chartConfig.filters.dateRange.start),
          end: new Date(chartConfig.filters.dateRange.end)
        } : undefined
      }
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
    return `${yAxisLabel} by ${xAxisLabel}`
  }

  const getYAxisLabel = (yAxis: string) => {
    const labels: Record<string, string> = {
      count: 'Count of Bets',
      profit: 'Total Profit',
      stake: 'Total Stake',
      win_rate: 'Win Rate',
      roi: 'ROI'
    }
    return labels[yAxis] || yAxis
  }

  const getXAxisLabel = (xAxis: string) => {
    const labels: Record<string, string> = {
      placed_at: 'Time',
      league: 'League',
      bet_type: 'Bet Type',
      sportsbook: 'Sportsbook'
    }
    return labels[xAxis] || xAxis
  }

  const resetChartConfig = () => {
    setChartConfig({
      title: '',
      chartType: 'bar',
      xAxis: 'league',
      yAxis: 'count',
      filters: {
        leagues: [],
        status: [],
        betTypes: [],
        dateRange: null
      }
    })
    setActiveStep(1)
  }

  const handleDuplicateChart = (chart: ChartConfig) => {
    const duplicatedChart: ChartConfig = {
      ...chart,
      id: `custom-${Date.now()}`,
      title: `${chart.title} (Copy)`
    }
    setCustomCharts(prev => [...prev, duplicatedChart])
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00'
    }
    return `$${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
  }


  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bets</p>
                                <p className="text-2xl font-bold">{safeData.totalBets}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">{safeData.winRate.toFixed(1)}%</p>
                <Progress value={safeData.winRate} className="w-full mt-2 h-2" />
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className={`text-2xl font-bold ${safeData.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeData.roi >= 0 ? '+' : ''}{safeData.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Return on investment</p>
              </div>
              <div className={`p-3 rounded-lg ${safeData.roi >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity className={`w-6 h-6 ${safeData.roi >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${safeData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(safeData.netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total profit/loss</p>
              </div>
              <div className={`p-3 rounded-lg ${safeData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Tier Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <LineChart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Over Time</h3>
                    <p className="text-sm text-gray-500">{`${timePeriod === 'week' ? 'This week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear} performance overview`}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {['week', 'month', 'year'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period as 'week' | 'month' | 'year')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
                      onValueChange={(value) => setSelectedMonth(parseInt(value))}
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
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
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
                  {!isPro && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <span className="text-xs">Last 6 months only</span>
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? (value/1000).toFixed(1) + 'k' : value.toFixed(0)}`}
                />
                <YAxis 
                  yAxisId="roi"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'Net Profit' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                    name === 'Net Profit' ? 'Net Profit' : 'ROI %'
                  ]}
                  labelFormatter={(value) => value}
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
          </CardContent>
        </Card>

        {/* Performance by League - Compact */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Performance by League</h3>
                  <p className="text-xs text-gray-500">ROI breakdown (10+ bets)</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-2 pr-2">
                {(data.leagueBreakdown || []).map((league) => (
                  <div key={league.league} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                          league.roi_pct >= 5 ? 'bg-emerald-500' : 
                          league.roi_pct <= -5 ? 'bg-rose-500' : 
                          'bg-slate-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{league.league}</p>
                        <p className="text-xs text-gray-500">{league.bets} bets • ${league.stake.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        league.roi_pct >= 5 ? 'text-emerald-600' : 
                        league.roi_pct <= -5 ? 'text-rose-600' : 
                        'text-slate-600'
                      }`}>
                        {league.roi_pct ? league.roi_pct.toFixed(1) : '0.0'}%
                      </p>
                      <p className={`text-xs font-medium ${
                        league.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(league.net_profit)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data.leagueBreakdown || data.leagueBreakdown.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No league data available</p>
                    <p className="text-xs">Leagues with 10+ bets will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bets Over Time Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle>
              <TimePeriodControls 
                title="Betting Activity" 
                description={`${timePeriod === 'week' ? 'This week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear} betting volume`}
                icon={
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <YAxis 
                  yAxisId="stake"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? (value/1000).toFixed(1) + 'k' : value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'Bets' ? `${Math.round(value)} bet${Math.round(value) !== 1 ? 's' : ''}` : formatCurrency(value),
                    name === 'Bets' ? 'Bets Placed' : 'Total Stake'
                  ]}
                  labelFormatter={(value) => value}
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
            {(!data.roiOverTime || getBetsChartData().length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No betting activity for selected period</p>
                <p className="text-sm">{`No bets placed in ${timePeriod === 'week' ? 'this week' : timePeriod === 'month' ? `${getMonthOptions()[selectedMonth]?.label} ${selectedYear}` : selectedYear}`}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Win Rate vs Expected Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Odds Calibration Analysis</h3>
                  <p className="text-sm text-gray-500">Comparing your actual win rates vs bookmaker implied probability</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {data.winRateVsExpected && data.winRateVsExpected.length > 0 && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                      {data.winRateVsExpected.reduce((sum, item) => sum + item.bets, 0)} total bets
                    </span>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend and Explanation */}
            <div className="mb-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-gray-400" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                    <span className="text-sm text-gray-600">Expected (Bookmaker)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-green-600"></div>
                    <span className="text-sm text-gray-600">Your Actual</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Above the line = You're beating the odds
                </div>
              </div>
              <p className="text-xs text-gray-600">
                This chart groups your settled bets ('won' or 'lost' status) by their implied probability ranges and compares your actual win rate to the bookmaker's expected win rate derived from the betting odds. 
                Points above the dotted line indicate you're outperforming market expectations in that probability range.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RechartsLineChart 
                data={data.winRateVsExpected || []}
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                    minWidth: '200px'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const diff = name === 'Actual' ? value - props.payload.expected_pct : 0
                    const diffText = name === 'Actual' && diff !== 0 ? 
                      ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)` : ''
                    return [
                      `${value.toFixed(1)}%${diffText}`,
                      name === 'Expected' ? 'Expected Win Rate' : 'Your Actual Win Rate'
                    ]
                  }}
                  labelFormatter={(label) => {
                    const item = (data.winRateVsExpected || []).find(d => d.bucket_label === label)
                    return item ? `${label} Range • ${item.bets} bets` : label
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
            {(!data.winRateVsExpected || data.winRateVsExpected.length === 0) ? (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No calibration data available</p>
                <p className="text-sm">Place bets across different odds ranges to see your calibration analysis</p>
              </div>
            ) : (
              /* Summary Statistics */
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const totalBets = data.winRateVsExpected.reduce((sum, item) => sum + item.bets, 0)
                  const weightedExpected = data.winRateVsExpected.reduce((sum, item) => 
                    sum + (item.expected_pct * item.bets), 0) / totalBets
                  const weightedActual = data.winRateVsExpected.reduce((sum, item) => 
                    sum + (item.actual_pct * item.bets), 0) / totalBets
                  const difference = weightedActual - weightedExpected
                  const bestRange = data.winRateVsExpected.reduce((best, item) => {
                    const diff = item.actual_pct - item.expected_pct
                    return diff > (best.actual_pct - best.expected_pct) ? item : best
                  })
                  
                  return (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Overall Performance</div>
                        <div className="text-lg font-bold text-blue-700">
                          {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-600">
                          vs bookmaker expectations
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-900">Best Range</div>
                        <div className="text-lg font-bold text-green-700">
                          {bestRange.bucket_label}
                        </div>
                        <div className="text-xs text-green-600">
                          +{(bestRange.actual_pct - bestRange.expected_pct).toFixed(1)}% above expected
                        </div>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-900">Sample Size</div>
                        <div className="text-lg font-bold text-purple-700">
                          {totalBets}
                        </div>
                        <div className="text-xs text-purple-600">
                          bets across {data.winRateVsExpected.length} ranges
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Charts</h3>
            <p className="text-sm text-gray-500">Create your own analytics views with custom filters and chart types</p>
          </div>
          {user ? (
            <div className="relative">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setShowChartBuilder(true)}
                size="lg"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Create Custom Chart</span>
                </div>
              </Button>
              {customCharts.length === 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Sign in to create custom charts
            </div>
          )}
        </div>

        {customCharts.length > 0 && (
          <div className="space-y-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-6 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Your Custom Charts ({customCharts.length})</h4>
                  <p className="text-sm text-gray-500">Professional analytics views tailored to your data</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {customCharts.length} Active
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {customCharts.map((chart) => (
                <div key={chart.id} className="group">
                  <Card className="border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md bg-white flex flex-col">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors truncate">
                            {chart.title}
                          </CardTitle>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              {chart.chartType === 'bar' && <BarChart3 className="w-3 h-3" />}
                              {chart.chartType === 'line' && <TrendingUp className="w-3 h-3" />}
                              {chart.chartType === 'pie' && <PieChartIcon className="w-3 h-3" />}
                              <span>{chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)}</span>
                            </div>
                            <div className="flex items-center space-x-1 truncate">
                              <Settings className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{getYAxisLabel(chart.yAxis)} by {getXAxisLabel(chart.xAxis)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Compact Chart Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateChart(chart)}
                            className="h-6 w-6 p-0 hover:bg-blue-50"
                            title="Duplicate Chart"
                          >
                            <Copy className="w-3 h-3 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomChart(chart.id)}
                            className="h-6 w-6 p-0 hover:bg-red-50"
                            title="Delete Chart"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Compact Filters Display */}
                      {(chart.filters.status && chart.filters.status.length > 0) ||
                       (chart.filters.leagues && chart.filters.leagues.length > 0) ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {chart.filters.status && chart.filters.status.slice(0, 3).map((status) => (
                            <Badge key={status} variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                              {status}
                            </Badge>
                          ))}
                          {chart.filters.status && chart.filters.status.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600">
                              +{chart.filters.status.length - 3}
                            </Badge>
                          )}
                          {chart.filters.leagues && chart.filters.leagues.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                              {chart.filters.leagues.length} leagues
                            </Badge>
                          )}
                        </div>
                      ) : null}
                    </CardHeader>
                    
                    <CardContent className="px-4 pb-4 pt-2 flex-1 flex flex-col">
                      {/* Responsive Chart Rendering */}
                      <div className="w-full bg-gray-50/50 rounded border overflow-hidden flex-1 min-h-[300px]">
                        <CustomChartRenderer
                          config={chart}
                          userId={user?.id || ''}
                          onDelete={() => handleDeleteCustomChart(chart.id)}
                          className="w-full h-full"
                        />
                      </div>
                      
                      {/* Compact Actions Footer */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-400">
                          {new Date(parseInt(chart.id.split('-')[1])).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700">
                          <Download className="w-3 h-3 mr-1" />
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
          <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="text-center max-w-lg space-y-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to Create Your First Chart?</h4>
                <p className="text-gray-600 text-base leading-relaxed">
                  Unlock powerful insights by creating custom analytics views. Mix and match different chart types, 
                  data dimensions, and filters to visualize your betting performance exactly how you want.
                </p>
                
                <div className="grid grid-cols-3 gap-4 mt-8 mb-6">
                  <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-100">
                    <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700">Bar Charts</div>
                    <div className="text-xs text-gray-500">Compare categories</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-100">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700">Line Charts</div>
                    <div className="text-xs text-gray-500">Track trends</div>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-100">
                    <PieChartIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700">Pie Charts</div>
                    <div className="text-xs text-gray-500">Show proportions</div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowChartBuilder(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Chart
                </Button>
                
                <p className="text-xs text-gray-400 mt-4">
                  🎯 Pro tip: Start with "Count of Bets by League" for a quick overview
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Streak & Recent Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current Streak</p>
              <p className={`text-3xl font-bold ${
                data.currentStreak.type === 'win' ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.currentStreak.count}{data.currentStreak.type === 'win' ? 'W' : 'L'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.currentStreak.type === 'win' ? 'Winning' : 'Losing'} streak
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Largest Win</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(safeData.largestWin)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Single bet profit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Largest Loss</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(safeData.largestLoss)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Single bet loss</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Custom Chart Builder Modal */}
      <Dialog open={showChartBuilder} onOpenChange={(open) => {
        setShowChartBuilder(open)
        if (!open) resetChartConfig()
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden fixed top-[6vh] left-[50%] translate-x-[-50%] border-2 border-gradient-to-r from-blue-200 to-indigo-200 shadow-2xl rounded-xl backdrop-blur-sm bg-white/95">
          <DialogHeader className="border-b border-gray-200/50 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 mb-4 p-6 rounded-t-xl">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200/30">
                <TrueSharpShield className="h-6 w-6" variant="light" />
              </div>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span>Create Custom Chart</span>
            </DialogTitle>
            <div className="text-sm text-gray-500 mt-2">
              Build personalized analytics views with advanced filtering and visualization options
            </div>
          </DialogHeader>
          
          {/* Step Indicator - Now 2 Steps */}
          <div className="flex items-center justify-center space-x-4 py-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
              activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="text-xs text-gray-500 font-medium">Configure</div>
            <div className={`w-20 h-1 rounded ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
              activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="text-xs text-gray-500 font-medium">Finalize</div>
          </div>

          <div className="overflow-y-auto max-h-96">
            {/* Step 1: Chart Configuration */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Chart Configuration</h3>
                  <p className="text-sm text-gray-500">Choose your chart type and data axes</p>
                </div>

                {/* Chart Type Selection with Visual Cards */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Chart Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'bar', label: 'Bar Chart', icon: BarChart3, desc: 'Compare categories' },
                      { value: 'line', label: 'Line Chart', icon: TrendingUp, desc: 'Show trends over time' },
                      { value: 'pie', label: 'Pie Chart', icon: PieChartIcon, desc: 'Show proportions' }
                    ].map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() => setChartConfig(prev => ({ ...prev, chartType: type.value as any }))}
                          className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                            chartConfig.chartType === type.value 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${
                            chartConfig.chartType === type.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-sm font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Axes Configuration */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>X-Axis (Categories)</span>
                    </Label>
                    <Select 
                      value={chartConfig.xAxis} 
                      onValueChange={(value: 'placed_at' | 'league' | 'bet_type' | 'sportsbook') => 
                        setChartConfig(prev => ({ ...prev, xAxis: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select X-axis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="league">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4" />
                            <span>League</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bet_type">
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span>Bet Type</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sportsbook">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4" />
                            <span>Sportsbook</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="placed_at">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Date</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Y-Axis (Values)</span>
                    </Label>
                    <Select 
                      value={chartConfig.yAxis} 
                      onValueChange={(value: 'count' | 'profit' | 'stake' | 'win_rate' | 'roi') => 
                        setChartConfig(prev => ({ ...prev, yAxis: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Y-axis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count of Bets</SelectItem>
                        <SelectItem value="profit">Total Profit</SelectItem>
                        <SelectItem value="stake">Total Stake</SelectItem>
                        <SelectItem value="win_rate">Win Rate (%)</SelectItem>
                        <SelectItem value="roi">ROI (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-900">Preview</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-900">
                    {generateChartTitle()}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {chartConfig.chartType.charAt(0).toUpperCase() + chartConfig.chartType.slice(1)} chart showing {getYAxisLabel(chartConfig.yAxis).toLowerCase()} grouped by {getXAxisLabel(chartConfig.xAxis).toLowerCase()}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Finalize */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Finalize Your Chart</h3>
                  <p className="text-sm text-gray-500">Add a custom title and review your configuration</p>
                </div>

                {/* Custom Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">Chart Title</Label>
                  <Input
                    id="title"
                    placeholder={generateChartTitle()}
                    value={chartConfig.title}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Configuration Summary */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Chart Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Type</div>
                      <div className="font-medium">{chartConfig.chartType.charAt(0).toUpperCase() + chartConfig.chartType.slice(1)} Chart</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Data</div>
                      <div className="font-medium">{getYAxisLabel(chartConfig.yAxis)} by {getXAxisLabel(chartConfig.xAxis)}</div>
                    </div>
                    {chartConfig.filters.status.length > 0 && (
                      <div>
                        <div className="text-gray-600">Status Filter</div>
                        <div className="font-medium">{chartConfig.filters.status.join(', ')}</div>
                      </div>
                    )}
                    {chartConfig.filters.leagues.length > 0 && (
                      <div>
                        <div className="text-gray-600">Leagues</div>
                        <div className="font-medium">{chartConfig.filters.leagues.length} selected</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowChartBuilder(false)}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Button>

            <div className="flex space-x-2">
              {activeStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(prev => prev - 1)}
                >
                  Previous
                </Button>
              )}
              
              {activeStep < 2 ? (
                <Button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleCreateChart}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Chart
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}