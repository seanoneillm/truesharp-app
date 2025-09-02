'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'

interface AnalyticsHeaderProps {
  username?: string
  totalBets: number
  winRate: number
  totalProfit: number
  roi: number
}

export function AnalyticsHeader({
  username = 'User',
  totalBets = 0,
  winRate = 0,
  totalProfit = 0,
  roi = 0,
}: AnalyticsHeaderProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Welcome to Analytics, {username}</h1>
            <p className="text-lg text-blue-100">
              Track your betting performance and discover insights to improve your strategy
            </p>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="h-16 w-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bets</p>
                <p className="text-2xl font-bold text-gray-900">{totalBets.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`rounded-lg p-2 ${totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign
                  className={`h-5 w-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  ${totalProfit >= 0 ? '+' : ''}
                  {totalProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`rounded-lg p-2 ${roi >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Users className={`h-5 w-5 ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi >= 0 ? '+' : ''}
                  {roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
