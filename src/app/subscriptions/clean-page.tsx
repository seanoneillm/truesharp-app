'use client'

import { ArrowUpRight, BarChart3, CreditCard, Edit, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Shield SVG Component
const TrueSharpShield = ({ className = 'h-6 w-6', variant = 'default' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
        <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill={`url(#shieldGradient-${variant})`}
      stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
      strokeWidth="2"
    />
    <path
      d="M35 45 L45 55 L65 35"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <TrueSharpShield className="h-8 w-8" variant="light" />
                  <h1 className="text-3xl font-bold">My Subscriptions</h1>
                </div>
                <p className="text-blue-100">
                  Track performance and manage your strategy subscriptions
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center rounded-xl bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
                >
                  Browse Strategies
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'billing', label: 'Billing' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-6 py-3 text-sm font-medium capitalize transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">No subscriptions yet</h3>
            <p className="mb-6 text-slate-600">
              Start following top-performing strategies from verified sellers
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-cyan-500"
            >
              Browse Strategies
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment Method</h2>
              <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-900">
                        No payment method on file
                      </p>
                      <p className="text-sm text-slate-500">Add a payment method to subscribe</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                    <Edit className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription History */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Subscription History</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
                <div className="p-8 text-center">
                  <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <h3 className="mb-2 text-lg font-medium text-slate-900">
                    No subscription history
                  </h3>
                  <p className="text-slate-600">
                    Your subscription history will appear here once you subscribe to strategies
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
