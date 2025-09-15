'use client'

import {
  Activity,
  Badge as BadgeIcon,
  Clock,
  Shield,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

interface StrategyData {
  id: string
  strategy_id: string
  user_id: string // Add user_id for seller identification
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
  leaderboard_score?: number // Composite algorithm score
  marketplace_rank_score?: number // New marketplace ranking score
  last_bet_date: string | null
  last_updated: string
  created_at: string
  start_date?: string // Start date for strategy filtering
}

interface StrategyCardProps {
  strategy: StrategyData
  index: number
  isSubscribed?: boolean
  subscription?: any
  onSubscribe: (strategyId: string, sellerId: string) => void
  isLoading?: boolean
}

export function StrategyCard({
  strategy,
  // index, // TS6133: unused parameter
  isSubscribed = false,
  // subscription, // TS6133: unused parameter
  onSubscribe,
  isLoading = false,
}: StrategyCardProps) {
  const getRankBadgeStyle = (rank: number | null) => {
    if (!rank) return { bg: 'bg-slate-100', text: 'text-slate-600', icon: null }
    if (rank <= 3)
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        text: 'text-white',
        icon: <Star className="h-3 w-3 fill-current" />,
      }
    if (rank <= 10)
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-700',
        text: 'text-white',
        icon: <BadgeIcon className="h-3 w-3" />,
      }
    if (rank <= 25)
      return { bg: 'bg-gradient-to-r from-green-500 to-green-600', text: 'text-white', icon: null }
    return { bg: 'bg-slate-100', text: 'text-slate-700', icon: null }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Verified' }
      case 'premium':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Premium' }
      default:
        return null
    }
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toString()
  }

  const getDaysActive = () => {
    const days = Math.floor(
      (Date.now() - new Date(strategy.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (days < 30) return `${days}d`
    if (days < 365) return `${Math.floor(days / 30)}mo`
    return `${Math.floor(days / 365)}y`
  }

  const rankStyle = getRankBadgeStyle(strategy.rank)
  const verificationBadge = getVerificationBadge(strategy.verification_status)

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-200 hover:border-blue-300 hover:shadow-md">
      <div className="p-4 lg:p-6">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="space-y-4">
            {/* Top Row - Rank and User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                {strategy.rank && (
                  <div className="flex flex-shrink-0 items-center">
                    <div
                      className={`flex items-center space-x-1 ${rankStyle.bg} ${rankStyle.text} rounded-full px-2 py-1 text-xs font-bold shadow-sm`}
                    >
                      {rankStyle.icon}
                      <span>#{strategy.rank}</span>
                    </div>
                  </div>
                )}
                
                {/* Profile */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {strategy.profile_picture_url ? (
                      <img
                        src={strategy.profile_picture_url}
                        alt={strategy.username}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-base font-bold text-white ring-2 ring-slate-100">
                        {strategy.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {strategy.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <Link href={`/marketplace/${strategy.username}`}>
                        <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors truncate">
                          @{strategy.username}
                        </h3>
                      </Link>
                      {verificationBadge && (
                        <div
                          className={`${verificationBadge.bg} ${verificationBadge.text} rounded px-2 py-1 text-xs font-medium flex-shrink-0`}
                        >
                          {verificationBadge.label}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 truncate">
                      {strategy.display_name || `@${strategy.username}`}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subscribe Button */}
              <div className="flex-shrink-0">
                {isSubscribed ? (
                  <div className="flex items-center space-x-1 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
                    <Shield className="h-4 w-4" />
                    <span>Subscribed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onSubscribe(strategy.strategy_id, strategy.user_id)}
                    disabled={isLoading}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-md disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Strategy Name */}
            <div>
              <h4 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {strategy.strategy_name}
              </h4>
              {strategy.start_date && (
                <div className="mb-2">
                  <span className="rounded bg-blue-50 px-2 py-1 text-sm text-blue-700 font-medium">
                    📅 Since {new Date(strategy.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                  {strategy.primary_sport}
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{getDaysActive()} active</span>
                </span>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-4 gap-4">
              {/* ROI */}
              <div className="text-center">
                <div
                  className={`mb-1 flex items-center justify-center ${
                    strategy.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {strategy.roi_percentage >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  <span className="text-lg font-bold">
                    {formatPercentage(strategy.roi_percentage)}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">ROI</div>
              </div>
              
              {/* Win Rate */}
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center text-slate-700">
                  <Target className="mr-1 h-4 w-4" />
                  <span className="text-lg font-bold">{strategy.win_rate.toFixed(1)}%</span>
                </div>
                <div className="text-xs font-medium text-slate-500">Win Rate</div>
              </div>
              
              {/* Total Bets */}
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center text-slate-700">
                  <Activity className="mr-1 h-4 w-4" />
                  <span className="text-lg font-bold">{formatNumber(strategy.total_bets)}</span>
                </div>
                <div className="text-xs font-medium text-slate-500">Bets</div>
              </div>
              
              {/* Subscribers */}
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center text-slate-700">
                  <Users className="mr-1 h-4 w-4" />
                  <span className="text-lg font-bold">
                    {formatNumber(strategy.subscriber_count || 0)}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">Subs</div>
              </div>
            </div>
            
            {/* Pricing */}
            <div className="flex justify-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-slate-900">${strategy.pricing_weekly || 0}</div>
                <div className="text-xs text-slate-600">per week</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600 text-base">${strategy.pricing_monthly || 0}</div>
                <div className="text-xs text-slate-600">per month</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-900">${strategy.pricing_yearly || 0}</div>
                <div className="text-xs text-slate-600">per year</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          {/* Left Side - Rank, Profile, and Strategy Info */}
          <div className="flex items-center space-x-6 max-w-2xl">
            {/* Rank Badge */}
            {strategy.rank && (
              <div className="flex flex-shrink-0 flex-col items-center space-y-1">
                <div
                  className={`flex items-center space-x-1 ${rankStyle.bg} ${rankStyle.text} rounded-full px-3 py-1.5 text-sm font-bold shadow-sm`}
                >
                  {rankStyle.icon}
                  <span>#{strategy.rank}</span>
                </div>
              </div>
            )}

            {/* Profile */}
            <div className="flex flex-shrink-0 items-center space-x-4">
              <div className="relative">
                {strategy.profile_picture_url ? (
                  <img
                    src={strategy.profile_picture_url}
                    alt={strategy.username}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white ring-2 ring-slate-100">
                    {strategy.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {strategy.is_verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Link href={`/marketplace/${strategy.username}`}>
                    <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors">
                      @{strategy.username}
                    </h3>
                  </Link>
                  {verificationBadge && (
                    <div
                      className={`${verificationBadge.bg} ${verificationBadge.text} rounded px-2 py-1 text-xs font-medium flex-shrink-0`}
                    >
                      {verificationBadge.label}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  {strategy.display_name || `@${strategy.username}`}
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                    {strategy.primary_sport}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getDaysActive()} active</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy Name */}
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">
                  {strategy.strategy_name}
                </h4>
                {strategy.start_date && (
                  <div className="flex items-center space-x-1 mb-1">
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 font-medium">
                      📅 Since {new Date(strategy.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {strategy.strategy_description}
              </p>
            </div>
          </div>

          {/* Center - Performance Metrics */}
          <div className="mx-8 flex items-center space-x-8">
            {/* ROI */}
            <div className="text-center">
              <div
                className={`mb-1 flex items-center justify-center ${
                  strategy.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {strategy.roi_percentage >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                <span className="text-xl font-bold">
                  {formatPercentage(strategy.roi_percentage)}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-500">ROI</div>
            </div>

            {/* Win Rate */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center text-slate-700">
                <Target className="mr-1 h-4 w-4" />
                <span className="text-xl font-bold">{strategy.win_rate.toFixed(1)}%</span>
              </div>
              <div className="text-sm font-medium text-slate-500">Win Rate</div>
            </div>

            {/* Total Bets */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center text-slate-700">
                <Activity className="mr-1 h-4 w-4" />
                <span className="text-xl font-bold">{formatNumber(strategy.total_bets)}</span>
              </div>
              <div className="text-sm font-medium text-slate-500">Bets</div>
            </div>

            {/* Subscribers */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center text-slate-700">
                <Users className="mr-1 h-4 w-4" />
                <span className="text-xl font-bold">
                  {formatNumber(strategy.subscriber_count || 0)}
                </span>
              </div>
              <div className="text-sm font-medium text-slate-500">Subs</div>
            </div>
          </div>

          {/* Right Side - Pricing and Subscribe */}
          <div className="flex flex-shrink-0 items-center space-x-6">
            {/* All Pricing Options */}
            <div className="space-y-1 text-right">
              <div className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">${strategy.pricing_weekly || 0}</span>
                /week
              </div>
              <div className="text-lg font-bold text-blue-600">
                ${strategy.pricing_monthly || 0}/month
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">${strategy.pricing_yearly || 0}</span>
                /year
              </div>
            </div>

            {/* Subscribe Button */}
            {isSubscribed ? (
              <div className="flex items-center space-x-2 rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
                <Shield className="h-5 w-5" />
                <span>Subscribed</span>
              </div>
            ) : (
              <button
                onClick={() => onSubscribe(strategy.strategy_id, strategy.user_id)}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrategyCard
