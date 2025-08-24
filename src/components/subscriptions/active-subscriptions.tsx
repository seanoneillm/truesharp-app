"use client"

import React, { useState } from 'react'
import { Filter, Search, SortAsc, SortDesc, CreditCard } from 'lucide-react'
import { SubscriptionCard } from './subscription-card'
import { ActiveSubscriptionsProps, SubscriptionFilters } from '@/types/subscriptions'

export function ActiveSubscriptions({ 
  subscriptions, 
  isLoading = false, 
  onCancel, 
  onModify 
}: ActiveSubscriptionsProps) {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    status: 'all',
    timeframe: '30d',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filter subscriptions based on current filters
  const filteredSubscriptions = subscriptions
    ?.filter(subscription => {
      // Status filter
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            if (!(subscription.status === 'active' && new Date(subscription.current_period_end) > new Date())) {
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
        const sellerMatch = subscription.seller?.username?.toLowerCase().includes(searchLower) || 
                           subscription.seller?.display_name?.toLowerCase().includes(searchLower)
        const strategyMatch = subscription.strategy?.name?.toLowerCase().includes(searchLower) ||
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
        return subscriptions.filter(sub => 
          sub.status === 'active' && new Date(sub.current_period_end) > new Date()
        ).length
      case 'cancelled':
        return subscriptions.filter(sub => 
          sub.cancel_at_period_end || sub.status === 'canceled'
        ).length
      case 'expired':
        return subscriptions.filter(sub => 
          new Date(sub.current_period_end) <= new Date()
        ).length
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Active Subscriptions</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as SubscriptionFilters['status'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All ({getStatusCount('all')})</option>
                <option value="active">Active ({getStatusCount('active')})</option>
                <option value="cancelled">Cancelled ({getStatusCount('cancelled')})</option>
                <option value="expired">Expired ({getStatusCount('expired')})</option>
              </select>
            </div>

            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value as SubscriptionFilters['timeframe'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SubscriptionFilters['sortBy'] }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date Created</option>
                <option value="performance">Performance</option>
                <option value="cost">Cost</option>
                <option value="name">Seller Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <button
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                }))}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filters.sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="h-4 w-4 mr-2" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4 mr-2" />
                    Descending
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilters({
                  status: 'all',
                  timeframe: '30d',
                  sortBy: 'date',
                  sortOrder: 'desc'
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
              .filter(sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date())
              .reduce((sum, sub) => {
                const monthlyEquivalent = sub.frequency === 'weekly' 
                  ? (sub.price || sub.price_cents / 100) * 4.33
                  : sub.frequency === 'yearly'
                    ? (sub.price || sub.price_cents / 100) / 12
                    : (sub.price || sub.price_cents / 100)
                return sum + monthlyEquivalent
              }, 0)
              .toFixed(2)
            }
          </div>
        )}
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filters.status !== 'all' 
              ? 'No subscriptions found' 
              : 'No subscriptions yet'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filters.status !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Start following top-performing strategies from verified sellers'
            }
          </p>
          {!searchTerm && filters.status === 'all' && (
            <a
              href="/marketplace"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
            >
              Browse Marketplace
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubscriptions.map((subscription) => (
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-xl w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-xl w-20 animate-pulse" />
        </div>
      </div>

      {/* Results Count Loading */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
      </div>

      {/* Cards Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-8 bg-gray-200 rounded w-20 mb-1 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}