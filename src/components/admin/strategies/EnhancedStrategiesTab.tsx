'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Trophy,
  Users,
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Star,
  Award,
  Crown,
  Zap
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

interface StrategyAnalytics {
  totalStrategies: number
  activeStrategies: number
  inactiveStrategies: number
  monetizedStrategies: number
  verifiedStrategies: number
  averageROI: number
  averageWinRate: number
  averageTotalBets: number
  totalSubscribers: number
  topCreators: Array<{
    userId: string
    username: string
    strategyCount: number
    averageROI: number
    averageWinRate: number
    totalBets: number
    subscribers: number
    isVerified: boolean
  }>
  topPerformingStrategies: Array<{
    id: string
    strategyId: string
    strategyName: string
    username: string
    isVerifiedSeller: boolean
    totalBets: number
    winningBets: number
    losingBets: number
    roiPercentage: number
    winRate: number
    overallRank: number
    primarySport: string
    strategyType: string
    betType: string
    isMonetized: boolean
    subscriptionPriceMonthly: number
    verificationStatus: string
    marketplaceRankScore: number
  }>
  sportDistribution: Array<{
    sport: string
    count: number
    averageROI: number
    averageWinRate: number
  }>
  betTypeDistribution: Array<{
    betType: string
    count: number
    averageROI: number
    averageWinRate: number
  }>
  verificationDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  strategiesOverTime: Array<{
    date: string
    dateLabel: string
    totalStrategies: number
    activeStrategies: number
    monetizedStrategies: number
  }>
  performanceOverTime: Array<{
    date: string
    dateLabel: string
    averageROI: number
    averageWinRate: number
    totalBets: number
  }>
  creatorPerformance: Array<{
    username: string
    strategyCount: number
    totalROI: number
    averageWinRate: number
    totalBets: number
  }>
  monetizationMetrics: {
    averageSubscriptionPrice: number
    conversionRate: number
    topEarningStrategies: Array<{
      strategyName: string
      username: string
      monthlyPrice: number
      subscriberCount: number
    }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export function EnhancedStrategiesTab() {
  const [strategiesData, setStrategiesData] = useState<StrategyAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedVerification, setSelectedVerification] = useState<string>('all')
  const [selectedMonetization, setSelectedMonetization] = useState<string>('all')
  const [roiRange, setRoiRange] = useState<{ min: string; max: string }>({ min: '', max: '' })

  const fetchStrategiesData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/strategies-analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch strategies analytics')
      }
      const result = await response.json()
      setStrategiesData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStrategiesData()
  }, [fetchStrategiesData])

  // Filter top performing strategies based on current filters
  const filteredStrategies = strategiesData?.topPerformingStrategies.filter(strategy => {
    if (searchTerm && !strategy.strategyName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !strategy.username.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    if (selectedSport !== 'all' && strategy.primarySport !== selectedSport) {
      return false
    }
    
    if (selectedVerification !== 'all' && strategy.verificationStatus !== selectedVerification) {
      return false
    }
    
    if (selectedMonetization !== 'all') {
      if (selectedMonetization === 'monetized' && !strategy.isMonetized) return false
      if (selectedMonetization === 'free' && strategy.isMonetized) return false
    }
    
    if (roiRange.min && strategy.roiPercentage < parseFloat(roiRange.min)) {
      return false
    }
    
    if (roiRange.max && strategy.roiPercentage > parseFloat(roiRange.max)) {
      return false
    }
    
    return true
  }) || []

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
          <Button onClick={fetchStrategiesData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  if (!strategiesData) return null

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategy Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of strategies and leaderboard performance
          </p>
        </div>
        <Button onClick={fetchStrategiesData} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Strategies</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.totalStrategies.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Strategies</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.activeStrategies.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {strategiesData.totalStrategies > 0 ? 
                  ((strategiesData.activeStrategies / strategiesData.totalStrategies) * 100).toFixed(1) : 0}% of total
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
              <p className="text-sm font-medium text-slate-600">Monetized</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.monetizedStrategies.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {strategiesData.monetizationMetrics.conversionRate.toFixed(1)}% conversion
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Verified</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.verifiedStrategies.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Average ROI</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.averageROI > 0 ? '+' : ''}{strategiesData.averageROI.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Average Win Rate</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.averageWinRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Total Bets</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.averageTotalBets.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Subscribers</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.totalSubscribers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Pricing Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Subscription Price</p>
              <p className="text-2xl font-semibold text-slate-900">
                ${strategiesData.monetizationMetrics.averageSubscriptionPrice.toFixed(2)}/mo
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-slate-900">
                {strategiesData.monetizationMetrics.conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Strategy Growth Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Strategy Growth Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={strategiesData.strategiesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalStrategies"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total Strategies"
                />
                <Area
                  type="monotone"
                  dataKey="activeStrategies"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Active Strategies"
                />
                <Area
                  type="monotone"
                  dataKey="monetizedStrategies"
                  stackId="3"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  name="Monetized Strategies"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={strategiesData.performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageROI"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Average ROI %"
                />
                <Line
                  type="monotone"
                  dataKey="averageWinRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Average Win Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sport Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Sport Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={strategiesData.sportDistribution.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ sport, count }) => `${sport}: ${count}`}
                >
                  {strategiesData.sportDistribution.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Creator Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span>Top Creators by Strategy Count</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategiesData.creatorPerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="username" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="strategyCount" fill="#f59e0b" name="Strategy Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span>Strategy Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {strategiesData.sportDistribution.map((sport) => (
                  <SelectItem key={sport.sport} value={sport.sport}>
                    {sport.sport} ({sport.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVerification} onValueChange={setSelectedVerification}>
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonetization} onValueChange={setSelectedMonetization}>
              <SelectTrigger>
                <SelectValue placeholder="Monetization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="monetized">Monetized</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Min ROI %"
              value={roiRange.min}
              onChange={(e) => setRoiRange(prev => ({ ...prev, min: e.target.value }))}
              type="number"
            />

            <Input
              placeholder="Max ROI %"
              value={roiRange.max}
              onChange={(e) => setRoiRange(prev => ({ ...prev, max: e.target.value }))}
              type="number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Strategies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-gold-600" />
            <span>Top Performing Strategies ({filteredStrategies.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead className="text-right">ROI %</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
                <TableHead className="text-right">Total Bets</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStrategies.slice(0, 20).map((strategy, index) => (
                <TableRow key={strategy.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {strategy.overallRank <= 3 && (
                        <Crown className={`h-4 w-4 ${
                          strategy.overallRank === 1 ? 'text-yellow-500' :
                          strategy.overallRank === 2 ? 'text-gray-400' :
                          'text-amber-600'
                        }`} />
                      )}
                      <span className="font-medium">#{strategy.overallRank || index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{strategy.strategyName}</div>
                      <div className="text-sm text-gray-500">{strategy.betType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{strategy.username}</span>
                      {strategy.isVerifiedSeller && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{strategy.primarySport}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${
                      strategy.roiPercentage > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {strategy.roiPercentage > 0 ? '+' : ''}{strategy.roiPercentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">
                      {(strategy.winRate * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {strategy.totalBets.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {strategy.isMonetized ? (
                      <span className="font-medium text-green-600">
                        ${strategy.subscriptionPriceMonthly}/mo
                      </span>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Badge
                        variant={strategy.verificationStatus === 'verified' ? 'default' : 'secondary'}
                      >
                        {strategy.verificationStatus}
                      </Badge>
                      {strategy.isMonetized && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Creators & Top Earning Strategies */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <span>Top Creators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Strategies</TableHead>
                  <TableHead className="text-right">Avg ROI</TableHead>
                  <TableHead className="text-right">Subscribers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategiesData.topCreators.slice(0, 10).map((creator) => (
                  <TableRow key={creator.userId}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{creator.username}</span>
                        {creator.isVerified && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{creator.strategyCount}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        creator.averageROI > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {creator.averageROI > 0 ? '+' : ''}{creator.averageROI.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{creator.subscribers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Priced Strategies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Top Priced Strategies</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Monthly Price</TableHead>
                  <TableHead className="text-right">Subscribers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategiesData.monetizationMetrics.topEarningStrategies.slice(0, 10).map((strategy, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{strategy.strategyName}</div>
                    </TableCell>
                    <TableCell>{strategy.username}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-yellow-600">
                        ${strategy.monthlyPrice}/mo
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {strategy.subscriberCount.toLocaleString()}
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