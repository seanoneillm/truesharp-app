'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  CreditCard,
  Link2,
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'
import { useEffect, useState, useCallback } from 'react'

interface AccountsAnalytics {
  totalUsers: number
  usersWithStripeCustomers: number
  usersWithStripeConnect: number
  usersWithSharpSports: number
  stripeCustomerPercentage: number
  stripeConnectPercentage: number
  sharpSportsPercentage: number
  stripeCustomerAndConnect: number
  stripeAndSharpSports: number
  connectAndSharpSports: number
  allThreeAccounts: number
  totalBettorAccounts: number
  uniqueBettors: number
  avgAccountsPerBettor: number
  sportsbookDistribution: Array<{
    bookName: string
    bookAbbr: string
    totalAccounts: number
    verifiedAccounts: number
    accessibleAccounts: number
    pausedAccounts: number
    averageBalance: number
  }>
  accountLinkingOverTime: Array<{
    date: string
    dateLabel: string
    dailyLinks: number
    cumulativeLinks: number
  }>
  connectivityTrends: Array<{
    date: string
    dateLabel: string
    stripeCustomers: number
    stripeConnect: number
    sharpSports: number
  }>
  recentLinkingActivity: Array<{
    date: string
    bettorId: string
    bookName: string
    bookAbbr: string
    verified: boolean
    balance: number
  }>
  accountHealth: {
    verifiedAccountsPercentage: number
    accessibleAccountsPercentage: number
    pausedAccountsPercentage: number
    accountsWithBalance: number
    totalBalance: number
    averageBalance: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export function EnhancedAccountsTab() {
  const [accountsData, setAccountsData] = useState<AccountsAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccountsData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/accounts-analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch accounts analytics')
      }
      const result = await response.json()
      setAccountsData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccountsData()
  }, [fetchAccountsData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 p-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200"></div>
                    <div className="h-6 w-16 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold">Error Loading Data</h3>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={fetchAccountsData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  if (!accountsData) return null

  // Prepare chart data

  const accountOverlapData = [
    { name: 'Stripe + Connect', value: accountsData.stripeCustomerAndConnect },
    { name: 'Stripe + SharpSports', value: accountsData.stripeAndSharpSports },
    { name: 'Connect + SharpSports', value: accountsData.connectAndSharpSports },
    { name: 'All Three', value: accountsData.allThreeAccounts }
  ]

  const topSportsbooks = accountsData.sportsbookDistribution.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of user accounts and connectivity
          </p>
        </div>
        <Button onClick={fetchAccountsData} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Stripe Customers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.usersWithStripeCustomers.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {accountsData.stripeCustomerPercentage.toFixed(1)}% of users
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <Link2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Stripe Connect</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.usersWithStripeConnect.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {accountsData.stripeConnectPercentage.toFixed(1)}% of users
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">SharpSports Users</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.usersWithSharpSports.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {accountsData.sharpSportsPercentage.toFixed(1)}% of users
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sportsbook Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Bettor Accounts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.totalBettorAccounts.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-teal-100 p-2">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Unique Bettors</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.uniqueBettors.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Accounts/Bettor</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.avgAccountsPerBettor.toFixed(1)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Balance</p>
              <p className="text-2xl font-semibold text-slate-900">
                ${accountsData.accountHealth.averageBalance.toFixed(0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Health Status */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Verified Accounts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.accountHealth.verifiedAccountsPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Accessible Accounts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.accountHealth.accessibleAccountsPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-red-100 p-2">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Paused Accounts</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.accountHealth.pausedAccountsPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Accounts w/ Balance</p>
              <p className="text-2xl font-semibold text-slate-900">
                {accountsData.accountHealth.accountsWithBalance.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Total: ${accountsData.accountHealth.totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Connectivity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Account Connectivity Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accountsData.connectivityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="stripeCustomers"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Stripe Customers"
                />
                <Line
                  type="monotone"
                  dataKey="stripeConnect"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Stripe Connect"
                />
                <Line
                  type="monotone"
                  dataKey="sharpSports"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="SharpSports"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Account Linking Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link2 className="h-5 w-5 text-purple-600" />
              <span>Sportsbook Linking Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={accountsData.accountLinkingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="dailyLinks"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  name="Daily Links"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Account Overlap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Account Overlap Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accountOverlapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Sportsbooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <span>Top Sportsbooks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topSportsbooks}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="totalAccounts"
                  label={({ bookAbbr, totalAccounts }) => `${bookAbbr}: ${totalAccounts}`}
                >
                  {topSportsbooks.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sportsbook Distribution Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sportsbook Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sportsbook</TableHead>
                  <TableHead className="text-right">Accounts</TableHead>
                  <TableHead className="text-right">Verified</TableHead>
                  <TableHead className="text-right">Avg Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsData.sportsbookDistribution.slice(0, 10).map((book) => (
                  <TableRow key={book.bookName}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.bookName}</div>
                        <div className="text-sm text-gray-500">{book.bookAbbr}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{book.totalAccounts}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={book.verifiedAccounts > 0 ? "default" : "secondary"}
                      >
                        {book.verifiedAccounts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${book.averageBalance.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Linking Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Linking Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sportsbook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsData.recentLinkingActivity.slice(0, 10).map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(activity.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.bookName}</div>
                        <div className="text-sm text-gray-500">{activity.bookAbbr}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={activity.verified ? "default" : "secondary"}
                      >
                        {activity.verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {activity.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${activity.balance.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}