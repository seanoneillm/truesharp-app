'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MetricCard } from './MetricCard'
import { GrowthChart } from './GrowthChart'
import { BusinessHealthPanel } from './BusinessHealthPanel'
import { 
  Users, 
  UserCheck, 
  // Shield, 
  Star,
  CreditCard,
  Bell,
  // Globe,
  Zap,
  RefreshCw,
  Activity,
  UserPlus,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface BusinessMetrics {
  totalUsers: number
  totalSellers: number
  verifiedSellers: number
  proUsers: number
  usersWithStripeAccounts: number
  usersWithConnectAccounts: number
  usersWithPushTokens: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  newSellersThisMonth: number
  publicProfileUsers: number
  notificationsEnabledUsers: number
  sharpsportsConnectedUsers: number
  sellerConversionRate: number
  verificationRate: number
  proConversionRate: number
  stripeIntegrationRate: number
  userGrowthData: Array<{date: string, count: number, cumulative: number}>
  sellerGrowthData: Array<{date: string, count: number, cumulative: number}>
  proUserGrowthData: Array<{date: string, count: number, cumulative: number}>
  verificationGrowthData: Array<{date: string, count: number, cumulative: number}>
}

interface RecentSignup {
  id: string
  username: string | null
  email: string | null
  created_at: string | null
  pro: string | null
  stripe_customer_id: string | null
  stripe_connect_account_id: string | null
  sharpsports_bettor_id: string | null
  is_seller: boolean | null
  is_verified_seller: boolean | null
  subscriptionStatus: string
  hasStripeCustomer: boolean
  hasStripeConnect: boolean
  hasSharpSports: boolean
  accountType: string
}

interface EnhancedOverviewTabProps {
  className?: string
}

export function EnhancedOverviewTab({ className }: EnhancedOverviewTabProps) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSignups, setIsLoadingSignups] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signupsError, setSignupsError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/overview-enhanced?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setMetrics(result.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to load metrics')
      }
    } catch (err) {
      console.error('Error fetching overview metrics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  const fetchRecentSignups = useCallback(async () => {
    try {
      setIsLoadingSignups(true)
      setSignupsError(null)
      
      const response = await fetch('/api/admin/recent-signups?limit=50')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent signups: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setRecentSignups(result.data)
      } else {
        throw new Error(result.error || 'Failed to load recent signups')
      }
    } catch (err) {
      console.error('Error fetching recent signups:', err)
      setSignupsError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoadingSignups(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    fetchRecentSignups()
  }, [fetchMetrics, fetchRecentSignups])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics()
      fetchRecentSignups()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchMetrics, fetchRecentSignups])

  const calculateGrowthTrend = (data: Array<{count: number}>, days: number = 7) => {
    if (data.length < days) return 0
    
    const recent = data.slice(-days).reduce((sum, d) => sum + d.count, 0)
    const previous = data.slice(-days * 2, -days).reduce((sum, d) => sum + d.count, 0)
    
    if (previous === 0) return recent > 0 ? 100 : 0
    return ((recent - previous) / previous) * 100
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-medium">Error loading overview data</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchMetrics} 
              variant="outline" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Overview</h1>
          <p className="text-gray-600">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => {
              fetchMetrics()
              fetchRecentSignups()
            }}
            variant="outline"
            size="sm"
            disabled={isLoading || isLoadingSignups}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isLoadingSignups ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && !metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers}
              subtitle={`+${metrics.newUsersToday} today`}
              trend={{
                value: calculateGrowthTrend(metrics.userGrowthData),
                label: "vs last period",
                direction: calculateGrowthTrend(metrics.userGrowthData) > 0 ? 'up' : 'down'
              }}
              icon={Users}
              iconColor="text-blue-600"
              status="success"
            />

            <MetricCard
              title="Active Sellers"
              value={metrics.totalSellers}
              subtitle={`${metrics.sellerConversionRate.toFixed(1)}% conversion rate`}
              trend={{
                value: calculateGrowthTrend(metrics.sellerGrowthData),
                label: "vs last period",
                direction: calculateGrowthTrend(metrics.sellerGrowthData) > 0 ? 'up' : 'down'
              }}
              icon={UserCheck}
              iconColor="text-green-600"
              status={metrics.sellerConversionRate > 10 ? "success" : "warning"}
            />


            <MetricCard
              title="Pro Users"
              value={metrics.proUsers}
              subtitle={`${metrics.proConversionRate.toFixed(1)}% upgrade rate`}
              trend={{
                value: calculateGrowthTrend(metrics.proUserGrowthData),
                label: "vs last period",
                direction: calculateGrowthTrend(metrics.proUserGrowthData) > 0 ? 'up' : 'down'
              }}
              icon={Star}
              iconColor="text-yellow-600"
              status={metrics.proConversionRate > 15 ? "success" : "warning"}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Payment Setup"
              value={metrics.usersWithStripeAccounts}
              subtitle={`${metrics.stripeIntegrationRate.toFixed(1)}% of users`}
              icon={CreditCard}
              iconColor="text-emerald-600"
            />

            <MetricCard
              title="Push Notifications"
              value={metrics.usersWithPushTokens}
              subtitle={`${metrics.notificationsEnabledUsers} enabled`}
              icon={Bell}
              iconColor="text-orange-600"
            />


            <MetricCard
              title="Sharp Sports Connected"
              value={metrics.sharpsportsConnectedUsers}
              subtitle="External integrations"
              icon={Zap}
              iconColor="text-indigo-600"
            />
          </div>

          {/* Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GrowthChart
              title="User Growth"
              data={metrics.userGrowthData}
              dataKey="cumulative"
              color="#3b82f6"
              icon={Users}
              height={250}
            />

            <GrowthChart
              title="Seller Growth"
              data={metrics.sellerGrowthData}
              dataKey="cumulative"
              color="#10b981"
              icon={UserCheck}
              height={250}
            />

            <GrowthChart
              title="Pro User Growth"
              data={metrics.proUserGrowthData}
              dataKey="cumulative"
              color="#f59e0b"
              icon={Star}
              height={250}
            />

          </div>

          {/* Business Health Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BusinessHealthPanel 
                metrics={{
                  sellerConversionRate: metrics.sellerConversionRate,
                  proConversionRate: metrics.proConversionRate,
                  stripeIntegrationRate: metrics.stripeIntegrationRate
                }}
              />
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New users today</span>
                  <Badge variant="outline">{metrics.newUsersToday}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New users this week</span>
                  <Badge variant="outline">{metrics.newUsersThisWeek}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New users this month</span>
                  <Badge variant="outline">{metrics.newUsersThisMonth}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New sellers this month</span>
                  <Badge variant="outline">{metrics.newSellersThisMonth}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connect accounts</span>
                  <Badge variant="outline">{metrics.usersWithConnectAccounts}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signups Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Recent Signups (Last 50)
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    SC = Stripe Customer, Conn = Stripe Connect, SS = SharpSports
                  </p>
                </div>
                <Button
                  onClick={fetchRecentSignups}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingSignups}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSignups ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {signupsError ? (
                <div className="text-center py-6">
                  <p className="text-red-600 font-medium">Error loading recent signups</p>
                  <p className="text-red-500 text-sm mt-1">{signupsError}</p>
                  <Button 
                    onClick={fetchRecentSignups} 
                    variant="outline" 
                    className="mt-3"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : isLoadingSignups && recentSignups.length === 0 ? (
                <div className="text-center py-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-gray-600 mt-2">Loading recent signups...</p>
                </div>
              ) : recentSignups.length === 0 ? (
                <div className="text-center py-6">
                  <UserPlus className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500 mt-2">No recent signups found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Username</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Email</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Signed Up</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Sub</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">SC</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Conn</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">SS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSignups.map((signup) => (
                        <tr key={signup.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div className="font-medium text-gray-900 truncate max-w-[100px]">
                              {signup.username || 'N/A'}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-gray-600 truncate max-w-[150px]">
                              {signup.email || 'N/A'}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-gray-600">
                              {signup.created_at ? new Date(signup.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {signup.created_at ? new Date(signup.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Badge 
                              variant="outline"
                              className={`text-xs px-1.5 py-0.5 ${
                                signup.accountType === 'Verified Seller' ? 'border-green-200 bg-green-50 text-green-700' :
                                signup.accountType === 'Seller' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              {signup.accountType === 'Verified Seller' ? 'V-Seller' :
                               signup.accountType === 'Seller' ? 'Seller' : 'User'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Badge 
                              variant="outline"
                              className={`text-xs px-1.5 py-0.5 ${
                                signup.subscriptionStatus === 'Subscribed' ? 
                                'border-purple-200 bg-purple-50 text-purple-700' :
                                'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              {signup.subscriptionStatus === 'Subscribed' ? 'Pro' : 'Free'}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {signup.hasStripeCustomer ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {signup.hasStripeConnect ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {signup.hasSharpSports ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-gray-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}