'use client'

import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  DollarSign,
  Filter,
  Flame,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Star,
  Store,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
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

// Make sure navigation is defined at the top level
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: false },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
  { name: 'Feed', href: '/feed', icon: MessageSquare, current: true },
  { name: 'Marketplace', href: '/marketplace', icon: Store, current: false },
  { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: false },
  { name: 'Monetize', href: '/sell', icon: DollarSign, current: false },
  { name: 'Settings', href: '/settings', icon: Settings, current: false },
]

export default function EnhancedFeedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('forYou')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const feedFilters = [
    {
      id: 'forYou',
      label: 'For You',
      icon: TrueSharpShield,
      description: 'Verified picks personalized for you',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'following',
      label: 'Following',
      icon: Users,
      description: 'People you follow',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'live',
      label: 'Live',
      icon: Zap,
      description: 'Games starting soon',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'hot',
      label: 'Hot',
      icon: Flame,
      description: 'Trending picks',
      color: 'from-purple-500 to-pink-500',
    },
  ]

  const feedPosts = [
    {
      id: 1,
      user: {
        username: '@sharpbettor',
        displayName: 'Mike Johnson',
        avatar: 'MJ',
        verified: true,
        tier: 'elite',
      },
      type: 'pick',
      content: {
        title: 'Lakers -4.5 vs Warriors',
        analysis:
          'Lakers have been dominant at home this season, covering 8 of last 10. Warriors dealing with key injuries to Curry and Thompson.',
        sport: 'NBA',
        confidence: 4,
        odds: '-110',
        status: 'won',
        result: '+$91',
      },
      engagement: { likes: 45, comments: 12, shares: 8 },
      timestamp: '2h ago',
    },
    {
      id: 2,
      user: {
        username: '@mlbmaster',
        displayName: 'Sarah Chen',
        avatar: 'SC',
        verified: true,
        tier: 'pro',
      },
      type: 'celebration',
      content: {
        text: "Just hit my 10th straight win! 🔥 The analytics don't lie - staying disciplined with the process.",
        streak: 10,
      },
      engagement: { likes: 128, comments: 34, shares: 22 },
      timestamp: '4h ago',
    },
    {
      id: 3,
      user: {
        username: '@nflkings',
        displayName: 'Tony Rodriguez',
        avatar: 'TR',
        verified: true,
        tier: 'rising',
      },
      type: 'pick',
      content: {
        title: 'Chiefs ML vs Bills',
        analysis:
          'Chiefs are undefeated at home in playoffs. Bills struggling with road performance in cold weather.',
        sport: 'NFL',
        confidence: 5,
        odds: '+150',
        status: 'pending',
      },
      engagement: { likes: 67, comments: 19, shares: 11 },
      timestamp: '6h ago',
    },
  ]

  const trendingTopics = [
    { tag: '#NBAPlayoffs', posts: '2.4k', trending: true },
    { tag: '#SuperBowl', posts: '1.8k', trending: true },
    { tag: '#MarchMadness', posts: '3.2k', trending: false },
    { tag: '#MLBSeason', posts: '956', trending: false },
  ]

  const suggestedUsers = [
    {
      username: '@tennisace',
      displayName: 'Emma Wilson',
      avatar: 'EW',
      verified: true,
      specialty: 'Tennis Expert',
      followers: '1.2k',
    },
    {
      username: '@hockeysharp',
      displayName: 'Alex Thompson',
      avatar: 'AT',
      verified: false,
      specialty: 'NHL Specialist',
      followers: '847',
    },
  ]

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
            <Menu className="h-6 w-6" />
          </button>
          <div className="h-6 w-px bg-slate-200 lg:hidden" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex max-w-lg flex-1">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-slate-400" />
              <input
                className="block h-full w-full border-0 bg-transparent py-0 pl-10 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
                placeholder="Search posts, users, or topics..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="-m-2.5 rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" />
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center rounded-xl p-1.5 transition-colors hover:bg-slate-100"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg">
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
                      <LogOut className="mr-2 h-4 w-4" />
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
                    <h1 className="text-3xl font-bold text-slate-900">Community Feed</h1>
                  </div>
                  <p className="text-slate-600">
                    Latest verified picks, wins, and insights from the community
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </button>
                  <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-cyan-500"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* Feed Filters */}
            <div className="mb-8">
              <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
                {feedFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? `bg-gradient-to-r ${filter.color} scale-105 text-white shadow-lg`
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {filter.id === 'forYou' ? (
                      <TrueSharpShield
                        className="mr-2 h-4 w-4"
                        variant={activeFilter === filter.id ? 'light' : 'default'}
                      />
                    ) : (
                      <filter.icon className="mr-2 h-4 w-4" />
                    )}
                    {filter.label}
                  </button>
                ))}
              </div>
              {activeFilter && (
                <p className="ml-2 mt-3 text-sm text-slate-600">
                  {feedFilters.find(f => f.id === activeFilter)?.description}
                </p>
              )}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {/* Feed */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {feedPosts.map(post => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                      {/* Post Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 font-bold text-white shadow-lg">
                            {post.user.avatar}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900">
                                {post.user.username}
                              </span>
                              {post.user.verified && (
                                <TrueSharpShield className="h-4 w-4" variant="light" />
                              )}
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  post.user.tier === 'elite'
                                    ? 'bg-purple-100 text-purple-800'
                                    : post.user.tier === 'pro'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {post.user.tier}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <span>{post.user.displayName}</span>
                              <span>•</span>
                              <span>{post.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        <button className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                          <MoreHorizontal className="h-5 w-5 text-slate-400" />
                        </button>
                      </div>

                      {/* Post Content */}
                      {post.type === 'pick' ? (
                        <div className="mb-4">
                          <div className="mb-3 flex items-center space-x-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                post.content.sport === 'NBA'
                                  ? 'bg-orange-100 text-orange-800'
                                  : post.content.sport === 'NFL'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {post.content.sport}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (post.content.confidence ?? 0)
                                      ? 'fill-current text-yellow-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {post.content.status && (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  post.content.status === 'won'
                                    ? 'bg-green-100 text-green-800'
                                    : post.content.status === 'lost'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {post.content.status}
                              </span>
                            )}
                          </div>
                          <h3 className="mb-2 text-lg font-bold text-slate-900">
                            {post.content.title}
                          </h3>
                          <p className="mb-3 text-slate-700">{post.content.analysis}</p>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span>Odds: {post.content.odds}</span>
                            {post.content.result && (
                              <span
                                className={
                                  post.content.status === 'won'
                                    ? 'font-semibold text-green-600'
                                    : 'font-semibold text-red-600'
                                }
                              >
                                {post.content.result}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <p className="text-lg text-slate-900">{post.content.text}</p>
                          {post.content.streak && (
                            <div className="mt-3 inline-flex items-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-white">
                              <Trophy className="mr-2 h-4 w-4" />
                              <span className="font-semibold">
                                {post.content.streak} Win Streak
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Engagement */}
                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-4">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-red-500">
                            <Heart className="h-5 w-5" />
                            <span className="text-sm">{post.engagement.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-blue-500">
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-sm">{post.engagement.comments}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-slate-600 transition-colors hover:text-green-500">
                            <Share2 className="h-5 w-5" />
                            <span className="text-sm">{post.engagement.shares}</span>
                          </button>
                        </div>
                        <button className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                          <Bookmark className="h-5 w-5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                {/* Trending Topics */}
                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex items-center space-x-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Trending</h3>
                  </div>
                  <div className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50/50"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">{topic.tag}</span>
                            {topic.trending && <TrendingUp className="h-4 w-4 text-green-500" />}
                          </div>
                          <span className="text-sm text-slate-600">{topic.posts} posts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Users */}
                <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Suggested for You</h3>
                  <div className="space-y-4">
                    {suggestedUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 font-bold text-white shadow-lg">
                            {user.avatar}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-slate-900">{user.username}</span>
                              {user.verified && (
                                <TrueSharpShield className="h-3 w-3" variant="light" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{user.specialty}</p>
                            <p className="text-xs text-slate-500">{user.followers} followers</p>
                          </div>
                        </div>
                        <button className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 text-sm font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-cyan-500">
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white shadow-lg">
                  <div className="mb-4 flex items-center space-x-2">
                    <TrueSharpShield className="h-6 w-6" variant="light" />
                    <h3 className="text-lg font-semibold">Community Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-100">Active Users</span>
                      <span className="font-bold">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100">Picks Today</span>
                      <span className="font-bold">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-100">Win Rate</span>
                      <span className="font-bold">68.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
