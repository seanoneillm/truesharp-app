"use client"

import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  Crown,
  DollarSign,
  Eye,
  Filter,
  Grid3X3,
  Home,
  List,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Shield,
  Star,
  Store,
  TrendingUp,
  Trophy,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// TrueSharp Shield Component
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

// Navigation component
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
  { name: 'Feed', href: '/feed', icon: Users, current: false },
  { name: 'Marketplace', href: '/marketplace', icon: Store, current: true },
  { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: false },
  { name: 'Monetize', href: '/sell', icon: DollarSign, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export default function EnhancedMarketplacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [sortBy, setSortBy] = useState('roi')

  const featuredSellers = [
    {
      id: 1,
      username: '@sharpbettor',
      displayName: 'Mike Johnson',
      avatar: 'MJ',
      verified: true,
      tier: 'elite',
      specialization: ['NFL', 'NBA'],
      roi: '+34.2%',
      winRate: '68.4%',
      totalPicks: 487,
      subscribers: 2847,
      pricing: {
        bronze: 29,
        silver: 49,
        premium: 89
      },
      recentStreak: { type: 'win', count: 8 },
      joinDate: 'Jan 2023',
      location: 'Las Vegas, NV',
      rating: 4.9,
      description: 'Former Vegas insider with 15+ years experience. Specializing in NFL spreads and NBA totals with proven long-term results.',
      badges: ['Top Performer', 'Verified Pro', 'Hot Streak']
    },
    {
      id: 2,
      username: '@mlbmaster',
      displayName: 'Sarah Chen',
      avatar: 'SC',
      verified: true,
      tier: 'pro',
      specialization: ['MLB'],
      roi: '+28.7%',
      winRate: '64.2%',
      totalPicks: 892,
      subscribers: 1654,
      pricing: {
        bronze: 19,
        silver: 39,
        premium: 69
      },
      recentStreak: { type: 'win', count: 12 },
      joinDate: 'Mar 2022',
      location: 'Chicago, IL',
      rating: 4.8,
      description: 'MLB analytics expert with proprietary models. Focus on player props and team totals during regular season.',
      badges: ['MLB Expert', 'Analytics Pro']
    },
    {
      id: 3,
      username: '@nflkings',
      displayName: 'Tony Rodriguez',
      avatar: 'TR',
      verified: true,
      tier: 'rising',
      specialization: ['NFL', 'CFB'],
      roi: '+41.8%',
      winRate: '71.3%',
      totalPicks: 156,
      subscribers: 892,
      pricing: {
        bronze: 25,
        silver: 45,
        premium: 75
      },
      recentStreak: { type: 'win', count: 6 },
      joinDate: 'Sep 2024',
      location: 'Miami, FL',
      rating: 4.9,
      description: 'Rising star with incredible football instincts. Strong record on primetime games and playoff predictions.',
      badges: ['Rising Star', 'Hot Streak', 'New Talent']
    }
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rising': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite': return Crown
      case 'pro': return Shield
      case 'rising': return TrendingUp
      default: return Star
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
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
                placeholder="Search sellers by username or sport..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    <span className="ml-4 text-sm font-semibold leading-6 text-slate-900">
                      @sportsbettor
                    </span>
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
                    <Store className="h-8 w-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Pick Marketplace</h1>
                  </div>
                  <p className="text-slate-600">
                    Discover verified winning bettors and subscribe to their picks
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 text-blue-600 scale-105'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-600 scale-105'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 hover:scale-105"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Quick Filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search sellers by username or sport..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="roi">Highest ROI</option>
                  <option value="winrate">Win Rate</option>
                  <option value="subscribers">Most Subscribers</option>
                  <option value="rating">Highest Rated</option>
                  <option value="recent">Most Active</option>
                </select>
              </div>
            </div>

            {/* Featured Sellers */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                Featured Sellers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredSellers.map((seller) => {
                  const TierIcon = getTierIcon(seller.tier)
                  return (
                    <div key={seller.id} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                            {seller.avatar}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-slate-900">{seller.username}</h3>
                              {seller.verified && (
                                <TrueSharpShield className="h-4 w-4 ml-2" variant="light" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{seller.displayName}</p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(seller.tier)}`}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {seller.tier}
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <p className="text-lg font-semibold text-green-600">{seller.roi}</p>
                          <p className="text-xs text-slate-500">ROI</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{seller.winRate}</p>
                          <p className="text-xs text-slate-500">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{seller.totalPicks}</p>
                          <p className="text-xs text-slate-500">Total Picks</p>
                        </div>
                      </div>

                      {/* Specialization */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {seller.specialization.map((sport) => (
                            <span key={sport} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {sport}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {seller.description}
                      </p>

                      {/* Pricing and Actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Starting at</p>
                          <p className="text-lg font-bold text-slate-900">
                            ${Math.min(seller.pricing.bronze, seller.pricing.silver, seller.pricing.premium)}/month
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white/80 transition-all duration-200">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </button>
                          <button className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Subscribe
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-8 bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sport</label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                    >
                      <option value="all">All Sports</option>
                      <option value="nfl">NFL</option>
                      <option value="nba">NBA</option>
                      <option value="mlb">MLB</option>
                      <option value="nhl">NHL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Range</label>
                    <select
                      value={selectedPriceRange}
                      onChange={(e) => setSelectedPriceRange(e.target.value)}
                      className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                    >
                      <option value="all">All Prices</option>
                      <option value="low">$1 - $25</option>
                      <option value="mid">$26 - $75</option>
                      <option value="high">$76+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tier</label>
                    <select
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white/70"
                    >
                      <option value="all">All Tiers</option>
                      <option value="elite">Elite</option>
                      <option value="pro">Pro</option>
                      <option value="rising">Rising</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setSelectedSport('all')
                        setSelectedPriceRange('all')
                        setSelectedTier('all')
                      }}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white/80 transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                Showing {featuredSellers.length} verified sellers
                {selectedSport !== 'all' && ` • ${selectedSport}`}
                {selectedPriceRange !== 'all' && ` • ${selectedPriceRange} price range`}
                {selectedTier !== 'all' && ` • ${selectedTier} tier`}
              </p>
            </div>

            {/* All Sellers Grid */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">All Sellers</h2>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredSellers.map((seller) => {
                    const TierIcon = getTierIcon(seller.tier)
                    return (
                      <div key={seller.id + '_grid'} className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        {/* Similar content as featured sellers but with more details */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                              {seller.avatar}
                            </div>
                            <div className="ml-3">
                              <div className="flex items-center">
                                <h3 className="text-lg font-medium text-slate-900">{seller.username}</h3>
                                {seller.verified && (
                                  <TrueSharpShield className="h-4 w-4 ml-2" variant="light" />
                                )}
                              </div>
                              <p className="text-sm text-slate-500">{seller.displayName}</p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(seller.tier)}`}>
                            <TierIcon className="h-3 w-3 mr-1" />
                            {seller.tier}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                          <div>
                            <p className="text-lg font-semibold text-green-600">{seller.roi}</p>
                            <p className="text-xs text-slate-500">ROI</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{seller.winRate}</p>
                            <p className="text-xs text-slate-500">Win Rate</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{seller.subscribers.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Subscribers</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {seller.specialization.map((sport) => (
                              <span key={sport} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {sport}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center text-sm text-slate-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {seller.location}
                            <Calendar className="h-4 w-4 ml-4 mr-1" />
                            Joined {seller.joinDate}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-slate-900">{seller.rating}</span>
                            <span className="text-sm text-slate-500 ml-1">rating</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                          {seller.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Starting at</p>
                            <p className="text-lg font-bold text-slate-900">
                              ${Math.min(seller.pricing.bronze, seller.pricing.silver, seller.pricing.premium)}/month
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white/80 transition-all duration-200">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </button>
                            <button className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Subscribe
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg">
                  <div className="px-6 py-4 border-b border-slate-200/50">
                    <h3 className="text-lg font-medium text-slate-900">All Sellers</h3>
                  </div>
                  <ul className="divide-y divide-slate-200/50">
                    {featuredSellers.map((seller) => {
                      const TierIcon = getTierIcon(seller.tier)
                      return (
                        <li key={seller.id + '_list'} className="px-6 py-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {seller.avatar}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center">
                                  <h3 className="text-lg font-medium text-slate-900">{seller.username}</h3>
                                  {seller.verified && (
                                    <TrueSharpShield className="h-5 w-5 ml-2" variant="light" />
                                  )}
                                  <div className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(seller.tier)}`}>
                                    <TierIcon className="h-3 w-3 mr-1" />
                                    {seller.tier}
                                  </div>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{seller.displayName}</p>
                                <p className="text-sm text-slate-600 mt-2 max-w-2xl">{seller.description}</p>
                                <div className="flex items-center mt-3 space-x-6">
                                  <div className="flex items-center text-sm text-slate-500">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {seller.location}
                                  </div>
                                  <div className="flex items-center text-sm text-slate-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Joined {seller.joinDate}
                                  </div>
                                  <div className="flex items-center text-sm text-slate-500">
                                    <Users className="h-4 w-4 mr-1" />
                                    {seller.subscribers.toLocaleString()} subscribers
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-8">
                              <div className="text-center">
                                <p className="text-lg font-semibold text-green-600">{seller.roi}</p>
                                <p className="text-xs text-slate-500">ROI</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-slate-900">{seller.winRate}</p>
                                <p className="text-xs text-slate-500">Win Rate</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">
                                  ${Math.min(seller.pricing.bronze, seller.pricing.silver, seller.pricing.premium)}
                                </p>
                                <p className="text-xs text-slate-500">per month</p>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white/80 transition-all duration-200">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </button>
                                <button className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 hover:scale-105">
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Subscribe
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Ready to Start Winning?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Join thousands of bettors following verified winners. All performance data is 100% authentic and tracked in real-time.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200 shadow-lg hover:scale-105"
                  >
                    Start Free Trial
                    <ArrowUpRight className="h-5 w-5 ml-2" />
                  </Link>
                  <Link
                    href="/monetize"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-xl text-white hover:bg-blue-600 transition-all duration-200 hover:scale-105"
                  >
                    Become a Seller
                    <Crown className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
