'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Strategy {
  id: string
  strategy_id: string
  username: string
  strategy_name: string
  primary_sport?: string
  roi_percentage?: number
  win_rate?: number
  winning_bets?: number
  losing_bets?: number
  push_bets?: number
  total_bets?: number
  subscriber_count?: number
  verification_status?: string
  profile_picture_url?: string
  is_monetized?: boolean
  subscription_price_weekly?: number
  subscription_price_monthly?: number
  subscription_price_yearly?: number
}

export default function RealStrategyCards() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStrategies() {
      try {
        const response = await fetch('/api/public/marketplace-preview')
        if (!response.ok) {
          throw new Error('Failed to fetch strategies')
        }
        const data = await response.json()
        setStrategies(data.strategies || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading strategies')
        console.error('Error fetching strategies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStrategies()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatRecord = (wins: number, losses: number, pushes: number) => {
    return `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`
  }

  const renderProfilePicture = (url?: string, username?: string) => {
    if (url) {
      return (
        <Image
          src={url}
          alt={`${username} profile picture`}
          width={40}
          height={40}
          className="rounded-full bg-gray-100"
        />
      )
    }
    
    // Show user initials as fallback
    const initials = username ? username.substring(0, 2).toUpperCase() : '??'
    return (
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-white text-sm font-semibold">{initials}</span>
      </div>
    )
  }

  const getLeagueLogo = (sport?: string) => {
    // Since we don't have access to the LeagueLogo component, we'll use simple badges
    if (!sport) return null
    
    const colors: { [key: string]: string } = {
      'NFL': 'bg-orange-500',
      'NBA': 'bg-blue-600',
      'MLB': 'bg-red-600',
      'NHL': 'bg-gray-700',
      'NCAAF': 'bg-purple-600',
      'NCAAB': 'bg-indigo-600',
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${colors[sport] || 'bg-gray-500'}`}>
        {sport}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 animate-pulse">
            <div className="mb-4 flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="ml-3">
                <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="ml-auto w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-12 h-6 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="w-8 h-3 bg-gray-200 rounded mx-auto"></div>
              </div>
              <div>
                <div className="w-12 h-6 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="w-8 h-3 bg-gray-200 rounded mx-auto"></div>
              </div>
              <div>
                <div className="w-12 h-6 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="w-8 h-3 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
            <div className="mb-4 w-full h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || strategies.length === 0) {
    // Fallback to original mock data if API fails
    const fallbackStrategies = [
      {
        id: 'fallback-1',
        username: 'TopBaseball',
        strategy_name: 'MLB Specialist',
        roi_percentage: 23.4,
        winning_bets: 492,
        losing_bets: 355,
        push_bets: 0,
        win_rate: 0.582,
        total_bets: 847,
        verification_status: 'verified',
        primary_sport: 'MLB',
        description: 'Specializes in MLB player props and run totals. Strong record in day games and division matchups.'
      },
      {
        id: 'fallback-2',
        username: 'NFLEdge',
        strategy_name: 'NFL Totals Expert',
        roi_percentage: 19.8,
        winning_bets: 192,
        losing_bets: 120,
        push_bets: 0,
        win_rate: 0.615,
        total_bets: 312,
        verification_status: 'verified',
        primary_sport: 'NFL',
        description: 'Focus on NFL over/under totals with weather and pace analysis. Best record in primetime games.'
      },
      {
        id: 'fallback-3',
        username: 'BasketballMath',
        strategy_name: 'NBA Analytics',
        roi_percentage: 16.2,
        winning_bets: 292,
        losing_bets: 231,
        push_bets: 0,
        win_rate: 0.558,
        total_bets: 523,
        verification_status: 'verified',
        primary_sport: 'NBA',
        description: 'Data-driven NBA approach using advanced metrics. Strong in player props and alternative spreads.'
      }
    ]
    
    return (
      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
        {fallbackStrategies.map((strategy) => (
          <div key={strategy.id} className="rounded-2xl bg-white p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
            <div className="mb-4 flex items-center">
              {renderProfilePicture(undefined, strategy.username)}
              <div className="ml-3">
                <div className="font-medium text-gray-900">{strategy.username}</div>
                <div className="text-sm text-gray-600">{strategy.strategy_name}</div>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Verified
                </span>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">+{strategy.roi_percentage}%</div>
                <div className="text-xs text-gray-600">ROI</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{strategy.total_bets}</div>
                <div className="text-xs text-gray-600">Bets</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{(strategy.win_rate * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-600">Win Rate</div>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-600">{strategy.description}</p>
            <div className="text-center">
              <span className="text-sm text-gray-600">Subscription-based strategy</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
      {strategies.map((strategy, index) => (
        <div 
          key={strategy.id} 
          className={`rounded-2xl bg-white p-8 shadow-lg border transition-all duration-200 hover:shadow-xl hover:border-blue-200 ${
            index === 0 ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white' : 'border-blue-100'
          }`}
        >
          {/* Top Badge for #1 */}
          {index === 0 && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                #1 RANKED
              </div>
            </div>
          )}

          {/* Header with Profile */}
          <div className="mb-4 flex items-center">
            {renderProfilePicture(strategy.profile_picture_url, strategy.username)}
            <div className="ml-3 flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">@{strategy.username}</div>
              <div className="text-sm text-gray-600 truncate">{strategy.strategy_name}</div>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              {strategy.verification_status !== 'unverified' && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  strategy.verification_status === 'premium' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <CheckCircle className="h-3 w-3" />
                  {strategy.verification_status === 'premium' ? 'Premium' : 'Verified'}
                </span>
              )}
              {strategy.primary_sport && getLeagueLogo(strategy.primary_sport)}
            </div>
          </div>

          {/* Rank Badge for top 3 */}
          <div className="mb-4 flex justify-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
              'bg-gradient-to-br from-amber-400 to-amber-600'
            }`}>
              #{index + 1}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-xl font-bold ${
                (strategy.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(strategy.roi_percentage || 0) >= 0 ? '+' : ''}{(strategy.roi_percentage || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">ROI</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {formatRecord(strategy.winning_bets || 0, strategy.losing_bets || 0, strategy.push_bets || 0)}
              </div>
              <div className="text-xs text-gray-600">Record</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {((strategy.win_rate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mb-6 flex justify-between items-center text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>{(strategy.total_bets || 0).toLocaleString()} total bets</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{(strategy.subscriber_count || 0).toLocaleString()} subscribers</span>
            </div>
          </div>

          {/* Pricing */}
          {strategy.is_monetized && (strategy.subscription_price_weekly || strategy.subscription_price_monthly) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-gray-900 mb-2">Subscription Options:</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {strategy.subscription_price_weekly && (
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(strategy.subscription_price_weekly)}
                    </div>
                    <div className="text-gray-600">per week</div>
                  </div>
                )}
                {strategy.subscription_price_monthly && (
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(strategy.subscription_price_monthly)}
                    </div>
                    <div className="text-gray-600">per month</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center">
            <Link 
              href="https://apps.apple.com/us/app/truesharp-sports/id6753960332"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                index === 0 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              Follow This Strategy
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-2 text-xs text-gray-500">
              Download the app to subscribe
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}