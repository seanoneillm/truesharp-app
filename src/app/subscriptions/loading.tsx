'use client'

import React from 'react'

export default function SubscriptionsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Loading */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <div className="h-8 w-8 animate-pulse rounded bg-white/20" />
                  <div className="h-8 w-56 animate-pulse rounded bg-white/20" />
                </div>
                <div className="h-5 w-80 animate-pulse rounded bg-white/20" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-24 animate-pulse rounded-xl bg-white/20" />
                <div className="h-10 w-36 animate-pulse rounded-xl bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary Loading */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </div>
                <div>
                  <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="mb-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
            <div className="mt-2 flex justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Tabs Loading */}
        <div className="mb-8">
          <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
            {['overview', 'picks', 'billing'].map((tab, index) => (
              <div
                key={index}
                className={`h-12 rounded-xl px-6 py-3 ${
                  index === 0
                    ? 'w-24 bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'w-16 bg-gray-200'
                } animate-pulse`}
              />
            ))}
          </div>
        </div>

        {/* Tab Content Loading */}
        <div className="space-y-6">
          {/* Subscription Filters Loading */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="flex space-x-2 rounded-xl border border-slate-200/50 bg-white/70 p-1 shadow-lg backdrop-blur-sm">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className={`h-10 rounded-lg px-4 py-2 ${
                    index === 0 ? 'w-16 bg-blue-200' : 'w-20 bg-gray-200'
                  } animate-pulse`}
                />
              ))}
            </div>
          </div>

          {/* Subscription Cards Loading */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Header */}
                <div className="border-b border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                      <div>
                        <div className="mb-2 flex items-center space-x-2">
                          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                          <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                        </div>
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 h-8 w-20 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>

                {/* Performance Metrics */}
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

                {/* Billing Information */}
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

          {/* Load More Button Loading */}
          <div className="flex justify-center">
            <div className="h-12 w-32 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
