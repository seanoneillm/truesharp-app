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
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Rank, Profile, and Strategy Info */}
          <div className="flex flex-1 items-center space-x-4">
            {/* Rank Badge */}
            {strategy.rank && (
              <div className="flex flex-shrink-0 flex-col items-center space-y-1">
                <div
                  className={`flex items-center space-x-1 ${rankStyle.bg} ${rankStyle.text} rounded-full px-2 py-1 text-xs font-bold shadow-sm`}
                >
                  {rankStyle.icon}
                  <span>#{strategy.rank}</span>
                </div>
                {strategy.leaderboard_score && (
                  <div
                    className="text-xs font-medium text-slate-500"
                    title="Composite Algorithm Score"
                  >
                    Score: {strategy.leaderboard_score.toFixed(1)}
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            <div className="flex flex-shrink-0 items-center space-x-3">
              <div className="relative">
                {strategy.profile_picture_url ? (
                  <img
                    src={strategy.profile_picture_url}
                    alt={strategy.username}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white ring-2 ring-slate-100">
                    {strategy.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {strategy.is_verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 shadow-sm">
                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">@{strategy.username}</h3>
                  {verificationBadge && (
                    <div
                      className={`${verificationBadge.bg} ${verificationBadge.text} rounded px-1.5 py-0.5 text-xs font-medium`}
                    >
                      {verificationBadge.label}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                    {strategy.primary_sport}
                  </span>
                  <Clock className="h-3 w-3" />
                  <span>{getDaysActive()} active</span>
                  {strategy.start_date && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                        📅 Since{' '}
                        {new Date(strategy.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Strategy Name */}
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-base font-bold text-slate-900">
                {strategy.strategy_name}
              </h4>
            </div>
          </div>

          {/* Center - Performance Metrics */}
          <div className="mx-6 flex items-center space-x-6">
            {/* ROI */}
            <div className="text-center">
              <div
                className={`mb-0.5 flex items-center justify-center ${
                  strategy.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {strategy.roi_percentage >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                <span className="text-lg font-bold">
                  {formatPercentage(strategy.roi_percentage)}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">ROI</div>
            </div>

            {/* Win Rate */}
            <div className="text-center">
              <div className="mb-0.5 flex items-center justify-center text-slate-700">
                <Target className="mr-1 h-3 w-3" />
                <span className="text-lg font-bold">{strategy.win_rate.toFixed(1)}%</span>
              </div>
              <div className="text-xs font-medium text-slate-500">Win Rate</div>
            </div>

            {/* Total Bets */}
            <div className="text-center">
              <div className="mb-0.5 flex items-center justify-center text-slate-700">
                <Activity className="mr-1 h-3 w-3" />
                <span className="text-lg font-bold">{formatNumber(strategy.total_bets)}</span>
              </div>
              <div className="text-xs font-medium text-slate-500">Bets</div>
            </div>

            {/* Subscribers */}
            <div className="text-center">
              <div className="mb-0.5 flex items-center justify-center text-slate-700">
                <Users className="mr-1 h-3 w-3" />
                <span className="text-lg font-bold">
                  {formatNumber(strategy.subscriber_count || 0)}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-500">Subs</div>
            </div>
          </div>

          {/* Right Side - Pricing and Subscribe */}
          <div className="flex flex-shrink-0 items-center space-x-6">
            {/* All Pricing Options */}
            <div className="space-y-1 text-right">
              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-900">${strategy.pricing_weekly || 0}</span>
                /week
              </div>
              <div className="text-sm font-bold text-slate-900">
                ${strategy.pricing_monthly || 0}/month
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-900">${strategy.pricing_yearly || 0}</span>
                /year
              </div>
            </div>

            {/* Subscribe Button */}
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
      </div>
    </div>
  )
}

export default StrategyCard
