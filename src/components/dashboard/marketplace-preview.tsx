'use client'

import { createBrowserClient } from '@/lib/auth/supabase'
import { Award, Star, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface TopSeller {
  id: string
  strategy_id: string
  user_id: string
  strategy_name: string
  username: string
  user_display_name?: string
  is_verified_seller: boolean
  roi_percentage: number
  win_rate: number
  total_bets: number
  is_monetized: boolean
  subscription_price_bronze?: number
  subscription_price_silver?: number
  subscription_price_premium?: number
  overall_rank?: number
  verification_status: string
}

export default function MarketplacePreview() {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopSellers() {
      try {
        const supabase = createBrowserClient()
        
        // Fetch top performing strategies from the leaderboard table
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('strategy_leaderboard')
          .select(`
            id,
            strategy_id,
            user_id,
            strategy_name,
            username,
            user_display_name,
            is_verified_seller,
            roi_percentage,
            win_rate,
            total_bets,
            is_monetized,
            subscription_price_bronze,
            subscription_price_silver,
            subscription_price_premium,
            overall_rank,
            verification_status
          `)
          .eq('is_eligible', true)
          .eq('is_monetized', true)
          .gte('total_bets', 10) // Minimum 10 bets for leaderboard
          .order('roi_percentage', { ascending: false })
          .limit(5)

        if (leaderboardError) {
          console.error('Error fetching leaderboard:', leaderboardError?.message || leaderboardError)
          setTopSellers([])
          setLoading(false)
          return
        }

        if (leaderboardData && leaderboardData.length > 0) {
          setTopSellers(leaderboardData)
        } else {
          setTopSellers([])
        }

      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopSellers()
  }, [])

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
            <p className="text-sm text-gray-500">Best sellers in marketplace</p>
          </div>
        </div>
      </div>

      {topSellers.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No sellers available</h3>
          <p className="text-sm text-gray-500 mb-4">
            Check back soon for top performing bettors.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {topSellers.map((seller, index) => (
            <div
              key={seller.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {seller.strategy_name}
                    </p>
                    {seller.is_verified_seller && (
                      <Award className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    by @{seller.username}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">
                        {seller.roi_percentage?.toFixed(1) || '0'}% ROI
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">
                        {seller.total_bets || 0} bets
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  ${seller.subscription_price_bronze || seller.subscription_price_silver || seller.subscription_price_premium || 25}/mo
                </div>
                <div className="text-xs text-gray-500">
                  {(seller.win_rate * 100)?.toFixed(1) || '0'}% win rate
                </div>
              </div>
            </div>
          ))}
          
          {/* Browse All Link */}
          <div className="text-center pt-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse All Strategies
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
