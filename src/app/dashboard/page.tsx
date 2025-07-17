'use client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { useBets } from '@/lib/hooks/use-bets'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  ChevronDown,
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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
  const { user, loading: authLoading } = useAuth()
  const { betsData, isLoading: betsLoading, error: betsError, refresh: refreshBets } = useBets()
  
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [showAllBets, setShowAllBets] = useState(false)
  const [displayedBetsCount, setDisplayedBetsCount] = useState(10)

  // Auto-refresh data when user changes
  useEffect(() => {
    if (user && !authLoading && refreshBets) {
      refreshBets()
    }
  }, [user, authLoading, refreshBets])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false },
    { name: 'Feed', href: '/feed', icon: MessageSquare, current: false },
    { name: 'Marketplace', href: '/marketplace', icon: Store, current: false },
    { name: 'Subscriptions', href: '/subscriptions', icon: Users, current: false },
    { name: 'Monetize', href: '/sell', icon: DollarSign, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ]

  // Calculate metrics from bets data
  const metrics = useMemo(() => {
    if (!betsData?.length) {
      return {
        totalBets: 0,
        winRate: 0,
        roi: 0,
        totalProfit: 0,
        totalStaked: 0
      }
    }

    const settledBets = betsData.filter(bet => {
      const result = bet.result || bet.status
      return result === 'won' || result === 'lost' || result === 'win' || result === 'loss'
    })
    const wonBets = settledBets.filter(bet => {
      const result = bet.result || bet.status
      return result === 'won' || result === 'win'
    })
    
    const totalBets = settledBets.length
    const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0
    
    const totalStaked = settledBets.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
    const totalProfit = settledBets.reduce((sum, bet) => {
      const result = bet.result || bet.status
      const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                        ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : -(Number(bet.stake) || 0))
      return sum + profitLoss
    }, 0)
    
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0

    return {
      totalBets,
      winRate,
      roi,
      totalProfit,
      totalStaked
    }
  }, [betsData])

  // Stats array
  const stats = [
    {
      name: 'Total Bets',
      value: metrics.totalBets.toString(),
      change: '+0',
      changeType: 'positive',
      icon: Target,
      period: 'all time',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: '+0%',
      changeType: 'positive',
      icon: Trophy,
      period: 'all time',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'ROI',
      value: `${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(1)}%`,
      change: '+0%',
      changeType: 'positive',
      icon: TrendingUp,
      period: 'all time',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Total P&L',
      value: `${metrics.totalProfit >= 0 ? '+' : ''}$${metrics.totalProfit.toFixed(2)}`,
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

  // Generate years for dropdown (2020 to current year)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const yearOptions = ['all']
    for (let year = currentYear; year >= 2020; year--) {
      yearOptions.push(year.toString())
    }
    return yearOptions
  }, [])

  // Filter bets by selected year
  const yearFilteredBets = useMemo(() => {
    if (!betsData?.length || selectedYear === 'all') return betsData || []
    
    return betsData.filter(bet => {
      const betYear = new Date(bet.placed_at).getFullYear().toString()
      return betYear === selectedYear
    })
  }, [betsData, selectedYear])

  // Get today's bets for recent activity
  const todaysBets = useMemo(() => {
    if (!betsData?.length) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return betsData.filter(bet => {
      const betDate = new Date(bet.placed_at)
      return betDate >= today && betDate < tomorrow
    })
  }, [betsData])

  // Mock connected sportsbooks data
  const connectedSportsbooks = [
    {
      name: 'DraftKings',
      status: 'connected',
      lastSync: new Date().toLocaleString(),
      color: 'green',
      logo: 'DK'
    },
    {
      name: 'FanDuel',
      status: 'connected', 
      lastSync: new Date(Date.now() - 3600000).toLocaleString(),
      color: 'green',
      logo: 'FD'
    }
  ]

  // Load more bets functionality
  const loadMoreBets = useCallback(() => {
    setDisplayedBetsCount(prev => prev + 10)
  }, [])

  // Calculate profit chart data
  const profitChartData = useMemo(() => {
    if (!yearFilteredBets?.length) return []
    
    const sortedBets = [...yearFilteredBets].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
    let cumulativeProfit = 0
    
    return sortedBets.map((bet, index) => {
      const result = bet.result || bet.status
      const profitLoss = bet.profit_loss ? Number(bet.profit_loss) : 
                        ((result === 'won' || result === 'win') ? (Number(bet.actual_payout) || 0) - (Number(bet.stake) || 0) : 
                         (result === 'lost' || result === 'loss') ? -(Number(bet.stake) || 0) : 0)
      cumulativeProfit += profitLoss
      return {
        date: new Date(bet.placed_at).toLocaleDateString(),
        profit: Number(cumulativeProfit.toFixed(2)),
        betNumber: index + 1
      }
    })
  }, [yearFilteredBets])

  const isLoading = authLoading || betsLoading

  if (authLoading) {
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
                Welcome back, {user?.email ? user.email.split('@')[0] : 'Bettor'}
              </h1>
              <p className="text-blue-100">
                Here's what's happening with your betting performance today.
              </p>
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

      {/* Stats Grid */}
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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Profit Over Time</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Years</option>
                  {years.slice(1).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div className="h-64">
            {profitChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="betNumber" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${value}`, 'Profit']}
                    labelFormatter={(label) => `Bet #${label}`}
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3b82f6" 
                    fill="url(#profitGradient)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No data available</p>
                  <p className="text-sm text-slate-500">
                    {selectedYear === 'all' ? 'Add some bets to see your profit trend' : `No bets found for ${selectedYear}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Today's Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Today's Bets</h3>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {todaysBets.length > 0 ? (
              todaysBets.slice(0, 5).map((bet, index) => {
                const result = bet.result || bet.status
                return (
                  <div key={bet.id || index} className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-xl">
                    <div className={`p-2 rounded-lg ${
                      result === 'won' || result === 'win' ? 'bg-green-100 text-green-600' :
                      result === 'lost' || result === 'loss' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {bet.description || `${bet.bet_type || 'Bet'} - ${bet.sport || 'Unknown'}`}
                      </p>
                      <p className="text-xs text-slate-600">
                        {bet.sport} • {bet.odds > 0 ? `+${bet.odds}` : bet.odds} • ${bet.stake}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={result === 'won' || result === 'win' ? 'default' : result === 'lost' || result === 'loss' ? 'destructive' : 'secondary'}>
                        {result || 'pending'}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No bets placed today</p>
                <p className="text-xs text-slate-400">Today's bets will appear here</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Bets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bets</h2>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Link href="/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
        </div>
        <Card className="overflow-hidden">
          {betsData && betsData.length > 0 ? (
            <>
              <ul className="divide-y divide-slate-200">
                {betsData.slice(0, displayedBetsCount).map((bet, index) => {
                  const result = bet.result || bet.status
                  return (
                    <li key={bet.id || index} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline">
                              {bet.sport || 'Unknown'}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(bet.placed_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            {bet.description || `${bet.bet_type || 'Bet'} - ${bet.matchup || 'Unknown matchup'}`}
                          </p>
                          <div className="flex items-center text-sm text-slate-600 space-x-4">
                            <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                            <span>${bet.stake}</span>
                            <span>{bet.sportsbook || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end mb-1">
                            {(result === 'won' || result === 'win') && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                            {(result === 'lost' || result === 'loss') && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                            {(result === 'pending' || !result) && <Clock className="h-4 w-4 text-yellow-500 mr-1" />}
                            <Badge variant={
                              result === 'won' || result === 'win' ? 'default' :
                              result === 'lost' || result === 'loss' ? 'destructive' :
                              'secondary'
                            }>
                              {result || 'pending'}
                            </Badge>
                          </div>
                          <p className={`text-sm font-semibold ${
                            result === 'won' || result === 'win' ? 'text-green-600' :
                            result === 'lost' || result === 'loss' ? 'text-red-600' :
                            'text-slate-500'
                          }`}>
                            {bet.actual_payout ? `$${bet.actual_payout}` : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {betsData.length > displayedBetsCount && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <Button 
                    variant="ghost" 
                    onClick={loadMoreBets}
                    className="w-full"
                  >
                    Load More ({betsData.length - displayedBetsCount} remaining)
                  </Button>
                </div>
              )}
            </>
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
        </Card>
      </div>

      {/* Connected Sportsbooks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Connected Sportsbooks</h2>
        <Card className="p-6">
          {connectedSportsbooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {connectedSportsbooks.map((book) => (
                <div key={book.name} className="flex items-center p-4 bg-slate-50 rounded-xl">
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
        </Card>
      </div>
    </DashboardLayout>
  )
}