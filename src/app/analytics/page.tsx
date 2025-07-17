'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/hooks/use-auth'
import { useBets } from '@/lib/hooks/use-bets'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Crown,
  DollarSign,
  Download,
  Eye,
  Filter,
  LineChart,
  Lock,
  PieChart,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ScatterChart as RechartsScatterChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

// Advanced Filter Types
interface FilterState {
  // Temporal Filters
  timeframe: string
  customDateRange: { start: Date | null; end: Date | null }
  daysOfWeek: string[]
  timeOfDay: string[]
  
  // Sport & League Filters
  sports: string[]
  leagues: string[]
  seasonType: string[]
  
  // Team & Matchup Filters
  teams: string[]
  homeAway: string[]
  rivals: boolean
  
  // Bet Type Filters
  betTypes: string[]
  propTypes: string[]
  spreadRanges: { min: number; max: number }
  totalsRanges: { min: number; max: number }
  
  // Performance Filters
  oddsRanges: { min: number; max: number }
  stakeRanges: { min: number; max: number }
  confidenceLevels: number[]
  results: string[]
  
  // Sportsbook Filters
  sportsbooks: string[]
  lineMovement: string[]
  clvStatus: string[]
  
  // Strategy Filters
  strategies: string[]
}

// Default filter state
const defaultFilters: FilterState = {
  timeframe: 'all', // Changed to 'all' to see all data
  customDateRange: { start: null, end: null },
  daysOfWeek: [],
  timeOfDay: [],
  sports: [],
  leagues: [],
  seasonType: [],
  teams: [],
  homeAway: [],
  rivals: false,
  betTypes: [],
  propTypes: [],
  spreadRanges: { min: -50, max: 50 },
  totalsRanges: { min: 30, max: 80 },
  oddsRanges: { min: -10000, max: 10000 }, // Expanded range
  stakeRanges: { min: 0, max: 100000 }, // Expanded range
  confidenceLevels: [],
  results: [], // Temporarily empty to see all bets
  sportsbooks: [],
  lineMovement: [],
  clvStatus: [],
  strategies: []
}

// Dropdown component for filters
interface FilterDropdownProps {
  label: string
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  isPro: boolean
  isProFeature?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  isPro, 
  isProFeature = false,
  icon: Icon = Filter 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  if (isProFeature && !isPro) {
    return (
      <div className="relative">
        <button 
          className="w-full px-4 py-3 text-left border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed flex items-center justify-between"
          disabled
        >
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <Lock className="h-3 w-3" />
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-slate-200 rounded-xl hover:border-blue-300 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{label}</span>
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedValues.length}
            </Badge>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleToggle(option)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between ${
                  selectedValues.includes(option) ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <span>{option}</span>
                {selectedValues.includes(option) && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Range filter component
interface RangeFilterProps {
  label: string
  min?: number
  max?: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  isPro: boolean
  isProFeature?: boolean
  prefix?: string
  suffix?: string
}

const RangeFilter: React.FC<RangeFilterProps> = ({ label, min, max, value, onChange, isPro, isProFeature = false, prefix = '', suffix = '' }) => {
  if (isProFeature && !isPro) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center">
          {label}
          <Lock className="h-3 w-3 ml-2 text-slate-400" />
        </label>
        <div className="flex space-x-2 opacity-50">
          <Input placeholder="Min" disabled className="bg-slate-50" />
          <Input placeholder="Max" disabled className="bg-slate-50" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex space-x-2">
        <Input
          type="number"
          placeholder="Min"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: Number(e.target.value) })}
          className="text-sm"
        />
        <Input
          type="number"
          placeholder="Max"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: Number(e.target.value) })}
          className="text-sm"
        />
      </div>
    </div>
  )
}

// Strategy builder component
interface StrategyBuilderProps {
  filters: FilterState
  onSaveStrategy: (strategy: any) => void
  isPro: boolean
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ filters, onSaveStrategy, isPro }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [strategyName, setStrategyName] = useState('')
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (strategyName.trim()) {
      onSaveStrategy({
        name: strategyName.trim(),
        description: description.trim(),
        filters: { ...filters },
        createdAt: new Date().toISOString()
      })
      setStrategyName('')
      setDescription('')
      setIsOpen(false)
    }
  }

  if (!isPro) {
    return (
      <Card className="p-6 border-2 border-dashed border-slate-200">
        <div className="text-center">
          <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-900 mb-1">Strategy Builder</h3>
          <p className="text-sm text-slate-600 mb-4">
            Save filter combinations as strategies and monetize them
          </p>
          <Button variant="outline" disabled>
            <Lock className="h-4 w-4 mr-2" />
            Pro Feature
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Strategy Builder</h3>
          <Crown className="h-4 w-4 text-yellow-500" />
        </div>
        <Button onClick={() => setIsOpen(!isOpen)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Strategy
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-4 mt-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Strategy Name</label>
            <Input
              placeholder="e.g., NFL Home Underdogs"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Description (Optional)</label>
            <Input
              placeholder="Describe your strategy..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!strategyName.trim()}>
              Save Strategy
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-sm text-slate-600 mb-2">Current Filter Summary:</p>
        <div className="text-xs text-slate-500 space-y-1">
          {filters.sports.length > 0 && <div>Sports: {filters.sports.join(', ')}</div>}
          {filters.betTypes.length > 0 && <div>Bet Types: {filters.betTypes.join(', ')}</div>}
          {filters.timeframe !== '30d' && <div>Timeframe: {filters.timeframe}</div>}
          {Object.values(filters).every(v => Array.isArray(v) ? v.length === 0 : v === defaultFilters[Object.keys(filters).find(key => filters[key] === v)]) && (
            <div className="italic">No filters applied</div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Advanced Charts Component
interface AdvancedChartsProps {
  data: any[]
  isPro: boolean
  isLoading: boolean
}

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ data, isPro, isLoading }) => {
  const [activeChart, setActiveChart] = useState('profit-trend')

  const chartTypes = [
    { id: 'profit-trend', name: 'Profit Trend', icon: LineChart },
    { id: 'roi-distribution', name: 'ROI Distribution', icon: BarChart, pro: true },
    { id: 'sport-breakdown', name: 'Sport Performance', icon: PieChart },
    { id: 'correlation', name: 'Correlation Matrix', icon: BarChart3, pro: true },
    { id: 'clv-analysis', name: 'CLV Analysis', icon: TrendingUp, pro: true },
    { id: 'variance', name: 'Variance Analysis', icon: Activity, pro: true }
  ]

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Advanced Analytics</h3>
        <div className="flex space-x-2">
          {chartTypes.map((chart) => {
            const Icon = chart.icon
            const isProChart = chart.pro && !isPro
            
            return (
              <button
                key={chart.id}
                onClick={() => !isProChart && setActiveChart(chart.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                  activeChart === chart.id
                    ? 'bg-blue-100 text-blue-700'
                    : isProChart
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                disabled={isProChart}
              >
                <Icon className="h-4 w-4" />
                <span>{chart.name}</span>
                {chart.pro && !isPro && <Lock className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-64">
        {activeChart === 'profit-trend' && (
          <div className="h-full">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={(() => {
                  // Calculate cumulative profit over time
                  const sortedBets = [...data].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
                  let cumulativeProfit = 0
                  return sortedBets.map((bet, index) => {
                    const result = bet.result || bet.status
                    const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                                      ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : 
                                       (result === 'lost' || result === 'loss') ? -(Number(bet.stake) || 0) : 0)
                    cumulativeProfit += profitLoss
                    return {
                      date: new Date(bet.placed_at).toLocaleDateString(),
                      profit: Number(cumulativeProfit.toFixed(2)),
                      betNumber: index + 1
                    }
                  })
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="betNumber" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${value}`, 'Profit']}
                    labelFormatter={(label) => `Bet #${label}`}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3b82f6" 
                    fill="url(#profitGradient)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </RechartsAreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No data available</p>
                  <p className="text-sm text-slate-500">Add some bets to see your profit trend</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeChart === 'roi-distribution' && (
          <div className="h-full">
            {isPro ? (
              data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={(() => {
                    // Create ROI distribution buckets
                    const settledBets = data.filter(bet => bet.result === 'won' || bet.result === 'lost')
                    const roiBuckets = {
                      '-100% to -50%': 0,
                      '-50% to -25%': 0,
                      '-25% to 0%': 0,
                      '0% to 25%': 0,
                      '25% to 50%': 0,
                      '50% to 100%': 0,
                      '100%+': 0
                    }
                    
                    settledBets.forEach(bet => {
                      const result = bet.result || bet.status
                      const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                                        ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : -(Number(bet.stake) || 0))
                      const roi = (profitLoss / (Number(bet.stake) || 1)) * 100
                      
                      if (roi < -50) roiBuckets['-100% to -50%']++
                      else if (roi < -25) roiBuckets['-50% to -25%']++
                      else if (roi < 0) roiBuckets['-25% to 0%']++
                      else if (roi < 25) roiBuckets['0% to 25%']++
                      else if (roi < 50) roiBuckets['25% to 50%']++
                      else if (roi < 100) roiBuckets['50% to 100%']++
                      else roiBuckets['100%+']++
                    })
                    
                    return Object.entries(roiBuckets).map(([range, count]) => ({
                      range,
                      count,
                      percentage: settledBets.length > 0 ? ((count / settledBets.length) * 100).toFixed(1) : 0
                    }))
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="range" 
                      stroke="#64748b" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [name === 'count' ? `${value} bets` : `${value}%`, name === 'count' ? 'Bets' : 'Percentage']}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No data for ROI analysis</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="filter blur-sm text-center">
                  <BarChart className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">ROI Distribution</p>
                  <Lock className="h-6 w-6 text-slate-400 mx-auto mt-2" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'sport-breakdown' && (
          <div className="h-full">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={(() => {
                      const sportStats = data.reduce((acc: Record<string, { bets: number; profit: number }>, bet) => {
                        const sport = bet.sport || 'Unknown'
                        if (!acc[sport]) {
                          acc[sport] = { bets: 0, profit: 0 }
                        }
                        acc[sport].bets += 1
                        const result = bet.result || bet.status
                        const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                                          ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : 
                                           (result === 'lost' || result === 'loss') ? -(Number(bet.stake) || 0) : 0)
                        acc[sport].profit += profitLoss
                        return acc
                      }, {})
                      
                      return Object.entries(sportStats)
                        .sort(([,a], [,b]) => (b as any).bets - (a as any).bets)
                        .slice(0, 6) // Top 6 sports
                        .map(([sport, stats], index) => ({
                          name: sport,
                          value: (stats as any).bets,
                          profit: (stats as any).profit,
                          fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index]
                        }))
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} bets`,
                      `Profit: $${props.payload.profit.toFixed(2)}`
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No sports data available</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'correlation' && (
          <div className="h-full">
            {isPro ? (
              data && data.length > 5 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsScatterChart data={(() => {
                    return data.map(bet => {
                      const result = bet.result || bet.status
                      const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                                        ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : 
                                         (result === 'lost' || result === 'loss') ? -(Number(bet.stake) || 0) : 0)
                      return {
                        odds: Number(bet.odds) || 0,
                        stake: Number(bet.stake) || 0,
                        profit: profitLoss,
                        roi: (profitLoss / (Number(bet.stake) || 1)) * 100
                      }
                    }).filter(bet => bet.odds !== 0 && bet.stake !== 0)
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      dataKey="odds" 
                      name="Odds" 
                      stroke="#64748b" 
                      fontSize={12}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="roi" 
                      name="ROI %" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'ROI %') return [`${Number(value).toFixed(1)}%`, 'ROI']
                        if (name === 'Odds') return [Number(value).toFixed(0), 'Odds']
                        return [value, name]
                      }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Scatter 
                      dataKey="roi" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                      strokeWidth={1}
                      stroke="#7c3aed"
                    />
                  </RechartsScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Need more data for correlation</p>
                    <p className="text-sm text-slate-500">At least 6 bets required</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="filter blur-sm text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">Correlation Analysis</p>
                  <Lock className="h-6 w-6 text-slate-400 mx-auto mt-2" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'clv-analysis' && (
          <div className="h-full">
            {isPro ? (
              data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={(() => {
                    // Simulate CLV data over time since we don't have real CLV data
                    const sortedBets = [...data].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
                    let cumulativeCLV = 0
                    return sortedBets.map((bet, index) => {
                      // Simulate CLV based on bet success and odds
                      const result = bet.result || bet.status
                      const odds = Number(bet.odds) || 0
                      const simulatedCLV = (result === 'won' || result === 'win') ? 
                        Math.random() * 0.05 + 0.01 : // Positive CLV for wins
                        Math.random() * 0.03 - 0.02   // Slightly negative CLV for losses
                      cumulativeCLV += simulatedCLV
                      return {
                        betNumber: index + 1,
                        clv: Number((simulatedCLV * 100).toFixed(2)),
                        cumulativeCLV: Number((cumulativeCLV * 100).toFixed(2)),
                        date: new Date(bet.placed_at).toLocaleDateString()
                      }
                    })
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="betNumber" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(value) => `#${value}`}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'clv') return [`${value}%`, 'CLV']
                        if (name === 'cumulativeCLV') return [`${value}%`, 'Cumulative CLV']
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Bet #${label}`}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeCLV" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No CLV data available</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="filter blur-sm text-center">
                  <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">CLV Analysis</p>
                  <Lock className="h-6 w-6 text-slate-400 mx-auto mt-2" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'variance' && (
          <div className="h-full">
            {isPro ? (
              data && data.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={(() => {
                    // Calculate rolling variance and risk metrics
                    const sortedBets = [...data].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
                    const windowSize = Math.min(10, Math.max(3, Math.floor(sortedBets.length / 4)))
                    
                    return sortedBets.map((bet, index) => {
                      if (index < windowSize - 1) return null
                      
                      const window = sortedBets.slice(index - windowSize + 1, index + 1)
                      const returns = window.map(b => {
                        const result = b.result || b.status
                        const profitLoss = b.profit_loss ? Number(b.profit_loss) : 
                                          ((result === 'won' || result === 'win') ? (Number(b.actual_payout) || 0) - (Number(b.stake) || 0) : 
                                           (result === 'lost' || result === 'loss') ? -(Number(b.stake) || 0) : 0)
                        return profitLoss / (Number(b.stake) || 1)
                      })
                      
                      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
                      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
                      const volatility = Math.sqrt(variance) * 100
                      
                      return {
                        betNumber: index + 1,
                        volatility: Number(volatility.toFixed(2)),
                        riskScore: Number((volatility * 2).toFixed(1)), // Risk score as 2x volatility
                        date: new Date(bet.placed_at).toLocaleDateString()
                      }
                    }).filter(Boolean)
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="betNumber" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(value) => `#${value}`}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'volatility') return [`${value}%`, 'Volatility']
                        if (name === 'riskScore') return [`${value}%`, 'Risk Score']
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Bet #${label}`}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volatility" 
                      stroke="#f59e0b" 
                      fill="url(#varianceGradient)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="varianceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </RechartsAreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Insufficient data for variance</p>
                    <p className="text-sm text-slate-500">Need at least 3 bets</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="filter blur-sm text-center">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">Variance Analysis</p>
                  <Lock className="h-6 w-6 text-slate-400 mx-auto mt-2" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isPro && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Unlock Advanced Charts</p>
              <p className="text-xs text-blue-700">Get correlation analysis, CLV tracking, and risk metrics</p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// Performance metrics calculation
const calculateAdvancedMetrics = (bets: any[], isPro: boolean) => {
  // Debug logging
  console.log('calculateAdvancedMetrics called with:', {
    betsCount: bets?.length || 0,
    firstBet: bets?.[0],
    isPro
  })

  if (!bets || bets.length === 0) {
    return {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      totalProfit: 0,
      totalStaked: 0,
      avgOdds: 0,
      avgStake: 0,
      currentStreak: 0,
      streakType: 'none',
      variance: 0,
      sharpeRatio: 0,
      avgClv: 0,
      maxDrawdown: 0,
      profitFactor: 0,
      kellyOptimal: 0
    }
  }

  const settledBets = bets.filter(bet => {
    const result = bet.result || bet.status
    return result === 'won' || result === 'lost' || result === 'win' || result === 'loss'
  })
  const wonBets = settledBets.filter(bet => {
    const result = bet.result || bet.status
    return result === 'won' || result === 'win'
  })
  
  console.log('Bet filtering results:', {
    totalBets: bets.length,
    settledBets: settledBets.length,
    wonBets: wonBets.length,
    sampleResults: bets.slice(0, 3).map(bet => ({ 
      result: bet.result, 
      status: bet.status, 
      stake: bet.stake,
      sport: bet.sport 
    }))
  })
  
  const totalBets = settledBets.length
  const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0
  
  const totalStaked = settledBets.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
  const totalProfit = settledBets.reduce((sum, bet) => {
    const result = bet.result || bet.status
    const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                      ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : -(Number(bet.stake) || 0))
    return sum + profitLoss
  }, 0)
  
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
  const avgOdds = settledBets.length > 0 ? settledBets.reduce((sum, bet) => sum + (Number(bet.odds) || 0), 0) / settledBets.length : 0
  const avgStake = totalStaked / Math.max(totalBets, 1)

  // Calculate current streak
  let currentStreak = 0
  let streakType = 'none'
  
  if (settledBets.length > 0) {
    const sortedBets = [...settledBets].sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime())
    const lastResult = sortedBets[0]?.result || sortedBets[0]?.status
    streakType = (lastResult === 'won' || lastResult === 'win') ? 'win' : 'loss'
    
    for (const bet of sortedBets) {
      const betResult = bet.result || bet.status
      if ((streakType === 'win' && (betResult === 'won' || betResult === 'win')) ||
          (streakType === 'loss' && (betResult === 'lost' || betResult === 'loss'))) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Advanced metrics (Pro only)
  let variance = 0
  let sharpeRatio = 0
  let avgClv = 0
  const maxDrawdown = 0
  let profitFactor = 0
  const kellyOptimal = 0

  if (isPro && settledBets.length > 0) {
    // Calculate variance
    const returns = settledBets.map(bet => {
      const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                        (bet.result === 'won' ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : -(Number(bet.stake) || 0))
      return profitLoss / (Number(bet.stake) || 1)
    })
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    
    // Sharpe ratio
    const standardDev = Math.sqrt(variance)
    sharpeRatio = standardDev > 0 ? avgReturn / standardDev : 0

    // Average CLV
    const clvBets = settledBets.filter(bet => bet.clv !== null && bet.clv !== undefined)
    avgClv = clvBets.length > 0 ? clvBets.reduce((sum, bet) => sum + Number(bet.clv), 0) / clvBets.length : 0

    // Profit factor
    const grossWins = wonBets.reduce((sum, bet) => {
      const profit = bet.profit_loss ? Number(bet.profit_loss) : (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0)
      return sum + Math.max(profit, 0)
    }, 0)
    const grossLosses = settledBets.filter(bet => bet.result === 'lost').reduce((sum, bet) => {
      return sum + (Number(bet.stake) || 0)
    }, 0)
    profitFactor = grossLosses > 0 ? grossWins / grossLosses : 0
  }

  return {
    totalBets,
    winRate,
    roi,
    totalProfit,
    totalStaked,
    avgOdds,
    avgStake,
    currentStreak,
    streakType,
    variance,
    sharpeRatio,
    avgClv,
    maxDrawdown,
    profitFactor,
    kellyOptimal
  }
}

// Main component
export default function EnhancedAnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const { betsData, isLoading: betsLoading, error: betsError, refresh: refreshBets } = useBets()
  
  const [isPro, setIsPro] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>('overview')
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [savedStrategies, setSavedStrategies] = useState<any[]>([])
  const [showProUpgrade, setShowProUpgrade] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // Auto-refresh data when user changes
  useEffect(() => {
    if (user && !authLoading && refreshBets) {
      refreshBets()
    }
  }, [user, authLoading, refreshBets])

  // Set default custom date range when bets data loads
  useEffect(() => {
    if (betsData && betsData.length > 0 && !filters.customDateRange.start && !filters.customDateRange.end) {
      const sortedBets = [...betsData].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
      const firstBetDate = new Date(sortedBets[0].placed_at)
      const lastBetDate = new Date(sortedBets[sortedBets.length - 1].placed_at)
      
      setFilters(prev => ({
        ...prev,
        customDateRange: {
          start: firstBetDate,
          end: lastBetDate
        }
      }))
    }
  }, [betsData, filters.customDateRange.start, filters.customDateRange.end])

  // Filter options
  const sportOptions = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'MMA', 'Boxing']
  const betTypeOptions = ['Spread', 'Moneyline', 'Total', 'Player Props', 'Game Props', 'Futures', 'Live']
  const sportsbookOptions = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET']
  const resultOptions = ['won', 'lost', 'pending', 'void']
  const daysOfWeekOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const homeAwayOptions = ['Home', 'Away', 'Neutral']

  // Apply filters to bets
  const filteredBets = useMemo(() => {
    if (!betsData?.length) return []

    const filtered = betsData.filter((bet: any) => {
      // Timeframe filter
      if (filters.timeframe !== 'all') {
        const betDate = new Date(bet.placed_at)
        
        if (filters.timeframe === 'custom') {
          // Custom date range
          if (filters.customDateRange.start && betDate < filters.customDateRange.start) return false
          if (filters.customDateRange.end && betDate > filters.customDateRange.end) return false
        } else {
          // Predefined date ranges
          const now = new Date()
          let startDate = new Date(0)
          
          switch (filters.timeframe) {
            case '7d':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case '30d':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
          }
          
          if (betDate < startDate) return false
        }
      }

      // Sport filter
      if (filters.sports.length > 0 && !filters.sports.includes(bet.sport)) return false
      
      // Bet type filter
      if (filters.betTypes.length > 0) {
        const betType = bet.bet_type || bet.betType || 'Unknown'
        // Normalize the bet type for comparison
        const normalizedBetType = betType.toLowerCase()
        const matchesBetType = filters.betTypes.some(filterType => 
          normalizedBetType.includes(filterType.toLowerCase()) || 
          filterType.toLowerCase().includes(normalizedBetType)
        )
        if (!matchesBetType) return false
      }
      
      // Result filter (only apply if results are selected)
      if (filters.results.length > 0) {
        const betResult = bet.result || bet.status
        // Normalize results to match filter options
        let normalizedResult = 'pending'
        if (betResult === 'won' || betResult === 'win') normalizedResult = 'won'
        else if (betResult === 'lost' || betResult === 'loss') normalizedResult = 'lost'
        else if (betResult === 'void' || betResult === 'cancelled') normalizedResult = 'void'
        
        if (!filters.results.includes(normalizedResult)) return false
      }
      
      // Sportsbook filter
      if (filters.sportsbooks.length > 0 && !filters.sportsbooks.includes(bet.sportsbook || '')) return false

      // Days of week filter (Pro feature)
      if (isPro && filters.daysOfWeek.length > 0) {
        const betDate = new Date(bet.placed_at)
        const dayName = betDate.toLocaleDateString('en-US', { weekday: 'long' })
        if (!filters.daysOfWeek.includes(dayName)) return false
      }

      // Stakes range filter (only apply if realistic ranges)
      if (filters.stakeRanges.min > 0 || filters.stakeRanges.max < 100000) {
        const stake = Number(bet.stake) || 0
        if (stake < filters.stakeRanges.min || stake > filters.stakeRanges.max) return false
      }

      // Odds range filter (only apply if realistic ranges)
      if (filters.oddsRanges.min > -10000 || filters.oddsRanges.max < 10000) {
        const odds = Number(bet.odds) || 0
        if (odds < filters.oddsRanges.min || odds > filters.oddsRanges.max) return false
      }

      return true
    })
    
    return filtered
  }, [betsData, filters, isPro])

  // Calculate metrics
  const metrics = useMemo(() => calculateAdvancedMetrics(filteredBets, isPro), [filteredBets, isPro])

  // Filter update handlers
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const handleProFeatureClick = () => {
    if (!isPro) setShowProUpgrade(true)
  }

  const handleSaveStrategy = useCallback((strategy: any) => {
    setSavedStrategies(prev => [...prev, { ...strategy, id: Date.now().toString() }])
  }, [])

  const isLoading = authLoading || betsLoading

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
    );
  }

  return (
    <DashboardLayout current="Analytics">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
                
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
              
              <p className="text-slate-600 mb-2">
                {isPro 
                  ? "Advanced analytics with unlimited filtering and professional insights"
                  : "Deep dive into your verified betting performance with basic analytics"
                }
              </p>
              
              {/* Data summary */}
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>Total Bets: {betsData?.length || 0}</span>
                <span>Filtered: {filteredBets?.length || 0}</span>
                {metrics.totalStaked > 0 && (
                  <span>Total Staked: ${metrics.totalStaked.toFixed(2)}</span>
                )}
                {/* Debug info */}
                {betsLoading && <span className="text-blue-600">Loading...</span>}
                {betsError && <span className="text-red-600">Error: {betsError}</span>}
                {!user && !authLoading && <span className="text-orange-600">Not signed in</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'overview' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2 inline" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('analysis')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'analysis' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2 inline" />
                  Analysis
                </button>
                <button
                  onClick={() => isPro ? setActiveView('strategies') : handleProFeatureClick()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'strategies' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  } ${!isPro ? 'opacity-60' : ''}`}
                >
                  <Target className="h-4 w-4 mr-2 inline" />
                  Strategies
                  {!isPro && <Lock className="h-3 w-3 ml-1 inline" />}
                </button>
              </div>
              
              <button 
                onClick={refreshBets}
                className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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

        {/* Analytics Filters Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium rounded-xl shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 hover:scale-105 ${
              showFilters ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            <Filter className="h-5 w-5 mr-2" />
            Analytics Filters
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {(filters.sports.length > 0 || filters.betTypes.length > 0 || filters.results.length < 2 || filters.sportsbooks.length > 0) && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                Active
              </Badge>
            )}
          </button>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <Card className="mt-4 p-6 bg-slate-50/50 border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Timeframe Filter */}
                <div>
                  <FilterDropdown
                    label="Time Period"
                    options={['Last 7 Days', 'Last 30 Days', 'All Time', 'Custom']}
                    selectedValues={[
                      filters.timeframe === '7d' ? 'Last 7 Days' :
                      filters.timeframe === '30d' ? 'Last 30 Days' :
                      filters.timeframe === 'custom' ? 'Custom' : 'All Time'
                    ]}
                    onChange={(values) => {
                      const value = values[0]
                      if (value === 'Last 7 Days') updateFilter('timeframe', '7d')
                      else if (value === 'Last 30 Days') updateFilter('timeframe', '30d')
                      else if (value === 'Custom') updateFilter('timeframe', 'custom')
                      else updateFilter('timeframe', 'all')
                    }}
                    isPro={isPro}
                    icon={Calendar}
                  />
                  
                  {/* Custom Date Range */}
                  {filters.timeframe === 'custom' && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <p className="text-sm font-medium text-slate-700">Custom Date Range</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 mb-1 block">Start Date</label>
                          <input
                            type="date"
                            value={filters.customDateRange.start ? filters.customDateRange.start.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null
                              updateFilter('customDateRange', { ...filters.customDateRange, start: date })
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 mb-1 block">End Date</label>
                          <input
                            type="date"
                            value={filters.customDateRange.end ? filters.customDateRange.end.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null
                              updateFilter('customDateRange', { ...filters.customDateRange, end: date })
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sports Filter */}
                <div>
                  <FilterDropdown
                    label="Sports"
                    options={sportOptions}
                    selectedValues={filters.sports}
                    onChange={(values) => updateFilter('sports', values)}
                    isPro={isPro}
                    icon={Trophy}
                  />
                </div>

                {/* Bet Types Filter */}
                <div>
                  <FilterDropdown
                    label="Bet Types"
                    options={betTypeOptions}
                    selectedValues={filters.betTypes}
                    onChange={(values) => updateFilter('betTypes', values)}
                    isPro={isPro}
                    icon={Target}
                  />
                </div>

                {/* Results Filter */}
                <div>
                  <FilterDropdown
                    label="Results"
                    options={resultOptions}
                    selectedValues={filters.results}
                    onChange={(values) => updateFilter('results', values)}
                    isPro={isPro}
                    icon={CheckCircle}
                  />
                </div>
              </div>

              {/* Second Row - Pro Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-200">
                {/* Sportsbooks Filter */}
                <div>
                  <FilterDropdown
                    label="Sportsbooks"
                    options={sportsbookOptions}
                    selectedValues={filters.sportsbooks}
                    onChange={(values) => updateFilter('sportsbooks', values)}
                    isPro={isPro}
                    icon={DollarSign}
                  />
                </div>

                {/* Days of Week (Pro) */}
                <div>
                  <FilterDropdown
                    label="Days of Week"
                    options={daysOfWeekOptions}
                    selectedValues={filters.daysOfWeek}
                    onChange={(values) => updateFilter('daysOfWeek', values)}
                    isPro={isPro}
                    isProFeature={true}
                    icon={Calendar}
                  />
                </div>

                {/* Placeholder for future filter */}
                <div></div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
                <RangeFilter
                  label="Stake Range ($)"
                  value={filters.stakeRanges}
                  onChange={(value) => updateFilter('stakeRanges', value)}
                  isPro={isPro}
                  prefix="$"
                />
                
                <RangeFilter
                  label="Odds Range"
                  value={filters.oddsRanges}
                  onChange={(value) => updateFilter('oddsRanges', value)}
                  isPro={isPro}
                  isProFeature={true}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!user && (
              <Card className="p-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-yellow-800">Sign in Required</h3>
                    <p className="text-yellow-700 mt-1">Please sign in to view your betting analytics.</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Overview Tab */}
            {activeView === 'overview' && (
              <>
                {/* Key Metrics */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Performance Overview
                  </h2>
                  
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-6">
                          <div className="animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-8 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded"></div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : betsError ? (
                    <Card className="p-6 bg-red-50 border-red-200">
                      <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
                          <p className="text-red-700 mt-1">{betsError}</p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Total Profit */}
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${metrics.totalProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          {isPro && (
                            <Badge variant="outline" className="text-xs">
                              Real-time
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Profit</p>
                          <p className={`text-2xl font-bold mb-2 ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${metrics.totalProfit.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}% ROI
                          </p>
                        </div>
                      </Card>

                      {/* Win Rate */}
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Win Rate</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.winRate.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">
                            {metrics.totalBets} total bets
                          </p>
                        </div>
                      </Card>

                      {/* Average Stake */}
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Avg Stake</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">${metrics.avgStake.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">
                            ${metrics.totalStaked.toFixed(2)} total staked
                          </p>
                        </div>
                      </Card>

                      {/* Current Streak */}
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500">
                            <Activity className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Current Streak</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.currentStreak}</p>
                          <p className="text-xs text-slate-500">
                            {metrics.streakType === 'win' ? '🔥 Win' : metrics.streakType === 'loss' ? '❄️ Loss' : 'No'} streak
                          </p>
                        </div>
                      </Card>
                    </div>
                    </>
                  )}
                </div>

                {/* Advanced Metrics (Pro) */}
                {isPro && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                      Advanced Metrics
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Sharpe Ratio */}
                      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Sharpe Ratio</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.sharpeRatio.toFixed(2)}</p>
                          <p className="text-xs text-slate-600">Risk-adjusted returns</p>
                        </div>
                      </Card>

                      {/* Average CLV */}
                      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Avg CLV</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">
                            {metrics.avgClv ? `${metrics.avgClv > 0 ? '+' : ''}${(metrics.avgClv * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                          <p className="text-xs text-slate-600">Closing line value</p>
                        </div>
                      </Card>

                      {/* Profit Factor */}
                      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600">
                            <Target className="h-6 w-6 text-white" />
                          </div>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Profit Factor</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.profitFactor.toFixed(2)}</p>
                          <p className="text-xs text-slate-600">Gross wins / Gross losses</p>
                        </div>
                      </Card>

                      {/* Variance */}
                      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600">
                            <Activity className="h-6 w-6 text-white" />
                          </div>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Variance</p>
                          <p className="text-2xl font-bold text-slate-900 mb-2">{metrics.variance.toFixed(3)}</p>
                          <p className="text-xs text-slate-600">Return volatility</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Analysis Tab */}
            {activeView === 'analysis' && (
              <>
                <AdvancedCharts data={filteredBets} isPro={isPro} isLoading={isLoading} />
                
                {/* Sport Breakdown */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Performance by Sport
                  </h3>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4">
                          <div className="w-16 h-4 bg-slate-200 rounded"></div>
                          <div className="flex-1 h-4 bg-slate-200 rounded"></div>
                          <div className="w-20 h-4 bg-slate-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBets && filteredBets.length > 0 ? (
                        (() => {
                          const sportStats = filteredBets.reduce((acc: Record<string, { bets: number; won: number; profit: number; staked: number }>, bet) => {
                            const sport = bet.sport || 'Unknown'
                            if (!acc[sport]) {
                              acc[sport] = { bets: 0, won: 0, profit: 0, staked: 0 }
                            }
                            acc[sport].bets += 1
                            acc[sport].staked += Number(bet.stake) || 0
                            if (bet.result === 'won') {
                              acc[sport].won += 1
                              const profit = bet.profit_loss ? Number(bet.profit_loss) : 
                                            (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0)
                              acc[sport].profit += profit
                            } else if (bet.result === 'lost') {
                              acc[sport].profit -= Number(bet.stake) || 0
                            }
                            return acc
                          }, {})

                          return Object.entries(sportStats)
                            .sort(([,a], [,b]) => (b as any).profit - (a as any).profit)
                            .map(([sport, stats]) => {
                              const s = stats as { bets: number; won: number; profit: number; staked: number }
                              const winRate = s.bets > 0 ? (s.won / s.bets) * 100 : 0
                              const roi = s.staked > 0 ? (s.profit / s.staked) * 100 : 0
                              
                              return (
                                <div key={sport} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                  <div className="flex items-center space-x-4">
                                    <Badge variant="outline" className="min-w-[60px] justify-center">
                                      {sport}
                                    </Badge>
                                    <div>
                                      <p className="font-medium">{s.bets} bets</p>
                                      <p className="text-sm text-slate-600">{winRate.toFixed(1)}% win rate</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-semibold ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ${s.profit.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                                    </p>
                                  </div>
                                </div>
                              )
                            })
                        })()
                      ) : (
                        <div className="text-center py-8">
                          <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600">No data available for current filters</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Strategies Tab */}
            {activeView === 'strategies' && (
              <>
                <StrategyBuilder 
                  filters={filters} 
                  onSaveStrategy={handleSaveStrategy}
                  isPro={isPro}
                />
                
                {/* Saved Strategies */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    My Strategies
                    {isPro && <Crown className="h-4 w-4 ml-2 text-yellow-500" />}
                  </h3>
                  
                  {savedStrategies.length > 0 ? (
                    <div className="grid gap-4">
                      {savedStrategies.map((strategy) => (
                        <div key={strategy.id} className="p-4 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{strategy.name}</h4>
                              {strategy.description && (
                                <p className="text-sm text-slate-600 mt-1">{strategy.description}</p>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                Created {new Date(strategy.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                Load Filters
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No strategies created yet</p>
                      <p className="text-sm text-slate-500">Create your first strategy using the builder above</p>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Pro Upgrade Banner */}
            {!isPro && (
              <Card className="p-8 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <Crown className="h-8 w-8 text-yellow-300 mr-3" />
                      <h3 className="text-2xl font-bold">Unlock the Full Power of TrueSharp</h3>
                    </div>
                    <p className="text-blue-100 mb-6 max-w-2xl">
                      Get unlimited filtering, advanced analytics, strategy building, and professional-grade insights to maximize your betting edge.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6 max-w-3xl">
                      {[
                        'Unlimited historical data access',
                        'Advanced correlation & CLV analysis', 
                        'Strategy builder & monetization',
                        'Custom report generation',
                        'Risk management tools',
                        'Real-time alerts & notifications',
                        'Portfolio optimization',
                        'Priority customer support'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                          <span className="text-sm text-blue-100">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center ml-8">
                    <div className="mb-6">
                      <div className="text-4xl font-bold mb-1">$19.99</div>
                      <div className="text-blue-200 text-sm">/month</div>
                      <div className="text-xs text-blue-300 mt-1">or $199/year (save 17%)</div>
                    </div>
                    <Button
                      onClick={() => setIsPro(true)}
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg mb-4"
                    >
                      Try Pro Mode
                      <ArrowUpRight className="h-5 w-5 ml-2" />
                    </Button>
                    <p className="text-xs text-blue-200">14-day free trial • Cancel anytime</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Pro Upgrade Modal */}
        {showProUpgrade && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md">
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
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    <span className="text-sm font-medium text-slate-900">This feature requires TrueSharp Pro</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Upgrade now for unlimited analytics and advanced features that help you maximize your betting edge.
                  </p>
                  
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
                    <h4 className="text-sm font-medium text-slate-900 mb-3">What you'll get:</h4>
                    <div className="space-y-2">
                      {[
                        'Unlimited filtering & custom date ranges',
                        'Advanced profit & correlation charts',
                        'Strategy builder & monetization tools',
                        'CLV tracking & line movement analysis'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-xs text-slate-700">{feature}</span>
                        </div>
                      ))}
                      <div className="text-xs text-slate-500 mt-2">+ 8 more premium features</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowProUpgrade(false)}
                    className="px-4 py-2"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    onClick={() => {
                      setIsPro(true);
                      setShowProUpgrade(false);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Try Pro Mode
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
    </DashboardLayout>
  )
}