'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts'
import { 
  Trash2, 
  Loader2, 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import type { ChartConfig } from '@/lib/types/custom-charts'
import { 
  fetchCustomChartData, 
  formatCurrency, 
  formatPercentage, 
  getValueColor,
  type CustomChartData 
} from '@/lib/analytics/custom-charts'

interface CustomChartRendererProps {
  config: ChartConfig
  userId: string
  onDelete: (chartId: string) => void
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
}

export function CustomChartRenderer({ config, userId, onDelete }: CustomChartRendererProps) {
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

  const formatTooltipValue = (value: number, name: string) => {
    switch (config.yAxis) {
      case 'profit':
        return formatCurrency(value)
      case 'win_rate':
      case 'roi':
        return formatPercentage(value)
      case 'stake':
        return formatCurrency(value)
      case 'count':
        return `${value} bet${value !== 1 ? 's' : ''}`
      default:
        return value.toFixed(2)
    }
  }

  const formatYAxisTick = (value: number) => {
    switch (config.yAxis) {
      case 'profit':
      case 'stake':
        return `$${Math.abs(value) >= 1000 ? (value/1000).toFixed(1) + 'k' : value.toFixed(0)}`
      case 'win_rate':
      case 'roi':
        return `${value.toFixed(0)}%`
      case 'count':
        return value.toFixed(0)
      default:
        return value.toFixed(1)
    }
  }

  const getChartColor = () => {
    return getValueColor(0, config.yAxis as any)
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading chart data...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Error loading chart</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchData}
            >
              Retry
            </Button>
          </div>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No data available</p>
            <p className="text-sm">Try adjusting your filters or date range</p>
          </div>
        </div>
      )
    }

    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    switch (config.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
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
                  fontSize: '13px'
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
          <ResponsiveContainer width="100%" height={320}>
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
                  fontSize: '13px'
                }}
                formatter={formatTooltipValue}
              />
              <Bar 
                dataKey={config.yAxis}
                fill={getChartColor()}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
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
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '13px'
                }}
                formatter={formatTooltipValue}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getFilterSummary = () => {
    const filters = []
    
    if (config.filters.leagues && config.filters.leagues.length > 0) {
      filters.push(`${config.filters.leagues.length} league${config.filters.leagues.length !== 1 ? 's' : ''}`)
    }
    
    if (config.filters.status && config.filters.status.length > 0) {
      filters.push(config.filters.status.join(', '))
    }
    
    if (config.filters.bet_types && config.filters.bet_types.length > 0) {
      filters.push(`${config.filters.bet_types.length} bet type${config.filters.bet_types.length !== 1 ? 's' : ''}`)
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
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
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  )
}