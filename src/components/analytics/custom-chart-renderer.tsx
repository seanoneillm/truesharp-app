'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchCustomChartData,
  formatCurrency,
  formatPercentage,
  getValueColor,
} from '@/lib/analytics/custom-charts'
import type { ChartConfig, CustomChartData } from '@/lib/types/custom-charts'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Crown,
  LineChart as LineChartIcon,
  Loader2,
  PieChart as PieChartIcon,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface CustomChartRendererProps {
  config: ChartConfig
  userId: string
  onDelete: (chartId: string) => void
  isPro?: boolean
}

const CHART_COLORS = [
  '#3b82f6', // blue-600
  '#059669', // green-600
  '#dc2626', // red-600
  '#7c3aed', // violet-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#65a30d', // lime-600
  '#e11d48', // rose-600
]

const CHART_ICONS = {
  line: LineChartIcon,
  bar: BarChart3,
  pie: PieChartIcon,
  stacked_bar: BarChart3,
  histogram: BarChart3,
  scatter: Activity,
}

export function CustomChartRenderer({
  config,
  userId,
  onDelete,
  isPro = false,
}: CustomChartRendererProps) {
  const [data, setData] = useState<CustomChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [config, userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const chartData = await fetchCustomChartData(userId, config)
      setData(chartData)
    } catch (err) {
      console.error('Error fetching custom chart data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const formatTooltipValue = (value: any) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'N/A'
    }

    const numValue = Number(value)

    switch (config.yAxis as any) {
      case 'wins_count':
        return `${numValue} win${numValue !== 1 ? 's' : ''}`
      case 'losses_count':
        return `${numValue} loss${numValue !== 1 ? 'es' : ''}`
      case 'win_rate':
      case 'roi':
      case 'longshot_hit_rate':
      case 'chalk_hit_rate':
        return formatPercentage(numValue)
      case 'profit':
      case 'total_staked':
      case 'average_stake':
      case 'max_win':
      case 'max_loss':
        return formatCurrency(numValue)
      case 'average_odds':
      case 'median_odds':
        return numValue > 0 ? `+${numValue.toFixed(0)}` : numValue.toFixed(0)
      case 'void_count':
        return `${numValue} void${numValue !== 1 ? 's' : ''}`
      case 'profit_variance':
        return `$${numValue.toFixed(2)} volatility`
      // Legacy support
      case 'count':
        return `${numValue} bet${numValue !== 1 ? 's' : ''}`
      case 'stake':
        return formatCurrency(numValue)
      default:
        return numValue.toFixed(2)
    }
  }

  const formatYAxisTick = (value: any) => {
    // Handle null, undefined, or non-numeric values
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0'
    }

    const numValue = Number(value)

    switch (config.yAxis as any) {
      case 'profit':
      case 'total_staked':
      case 'average_stake':
      case 'max_win':
      case 'max_loss':
      case 'profit_variance':
        return `$${Math.abs(numValue) >= 1000 ? (numValue / 1000).toFixed(1) + 'k' : numValue.toFixed(0)}`
      case 'win_rate':
      case 'roi':
      case 'longshot_hit_rate':
      case 'chalk_hit_rate':
        return `${numValue.toFixed(0)}%`
      case 'wins_count':
      case 'losses_count':
      case 'void_count':
        return numValue.toFixed(0)
      case 'average_odds':
      case 'median_odds':
        return numValue > 0 ? `+${numValue.toFixed(0)}` : numValue.toFixed(0)
      // Legacy support
      case 'count':
        return numValue.toFixed(0)
      case 'stake':
        return `$${Math.abs(numValue) >= 1000 ? (numValue / 1000).toFixed(1) + 'k' : numValue.toFixed(0)}`
      default:
        return numValue.toFixed(1)
    }
  }

  const getChartColor = () => {
    return getValueColor(0, config.yAxis as any)
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex h-80 items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading chart data...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex h-80 items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="font-medium">Error loading chart</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              Retry
            </Button>
          </div>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex h-80 items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p className="font-medium">No data available</p>
            <p className="text-sm">Try adjusting your filters or date range</p>
          </div>
        </div>
      )
    }

    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    switch (config.chartType as any) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart {...chartProps}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#e2e8f0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                angle={config.xAxis === 'placed_at' ? 0 : -45}
                textAnchor={config.xAxis === 'placed_at' ? 'middle' : 'end'}
                height={config.xAxis === 'placed_at' ? 30 : 60}
              />
              <YAxis
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
              />
              <Line
                type="monotone"
                dataKey={config.yAxis}
                stroke={getChartColor()}
                strokeWidth={3}
                dot={{ r: 2, fill: getChartColor(), strokeWidth: 0 }}
                activeDot={{ r: 4, fill: getChartColor(), strokeWidth: 2, stroke: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart {...chartProps}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#e2e8f0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
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
              />
              <Bar dataKey={config.yAxis} fill={getChartColor()} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                paddingAngle={2}
                dataKey={config.yAxis}
                nameKey={config.xAxis}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '13px',
                }}
                formatter={formatTooltipValue}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'stacked_bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart {...chartProps}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#e2e8f0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
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
              />
              <Bar
                dataKey={config.yAxis}
                stackId="a"
                fill={getChartColor()}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart {...chartProps}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#e2e8f0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey={config.xAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
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
              />
              <Bar dataKey={config.yAxis} fill={getChartColor()} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart {...chartProps}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#e2e8f0"
                horizontal={true}
                vertical={true}
              />
              <XAxis
                dataKey={config.xAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                type="category"
              />
              <YAxis
                dataKey={config.yAxis}
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
              />
              <Scatter fill={getChartColor()} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getFilterSummary = () => {
    const filters = []

    if (config.filters.leagues && config.filters.leagues.length > 0) {
      filters.push(
        `${config.filters.leagues.length} league${config.filters.leagues.length !== 1 ? 's' : ''}`
      )
    }

    if (config.filters.status && config.filters.status.length > 0) {
      filters.push(config.filters.status.join(', '))
    }

    if (config.filters.bet_types && config.filters.bet_types.length > 0) {
      filters.push(
        `${config.filters.bet_types.length} bet type${config.filters.bet_types.length !== 1 ? 's' : ''}`
      )
    }

    if (config.filters.date_range?.start || config.filters.date_range?.end) {
      filters.push('date filtered')
    }

    return filters
  }

  const ChartIcon = CHART_ICONS[config.chartType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white to-slate-50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <ChartIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
                <div className="mt-1 flex items-center space-x-2">
                  {getFilterSummary().length > 0 && (
                    <>
                      {getFilterSummary().map((filter, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {filter}
                        </Badge>
                      ))}
                    </>
                  )}
                  {!loading && data.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {data.length} data point{data.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(config.id)}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {!isPro && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                <Crown className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                <div className="text-sm font-medium text-gray-900">Custom Charts - Pro Only</div>
                <div className="text-xs text-gray-600">Upgrade to create custom analytics</div>
              </div>
            </div>
          )}
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  )
}
