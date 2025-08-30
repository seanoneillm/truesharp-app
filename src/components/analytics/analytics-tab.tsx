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

  const handleCreateChart = () => {
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
        {/* Monthly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5" />
              <span>Performance Over Time</span>
              {!isPro && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <span className="text-xs">Last 6 months only</span>
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={isPro ? data.monthlyData : data.monthlyData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'profit' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                    name === 'profit' ? 'Profit' : 'ROI'
                  ]}
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by League */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance by League</h3>
                  <p className="text-sm text-gray-500">ROI breakdown by league (10+ bets)</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.leagueBreakdown || []).map((league) => (
                <div key={league.league} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div 
                      className={`w-3 h-3 rounded-full shadow-sm ${
                        league.roi_pct >= 5 ? 'bg-emerald-500' : 
                        league.roi_pct <= -5 ? 'bg-rose-500' : 
                        'bg-slate-400'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{league.league}</p>
                      <p className="text-sm text-gray-500">{league.bets} bets • ${league.stake.toFixed(0)} staked</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      league.roi_pct >= 5 ? 'text-emerald-600' : 
                      league.roi_pct <= -5 ? 'text-rose-600' : 
                      'text-slate-600'
                    }`}>
                      {league.roi_pct ? league.roi_pct.toFixed(1) : '0.0'}%
                    </p>
                    <p className={`text-sm font-medium ${
                      league.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formatCurrency(league.net_profit)}
                    </p>
                  </div>
                </div>
              ))}
              {(!data.leagueBreakdown || data.leagueBreakdown.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <PieChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No league data available</p>
                  <p className="text-sm">Leagues with 10+ bets will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROI Over Time Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">ROI Over Time</h3>
                  <p className="text-sm text-gray-500">Daily return on investment</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RechartsLineChart 
                data={data.roiOverTime || []}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#e2e8f0" 
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis 
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
                    name === 'roi_pct' ? `${value.toFixed(2)}%` : formatCurrency(value),
                    name === 'roi_pct' ? 'ROI' : 'Net Profit'
                  ]}
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi_pct" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: '#2563eb', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
            {(!data.roiOverTime || data.roiOverTime.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No ROI data available</p>
                <p className="text-sm">Data will appear as you place more bets</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate vs Expected Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Win Rate vs Expected</h3>
                  <p className="text-sm text-gray-500">Odds calibration analysis</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    fontSize: '13px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'expected_pct' ? 'Expected' : 'Actual'
                  ]}
                  labelFormatter={(label) => {
                    const item = (data.winRateVsExpected || []).find(d => d.bucket_label === label)
                    return item ? `${label} (${item.bets} bets)` : label
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
            {(!data.winRateVsExpected || data.winRateVsExpected.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No win rate comparison data</p>
                <p className="text-sm">Requires settled bets with various odds</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Chart - Full Width */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Performance Trend</h3>
                <p className="text-sm text-gray-500">Last 12 months performance overview</p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <RechartsLineChart 
              data={data.monthlyPerformance || []}
              margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#e2e8f0" 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }}
              />
              <YAxis 
                yAxisId="profit"
                orientation="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
              />
              <YAxis 
                yAxisId="roi"
                orientation="right"
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
                  fontSize: '13px'
                }}
                formatter={(value: number, name: string) => [
                  name.includes('roi') ? `${value.toFixed(1)}%` : formatCurrency(value),
                  name.includes('roi') ? 'ROI' : name.includes('profit') ? 'Net Profit' : name
                ]}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                }}
              />
              <Line 
                yAxisId="profit"
                type="monotone" 
                dataKey="net_profit" 
                name="Net Profit"
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 1.5, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
              />
              <Line 
                yAxisId="roi"
                type="monotone" 
                dataKey="roi_pct" 
                name="ROI %"
                stroke="#059669" 
                strokeWidth={3}
                dot={{ r: 1.5, fill: '#059669', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: 'white' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
          {(!data.monthlyPerformance || data.monthlyPerformance.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No monthly performance data</p>
              <p className="text-sm">Data will appear as you place bets over time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Charts</h3>
            <p className="text-sm text-gray-500">Create your own analytics views with custom filters and chart types</p>
          </div>
          {user ? (
            <div>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => setShowChartBuilder(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Chart
              </Button>
              {/* Temporarily comment out to test */}
              {/* <CustomChartBuilder
                onSaveChart={handleAddCustomChart}
                availableLeagues={filterOptions.leagues || []}
                availableBetTypes={filterOptions.betTypes || []}
                availableSportsbooks={filterOptions.sportsbooks || []}
              /> */}
              <div className="text-xs text-gray-400">
                CustomChartBuilder component temporarily disabled for debugging
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Sign in to create custom charts
            </div>
          )}
        </div>

        {customCharts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Your Custom Charts ({customCharts.length})</h4>
              <div className="text-sm text-gray-500">
                Manage and view your personalized analytics
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {customCharts.map((chart) => (
                <div key={chart.id} className="group">
                  <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {chart.title}
                          </CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              {chart.chartType === 'bar' && <BarChart3 className="w-4 h-4" />}
                              {chart.chartType === 'line' && <TrendingUp className="w-4 h-4" />}
                              {chart.chartType === 'pie' && <PieChartIcon className="w-4 h-4" />}
                              <span>{chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)} Chart</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings className="w-4 h-4" />
                              <span>{getYAxisLabel(chart.yAxis)} by {getXAxisLabel(chart.xAxis)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Chart Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateChart(chart)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            title="Duplicate Chart"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomChart(chart.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            title="Delete Chart"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Filters Display */}
                      {(chart.filters.status && chart.filters.status.length > 0) ||
                       (chart.filters.leagues && chart.filters.leagues.length > 0) ? (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {chart.filters.status && chart.filters.status.map((status) => (
                            <Badge key={status} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {status}
                            </Badge>
                          ))}
                          {chart.filters.leagues && chart.filters.leagues.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {chart.filters.leagues.length} leagues
                            </Badge>
                          )}
                        </div>
                      ) : null}
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Chart Placeholder - We'll integrate CustomChartRenderer here */}
                      <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                            {chart.chartType === 'bar' && <BarChart3 className="w-6 h-6 text-blue-600" />}
                            {chart.chartType === 'line' && <TrendingUp className="w-6 h-6 text-blue-600" />}
                            {chart.chartType === 'pie' && <PieChartIcon className="w-6 h-6 text-blue-600" />}
                          </div>
                          <div className="text-sm text-gray-600">Chart will render here</div>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            Export Data
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {customCharts.length === 0 && user && (
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Custom Charts Yet</h4>
              <p className="text-gray-500 text-center mb-4 max-w-md">
                Create custom analytics views to dive deeper into your betting performance. 
                Choose from different chart types, axes, and filters to visualize your data exactly how you want.
              </p>
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span>Create Custom Chart</span>
            </DialogTitle>
            <div className="text-sm text-gray-500 mt-2">
              Build personalized analytics views with advanced filtering and visualization options
            </div>
          </DialogHeader>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2 py-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 rounded ${activeStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
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

            {/* Step 2: Filters */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  <p className="text-sm text-gray-500">Refine your data with optional filters</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Status Filter */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span>Bet Status</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['won', 'lost', 'pending'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            const current = chartConfig.filters.status
                            const updated = current.includes(status)
                              ? current.filter(s => s !== status)
                              : [...current, status]
                            setChartConfig(prev => ({
                              ...prev,
                              filters: { ...prev.filters, status: updated }
                            }))
                          }}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            chartConfig.filters.status.includes(status)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* League Filter */}
                  {filterOptions.leagues.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Leagues</Label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        <div className="space-y-2">
                          {filterOptions.leagues.slice(0, 10).map((league) => (
                            <label key={league} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={chartConfig.filters.leagues.includes(league)}
                                onChange={(e) => {
                                  const current = chartConfig.filters.leagues
                                  const updated = e.target.checked
                                    ? [...current, league]
                                    : current.filter(l => l !== league)
                                  setChartConfig(prev => ({
                                    ...prev,
                                    filters: { ...prev.filters, leagues: updated }
                                  }))
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{league}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Finalize */}
            {activeStep === 3 && (
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
              
              {activeStep < 3 ? (
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