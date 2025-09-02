'use client'

import React, { useState } from 'react'
import {
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  Settings,
  X,
  Check,
  AlertTriangle,
  Star,
  Award,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MoreVertical,
  Eye,
  CreditCard,
  UserCheck,
} from 'lucide-react'
import { SubscriptionCardProps } from '@/types/subscriptions'
import { SubscriberOpenBetsDisplay } from '@/components/shared/subscriber-open-bets-display'
import { OpenBet } from '@/lib/queries/open-bets'

export function SubscriptionCard({
  subscription,
  onCancel,
  onModify,
  isLoading = false,
  showPerformance = true,
}: SubscriptionCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const isActive =
    subscription.status === 'active' && new Date(subscription.current_period_end) > new Date()
  const isCancelling = subscription.cancel_at_period_end
  const isExpired = new Date(subscription.current_period_end) <= new Date()

  const getStatusColor = () => {
    if (isCancelling) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (isExpired || subscription.status === 'canceled')
      return 'text-red-600 bg-red-50 border-red-200'
    if (isActive) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getStatusIcon = () => {
    if (isCancelling) return <AlertTriangle className="h-4 w-4" />
    if (isExpired || subscription.status === 'canceled') return <X className="h-4 w-4" />
    if (isActive) return <Check className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isCancelling) return 'Cancelling'
    if (isExpired) return 'Expired'
    if (subscription.status === 'canceled') return 'Canceled'
    if (isActive) return 'Active'
    return subscription.status
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium':
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1)
  }

  const calculateMonthlyEquivalent = () => {
    switch (subscription.frequency) {
      case 'weekly':
        return (subscription.price || subscription.price_cents / 100) * 4.33
      case 'yearly':
        return (subscription.price || subscription.price_cents / 100) / 12
      default:
        return subscription.price || subscription.price_cents / 100
    }
  }

  const performance = subscription.strategy
  const roi = performance?.performance_roi || 0
  const winRate = performance?.performance_win_rate || 0
  const totalBets = performance?.performance_total_bets || 0

  const getPerformanceColor = (value: number) => {
    if (value > 10) return 'text-green-600'
    if (value > 0) return 'text-green-500'
    if (value === 0) return 'text-gray-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  if (isLoading) {
    return <SubscriptionCardSkeleton />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Seller Avatar */}
            <div className="relative">
              {subscription.seller?.profile_picture_url ? (
                <img
                  src={subscription.seller.profile_picture_url}
                  alt={subscription.seller.username || 'Seller'}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-lg">
                  {(subscription.seller?.username?.substring(0, 2) || 'UN').toUpperCase()}
                </div>
              )}

              {subscription.seller?.is_verified_seller && (
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <UserCheck className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  @{subscription.seller?.username || 'Unknown'}
                </h3>
                {subscription.tier && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getTierBadgeColor(subscription.tier)}`}
                  >
                    {subscription.tier}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {subscription.seller?.display_name ||
                  subscription.strategy?.name ||
                  'Strategy Subscription'}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              disabled={isLoading}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDetails(!showDetails)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="mr-3 h-4 w-4" />
                    {showDetails ? 'Hide Details' : 'View Details'}
                  </button>

                  {onModify && isActive && (
                    <button
                      onClick={() => {
                        onModify(subscription.id)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <CreditCard className="mr-3 h-4 w-4" />
                      Manage Billing
                    </button>
                  )}

                  {isActive && !isCancelling && (
                    <button
                      onClick={() => {
                        onCancel(subscription.id)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <X className="mr-3 h-4 w-4" />
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center justify-between">
          <div
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ${(subscription.price || subscription.price_cents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">per {subscription.frequency}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showPerformance && (
        <div className="border-b border-gray-100 p-6">
          <h4 className="mb-3 font-medium text-gray-900">Strategy Performance</h4>

          <div className="grid grid-cols-3 gap-4">
            {/* ROI */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <BarChart3 className="mr-1 h-4 w-4 text-purple-500" />
                <span className={`text-lg font-bold ${getPerformanceColor(roi)}`}>
                  {roi > 0 ? '+' : ''}
                  {roi.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-500">ROI</p>
            </div>

            {/* Win Rate */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <Target className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-lg font-bold text-gray-900">{winRate.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-500">Win Rate</p>
            </div>

            {/* Total Bets */}
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center">
                <Target className="mr-1 h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold text-gray-900">{totalBets}</span>
              </div>
              <p className="text-xs text-gray-500">Total Bets</p>
            </div>
          </div>
        </div>
      )}

      {/* Open Bets Section */}
      {subscription.strategy?.open_bets && subscription.strategy.open_bets.length > 0 && (
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <SubscriberOpenBetsDisplay
            bets={subscription.strategy.open_bets}
            title="Current Open Picks"
            maxBets={3}
            showTitle={true}
          />
        </div>
      )}

      {/* Billing Information */}
      <div className="p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Next billing date:</span>
          <span className="font-medium text-gray-900">
            {isCancelling
              ? 'Cancelled'
              : new Date(subscription.current_period_end).toLocaleDateString()}
          </span>
        </div>

        {subscription.frequency !== 'monthly' && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">Monthly equivalent:</span>
            <span className="font-medium text-gray-900">
              ${calculateMonthlyEquivalent().toFixed(2)}/month
            </span>
          </div>
        )}

        {isCancelling && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Subscription will end on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Detailed Information (Expandable) */}
      {showDetails && (
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          <h4 className="mb-3 font-medium text-gray-900">Subscription Details</h4>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subscription ID:</span>
              <span className="font-mono text-xs text-gray-900">{subscription.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Started:</span>
              <span className="text-gray-900">
                {new Date(subscription.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Current period:</span>
              <span className="text-gray-900">
                {new Date(subscription.current_period_start).toLocaleDateString()} -{' '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>

            {subscription.strategy?.description && (
              <div>
                <span className="text-gray-500">Strategy:</span>
                <p className="mt-1 text-gray-900">{subscription.strategy.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriptionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div>
              <div className="mb-2 h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 h-8 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 p-6">
        <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="mb-1 h-6 animate-pulse rounded bg-gray-200" />
              <div className="h-3 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
