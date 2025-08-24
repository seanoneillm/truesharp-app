"use client"

import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Pause,
  Percent,
  Play,
  RefreshCw,
  Search,
  Settings,
  Star,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
  X,
  XCircle
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
  { name: 'Feed', href: '/feed', icon: MessageSquare, current: false },
  { name: 'Marketplace', href: '/marketplace', icon: Store, current: false },
  { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: true },
  { name: 'Monetize', href: '/sell', icon: DollarSign, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export default function SubscriptionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(null)

  const activeSubscriptions = [
    {
      id: 1,
      seller: {
        username: '@sharpbettor',
        displayName: 'Mike Johnson',
        avatar: 'MJ',
        verified: true,
        tier: 'elite'
      },
      tier: 'premium',
      price: 89,
      status: 'active',
      nextBilling: '2025-01-15',
      subscribedDate: '2024-12-15',
      autoRenew: true,
      performance: {
        roi: '+34.2%',
        winRate: '68.4%',
        pickCount: 28,
        profit: '+$847'
      },
      recentPicks: 12,
      sports: ['NFL', 'NBA']
    },
    {
      id: 2,
      seller: {
        username: '@mlbmaster',
        displayName: 'Sarah Chen',
        avatar: 'SC',
        verified: true,
        tier: 'pro'
      },
      tier: 'silver',
      price: 39,
      status: 'active',
      nextBilling: '2025-01-08',
      subscribedDate: '2024-11-08',
      autoRenew: true,
      performance: {
        roi: '+28.7%',
        winRate: '64.2%',
        pickCount: 45,
        profit: '+$542'
      },
      recentPicks: 8,
      sports: ['MLB']
    },
    {
      id: 3,
      seller: {
        username: '@nflkings',
        displayName: 'Tony Rodriguez',
        avatar: 'TR',
        verified: true,
        tier: 'rising'
      },
      tier: 'bronze',
      price: 25,
      status: 'paused',
      nextBilling: null,
      subscribedDate: '2024-10-20',
      autoRenew: false,
      performance: {
        roi: '+41.8%',
        winRate: '71.3%',
        pickCount: 18,
        profit: '+$321'
      },
      recentPicks: 0,
      sports: ['NFL', 'CFB']
    }
  ]

  const recentPicks = [
    {
      id: 1,
      seller: '@sharpbettor',
      title: 'Lakers -4.5 vs Warriors',
      sport: 'NBA',
      confidence: 4,
      analysis: 'Lakers have been dominant at home this season, covering 8 of last 10. Warriors dealing with key injuries.',
      odds: '-110',
      status: 'won',
      result: '+$91',
      postedAt: '2h ago',
      tier: 'premium'
    },
    {
      id: 2,
      seller: '@mlbmaster',
      title: 'Over 8.5 Runs - Yankees vs Red Sox',
      sport: 'MLB',
      confidence: 3,
      analysis: 'Weather conditions favorable for offense. Both bullpens have struggled recently.',
      odds: '-105',
      status: 'lost',
      result: '-$75',
      postedAt: '4h ago',
      tier: 'silver'
    },
    {
      id: 3,
      seller: '@sharpbettor',
      title: 'Chiefs ML vs Bills',
      sport: 'NFL',
      confidence: 5,
      analysis: 'Chiefs are undefeated at home in playoffs. Bills struggling with road performance in cold weather.',
      odds: '+150',
      status: 'pending',
      result: 'TBD',
      postedAt: '6h ago',
      tier: 'premium'
    },
    {
      id: 4,
      seller: '@mlbmaster',
      title: 'Dodgers -1.5 vs Padres',
      sport: 'MLB',
      confidence: 4,
      analysis: 'Starting pitcher matchup heavily favors Dodgers. Padres have lost 6 straight divisional games.',
      odds: '+120',
      status: 'won',
      result: '+$96',
      postedAt: '1d ago',
      tier: 'silver'
    }
  ]

  const billingHistory = [
    {
      id: 1,
      date: '2024-12-15',
      description: '@sharpbettor - Premium Tier',
      amount: 89.00,
      status: 'paid',
      invoice: 'INV-2024-001'
    },
    {
      id: 2,
      date: '2024-12-08',
      description: '@mlbmaster - Silver Tier',
      amount: 39.00,
      status: 'paid',
      invoice: 'INV-2024-002'
    },
    {
      id: 3,
      date: '2024-11-15',
      description: '@sharpbettor - Premium Tier',
      amount: 89.00,
      status: 'paid',
      invoice: 'INV-2024-003'
    },
    {
      id: 4,
      date: '2024-11-08',
      description: '@mlbmaster - Silver Tier',
      amount: 39.00,
      status: 'paid',
      invoice: 'INV-2024-004'
    }
  ]

  const subscriptionStats = {
    totalSpent: 512,
    totalProfit: 1710,
    netProfit: 1198,
    roi: '+234%',
    activeSubs: 2,
    totalPicks: 91,
    followedPicks: 67,
    winRate: '66.2%'
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCancelSubscription = (subscription) => {
    setCancelingSubscription(subscription)
    setShowCancelModal(true)
  }

  const confirmCancellation = () => {
    setShowCancelModal(false)
    setCancelingSubscription(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-sm px-6 pb-2 shadow-xl">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center space-x-3">
                  <TrueSharpShield className="h-8 w-8" />
                  <span className="text-xl font-bold text-slate-900">TrueSharp</span>
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                              item.current
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-slate-200/50 px-6 shadow-lg">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <TrueSharpShield className="h-8 w-8" />
              <span className="text-xl font-bold text-slate-900">TrueSharp</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                          item.current
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                            : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 lg:hidden hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-slate-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 max-w-lg">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400 pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search subscriptions..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" />
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-slate-900">@sportsbettor</span>
                    <ChevronDown className="ml-2 h-5 w-5 text-slate-400" />
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-slate-900/5 border border-slate-200">
                    <Link href="/profile" className="block px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50 rounded-lg mx-1">
                      Your profile
                    </Link>
                    <Link href="/settings" className="block px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50 rounded-lg mx-1">
                      Settings
                    </Link>
                    <Link href="/" className="flex items-center px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50 rounded-lg mx-1">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <TrueSharpShield className="h-8 w-8" variant="light" />
                    <h1 className="text-3xl font-bold text-slate-900">My Subscriptions</h1>
                  </div>
                  <p className="text-slate-600">Track performance and manage your pick subscriptions</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105"
                  >
                    Browse Sellers
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Subscription Stats */}
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Total Spent</dt>
                        <dd className="text-2xl font-bold text-slate-900">${subscriptionStats.totalSpent}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Total Profit</dt>
                        <dd className="text-2xl font-bold text-green-600">+${subscriptionStats.totalProfit}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Percent className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Subscription ROI</dt>
                        <dd className="text-2xl font-bold text-blue-600">{subscriptionStats.roi}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Win Rate</dt>
                        <dd className="text-2xl font-bold text-slate-900">{subscriptionStats.winRate}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="flex space-x-2 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-2 rounded-2xl w-fit shadow-lg">
                {['overview', 'picks', 'billing'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Active Subscriptions</h2>
                  <div className="space-y-4">
                    {activeSubscriptions.map((subscription) => (
                      <div key={subscription.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {subscription.seller.avatar}
                            </div>
                            <div className="ml-6 flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-slate-900">{subscription.seller.username}</h3>
                                {subscription.seller.verified && (
                                  <TrueSharpShield className="h-5 w-5" variant="light" />
                                )}
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(subscription.tier)}`}>
                                  {subscription.tier}
                                </div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                  subscription.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {subscription.status === 'active' ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Pause className="h-3 w-3 mr-1" />
                                  )}
                                  {subscription.status}
                                </div>
                              </div>
                              <p className="text-slate-600 mb-3">
                                {subscription.seller.displayName} • {subscription.sports.join(', ')}
                              </p>
                              <div className="flex items-center space-x-6 text-sm text-slate-600">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span className="font-medium">${subscription.price}/month</span>
                                </div>
                                {subscription.nextBilling && (
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>Next billing: {new Date(subscription.nextBilling).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  <span>{subscription.recentPicks} recent picks</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-8">
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{subscription.performance.roi}</p>
                              <p className="text-xs text-slate-500">ROI</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-slate-900">{subscription.performance.winRate}</p>
                              <p className="text-xs text-slate-500">Win Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{subscription.performance.profit}</p>
                              <p className="text-xs text-slate-500">Your Profit</p>
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                              <Link
                                href={`/marketplace/${subscription.seller.username.replace('@', '')}`}
                                className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white/70 hover:bg-white transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                              {subscription.status === 'active' ? (
                                <button 
                                  onClick={() => handleCancelSubscription(subscription)}
                                  className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white/70 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </button>
                              ) : (
                                <button className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-lg text-green-700 bg-white/70 hover:bg-green-50 transition-colors">
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'picks' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Recent Picks</h2>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/70 backdrop-blur-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {recentPicks.map((pick) => (
                    <div key={pick.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              pick.sport === 'NBA' ? 'bg-orange-100 text-orange-800' :
                              pick.sport === 'NFL' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {pick.sport}
                            </span>
                            <span className="ml-3 text-sm text-slate-500">{pick.postedAt}</span>
                            <span className="ml-3 text-sm font-medium text-slate-900">{pick.seller}</span>
                            <div className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(pick.tier)}`}>
                              {pick.tier}
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{pick.title}</h3>
                          <p className="text-slate-700 mb-3">{pick.analysis}</p>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <span className="text-sm text-slate-500">Confidence:</span>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < pick.confidence ? 'text-yellow-400 fill-current' : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-slate-500">
                              Odds: {pick.odds}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end mb-2">
                            {pick.status === 'won' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                            {pick.status === 'lost' && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                            {pick.status === 'pending' && <RefreshCw className="h-5 w-5 text-yellow-500 mr-2" />}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              pick.status === 'won' ? 'bg-green-100 text-green-800' :
                              pick.status === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pick.status}
                            </span>
                          </div>
                          <p className={`text-lg font-semibold ${
                            pick.status === 'won' ? 'text-green-600' :
                            pick.status === 'lost' ? 'text-red-600' :
                            'text-slate-500'
                          }`}>
                            {pick.result}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                          <p className="text-sm font-medium text-slate-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-slate-500">Expires 12/27</p>
                        </div>
                      </div>
                      <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                        <Edit className="h-4 w-4 mr-2" />
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">Billing History</h2>
                    <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </button>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-slate-200">
                          {billingHistory.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-white/70 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {transaction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ${transaction.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                <button className="hover:text-blue-500 inline-flex items-center">
                                  <Download className="h-4 w-4 mr-1" />
                                  {transaction.invoice}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Next Billing */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Billing</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="space-y-4">
                      {activeSubscriptions.filter(sub => sub.nextBilling).map((subscription) => (
                        <div key={subscription.id} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-b-0">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                              {subscription.seller.avatar}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-slate-900">
                                {subscription.seller.username} - {subscription.tier}
                              </p>
                              <p className="text-sm text-slate-500">
                                Next billing: {new Date(subscription.nextBilling).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">${subscription.price}</p>
                            <p className="text-xs text-slate-500">per month</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-medium text-slate-900">Total Monthly</p>
                        <p className="text-base font-medium text-slate-900">
                          ${activeSubscriptions.filter(sub => sub.status === 'active').reduce((sum, sub) => sum + sub.price, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && cancelingSubscription && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Cancel Subscription</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to cancel your subscription to <strong>{cancelingSubscription.seller.username}</strong>? 
              You'll lose access to their picks immediately, but you won't be charged again.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Current tier:</span>
                <span className="font-medium">{cancelingSubscription.tier}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-600">Monthly cost:</span>
                <span className="font-medium">${cancelingSubscription.price}</span>
              </div>
              {cancelingSubscription.nextBilling && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-600">Next billing:</span>
                  <span className="font-medium">{new Date(cancelingSubscription.nextBilling).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancellation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}