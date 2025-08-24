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
  Zap
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
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Win Rate',
      value: metrics?.winRate ? `${metrics.winRate.toFixed(1)}%` : '0%',
      change: '+0%',
      changeType: 'positive',
      icon: Trophy,
      period: 'all time',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'ROI',
      value: metrics?.roi ? `${metrics.roi > 0 ? '+' : ''}${metrics.roi.toFixed(1)}%` : '0%',
      change: '+0%',
      changeType: 'positive',
      icon: TrendingUp,
      period: 'all time',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Total P&L',
      value: metrics?.profit ? `${metrics.profit > 0 ? '+' : ''}$${Math.abs(metrics.profit).toFixed(0)}` : '$0',
      change: '+$0',
      changeType: 'positive',
      icon: DollarSign,
      period: 'all time',
      color: 'from-orange-500 to-red-500'
    },
  ]

  const quickActions = [
    {
      name: 'Connect Sportsbook',
      href: '/settings/sportsbooks',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      description: 'Link your betting accounts'
    },
    {
      name: 'View Analytics',
      href: '/analytics',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      description: 'Deep dive into your performance'
    },
    {
      name: 'Browse Picks',
      href: '/marketplace',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: 'Find winning bettors to follow'
    },
    {
      name: 'Start Selling',
      href: '/sell',
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      description: 'Monetize your expertise'
    }
  ]

  // ✅ REAL DATA: Transform connections data for display
  const connectedSportsbooks = connections?.map(conn => ({
    name: conn.sportsbooks?.display_name || conn.sportsbook_id,
    status: conn.status,
    lastSync: conn.last_sync ? new Date(conn.last_sync).toLocaleString() : 'Never',
    color: conn.status === 'connected' ? 'green' : 'red',
    logo: conn.sportsbooks?.display_name?.substring(0, 2) || conn.sportsbook_id?.substring(0, 2)
  })) || []

  if (isLoading) {
    return (
      <DashboardLayout current="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout current="Dashboard">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
<h1 className="text-3xl font-bold mb-2">
  Welcome back, {
    profile?.username
      ? `@${profile?.username}`
      : profile?.display_name
        ? profile.display_name
        : profile?.email
          ? profile.email
          : 'Complete your profile'
  }
</h1>
              <p className="text-blue-100">
                Here's what's happening with your betting performance today.
              </p>
              {/* Debug info (remove after testing) */}
              {profile && (
                <p className="text-xs text-blue-200 mt-2">
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="group relative rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-semibold">{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 mb-2">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.period}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Chart */}
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Profit Over Time</h3>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200/50">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {metrics?.totalBets ? 'Interactive profit chart would go here' : 'No betting data yet'}
              </p>
              <p className="text-xs text-slate-400">
                {metrics?.totalBets ? 'Showing performance trend' : 'Connect a sportsbook to start tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {bets && bets.length > 0 ? (
              bets.slice(0, 3).map((bet, index) => (
                <div key={bet.id} className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-xl">
                  <div className={`p-2 rounded-lg ${
                    bet.status === 'won' ? 'bg-green-100 text-green-600' :
                    bet.status === 'lost' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
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
              <div className="text-center py-8">
                <Trophy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No recent activity</p>
                <p className="text-xs text-slate-400">Your bets will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bets - NOW WITH REAL DATA */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bets</h2>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-white transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <Link href="/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
          {bets && bets.length > 0 ? (
            <ul className="divide-y divide-slate-200/50">
              {bets.map((bet) => (
                <li key={bet.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bet.sport === 'NBA' ? 'bg-orange-100 text-orange-800' :
                          bet.sport === 'NFL' ? 'bg-green-100 text-green-800' :
                          bet.sport === 'MLB' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {bet.sport}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(bet.placedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {bet.description}
                      </p>
                      <div className="flex items-center text-sm text-slate-600 space-x-4">
                        <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                        <span>${bet.stake}</span>
                        <span>{bet.teams.away} @ {bet.teams.home}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end mb-1">
                        {bet.status === 'won' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                        {bet.status === 'lost' && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                        {bet.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500 mr-1" />}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bet.status === 'won' ? 'bg-green-100 text-green-800' :
                          bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bet.status}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold ${
                        bet.status === 'won' ? 'text-green-600' :
                        bet.status === 'lost' ? 'text-red-600' :
                        'text-slate-500'
                      }`}>
                        {bet.actualPayout ? `$${bet.actualPayout}` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No bets tracked yet</h3>
              <p className="text-slate-500 mb-6">Connect a sportsbook to start automatically tracking your bets</p>
              <Link 
                href="/settings/sportsbooks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Sportsbook
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Connected Sportsbooks - NOW WITH REAL DATA */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Connected Sportsbooks</h2>
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg">
          {connectedSportsbooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {connectedSportsbooks.map((book) => (
                <div key={book.name} className="flex items-center p-4 bg-slate-50/50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                      book.status === 'connected' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                      'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      {book.logo}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">{book.name}</p>
                    <p className={`text-sm ${
                      book.status === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {book.status === 'connected' ? `Last sync: ${book.lastSync}` : 'Connection error'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No sportsbooks connected</h3>
              <p className="text-slate-500 mb-6">Connect your sportsbook accounts to start tracking bets automatically</p>
              <Link 
                href="/settings/sportsbooks"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Sportsbook
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}