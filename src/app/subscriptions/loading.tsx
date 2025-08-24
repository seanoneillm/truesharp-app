"use client"

import React from 'react'

export default function SubscriptionsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Loading */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-8 w-8 bg-white/20 rounded animate-pulse" />
                  <div className="h-8 bg-white/20 rounded w-56 animate-pulse" />
                </div>
                <div className="h-5 bg-white/20 rounded w-80 animate-pulse" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 bg-white/20 rounded-xl w-24 animate-pulse" />
                <div className="h-10 bg-white/20 rounded-xl w-36 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary Loading */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse" />
            <div className="flex justify-between mt-2">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tabs Loading */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-2 rounded-2xl w-fit shadow-lg">
            {['overview', 'picks', 'billing'].map((tab, index) => (
              <div
                key={index}
                className={`px-6 py-3 rounded-xl h-12 ${
                  index === 0
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 w-24'
                    : 'bg-gray-200 w-16'
                } animate-pulse`}
              />
            ))}
          </div>
        </div>

        {/* Tab Content Loading */}
        <div className="space-y-6">
          {/* Subscription Filters Loading */}
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
            <div className="flex space-x-2 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-1 rounded-xl shadow-lg">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 rounded-lg h-10 ${
                    index === 0 ? 'bg-blue-200 w-16' : 'bg-gray-200 w-20'
                  } animate-pulse`}
                />
              ))}
            </div>
          </div>

          {/* Subscription Cards Loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-8 bg-gray-200 rounded w-20 mb-1 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="p-6 border-b border-gray-100">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Information */}
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

          {/* Load More Button Loading */}
          <div className="flex justify-center">
            <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}