'use client'

import { Award, Star, TrendingUp, Users, ArrowRight, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface StrategyData {
  id: string
  strategy_id: string
  user_id: string
  strategy_name: string
  strategy_description: string
  username: string
  display_name: string
  profile_picture_url: string | null
  total_bets: number
  roi_percentage: number
  win_rate: number
  primary_sport: string
  strategy_type: string
  price: number
  pricing_weekly: number
  pricing_monthly: number
  pricing_yearly: number
  subscriber_count: number
  is_verified: boolean
  verification_status: string
  rank: number | null
  leaderboard_score?: number
  last_bet_date: string | null
  last_updated: string
  created_at: string
}

export default function MarketplacePreview() {
  const [topStrategies, setTopStrategies] = useState<StrategyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopStrategies = async () => {
      try {
        const params = new URLSearchParams({
          sort: 'leaderboard',
          limit: '3',
        })

        const response = await fetch(`/api/marketplace?${params.toString()}`)
        const data = await response.json()

        if (data.error) {
          console.error('Error fetching strategies:', data.error)
          setTopStrategies([])
        } else {
          setTopStrategies(data.data || [])
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
        setTopStrategies([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopStrategies()
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl">
        <div className="mb-6 flex items-center space-x-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-3">
            <Trophy className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Marketplace Stars</h2>
            <p className="text-sm text-gray-500">Top performing strategies</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 shadow-sm">
            <Trophy className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Marketplace Stars</h2>
            <p className="text-sm text-gray-500">Top performing strategies</p>
          </div>
        </div>
        <div className="flex items-center text-emerald-600">
          <Star className="h-4 w-4 fill-current" />
        </div>
      </div>

      {topStrategies.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Award className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No strategies available</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-gray-500">
            Check back soon for top performing strategies from our community.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex transform items-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-blue-800"
          >
            <Award className="mr-2 h-4 w-4" />
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {topStrategies.map((strategy, index) => (
            <div
              key={strategy.id}
              className="group relative transform rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2 sm:space-x-4 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg">
                      <span className="text-sm sm:text-lg font-bold text-white">#{index + 1}</span>
                    </div>
                    {index === 0 && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="mb-1">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-tight">
                        {strategy.strategy_name}
                      </h3>
                      <div className="mt-1 inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2 py-0.5">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                          {strategy.roi_percentage?.toFixed(1) || '0'}%
                        </span>
                      </div>
                    </div>
                    <p className="mb-2 text-xs text-gray-500 truncate">by @{strategy.username}</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 flex-shrink-0"></div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {(strategy.win_rate || 0).toFixed(0)}% win
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {strategy.total_bets || 0} bets
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-sm sm:text-base font-bold text-transparent">
                    ${strategy.pricing_monthly ||
                      strategy.pricing_weekly ||
                      strategy.pricing_yearly ||
                      strategy.price ||
                      25}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {strategy.pricing_monthly
                      ? '/mo'
                      : strategy.pricing_weekly
                        ? '/wk'
                        : strategy.pricing_yearly
                          ? '/yr'
                          : '/mo'}
                  </div>
                  <div className="mt-1 flex items-center justify-end">
                    <div className="flex items-center space-x-1 text-orange-500">
                      <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {strategy.subscriber_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Browse All Link */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <Link
              href="/marketplace"
              className="group inline-flex transform items-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-blue-800"
            >
              <Trophy className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Discover All Strategies
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
