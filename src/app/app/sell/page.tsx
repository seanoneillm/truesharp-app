'use client'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  Filter,
  Home,
  MessageSquare,
  Plus,
  Save,
  Settings,
  Star,
  Store,
  Target,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// TrueSharp Shield SVG Component
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
  { name: 'Feed', href: '/feed', icon: MessageSquare, current: false },
  { name: 'Marketplace', href: '/marketplace', icon: Store, current: false },
  { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: false },
  { name: 'Monetize', href: '/sell', icon: DollarSign, current: true },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export default function MonetizeStrategyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPickModal, setShowPickModal] = useState(false)
  const [newPick, setNewPick] = useState({
    sport: 'NFL',
    title: '',
    analysis: '',
    confidence: 3,
    tier: 'bronze',
    odds: '',
  })

  const sellerStats = {
    totalRevenue: 4247,
    monthlyRevenue: 892,
    totalSubscribers: 156,
    activeSubscribers: 142,
    totalPicks: 89,
    winRate: '68.4%',
    roi: '+34.2%',
    rating: 4.8,
    tierBreakdown: {
      bronze: 89,
      silver: 45,
      premium: 22,
    },
    recentGrowth: {
      subscribers: '+12',
      revenue: '+$247',
    },
  }

  const recentPicks = [
    {
      id: 1,
      title: 'Lakers -4.5 vs Warriors',
      sport: 'NBA',
      confidence: 4,
      analysis:
        'Lakers have been dominant at home this season, covering 8 of last 10. Warriors dealing with key injuries to Curry and Thompson.',
      odds: '-110',
      tier: 'premium',
      status: 'won',
      result: '+$91',
      postedAt: '2h ago',
      engagement: { views: 234, likes: 45, comments: 12 },
    },
    {
      id: 2,
      title: 'Chiefs ML vs Bills',
      sport: 'NFL',
      confidence: 5,
      analysis:
        'Chiefs are undefeated at home in playoffs. Bills struggling with road performance in cold weather conditions.',
      odds: '+150',
      tier: 'premium',
      status: 'pending',
      result: 'TBD',
      postedAt: '4h ago',
      engagement: { views: 567, likes: 89, comments: 23 },
    },
    {
      id: 3,
      title: 'Over 8.5 Runs - Yankees vs Red Sox',
      sport: 'MLB',
      confidence: 3,
      analysis:
        'Weather conditions favorable for offense. Both bullpens have struggled recently with ERA over 4.50.',
      odds: '-105',
      tier: 'silver',
      status: 'lost',
      result: '-$75',
      postedAt: '1d ago',
      engagement: { views: 189, likes: 23, comments: 8 },
    },
  ]

  const subscribers = [
    {
      id: 1,
      username: '@bettingfan23',
      displayName: 'John Smith',
      avatar: 'JS',
      tier: 'premium',
      joinDate: '2024-12-01',
      status: 'active',
      totalSpent: 267,
      engagement: 'high',
    },
    {
      id: 2,
      username: '@sportslover',
      displayName: 'Mike Davis',
      avatar: 'MD',
      tier: 'silver',
      joinDate: '2024-11-15',
      status: 'active',
      totalSpent: 78,
      engagement: 'medium',
    },
    {
      id: 3,
      username: '@pickfollower',
      displayName: 'Sarah Johnson',
      avatar: 'SJ',
      tier: 'bronze',
      joinDate: '2024-10-20',
      status: 'cancelled',
      totalSpent: 150,
      engagement: 'low',
    },
  ]

  const analytics = {
    pickPerformance: {
      thisMonth: { picks: 23, wins: 16, roi: '+28.4%' },
      lastMonth: { picks: 19, wins: 11, roi: '+15.2%' },
      improvement: '+13.2%',
    },
    subscriberGrowth: [
      { month: 'Aug', count: 89 },
      { month: 'Sep', count: 102 },
      { month: 'Oct', count: 128 },
      { month: 'Nov', count: 145 },
      { month: 'Dec', count: 156 },
    ],
    revenueByTier: {
      bronze: 2403,
      silver: 1575,
      premium: 1969,
    },
  }

  const getTierColor = tier => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCreatePick = () => {
    setShowPickModal(false)
    setNewPick({
      sport: 'NFL',
      title: '',
      analysis: '',
      confidence: 3,
      tier: 'bronze',
      odds: '',
    })
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
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 px-6 pb-2 shadow-xl backdrop-blur-sm">
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
                      {navigation.map(item => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 ${
                              item.current
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200/50 bg-white/80 px-6 shadow-lg backdrop-blur-xl">
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
                  {navigation.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 ${
                          item.current
                            ? 'scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'text-slate-700 hover:scale-105 hover:bg-blue-50 hover:text-blue-600'
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
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/50 bg-white/80 px-4 shadow-sm backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 rounded-lg p-2.5 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <div className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-slate-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex max-w-lg flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-slate-400" />
              <input
                className="block h-full w-full border-0 bg-transparent py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
                placeholder="Search strategy insights..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="-m-2.5 rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-500">
                <span className="sr-only">View notifications</span>
                <div className="h-6 w-6" />
              </button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" />
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center rounded-xl p-1.5 transition-colors hover:bg-slate-100"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
                    <span className="text-sm font-bold text-white">SB</span>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-slate-900">
                      @sharpbettor
                    </span>
                    <svg
                      className="ml-2 h-5 w-5 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-slate-900/5">
                    <Link
                      href="/profile"
                      className="mx-1 block rounded-lg px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50"
                    >
                      Your profile
                    </Link>
                    <Link
                      href="/settings"
                      className="mx-1 block rounded-lg px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/"
                      className="mx-1 flex items-center rounded-lg px-3 py-1 text-sm leading-6 text-slate-900 hover:bg-slate-50"
                    >
                      <span className="mr-2 h-4 w-4" />
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
                  <div className="mb-2 flex items-center space-x-3">
                    <TrueSharpShield className="h-8 w-8" variant="light" />
                    <h1 className="text-3xl font-bold text-slate-900">Strategy Dashboard</h1>
                  </div>
                  <p className="text-slate-600">
                    Manage your insights, subscribers, and strategy performance
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/marketplace/sharpbettor`}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Public Profile
                  </Link>
                  <button
                    onClick={() => setShowPickModal(true)}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Share New Insight
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Strategy Stats */}
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-slate-600">
                          Monthly Revenue
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-bold text-slate-900">
                            ${sellerStats.monthlyRevenue}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                            <span className="ml-1">{sellerStats.recentGrowth.revenue}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-slate-600">
                          Active Subscribers
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-bold text-slate-900">
                            {sellerStats.activeSubscribers}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                            <span className="ml-1">{sellerStats.recentGrowth.subscribers}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-slate-600">
                          Success Rate
                        </dt>
                        <dd className="text-2xl font-bold text-slate-900">{sellerStats.winRate}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-slate-600">Rating</dt>
                        <dd className="text-2xl font-bold text-slate-900">{sellerStats.rating}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
                {['overview', 'insights', 'subscribers', 'analytics', 'settings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-6 py-3 text-sm font-medium capitalize transition-all duration-200 ${
                      activeTab === tab
                        ? 'scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'insights' ? 'My Insights' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Performance */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Recent Performance</h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          +{analytics.pickPerformance.thisMonth.roi}
                        </div>
                        <div className="text-sm text-slate-500">This Month ROI</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {analytics.pickPerformance.thisMonth.wins}/
                          {analytics.pickPerformance.thisMonth.picks} wins
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">
                          {sellerStats.totalPicks}
                        </div>
                        <div className="text-sm text-slate-500">Total Insights</div>
                        <div className="mt-1 text-xs text-slate-400">All time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          ${sellerStats.totalRevenue}
                        </div>
                        <div className="text-sm text-slate-500">Total Earnings</div>
                        <div className="mt-1 text-xs text-slate-400">All time</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier Breakdown */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">
                    Subscriber Breakdown
                  </h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {sellerStats.tierBreakdown.bronze}
                        </div>
                        <div className="text-sm text-slate-500">Bronze Tier</div>
                        <div className="mt-1 text-xs text-slate-400">
                          ${analytics.revenueByTier.bronze} revenue
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {sellerStats.tierBreakdown.silver}
                        </div>
                        <div className="text-sm text-slate-500">Silver Tier</div>
                        <div className="mt-1 text-xs text-slate-400">
                          ${analytics.revenueByTier.silver} revenue
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {sellerStats.tierBreakdown.premium}
                        </div>
                        <div className="text-sm text-slate-500">Premium Tier</div>
                        <div className="mt-1 text-xs text-slate-400">
                          ${analytics.revenueByTier.premium} revenue
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Recent Activity</h2>
                  <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
                    <ul className="divide-y divide-slate-200">
                      <li className="px-6 py-4 transition-colors hover:bg-white/50">
                        <div className="flex items-center">
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              New comment on your strategy analysis
                            </p>
                            <p className="text-sm text-slate-500">@sportsfan99 • 6 hours ago</p>
                          </div>
                        </div>
                      </li>
                      <li className="px-6 py-4 transition-colors hover:bg-white/50">
                        <div className="flex items-center">
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <UserPlus className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              New subscriber joined Premium tier
                            </p>
                            <p className="text-sm text-slate-500">@newbettor23 • 2 hours ago</p>
                          </div>
                          <div className="text-sm font-medium text-green-600">+$89</div>
                        </div>
                      </li>
                      <li className="px-6 py-4 transition-colors hover:bg-white/50">
                        <div className="flex items-center">
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Insight successful: Lakers -4.5 vs Warriors
                            </p>
                            <p className="text-sm text-slate-500">
                              234 subscribers saw this insight • 4 hours ago
                            </p>
                          </div>
                          <div className="text-sm font-medium text-green-600">Won</div>
                        </div>
                      </li>
                      <li className="px-6 py-4 transition-colors hover:bg-white/50">
                        <div className="flex items-center">
                          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Insight failed: Over 8.5 Runs - Yankees vs Red Sox
                            </p>
                            <p className="text-sm text-slate-500">
                              189 subscribers saw this insight • 1 day ago
                            </p>
                          </div>
                          <div className="text-sm font-medium text-red-600">Lost</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">My Recent Insights</h2>
                  <button
                    onClick={() => setShowPickModal(true)}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Insight
                  </button>
                </div>

                <div className="space-y-6">
                  {recentPicks.map(pick => (
                    <div
                      key={pick.id}
                      className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                pick.sport === 'NBA'
                                  ? 'bg-orange-100 text-orange-800'
                                  : pick.sport === 'NFL'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {pick.sport}
                            </span>
                            <div
                              className={`ml-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getTierColor(pick.tier)}`}
                            >
                              {pick.tier}
                            </div>
                            <span className="ml-3 text-sm text-slate-500">{pick.postedAt}</span>
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-slate-900">
                            {pick.title}
                          </h3>
                          <p className="mb-4 text-slate-700">{pick.analysis}</p>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                              <span className="text-sm text-slate-500">Confidence:</span>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < pick.confidence
                                        ? 'fill-current text-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-slate-500">Odds: {pick.odds}</div>
                            <div className="flex items-center text-sm text-slate-500">
                              <Eye className="mr-1 h-4 w-4" />
                              {pick.engagement.views} views
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2 flex items-center justify-end">
                            {pick.status === 'won' && (
                              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                            )}
                            {pick.status === 'lost' && (
                              <XCircle className="mr-2 h-5 w-5 text-red-500" />
                            )}
                            {pick.status === 'pending' && (
                              <Clock className="mr-2 h-5 w-5 text-yellow-500" />
                            )}
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                pick.status === 'won'
                                  ? 'bg-green-100 text-green-800'
                                  : pick.status === 'lost'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {pick.status}
                            </span>
                          </div>
                          <p
                            className={`mb-2 text-lg font-semibold ${
                              pick.status === 'won'
                                ? 'text-green-600'
                                : pick.status === 'lost'
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                            }`}
                          >
                            {pick.result}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <div className="flex items-center">
                              <Trophy className="mr-1 h-4 w-4" />
                              {pick.engagement.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              {pick.engagement.comments}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subscribers' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Subscribers</h2>
                  <div className="flex items-center space-x-3">
                    <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </button>
                    <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
                  <ul className="divide-y divide-slate-200">
                    {subscribers.map(subscriber => (
                      <li
                        key={subscriber.id}
                        className="px-6 py-6 transition-colors hover:bg-white/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-1 items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 font-medium text-white shadow-lg">
                              {subscriber.avatar}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="text-sm font-medium text-slate-900">
                                  {subscriber.username}
                                </h3>
                                <div
                                  className={`ml-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getTierColor(subscriber.tier)}`}
                                >
                                  {subscriber.tier}
                                </div>
                                <div
                                  className={`ml-2 inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ${
                                    subscriber.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {subscriber.status}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {subscriber.displayName}
                              </p>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500">
                                <div>
                                  Joined: {new Date(subscriber.joinDate).toLocaleDateString()}
                                </div>
                                <div>Total spent: ${subscriber.totalSpent}</div>
                                <div
                                  className={`flex items-center ${
                                    subscriber.engagement === 'high'
                                      ? 'text-green-600'
                                      : subscriber.engagement === 'medium'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  <Activity className="mr-1 h-4 w-4" />
                                  {subscriber.engagement} engagement
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </button>
                            {subscriber.status === 'active' ? (
                              <button className="inline-flex items-center rounded-xl border border-red-300 bg-white/70 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50">
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove
                              </button>
                            ) : (
                              <button className="inline-flex items-center rounded-xl border border-green-300 bg-white/70 px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Back
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Revenue Chart */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Subscriber Growth</h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-2 h-12 w-12 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          Subscriber growth chart would go here
                        </p>
                        <p className="text-xs text-slate-400">Monthly subscriber count over time</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">
                    Performance Breakdown
                  </h2>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                      <h3 className="mb-4 text-base font-medium text-slate-900">
                        Insight Performance by Sport
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">NFL</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">
                              72.4% success rate
                            </span>
                            <span className="ml-2 text-sm text-green-600">+28.4% ROI</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">NBA</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">
                              65.2% success rate
                            </span>
                            <span className="ml-2 text-sm text-green-600">+19.7% ROI</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">MLB</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">
                              58.9% success rate
                            </span>
                            <span className="ml-2 text-sm text-green-600">+12.3% ROI</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                      <h3 className="mb-4 text-base font-medium text-slate-900">Revenue by Tier</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Premium Tier</span>
                          <span className="text-sm font-medium text-slate-900">
                            ${analytics.revenueByTier.premium}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Bronze Tier</span>
                          <span className="text-sm font-medium text-slate-900">
                            ${analytics.revenueByTier.bronze}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Silver Tier</span>
                          <span className="text-sm font-medium text-slate-900">
                            ${analytics.revenueByTier.silver}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Pricing Settings */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">
                    Subscription Pricing
                  </h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Bronze Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                            <input
                              type="number"
                              className="block w-full rounded-xl border border-slate-300 bg-white/70 py-3 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="25"
                              defaultValue="25"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Basic insights and analysis</p>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Silver Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                            <input
                              type="number"
                              className="block w-full rounded-xl border border-slate-300 bg-white/70 py-3 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="45"
                              defaultValue="45"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Detailed analysis and insights
                          </p>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Premium Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                            <input
                              type="number"
                              className="block w-full rounded-xl border border-slate-300 bg-white/70 py-3 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="89"
                              defaultValue="89"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            All insights, premium analysis, direct access
                          </p>
                        </div>
                      </div>
                      <button className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-cyan-500">
                        <Save className="mr-2 h-4 w-4" />
                        Update Pricing
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Settings */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Public Profile</h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Bio</label>
                        <textarea
                          rows={4}
                          className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Tell potential subscribers about your expertise..."
                          defaultValue="Former Vegas insider with 15+ years experience. Specializing in NFL spreads and NBA totals with proven long-term results."
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Specializations
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['NFL', 'NBA'].map(sport => (
                            <span
                              key={sport}
                              className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200"
                            >
                              {sport}
                              <X className="ml-2 h-4 w-4" />
                            </span>
                          ))}
                          <button className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                            <Plus className="mr-1 h-4 w-4" />
                            Add Sport
                          </button>
                        </div>
                      </div>
                      <button className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-cyan-500">
                        <Save className="mr-2 h-4 w-4" />
                        Update Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payout Settings */}
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Payout Settings</h2>
                  <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Payout Method
                        </label>
                        <select className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500">
                          <option>Bank Transfer</option>
                          <option>PayPal</option>
                          <option>Stripe</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Payout Schedule
                        </label>
                        <select className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500">
                          <option>Weekly</option>
                          <option>Bi-weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-medium text-slate-900">
                          Commission Structure
                        </h4>
                        <p className="text-sm text-slate-600">
                          TrueSharp takes 15% commission on all subscription revenue
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Payment processing fees: 2.9% + $0.30 per transaction
                        </p>
                      </div>
                      <button className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-cyan-500">
                        <Save className="mr-2 h-4 w-4" />
                        Update Payout Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Insight Modal */}
      {showPickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Share New Insight</h3>
              <button
                onClick={() => setShowPickModal(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Sport</label>
                  <select
                    value={newPick.sport}
                    onChange={e => setNewPick({ ...newPick, sport: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="NFL">NFL</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                    <option value="NHL">NHL</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Subscription Tier
                  </label>
                  <select
                    value={newPick.tier}
                    onChange={e => setNewPick({ ...newPick, tier: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Insight Title
                </label>
                <input
                  type="text"
                  value={newPick.title}
                  onChange={e => setNewPick({ ...newPick, title: e.target.value })}
                  className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Lakers -4.5 vs Warriors"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Analysis</label>
                <textarea
                  rows={4}
                  value={newPick.analysis}
                  onChange={e => setNewPick({ ...newPick, analysis: e.target.value })}
                  className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Explain your reasoning for this insight..."
                />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Odds</label>
                  <input
                    type="text"
                    value={newPick.odds}
                    onChange={e => setNewPick({ ...newPick, odds: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 bg-white/70 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., -110, +150"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confidence Level
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        onClick={() => setNewPick({ ...newPick, confidence: level })}
                        className="rounded p-1 transition-colors hover:bg-slate-100"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            level <= newPick.confidence
                              ? 'fill-current text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowPickModal(false)}
                className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePick}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-cyan-500"
              >
                Share Insight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
