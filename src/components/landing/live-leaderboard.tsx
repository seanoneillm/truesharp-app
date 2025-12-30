'use client'

import { useState, useEffect } from 'react'

interface Strategy {
  id: string
  strategy_id: string
  user_id: string
  username: string
  strategy_name: string
  primary_sport?: string
  roi_percentage?: number
  win_rate?: number
  winning_bets?: number
  losing_bets?: number
  push_bets?: number
  total_bets?: number
  verification_status?: string
  is_monetized?: boolean
  subscription_price_weekly?: number
  subscription_price_monthly?: number
  subscription_price_yearly?: number
  marketplace_rank_score?: number
  is_eligible?: boolean
  minimum_bets_met?: boolean
  created_at?: string
  profile_picture_url?: string
  profiles?: {
    id: string
    username: string
    avatar_url?: string
  }
  seller_profiles?: {
    profile_img?: string
  } | null
}

export default function LiveLeaderboard() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTopStrategies() {
      try {
        console.log('Fetching top strategies from API...')
        const response = await fetch('/api/public/top-strategies')
        console.log('API response status:', response.status)
        
        if (!response.ok) {
          console.error('API failed with status:', response.status)
          setError(`API failed with status ${response.status}`)
          setStrategies([])
          setLoading(false)
          return
        }
        
        const data = await response.json()
        console.log('API response data:', data)
        
        if (data.strategies && data.strategies.length > 0) {
          console.log(`Found ${data.strategies.length} strategies from API`)
          setStrategies(data.strategies)
        } else {
          console.log('No strategies returned from API')
          setStrategies([])
          setError('No strategies found')
        }
      } catch (err) {
        console.error('Error fetching strategies:', err)
        setError(err instanceof Error ? err.message : 'Error loading leaderboard')
        setStrategies([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopStrategies()
  }, [])


  const formatROI = (roi: number | null | undefined) => {
    if (roi === null || roi === undefined) return '0.0%'
    const value = roi >= 0 ? `+${roi.toFixed(1)}` : roi.toFixed(1)
    return `${value}%`
  }

  const formatRecord = (wins: number | null | undefined, losses: number | null | undefined, pushes: number | null | undefined) => {
    const w = wins || 0
    const l = losses || 0
    const p = pushes || 0
    const total = w + l + p
    if (total === 0) return '0-0'
    return p > 0 ? `${w}-${l}-${p}` : `${w}-${l}`
  }


  if (loading) {
    return (
      <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Loading Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-12 w-12 rounded-xl shadow-lg" 
              />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Live Leaderboard
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              Loading latest verified results...
            </p>
          </div>
          
          {/* Loading Animation */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-700">Loading live data...</span>
              </div>
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || strategies.length === 0) {
    return (
      <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Error Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img 
                src="/images/truesharp-logo.png" 
                alt="TrueSharp Logo" 
                className="h-12 w-12 rounded-xl shadow-lg" 
              />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Live Leaderboard
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              Top 10 performing strategies with verified results
            </p>
          </div>
          
          {/* Error State */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error ? 'Loading Error' : 'No Data Available'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {error 
                  ? 'We\'re having trouble loading the leaderboard. Please try again in a moment.'
                  : 'The leaderboard will be available once verified strategies are ranked.'
                }
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-orange-600">Temporarily Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Enhanced Header with Logo */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <img 
              src="/images/truesharp-logo.png" 
              alt="TrueSharp Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg" 
            />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Live Leaderboard
            </h2>
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
            Top 10 performing strategies with verified results from real sportsbook data
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Live Updates</span>
          </div>
        </div>

        {/* Enhanced Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-gray-200">
            <div className="col-span-1 text-xs font-bold text-gray-700 uppercase tracking-wide">#</div>
            <div className="col-span-4 text-xs font-bold text-gray-700 uppercase tracking-wide">Strategy</div>
            <div className="col-span-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Win Rate</div>
            <div className="col-span-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Record</div>
            <div className="col-span-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">ROI</div>
            <div className="col-span-1 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Bets</div>
          </div>
          
          {/* Rows */}
          {strategies.map((strategy, index) => (
            <div 
              key={strategy.id}
              className={`transition-all duration-200 ${
                index < strategies.length - 1 ? 'border-b border-gray-100' : ''
              } ${index < 3 
                ? 'bg-gradient-to-r from-blue-50/60 via-white to-blue-50/60 hover:from-blue-50 hover:to-blue-50' 
                : 'hover:bg-gray-50'
              }`}
            >
              {/* Mobile Layout */}
              <div className="sm:hidden px-3 py-3">
                <div className="flex items-center gap-2 mb-2">
                  {/* Rank */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Avatar */}
                  {strategy.seller_profiles?.profile_img ? (
                    <img
                      src={strategy.seller_profiles.profile_img}
                      alt={`${strategy.username} profile`}
                      className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 object-cover border border-white shadow-sm"
                    />
                  ) : strategy.profile_picture_url ? (
                    <img
                      src={strategy.profile_picture_url}
                      alt={`${strategy.username} profile`}
                      className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 object-cover border border-white shadow-sm"
                    />
                  ) : strategy.profiles?.avatar_url ? (
                    <img
                      src={strategy.profiles.avatar_url}
                      alt={`${strategy.username} profile`}
                      className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 object-cover border border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {strategy.username ? strategy.username.substring(0, 1).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  
                  {/* Strategy Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                      <p className="text-xs font-semibold text-gray-900 break-words">
                        {strategy.strategy_name || 'Unnamed Strategy'}
                      </p>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {strategy.is_monetized && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            💲
                          </span>
                        )}
                        {strategy.verification_status === 'premium' && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-xs text-gray-600 font-medium break-words">
                        @{strategy.username}
                      </p>
                      {strategy.primary_sport && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">
                          {strategy.primary_sport}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Stats Grid - Smaller */}
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-gray-50 rounded px-1.5 py-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Win%</p>
                    <p className="text-xs font-bold text-gray-900">
                      {((strategy.win_rate || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded px-1.5 py-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">ROI</p>
                    <p className={`text-xs font-bold ${
                      (strategy.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(strategy.roi_percentage || 0) >= 0 ? '+' : ''}{(strategy.roi_percentage || 0).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded px-1.5 py-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Record</p>
                    <p className="text-xs font-bold text-gray-900">
                      {formatRecord(strategy.winning_bets, strategy.losing_bets, strategy.push_bets)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded px-1.5 py-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Bets</p>
                    <p className="text-xs font-bold text-gray-900">
                      {(strategy.total_bets || 0) > 999 ? `${((strategy.total_bets || 0) / 1000).toFixed(0)}k` : (strategy.total_bets || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-12 gap-2 items-center px-4 sm:px-6 py-4">
                {/* Enhanced Rank */}
                <div className="col-span-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' :
                    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              
                {/* Enhanced Strategy Info */}
                <div className="col-span-4 flex items-center gap-4 min-w-0">
                  {strategy.seller_profiles?.profile_img ? (
                    <img
                      src={strategy.seller_profiles.profile_img}
                      alt={`${strategy.username} profile`}
                      className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 object-cover border-2 border-white shadow-sm"
                    />
                  ) : strategy.profile_picture_url ? (
                    <img
                      src={strategy.profile_picture_url}
                      alt={`${strategy.username} profile`}
                      className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 object-cover border-2 border-white shadow-sm"
                    />
                  ) : strategy.profiles?.avatar_url ? (
                    <img
                      src={strategy.profiles.avatar_url}
                      alt={`${strategy.username} profile`}
                      className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                      <span className="text-white text-sm font-bold">
                        {strategy.username ? strategy.username.substring(0, 1).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {strategy.strategy_name || 'Unnamed Strategy'}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {strategy.is_monetized && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            💲
                          </span>
                        )}
                        {strategy.verification_status === 'premium' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-gray-600 font-medium break-words">
                        @{strategy.username}
                      </p>
                      {strategy.primary_sport && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                          {strategy.primary_sport}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simplified Win Rate */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-black">
                    {((strategy.win_rate || 0) * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Enhanced Record */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-gray-900">
                    {formatRecord(strategy.winning_bets, strategy.losing_bets, strategy.push_bets)}
                  </span>
                </div>

                {/* Simplified ROI */}
                <div className="col-span-2 text-center">
                  <span className={`text-sm font-bold ${
                    (strategy.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatROI(strategy.roi_percentage)}
                  </span>
                </div>

                {/* Simplified Total Bets */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-bold text-gray-900">
                    {(strategy.total_bets || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              Rankings update live with verified sportsbook data
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}