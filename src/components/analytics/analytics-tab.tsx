'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Crown,
  DollarSign,
  LineChart,
  Lock,
  PieChart,
  Target,
  TrendingUp,
  Zap
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
  monthlyData: { month: string; profit: number; bets: number; roi: number }[]
  clvData?: { date: string; clv: number; profit: number }[]
  varianceData?: { period: string; variance: number; expectedValue: number }[]
}

interface AnalyticsTabProps {
  data: AnalyticsData
  isPro: boolean
  isLoading?: boolean
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

export function AnalyticsTab({ data, isPro, isLoading = false }: AnalyticsTabProps) {
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

  const ProUpgradePrompt = ({ title, description }: { title: string; description: string }) => (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      <CardContent className="relative p-8 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro - $20/month
          </Button>
        </div>
      </CardContent>
    </Card>
  )

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

        {/* Sport Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Sport Performance Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sportBreakdown.map((sport, index) => (
                <div key={sport.sport} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{sport.sport}</p>
                      <p className="text-sm text-gray-600">{sport.count} bets • {sport.winRate.toFixed(1)}% win rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${sport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(sport.profit)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sport.count} bets • {sport.winRate.toFixed(1)}% win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro Tier Analytics */}
      {isPro ? (
        <>
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-600">Pro Analytics</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Closing Line Value Chart */}
            {data.clvData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <span>Closing Line Value Over Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={data.clvData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'profit' ? formatCurrency(value) : `${value.toFixed(2)}%`,
                          name === 'profit' ? 'Profit' : 'CLV'
                        ]}
                        labelFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="clv" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>CLV Analysis:</strong> Positive CLV indicates you&apos;re consistently 
                      beating the closing line, suggesting sharp betting decisions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variance Analysis */}
            {data.varianceData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <span>Performance Variance Over Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={data.varianceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toFixed(1)}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          value.toFixed(2),
                          name === 'variance' ? 'Variance' : 'Expected Value'
                        ]}
                        labelFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="variance" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expectedValue" 
                        stroke="#06B6D4" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <strong>Variance Tracking:</strong> Understanding your variance helps 
                      with bankroll management and expectation setting.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>Advanced Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Sharp Ratio</p>
                    <p className="text-2xl font-bold text-green-600">73%</p>
                    <p className="text-xs text-gray-500">CLV positive bets</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Kelly Optimal</p>
                    <p className="text-2xl font-bold text-blue-600">2.3%</p>
                    <p className="text-xs text-gray-500">Recommended bet size</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-gray-600">Longest Streak</p>
                    <p className="text-2xl font-bold text-amber-600">7W</p>
                    <p className="text-xs text-gray-500">Winning streak</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Volatility</p>
                    <p className="text-2xl font-bold text-purple-600">0.84</p>
                    <p className="text-xs text-gray-500">Risk measure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Pro Upgrade Prompts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProUpgradePrompt
              title="Closing Line Value (CLV) Tracking"
              description="Track your CLV performance and identify sharp betting opportunities with comprehensive line movement analysis."
            />
            
            <ProUpgradePrompt
              title="Advanced Performance Metrics"
              description="Access variance analysis, confidence intervals, expected value tracking, and professional-grade insights."
            />
            
            <ProUpgradePrompt
              title="Comprehensive Historical Data"
              description="View unlimited betting history with detailed performance tracking and time-based analytics."
            />
            
            <ProUpgradePrompt
              title="Custom Dashboard Creation"
              description="Build personalized analytics dashboards with correlation matrices, heat maps, and multi-variable analysis."
            />
          </div>
        </>
      )}

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
    </div>
  )
}