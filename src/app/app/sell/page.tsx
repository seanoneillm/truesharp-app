"use client"
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
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// TrueSharp Shield SVG Component
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
    odds: ''
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
      premium: 22
    },
    recentGrowth: {
      subscribers: '+12',
      revenue: '+$247'
    }
  }

  const recentPicks = [
    {
      id: 1,
      title: 'Lakers -4.5 vs Warriors',
      sport: 'NBA',
      confidence: 4,
      analysis: 'Lakers have been dominant at home this season, covering 8 of last 10. Warriors dealing with key injuries to Curry and Thompson.',
      odds: '-110',
      tier: 'premium',
      status: 'won',
      result: '+$91',
      postedAt: '2h ago',
      engagement: { views: 234, likes: 45, comments: 12 }
    },
    {
      id: 2,
      title: 'Chiefs ML vs Bills',
      sport: 'NFL',
      confidence: 5,
      analysis: 'Chiefs are undefeated at home in playoffs. Bills struggling with road performance in cold weather conditions.',
      odds: '+150',
      tier: 'premium',
      status: 'pending',
      result: 'TBD',
      postedAt: '4h ago',
      engagement: { views: 567, likes: 89, comments: 23 }
    },
    {
      id: 3,
      title: 'Over 8.5 Runs - Yankees vs Red Sox',
      sport: 'MLB',
      confidence: 3,
      analysis: 'Weather conditions favorable for offense. Both bullpens have struggled recently with ERA over 4.50.',
      odds: '-105',
      tier: 'silver',
      status: 'lost',
      result: '-$75',
      postedAt: '1d ago',
      engagement: { views: 189, likes: 23, comments: 8 }
    }
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
      engagement: 'high'
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
      engagement: 'medium'
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
      engagement: 'low'
    }
  ]

  const analytics = {
    pickPerformance: {
      thisMonth: { picks: 23, wins: 16, roi: '+28.4%' },
      lastMonth: { picks: 19, wins: 11, roi: '+15.2%' },
      improvement: '+13.2%'
    },
    subscriberGrowth: [
      { month: 'Aug', count: 89 },
      { month: 'Sep', count: 102 },
      { month: 'Oct', count: 128 },
      { month: 'Nov', count: 145 },
      { month: 'Dec', count: 156 }
    ],
    revenueByTier: {
      bronze: 2403,
      silver: 1575,
      premium: 1969
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
      odds: ''
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
            <span className="sr-only">Open sidebar</span>
            <div className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-slate-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 max-w-lg">
              <span className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400 pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search strategy insights..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <span className="sr-only">View notifications</span>
                <div className="h-6 w-6" />
              </button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" />
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">SB</span>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-slate-900">@sharpbettor</span>
                    <svg className="ml-2 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
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
                      <span className="h-4 w-4 mr-2" />
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
                    <h1 className="text-3xl font-bold text-slate-900">Strategy Dashboard</h1>
                  </div>
                  <p className="text-slate-600">Manage your insights, subscribers, and strategy performance</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/marketplace/sharpbettor`}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Public Profile
                  </Link>
                  <button
                    onClick={() => setShowPickModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Share New Insight
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>

            {/* Strategy Stats */}
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Monthly Revenue</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-bold text-slate-900">${sellerStats.monthlyRevenue}</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                            <span className="ml-1">{sellerStats.recentGrowth.revenue}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Active Subscribers</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-bold text-slate-900">{sellerStats.activeSubscribers}</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center" />
                            <span className="ml-1">{sellerStats.recentGrowth.subscribers}</span>
                          </div>
                        </dd>
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
                        <dt className="text-sm font-medium text-slate-600 truncate">Success Rate</dt>
                        <dd className="text-2xl font-bold text-slate-900">{sellerStats.winRate}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-600 truncate">Rating</dt>
                        <dd className="text-2xl font-bold text-slate-900">{sellerStats.rating}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="flex space-x-2 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-2 rounded-2xl w-fit shadow-lg">
                {['overview', 'insights', 'subscribers', 'analytics', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Performance</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{analytics.pickPerformance.thisMonth.roi}</div>
                        <div className="text-sm text-slate-500">This Month ROI</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {analytics.pickPerformance.thisMonth.wins}/{analytics.pickPerformance.thisMonth.picks} wins
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{sellerStats.totalPicks}</div>
                        <div className="text-sm text-slate-500">Total Insights</div>
                        <div className="text-xs text-slate-400 mt-1">All time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">${sellerStats.totalRevenue}</div>
                        <div className="text-sm text-slate-500">Total Earnings</div>
                        <div className="text-xs text-slate-400 mt-1">All time</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier Breakdown */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Subscriber Breakdown</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{sellerStats.tierBreakdown.bronze}</div>
                        <div className="text-sm text-slate-500">Bronze Tier</div>
                        <div className="text-xs text-slate-400 mt-1">${analytics.revenueByTier.bronze} revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{sellerStats.tierBreakdown.silver}</div>
                        <div className="text-sm text-slate-500">Silver Tier</div>
                        <div className="text-xs text-slate-400 mt-1">${analytics.revenueByTier.silver} revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{sellerStats.tierBreakdown.premium}</div>
                        <div className="text-sm text-slate-500">Premium Tier</div>
                        <div className="text-xs text-slate-400 mt-1">${analytics.revenueByTier.premium} revenue</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Activity</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                      <li className="px-6 py-4 hover:bg-white/50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">New comment on your strategy analysis</p>
                            <p className="text-sm text-slate-500">@sportsfan99 • 6 hours ago</p>
                          </div>
                        </div>
                      </li>
                      <li className="px-6 py-4 hover:bg-white/50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <UserPlus className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">New subscriber joined Premium tier</p>
                            <p className="text-sm text-slate-500">@newbettor23 • 2 hours ago</p>
                          </div>
                          <div className="text-sm font-medium text-green-600">+$89</div>
                        </div>
                      </li>
                      <li className="px-6 py-4 hover:bg-white/50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Insight successful: Lakers -4.5 vs Warriors</p>
                            <p className="text-sm text-slate-500">234 subscribers saw this insight • 4 hours ago</p>
                          </div>
                          <div className="text-sm font-medium text-green-600">Won</div>
                        </div>
                      </li>
                      <li className="px-6 py-4 hover:bg-white/50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Insight failed: Over 8.5 Runs - Yankees vs Red Sox</p>
                            <p className="text-sm text-slate-500">189 subscribers saw this insight • 1 day ago</p>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">My Recent Insights</h2>
                  <button
                    onClick={() => setShowPickModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Insight
                  </button>
                </div>
                
                <div className="space-y-6">
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
                            <div className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(pick.tier)}`}>
                              {pick.tier}
                            </div>
                            <span className="ml-3 text-sm text-slate-500">{pick.postedAt}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{pick.title}</h3>
                          <p className="text-slate-700 mb-4">{pick.analysis}</p>
                          <div className="flex items-center space-x-6">
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
                            <div className="flex items-center text-sm text-slate-500">
                              <Eye className="h-4 w-4 mr-1" />
                              {pick.engagement.views} views
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end mb-2">
                            {pick.status === 'won' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                            {pick.status === 'lost' && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                            {pick.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500 mr-2" />}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              pick.status === 'won' ? 'bg-green-100 text-green-800' :
                              pick.status === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pick.status}
                            </span>
                          </div>
                          <p className={`text-lg font-semibold mb-2 ${
                            pick.status === 'won' ? 'text-green-600' :
                            pick.status === 'lost' ? 'text-red-600' :
                            'text-slate-500'
                          }`}>
                            {pick.result}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <div className="flex items-center">
                              <Trophy className="h-4 w-4 mr-1" />
                              {pick.engagement.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Subscribers</h2>
                  <div className="flex items-center space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
                  <ul className="divide-y divide-slate-200">
                    {subscribers.map((subscriber) => (
                      <li key={subscriber.id} className="px-6 py-6 hover:bg-white/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-medium shadow-lg">
                              {subscriber.avatar}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="text-sm font-medium text-slate-900">{subscriber.username}</h3>
                                <div className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(subscriber.tier)}`}>
                                  {subscriber.tier}
                                </div>
                                <div className={`ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                  subscriber.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {subscriber.status}
                                </div>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">{subscriber.displayName}</p>
                              <div className="flex items-center mt-2 space-x-4 text-sm text-slate-500">
                                <div>Joined: {new Date(subscriber.joinDate).toLocaleDateString()}</div>
                                <div>Total spent: ${subscriber.totalSpent}</div>
                                <div className={`flex items-center ${
                                  subscriber.engagement === 'high' ? 'text-green-600' :
                                  subscriber.engagement === 'medium' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  <Activity className="h-4 w-4 mr-1" />
                                  {subscriber.engagement} engagement
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </button>
                            {subscriber.status === 'active' ? (
                              <button className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-xl text-red-700 bg-white/70 hover:bg-red-50 transition-colors">
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove
                              </button>
                            ) : (
                              <button className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-xl text-green-700 bg-white/70 hover:bg-green-50 transition-colors">
                                <UserPlus className="h-4 w-4 mr-2" />
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
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Subscriber Growth</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Subscriber growth chart would go here</p>
                        <p className="text-xs text-slate-400">Monthly subscriber count over time</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Performance Breakdown</h2>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                      <h3 className="text-base font-medium text-slate-900 mb-4">Insight Performance by Sport</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">NFL</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">72.4% success rate</span>
                            <span className="ml-2 text-sm text-green-600">+28.4% ROI</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">NBA</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">65.2% success rate</span>
                            <span className="ml-2 text-sm text-green-600">+19.7% ROI</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">MLB</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">58.9% success rate</span>
                            <span className="ml-2 text-sm text-green-600">+12.3% ROI</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                      <h3 className="text-base font-medium text-slate-900 mb-4">Revenue by Tier</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Premium Tier</span>
                          <span className="text-sm font-medium text-slate-900">${analytics.revenueByTier.premium}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Bronze Tier</span>
                          <span className="text-sm font-medium text-slate-900">${analytics.revenueByTier.bronze}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Silver Tier</span>
                          <span className="text-sm font-medium text-slate-900">${analytics.revenueByTier.silver}</span>
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
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Subscription Pricing</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Bronze Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="number"
                              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                              placeholder="25"
                              defaultValue="25"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Basic insights and analysis</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Silver Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="number"
                              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                              placeholder="45"
                              defaultValue="45"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Detailed analysis and insights</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Premium Tier
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="number"
                              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                              placeholder="89"
                              defaultValue="89"
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">All insights, premium analysis, direct access</p>
                        </div>
                      </div>
                      <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200">
                        <Save className="h-4 w-4 mr-2" />
                        Update Pricing
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Settings */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Public Profile</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          rows={4}
                          className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                          placeholder="Tell potential subscribers about your expertise..."
                          defaultValue="Former Vegas insider with 15+ years experience. Specializing in NFL spreads and NBA totals with proven long-term results."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Specializations
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['NFL', 'NBA'].map((sport) => (
                            <span
                              key={sport}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                            >
                              {sport}
                              <X className="ml-2 h-4 w-4" />
                            </span>
                          ))}
                          <button className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Sport
                          </button>
                        </div>
                      </div>
                      <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200">
                        <Save className="h-4 w-4 mr-2" />
                        Update Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payout Settings */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Payout Settings</h2>
                  <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Payout Method
                        </label>
                        <select className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70">
                          <option>Bank Transfer</option>
                          <option>PayPal</option>
                          <option>Stripe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Payout Schedule
                        </label>
                        <select className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70">
                          <option>Weekly</option>
                          <option>Bi-weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="text-sm font-medium text-slate-900 mb-2">Commission Structure</h4>
                        <p className="text-sm text-slate-600">TrueSharp takes 15% commission on all subscription revenue</p>
                        <p className="text-sm text-slate-600 mt-1">Payment processing fees: 2.9% + $0.30 per transaction</p>
                      </div>
                      <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200">
                        <Save className="h-4 w-4 mr-2" />
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Share New Insight</h3>
              <button
                onClick={() => setShowPickModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sport
                  </label>
                  <select
                    value={newPick.sport}
                    onChange={(e) => setNewPick({...newPick, sport: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                  >
                    <option value="NFL">NFL</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                    <option value="NHL">NHL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subscription Tier
                  </label>
                  <select
                    value={newPick.tier}
                    onChange={(e) => setNewPick({...newPick, tier: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Insight Title
                </label>
                <input
                  type="text"
                  value={newPick.title}
                  onChange={(e) => setNewPick({...newPick, title: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                  placeholder="e.g., Lakers -4.5 vs Warriors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Analysis
                </label>
                <textarea
                  rows={4}
                  value={newPick.analysis}
                  onChange={(e) => setNewPick({...newPick, analysis: e.target.value})}
                  className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                  placeholder="Explain your reasoning for this insight..."
                />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Odds
                  </label>
                  <input
                    type="text"
                    value={newPick.odds}
                    onChange={(e) => setNewPick({...newPick, odds: e.target.value})}
                    className="block w-full border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                    placeholder="e.g., -110, +150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confidence Level
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setNewPick({...newPick, confidence: level})}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            level <= newPick.confidence ? 'text-yellow-400 fill-current' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowPickModal(false)}
                className="px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePick}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-200"
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