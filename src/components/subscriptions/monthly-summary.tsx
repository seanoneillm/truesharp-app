'use client'

import React from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { MonthlySummaryProps } from '@/types/subscriptions'

export function MonthlySummary({ summary, isLoading = false }: MonthlySummaryProps) {
  const currentMonth = summary?.currentMonth
  const monthName = currentMonth ? `${currentMonth.name} ${currentMonth.year}` : 'This Month'

  if (isLoading) {
    return <MonthlySummaryLoading />
  }

  const performanceColor =
    summary?.performanceIndicator === 'positive'
      ? 'text-green-600'
      : summary?.performanceIndicator === 'negative'
        ? 'text-red-600'
        : 'text-gray-600'

  const performanceIcon =
    summary?.performanceIndicator === 'positive' ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : summary?.performanceIndicator === 'negative' ? (
      <ArrowDownRight className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    )

  const performanceBg =
    summary?.performanceIndicator === 'positive'
      ? 'bg-green-50 border-green-200'
      : summary?.performanceIndicator === 'negative'
        ? 'bg-red-50 border-red-200'
        : 'bg-gray-50 border-gray-200'

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Summary</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="mr-1 h-4 w-4" />
          {monthName}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Monthly Cost */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-blue-600">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">Monthly</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Total Subscription Cost</p>
            <p className="mb-2 text-2xl font-bold text-gray-900">
              ${summary?.totalMonthlyCost?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">across all subscriptions</p>
          </div>
        </div>

        {/* Subscribed Bets Count */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-3 shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-orange-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-semibold">Picks</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Subscribed Bets</p>
            <p className="mb-2 text-2xl font-bold text-gray-900">
              {summary?.subscribedBetsCount || 0}
            </p>
            <p className="text-xs text-gray-500">available this month</p>
          </div>
        </div>

        {/* Return on Investment */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center space-x-1 ${performanceColor}`}>
              {performanceIcon}
              <span className="text-sm font-semibold">
                {(summary?.returnOnInvestment || 0) >= 0 ? '+' : ''}
                {(summary?.returnOnInvestment || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Return on Investment</p>
            <p className={`mb-2 text-2xl font-bold ${performanceColor}`}>
              {(summary?.returnOnInvestment || 0) >= 0 ? '+' : ''}
              {(summary?.returnOnInvestment || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">monthly performance</p>
          </div>
        </div>

        {/* Profit vs Cost Analysis */}
        <div
          className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg ${performanceBg}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-2xl p-3 shadow-lg ${
                summary?.performanceIndicator === 'positive'
                  ? 'bg-gradient-to-br from-green-500 to-green-600'
                  : summary?.performanceIndicator === 'negative'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}
            >
              {summary?.performanceIndicator === 'positive' ? (
                <TrendingUp className="h-6 w-6 text-white" />
              ) : summary?.performanceIndicator === 'negative' ? (
                <TrendingDown className="h-6 w-6 text-white" />
              ) : (
                <Minus className="h-6 w-6 text-white" />
              )}
            </div>
            <div className={`flex items-center space-x-1 ${performanceColor}`}>
              {performanceIcon}
              <span className="text-sm font-semibold">
                {summary?.performanceIndicator === 'positive'
                  ? 'Profitable'
                  : summary?.performanceIndicator === 'negative'
                    ? 'Loss'
                    : 'Break Even'}
              </span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Net Result</p>
            <p className={`mb-2 text-2xl font-bold ${performanceColor}`}>
              {(summary?.profitVsCost || 0) >= 0 ? '+' : ''}$
              {Math.abs(summary?.profitVsCost || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">profit vs subscription cost</p>
          </div>
        </div>
      </div>

      {/* Performance Indicator Bar */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Monthly Performance</span>
          <span className={`text-sm font-semibold ${performanceColor}`}>
            {summary?.performanceIndicator === 'positive'
              ? '✓ Profitable Month'
              : summary?.performanceIndicator === 'negative'
                ? '⚠ Losing Month'
                : '— Break Even Month'}
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              summary?.performanceIndicator === 'positive'
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : summary?.performanceIndicator === 'negative'
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            style={{
              width: `${Math.min(100, Math.max(10, 50 + (summary?.returnOnInvestment || 0)))}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Poor Performance</span>
          <span>Excellent Performance</span>
        </div>
      </div>
    </div>
  )
}

function MonthlySummaryLoading() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
            <div>
              <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="mb-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="mt-2 flex justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
