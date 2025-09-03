'use client'

import { PerformanceTrackingProps } from '@/types/subscriptions'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  // PieChart, // TS6133: unused import
  Calendar,
  Copy,
  DollarSign,
  Minus,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  // Clock, // TS6133: unused import
  Zap,
} from 'lucide-react'

export function PerformanceTracking({
  subscription,
  performance,
  timeframe,
  onTimeframeChange,
}: PerformanceTrackingProps) {
  const roi = performance.roi
  const winRate = performance.winRate
  const totalBets = (performance as any).totalBets || (performance.copiedVsOriginalPerformance?.copied?.bets || 0) + (performance.copiedVsOriginalPerformance?.original?.bets || 0)
  const copiedBets = (performance as any).copiedBets || performance.copiedVsOriginalPerformance?.copied?.bets || 0
  const profit = (performance as any).profit || (performance.copiedVsOriginalPerformance?.copied?.profit || 0) + (performance.copiedVsOriginalPerformance?.original?.profit || 0)
  const subscriptionCost = (performance as any).subscriptionCost || performance.subscriptionValue || 0
  const netValue = (performance as any).netValue || profit - subscriptionCost

  const getROIColor = (value: number) => {
    if (value > 15) return 'text-green-600'
    if (value > 5) return 'text-green-500'
    if (value > 0) return 'text-green-400'
    if (value === 0) return 'text-gray-600'
    if (value > -10) return 'text-red-400'
    return 'text-red-600'
  }

  const getROIIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getPerformanceBadge = (roi: number, winRate: number) => {
    if (roi > 20 && winRate > 60) {
      return {
        label: 'Excellent',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Award,
      }
    } else if (roi > 10 && winRate > 55) {
      return { label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp }
    } else if (roi > 0 && winRate > 50) {
      return {
        label: 'Average',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Target,
      }
    } else if (roi > -10 && winRate > 45) {
      return {
        label: 'Below Average',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: TrendingDown,
      }
    } else {
      return { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle }
    }
  }

  const performanceBadge = getPerformanceBadge(roi, winRate)
  const BadgeIcon = performanceBadge.icon

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getTimeframeName = (tf: string) => {
    switch (tf) {
      case '7d':
        return 'Last 7 days'
      case '30d':
        return 'Last 30 days'
      case '90d':
        return 'Last 90 days'
      case 'all':
        return 'All time'
      default:
        return tf
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Performance Tracking</h3>
          <p className="text-gray-600">
            @{subscription.seller?.username || 'Unknown'} subscription
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={e => onTimeframeChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Performance Badge */}
      <div className="flex items-center justify-center">
        <div
          className={`inline-flex items-center rounded-full border px-4 py-2 ${performanceBadge.color}`}
        >
          <BadgeIcon className="mr-2 h-5 w-5" />
          <span className="font-semibold">{performanceBadge.label} Performance</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* ROI */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center space-x-1 ${getROIColor(roi)}`}>
              {getROIIcon(roi)}
              <span className="text-sm font-semibold">ROI</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Return on Investment</p>
            <p className={`text-2xl font-bold ${getROIColor(roi)}`}>
              {roi > 0 ? '+' : ''}
              {roi.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">{getTimeframeName(timeframe)}</p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-semibold">Win Rate</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Winning Percentage</p>
            <p className="text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">
              {copiedBets} of {totalBets} bets
            </p>
          </div>
        </div>

        {/* Total Profit */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">Profit</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Total Profit</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}
              {formatCurrency(profit)}
            </p>
            <p className="text-xs text-gray-500">before subscription cost</p>
          </div>
        </div>

        {/* Net Value */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 shadow-lg ${
                netValue >= 0
                  ? 'bg-gradient-to-br from-green-500 to-green-600'
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div
              className={`flex items-center space-x-1 ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {netValue >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">Net</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Net Value</p>
            <p
              className={`text-2xl font-bold ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {netValue >= 0 ? '+' : ''}
              {formatCurrency(netValue)}
            </p>
            <p className="text-xs text-gray-500">after subscription cost</p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Betting Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-gray-900">Betting Activity</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Bets</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{totalBets}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <Copy className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Copied Bets</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{copiedBets}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-50 p-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Copy Rate</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {totalBets > 0 ? ((copiedBets / totalBets) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-orange-50 p-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Avg. Bet Size</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(copiedBets > 0 ? Math.abs(profit / copiedBets) : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-gray-900">Cost Analysis</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Subscription Cost</span>
              </div>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(subscriptionCost)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Gross Profit</span>
              </div>
              <span
                className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {profit >= 0 ? '+' : ''}
                {formatCurrency(profit)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <div className="flex items-center space-x-3">
                <div className={`rounded-lg p-2 ${netValue >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <BarChart3
                    className={`h-4 w-4 ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">Net Result</span>
              </div>
              <span
                className={`text-lg font-bold ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {netValue >= 0 ? '+' : ''}
                {formatCurrency(netValue)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cost per Bet</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(copiedBets > 0 ? subscriptionCost / copiedBets : subscriptionCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-lg font-semibold text-gray-900">Performance Insights</h4>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Last 30 Days vs All Time */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h5 className="mb-3 font-medium text-gray-900">Recent vs All-Time</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last 30 Days:</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {(performance as any).last30DaysPerformance?.bets || 0} bets,{' '}
                    {(performance as any).last30DaysPerformance?.wins || 0} wins
                  </div>
                  <div
                    className={`text-sm font-bold ${((performance as any).last30DaysPerformance?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {((performance as any).last30DaysPerformance?.profit || 0) >= 0 ? '+' : ''}
                    {formatCurrency((performance as any).last30DaysPerformance?.profit || 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">All Time:</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {(performance as any).allTimePerformance?.bets || 0} bets,{' '}
                    {(performance as any).allTimePerformance?.wins || 0} wins
                  </div>
                  <div
                    className={`text-sm font-bold ${((performance as any).allTimePerformance?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {((performance as any).allTimePerformance?.profit || 0) >= 0 ? '+' : ''}
                    {formatCurrency((performance as any).allTimePerformance?.profit || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Assessment */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h5 className="mb-3 font-medium text-gray-900">Value Assessment</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subscription Value:</span>
                <span
                  className={`text-sm font-bold ${netValue >= subscriptionCost * 0.5 ? 'text-green-600' : netValue >= 0 ? 'text-yellow-600' : 'text-red-600'}`}
                >
                  {netValue >= subscriptionCost * 0.5
                    ? 'Excellent'
                    : netValue >= 0
                      ? 'Good'
                      : 'Poor'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recommendation:</span>
                <span
                  className={`text-sm font-bold ${roi > 10 ? 'text-green-600' : roi > 0 ? 'text-yellow-600' : 'text-red-600'}`}
                >
                  {roi > 10 ? 'Continue' : roi > 0 ? 'Monitor' : 'Consider Canceling'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
