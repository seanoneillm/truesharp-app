"use client"

import {
    ArrowUpRight,
    BarChart3,
    CreditCard,
    Edit,
    RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Shield SVG Component
const TrueSharpShield = ({ className = "h-6 w-6", variant = "default" }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === "light" ? "#3b82f6" : "#1e40af"} />
        <stop offset="100%" stopColor={variant === "light" ? "#1e40af" : "#1e3a8a"} />
      </linearGradient>
    </defs>
    <path 
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z" 
      fill={`url(#shieldGradient-${variant})`} 
      stroke={variant === "light" ? "#60a5fa" : "#3b82f6"} 
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <TrueSharpShield className="h-8 w-8" variant="light" />
                  <h1 className="text-3xl font-bold">My Subscriptions</h1>
                </div>
                <p className="text-blue-100">Track performance and manage your strategy subscriptions</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-4 py-2 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                >
                  Browse Strategies
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-2 rounded-2xl w-fit shadow-lg">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'billing', label: 'Billing' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No subscriptions yet</h3>
            <p className="text-slate-600 mb-6">
              Start following top-performing strategies from verified sellers
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
            >
              Browse Strategies
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Method</h2>
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-900">No payment method on file</p>
                      <p className="text-sm text-slate-500">Add a payment method to subscribe</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription History */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Subscription History</h2>
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No subscription history</h3>
                  <p className="text-slate-600">Your subscription history will appear here once you subscribe to strategies</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
