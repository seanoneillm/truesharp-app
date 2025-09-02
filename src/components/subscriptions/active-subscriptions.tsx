'use client'

import React, { useState } from 'react'
import { Filter, Search, SortAsc, SortDesc, CreditCard } from 'lucide-react'
import { SubscriptionCard } from './subscription-card'
import { ActiveSubscriptionsProps, SubscriptionFilters } from '@/types/subscriptions'

export function ActiveSubscriptions({
  subscriptions,
  isLoading = false,
  onCancel,
  onModify,
}: ActiveSubscriptionsProps) {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    status: 'all',
    timeframe: '30d',
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filter subscriptions based on current filters
  const filteredSubscriptions =
    subscriptions
      ?.filter(subscription => {
        // Status filter
        if (filters.status !== 'all') {
          switch (filters.status) {
            case 'active':
              if (
                !(
                  subscription.status === 'active' &&
                  new Date(subscription.current_period_end) > new Date()
                )
              ) {
                return false
              }
              break
            case 'cancelled':
              if (!subscription.cancel_at_period_end && subscription.status !== 'canceled') {
                return false
              }
              break
            case 'expired':
              if (new Date(subscription.current_period_end) > new Date()) {
                return false
              }
              break
          }
        }

        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const sellerMatch =
            subscription.seller?.username?.toLowerCase().includes(searchLower) ||
            subscription.seller?.display_name?.toLowerCase().includes(searchLower)
          const strategyMatch =
            subscription.strategy?.name?.toLowerCase().includes(searchLower) ||
            subscription.strategy?.description?.toLowerCase().includes(searchLower)

          if (!sellerMatch && !strategyMatch) {
            return false
          }
        }

        // Sport filter (if specified)
        if (filters.sport) {
          // This would need to be implemented based on strategy sport filtering
          // For now, we'll skip this filter
        }

        return true
      })
      ?.sort((a, b) => {
        let aValue: any, bValue: any

        switch (filters.sortBy) {
          case 'performance':
            aValue = a.strategy?.performance_roi || 0
            bValue = b.strategy?.performance_roi || 0
            break
          case 'cost':
            aValue = a.price || a.price_cents / 100
            bValue = b.price || b.price_cents / 100
            break
          case 'name':
            aValue = a.seller?.username || ''
            bValue = b.seller?.username || ''
            break
          case 'date':
          default:
            aValue = new Date(a.created_at)
            bValue = new Date(b.created_at)
            break
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      }) || []

  const getStatusCount = (status: SubscriptionFilters['status']) => {
    if (!subscriptions) return 0

    switch (status) {
      case 'active':
        return subscriptions.filter(
          sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date()
        ).length
      case 'cancelled':
        return subscriptions.filter(sub => sub.cancel_at_period_end || sub.status === 'canceled')
          .length
      case 'expired':
        return subscriptions.filter(sub => new Date(sub.current_period_end) <= new Date()).length
      case 'all':
      default:
        return subscriptions.length
    }
  }

  if (isLoading) {
    return <ActiveSubscriptionsLoading />
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold text-gray-900">Active Subscriptions</h2>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-64"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              showFilters
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    status: e.target.value as SubscriptionFilters['status'],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ({getStatusCount('all')})</option>
                <option value="active">Active ({getStatusCount('active')})</option>
                <option value="cancelled">Cancelled ({getStatusCount('cancelled')})</option>
                <option value="expired">Expired ({getStatusCount('expired')})</option>
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Timeframe</label>
              <select
                value={filters.timeframe}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    timeframe: e.target.value as SubscriptionFilters['timeframe'],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sort by</label>
              <select
                value={filters.sortBy}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as SubscriptionFilters['sortBy'],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date Created</option>
                <option value="performance">Performance</option>
                <option value="cost">Cost</option>
                <option value="name">Seller Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Order</label>
              <button
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
                  }))
                }
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {filters.sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="mr-2 h-4 w-4" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="mr-2 h-4 w-4" />
                    Descending
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <button
              onClick={() => {
                setFilters({
                  status: 'all',
                  timeframe: '30d',
                  sortBy: 'date',
                  sortOrder: 'desc',
                })
                setSearchTerm('')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredSubscriptions.length} of {subscriptions?.length || 0} subscriptions
        </p>

        {filteredSubscriptions.length > 0 && (
          <div className="text-sm text-gray-600">
            Total monthly cost: $
            {filteredSubscriptions
              .filter(
                sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date()
              )
              .reduce((sum, sub) => {
                const monthlyEquivalent =
                  sub.frequency === 'weekly'
                    ? (sub.price || sub.price_cents / 100) * 4.33
                    : sub.frequency === 'yearly'
                      ? (sub.price || sub.price_cents / 100) / 12
                      : sub.price || sub.price_cents / 100
                return sum + monthlyEquivalent
              }, 0)
              .toFixed(2)}
          </div>
        )}
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm || filters.status !== 'all'
              ? 'No subscriptions found'
              : 'No subscriptions yet'}
          </h3>
          <p className="mb-6 text-gray-600">
            {searchTerm || filters.status !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Start following top-performing strategies from verified sellers'}
          </p>
          {!searchTerm && filters.status === 'all' && (
            <a
              href="/marketplace"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-cyan-500"
            >
              Browse Marketplace
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredSubscriptions.map(subscription => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onCancel={onCancel}
              onModify={onModify}
              showPerformance={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ActiveSubscriptionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Loading */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* Results Count Loading */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Cards Loading */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
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
        ))}
      </div>
    </div>
  )
}
