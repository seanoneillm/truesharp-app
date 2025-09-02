// FILE: src/app/dashboard/page.tsx
// REPLACE your existing dashboard page with this version

'use client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useDashboardData } from '@/lib/hooks'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Home,
  MessageSquare,
  Plus,
  Settings,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
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

export default function EnhancedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // ✅ NOW USING REAL DATA HOOKS!
  const { profile, metrics, bets, connections, isLoading } = useDashboardData()

  // Debug logs (remove these after testing)
  console.log('🔍 Dashboard Debug:')
  console.log('Profile:', profile)
  console.log('Metrics:', metrics)
  console.log('Bets:', bets)
  console.log('Connections:', connections)
  console.log('Is Loading:', isLoading)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
    { name: 'Feed', href: '/feed', icon: MessageSquare, current: false },
    { name: 'Marketplace', href: '/marketplace', icon: Store, current: false },
    { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: false },
    { name: 'Monetize', href: '/sell', icon: DollarSign, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ]

  // ✅ STATS NOW FROM REAL DATA
  const stats = [
    {
      name: 'Total Bets',
      value: metrics?.totalBets?.toString() || '0',
      change: '+0',
      changeType: 'positive',
      icon: Target,
      period: 'all time',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Win Rate',
      value: metrics?.winRate ? `${metrics.winRate.toFixed(1)}%` : '0%',
      change: '+0%',
      changeType: 'positive',
      icon: Trophy,
      period: 'all time',
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'ROI',
      value: metrics?.roi ? `${metrics.roi > 0 ? '+' : ''}${metrics.roi.toFixed(1)}%` : '0%',
      change: '+0%',
      changeType: 'positive',
      icon: TrendingUp,
      period: 'all time',
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Total P&L',
      value: metrics?.profit
        ? `${metrics.profit > 0 ? '+' : ''}$${Math.abs(metrics.profit).toFixed(0)}`
        : '$0',
      change: '+$0',
      changeType: 'positive',
      icon: DollarSign,
      period: 'all time',
      color: 'from-orange-500 to-red-500',
    },
  ]

  const quickActions = [
    {
      name: 'Connect Sportsbook',
      href: '/settings/sportsbooks',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      description: 'Link your betting accounts',
    },
    {
      name: 'View Analytics',
      href: '/analytics',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      description: 'Deep dive into your performance',
    },
    {
      name: 'Browse Picks',
      href: '/marketplace',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: 'Find winning bettors to follow',
    },
    {
      name: 'Start Selling',
      href: '/sell',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      description: 'Monetize your expertise',
    },
  ]

  // ✅ REAL DATA: Transform connections data for display
  const connectedSportsbooks =
    connections?.map(conn => ({
      name: conn.sportsbooks?.display_name || conn.sportsbook_id,
      status: conn.status,
      lastSync: conn.last_sync ? new Date(conn.last_sync).toLocaleString() : 'Never',
      color: conn.status === 'connected' ? 'green' : 'red',
      logo: conn.sportsbooks?.display_name?.substring(0, 2) || conn.sportsbook_id?.substring(0, 2),
    })) || []

  if (isLoading) {
    return (
      <DashboardLayout current="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout current="Dashboard">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">
                Welcome back,{' '}
                {profile?.username
                  ? `@${profile?.username}`
                  : profile?.display_name
                    ? profile.display_name
                    : profile?.email
                      ? profile.email
                      : 'Complete your profile'}
              </h1>
              <p className="text-blue-100">
                Here's what's happening with your betting performance today.
              </p>
              {/* Debug info (remove after testing) */}
              {profile && (
                <p className="mt-2 text-xs text-blue-200">
                  Real Profile: {profile.display_name} ({profile.email})
                </p>
              )}
            </div>
            <TrueSharpShield className="h-16 w-16" variant="light" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(action => (
            <Link
              key={action.name}
              href={action.href}
              className="group relative rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center">
                <div
                  className={`h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-slate-900">{action.name}</p>
                  <p className="text-xs text-slate-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid - NOW WITH REAL DATA */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Performance Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <div
              key={stat.name}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-2xl bg-gradient-to-br p-3 ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-semibold">{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">{stat.name}</p>
                <p className="mb-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.period}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Performance Chart */}
        <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Profit Over Time</h3>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-500">
                {metrics?.totalBets
                  ? 'Interactive profit chart would go here'
                  : 'No betting data yet'}
              </p>
              <p className="text-xs text-slate-400">
                {metrics?.totalBets
                  ? 'Showing performance trend'
                  : 'Connect a sportsbook to start tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {bets && bets.length > 0 ? (
              bets.slice(0, 3).map((bet, index) => (
                <div
                  key={bet.id}
                  className="flex items-center space-x-3 rounded-xl bg-slate-50/50 p-3"
                >
                  <div
                    className={`rounded-lg p-2 ${
                      bet.status === 'won'
                        ? 'bg-green-100 text-green-600'
                        : bet.status === 'lost'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Bet {bet.status}: {bet.description}
                    </p>
                    <p className="text-xs text-slate-600">
                      {bet.sport} • {bet.odds} • ${bet.stake}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(bet.placedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No recent activity</p>
                <p className="text-xs text-slate-400">Your bets will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bets - NOW WITH REAL DATA */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bets</h2>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm font-medium leading-4 text-slate-700 shadow-sm transition-colors hover:bg-white">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </button>
            <Link
              href="/analytics"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm">
          {bets && bets.length > 0 ? (
            <ul className="divide-y divide-slate-200/50">
              {bets.map(bet => (
                <li key={bet.id} className="px-6 py-4 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            bet.sport === 'NBA'
                              ? 'bg-orange-100 text-orange-800'
                              : bet.sport === 'NFL'
                                ? 'bg-green-100 text-green-800'
                                : bet.sport === 'MLB'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {bet.sport}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(bet.placedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-medium text-slate-900">{bet.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                        <span>${bet.stake}</span>
                        <span>
                          {bet.teams.away} @ {bet.teams.home}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 flex items-center justify-end">
                        {bet.status === 'won' && (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        )}
                        {bet.status === 'lost' && <XCircle className="mr-1 h-4 w-4 text-red-500" />}
                        {bet.status === 'pending' && (
                          <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            bet.status === 'won'
                              ? 'bg-green-100 text-green-800'
                              : bet.status === 'lost'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {bet.status}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          bet.status === 'won'
                            ? 'text-green-600'
                            : bet.status === 'lost'
                              ? 'text-red-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {bet.actualPayout ? `$${bet.actualPayout}` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-medium text-slate-900">No bets tracked yet</h3>
              <p className="mb-6 text-slate-500">
                Connect a sportsbook to start automatically tracking your bets
              </p>
              <Link
                href="/settings/sportsbooks"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Sportsbook
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Connected Sportsbooks - NOW WITH REAL DATA */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Connected Sportsbooks</h2>
        <div className="rounded-2xl border border-slate-200/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          {connectedSportsbooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {connectedSportsbooks.map(book => (
                <div key={book.name} className="flex items-center rounded-xl bg-slate-50/50 p-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-lg ${
                        book.status === 'connected'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : 'bg-gradient-to-br from-red-500 to-red-600'
                      }`}
                    >
                      {book.logo}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">{book.name}</p>
                    <p
                      className={`text-sm ${
                        book.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {book.status === 'connected'
                        ? `Last sync: ${book.lastSync}`
                        : 'Connection error'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Zap className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-medium text-slate-900">No sportsbooks connected</h3>
              <p className="mb-6 text-slate-500">
                Connect your sportsbook accounts to start tracking bets automatically
              </p>
              <Link
                href="/settings/sportsbooks"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Your First Sportsbook
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
