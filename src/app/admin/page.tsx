'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  HelpCircle,
  Link,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [isFetching, setIsFetching] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [settleResult, setSettleResult] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Ref to track current fetch request
  const currentFetchRequest = useRef<AbortController | null>(null)
  const lastFetchTime = useRef<number>(0)

  // SharpSports states
  const [isFetchingBettors, setIsFetchingBettors] = useState(false)
  const [isFetchingBettorProfiles, setIsFetchingBettorProfiles] = useState(false)
  const [isRefreshingUserBets, setIsRefreshingUserBets] = useState(false)
  const [bettorsResult, setBettorsResult] = useState<string | null>(null)
  const [bettorProfilesResult, setBettorProfilesResult] = useState<string | null>(null)
  const [userBetsResult, setUserBetsResult] = useState<string | null>(null)
  const [targetUserId, setTargetUserId] = useState('')

  // Feedback states
  const [feedbackList, setFeedbackList] = useState<
    { id: string; feedback_text: string; created_at: string | null }[]
  >([])
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState('overview')

  // Strategy states
  const [strategyData, setStrategyData] = useState<any[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false)
  const [strategyFilters, setStrategyFilters] = useState({
    sport: 'all',
    verification: 'all',
    monetization: 'all',
    search: '',
  })
  const [strategySortConfig, setStrategySortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [strategyOverview, setStrategyOverview] = useState({
    totalStrategies: 0,
    verifiedStrategies: 0,
    monetizedStrategies: 0,
    eligibleStrategies: 0,
    avgRoi: 0,
    avgWinRate: 0,
  })

  // Analytics data states
  const [analyticsData, setAnalyticsData] = useState<{
    totalUsers: number
    totalSellers: number
    verifiedSellers: number
    totalSubscribers: number
    totalProSubscribers: number
    usersWithLinkedAccounts: number
    avgLinkedAccountsPerUser: number
    percentUsersWithLinkedAccounts: number
    usersWithStripeCustomers: number
    usersWithStripeConnectAccounts: number
    sellersWithStripeButNotVerified: number
    usersWithStripeMissingSubscription: number
    sellersMissingStripeConnect: number
    newUsersData: Array<{ date: string; count: number; dateLabel: string }>
    newSellersData: Array<{ date: string; count: number; dateLabel: string }>
    newSubscribersData: Array<{ date: string; count: number; dateLabel: string }>
    newProSubscribersData: Array<{ date: string; count: number; dateLabel: string }>
    linkedAccountsGrowthData: Array<{
      date: string
      count: number
      dateLabel: string
      cumulative: number
    }>
    subscribersOverTimeData: Array<{
      date: string
      count: number
      dateLabel: string
      cumulative: number
    }>
    sellersWithConnectData: Array<{
      date: string
      count: number
      dateLabel: string
      cumulative: number
    }>
  }>({
    totalUsers: 0,
    totalSellers: 0,
    verifiedSellers: 0,
    totalSubscribers: 0,
    totalProSubscribers: 0,
    usersWithLinkedAccounts: 0,
    avgLinkedAccountsPerUser: 0,
    percentUsersWithLinkedAccounts: 0,
    usersWithStripeCustomers: 0,
    usersWithStripeConnectAccounts: 0,
    sellersWithStripeButNotVerified: 0,
    usersWithStripeMissingSubscription: 0,
    sellersMissingStripeConnect: 0,
    newUsersData: [],
    newSellersData: [],
    newSubscribersData: [],
    newProSubscribersData: [],
    linkedAccountsGrowthData: [],
    subscribersOverTimeData: [],
    sellersWithConnectData: [],
  })
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [timeframe, setTimeframe] = useState('30d')

  // Bets analytics data states
  const [betsAnalyticsData, setBetsAnalyticsData] = useState<{
    totalBets: number
    totalStakes: number
    totalPotentialPayout: number
    totalProfit: number
    averageStakeSize: number
    betsBySource: { manual: number; sharpsports: number }
    betsByStatus: { pending: number; won: number; lost: number; void: number; cancelled: number }
    betsByType: { [key: string]: number }
    betsPerDayData: Array<{
      date: string
      dateLabel: string
      manual: number
      sharpsports: number
      total: number
    }>
    handleOverTimeData: Array<{
      date: string
      dateLabel: string
      cumulative: number
      daily: number
    }>
    profitOverTimeData: Array<{
      date: string
      dateLabel: string
      cumulative: number
      daily: number
    }>
    statusBreakdownData: Array<{
      date: string
      dateLabel: string
      pending: number
      won: number
      lost: number
      void: number
      cancelled: number
    }>
    sourceBreakdownData: Array<{
      date: string
      dateLabel: string
      manual: number
      sharpsports: number
    }>
    betTypeDistribution: Array<{ name: string; value: number; color: string }>
    sportsbookDistribution: Array<{ name: string; value: number; color: string }>
    avgSettlementTime: number
    parlay: { percentage: number; avgLegs: number }
    copyBets: { percentage: number; mostCopiedCount: number }
    strategyBets: { total: number; winRate: number }
    pendingBetsAging: number
    settlementSuccessRate: number
    largeStakeBets: number
  }>({
    totalBets: 0,
    totalStakes: 0,
    totalPotentialPayout: 0,
    totalProfit: 0,
    averageStakeSize: 0,
    betsBySource: { manual: 0, sharpsports: 0 },
    betsByStatus: { pending: 0, won: 0, lost: 0, void: 0, cancelled: 0 },
    betsByType: {},
    betsPerDayData: [],
    handleOverTimeData: [],
    profitOverTimeData: [],
    statusBreakdownData: [],
    sourceBreakdownData: [],
    betTypeDistribution: [],
    sportsbookDistribution: [],
    avgSettlementTime: 0,
    parlay: { percentage: 0, avgLegs: 0 },
    copyBets: { percentage: 0, mostCopiedCount: 0 },
    strategyBets: { total: 0, winRate: 0 },
    pendingBetsAging: 0,
    settlementSuccessRate: 0,
    largeStakeBets: 0,
  })
  const [isLoadingBetsAnalytics, setIsLoadingBetsAnalytics] = useState(false)

  // Check if user is admin
  const isAdmin = user?.id && ADMIN_USER_IDS.includes(user.id)

  // Analytics data fetching function
  const fetchAnalyticsData = useCallback(async () => {
    if (!isAdmin) return

    setIsLoadingAnalytics(true)
    try {
      const supabase = createClient()

      // Calculate date range based on timeframe
      const now = new Date()
      let startDate = new Date()
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      // Fetch all profiles data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching profiles data:', error)
        return
      }

      if (!profiles) return

      // Calculate basic metrics
      const totalUsers = profiles.length
      const totalSellers = profiles.filter(p => p.is_seller === true).length
      const verifiedSellers = profiles.filter(p => p.is_verified_seller === true).length
      const totalSubscribers = profiles.filter(p => p.pro === 'yes' || p.pro === 'pro').length
      const totalProSubscribers = profiles.filter(p => p.pro === 'pro').length
      const usersWithLinkedAccounts = profiles.filter(p => p.sharpsports_bettor_id !== null).length
      const usersWithStripeCustomers = profiles.filter(p => p.stripe_customer_id !== null).length
      const usersWithStripeConnectAccounts = profiles.filter(
        p => p.stripe_connect_account_id !== null
      ).length

      // Advanced metrics
      const avgLinkedAccountsPerUser = usersWithLinkedAccounts / totalUsers
      const percentUsersWithLinkedAccounts = (usersWithLinkedAccounts / totalUsers) * 100
      const sellersWithStripeButNotVerified = profiles.filter(
        p =>
          p.is_seller === true &&
          p.stripe_connect_account_id !== null &&
          p.is_verified_seller !== true
      ).length
      const usersWithStripeMissingSubscription = profiles.filter(
        p => p.stripe_customer_id !== null && (p.pro === 'no' || p.pro === null)
      ).length
      const sellersMissingStripeConnect = profiles.filter(
        p => p.is_verified_seller === true && p.stripe_connect_account_id === null
      ).length

      // Generate time series data
      const generateTimeSeriesData = (filterFn: (profile: any) => boolean) => {
        const dataMap = new Map<string, number>()
        const filteredProfiles = profiles.filter(filterFn)

        // Initialize all dates in range with 0
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]!
          dataMap.set(dateKey, 0)
        }

        // Count profiles by date
        filteredProfiles.forEach(profile => {
          if (profile.created_at) {
            const profileDate = new Date(profile.created_at)
            if (profileDate >= startDate) {
              const dateKey = profileDate.toISOString().split('T')[0]!
              dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1)
            }
          }
        })

        return Array.from(dataMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({
            date,
            count,
            dateLabel: new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          }))
      }

      // Generate cumulative time series data
      const generateCumulativeData = (filterFn: (profile: any) => boolean) => {
        const dailyData = generateTimeSeriesData(filterFn)
        let cumulative = 0
        return dailyData.map(item => {
          cumulative += item.count
          return { ...item, cumulative }
        })
      }

      const newUsersData = generateTimeSeriesData(() => true)
      const newSellersData = generateTimeSeriesData(p => p.is_seller === true)
      const newSubscribersData = generateTimeSeriesData(p => p.pro === 'yes' || p.pro === 'pro')
      const newProSubscribersData = generateTimeSeriesData(p => p.pro === 'pro')
      const linkedAccountsGrowthData = generateCumulativeData(p => p.sharpsports_bettor_id !== null)
      const subscribersOverTimeData = generateCumulativeData(
        p => p.pro === 'yes' || p.pro === 'pro'
      )
      const sellersWithConnectData = generateCumulativeData(
        p => p.stripe_connect_account_id !== null
      )

      setAnalyticsData({
        totalUsers,
        totalSellers,
        verifiedSellers,
        totalSubscribers,
        totalProSubscribers,
        usersWithLinkedAccounts,
        avgLinkedAccountsPerUser,
        percentUsersWithLinkedAccounts,
        usersWithStripeCustomers,
        usersWithStripeConnectAccounts,
        sellersWithStripeButNotVerified,
        usersWithStripeMissingSubscription,
        sellersMissingStripeConnect,
        newUsersData,
        newSellersData,
        newSubscribersData,
        newProSubscribersData,
        linkedAccountsGrowthData,
        subscribersOverTimeData,
        sellersWithConnectData,
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [isAdmin, timeframe])

  // Bets analytics data fetching function
  const fetchBetsAnalyticsData = useCallback(async () => {
    if (!isAdmin) return

    setIsLoadingBetsAnalytics(true)
    try {
      const supabase = createClient()

      // Calculate date range based on timeframe
      const now = new Date()
      let startDate = new Date()
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate.setDate(now.getDate() - 30)
      }

      // Fetch ALL bets data (no date filtering for basic metrics)
      const { data: allBets, error } = await supabase
        .from('bets')
        .select('*')
        .order('placed_at', { ascending: true })

      // Also get filtered bets for charts only
      const filteredBets =
        allBets?.filter(bet => {
          if (!bet.placed_at) return false
          return new Date(bet.placed_at) >= startDate
        }) || []

      if (error) {
        console.error('Error fetching bets data:', error)
        return
      }

      if (!allBets) return

      // Calculate basic metrics - properly count bets by grouping parlay legs (use ALL bets)
      const uniqueBets = new Set()
      const parlayGroups = new Map()

      allBets.forEach(bet => {
        if (bet.parlay_id) {
          // For parlay bets, group by parlay_id
          if (!parlayGroups.has(bet.parlay_id)) {
            parlayGroups.set(bet.parlay_id, [])
          }
          parlayGroups.get(bet.parlay_id)!.push(bet)
        } else {
          // For single bets, each row is a unique bet
          uniqueBets.add(bet.id)
        }
      })

      // Total bets = single bets + number of unique parlays
      const totalBets = uniqueBets.size + parlayGroups.size

      // For stakes, potential payout, and profit - use the parlay totals for parlays, individual values for singles
      let totalStakes = 0
      let totalPotentialPayout = 0
      let totalProfit = 0

      // Add single bets
      allBets
        .filter(bet => !bet.parlay_id)
        .forEach(bet => {
          totalStakes += Number(bet.stake || 0)
          totalPotentialPayout += Number(bet.potential_payout || 0)
          totalProfit += Number(bet.profit || 0)
        })

      // Add parlay bets (take values from first leg since parlay totals should be on the first leg)
      parlayGroups.forEach(parlayLegs => {
        const firstLeg = parlayLegs[0]
        if (firstLeg) {
          totalStakes += Number(firstLeg.stake || 0)
          totalPotentialPayout += Number(firstLeg.potential_payout || 0)
          totalProfit += Number(firstLeg.profit || 0)
        }
      })

      const averageStakeSize = totalBets > 0 ? totalStakes / totalBets : 0

      // Bets by source - count properly grouped bets
      const betsBySource = {
        manual: 0,
        sharpsports: 0,
      }

      // Count single bets by source
      allBets
        .filter(bet => !bet.parlay_id)
        .forEach(bet => {
          if (bet.bet_source === 'manual') betsBySource.manual++
          else betsBySource.sharpsports++
        })

      // Count parlay bets by source (use first leg to determine source)
      parlayGroups.forEach(parlayLegs => {
        const firstLeg = parlayLegs[0]
        if (firstLeg) {
          if (firstLeg.bet_source === 'manual') betsBySource.manual++
          else betsBySource.sharpsports++
        }
      })

      // Bets by status - count properly grouped bets
      const betsByStatus = {
        pending: 0,
        won: 0,
        lost: 0,
        void: 0,
        cancelled: 0,
      }

      // Count single bets by status
      allBets
        .filter(bet => !bet.parlay_id)
        .forEach(bet => {
          const status = bet.status as keyof typeof betsByStatus
          if (status && betsByStatus.hasOwnProperty(status)) {
            betsByStatus[status]++
          }
        })

      // Count parlay bets by status (use first leg to determine status)
      parlayGroups.forEach(parlayLegs => {
        const firstLeg = parlayLegs[0]
        if (firstLeg) {
          const status = firstLeg.status as keyof typeof betsByStatus
          if (status && betsByStatus.hasOwnProperty(status)) {
            betsByStatus[status]++
          }
        }
      })

      // Bets by type - count properly grouped bets
      const betsByType: { [key: string]: number } = {}

      // Count single bets by type
      allBets
        .filter(bet => !bet.parlay_id)
        .forEach(bet => {
          const type = bet.bet_type || 'unknown'
          betsByType[type] = (betsByType[type] || 0) + 1
        })

      // Count parlay bets as 'parlay' type
      if (parlayGroups.size > 0) {
        betsByType['parlay'] = (betsByType['parlay'] || 0) + parlayGroups.size
      }

      // Generate time series data - properly count grouped bets (use filtered data for charts)
      const generateDailyBetsData = () => {
        const dataMap = new Map<string, { manual: number; sharpsports: number }>()

        // Initialize all dates in range with 0
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]!
          dataMap.set(dateKey, { manual: 0, sharpsports: 0 })
        }

        // Create filtered parlay groups for charts
        const filteredParlayGroups = new Map()
        filteredBets.forEach(bet => {
          if (bet.parlay_id) {
            if (!filteredParlayGroups.has(bet.parlay_id)) {
              filteredParlayGroups.set(bet.parlay_id, [])
            }
            filteredParlayGroups.get(bet.parlay_id)!.push(bet)
          }
        })

        // Count single bets by date and source (use filtered bets for charts)
        filteredBets
          .filter(bet => !bet.parlay_id)
          .forEach(bet => {
            if (bet.placed_at) {
              const betDate = new Date(bet.placed_at)
              const dateKey = betDate.toISOString().split('T')[0]!
              const existing = dataMap.get(dateKey) || { manual: 0, sharpsports: 0 }
              if (bet.bet_source === 'manual') {
                existing.manual += 1
              } else {
                existing.sharpsports += 1
              }
              dataMap.set(dateKey, existing)
            }
          })

        // Count parlay bets by date and source (use first leg for date/source)
        filteredParlayGroups.forEach(parlayLegs => {
          const firstLeg = parlayLegs[0]
          if (firstLeg && firstLeg.placed_at) {
            const betDate = new Date(firstLeg.placed_at)
            const dateKey = betDate.toISOString().split('T')[0]!
            const existing = dataMap.get(dateKey) || { manual: 0, sharpsports: 0 }
            if (firstLeg.bet_source === 'manual') {
              existing.manual += 1
            } else {
              existing.sharpsports += 1
            }
            dataMap.set(dateKey, existing)
          }
        })

        return Array.from(dataMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, counts]) => ({
            date,
            dateLabel: new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            manual: counts.manual,
            sharpsports: counts.sharpsports,
            total: counts.manual + counts.sharpsports,
          }))
      }

      // Generate cumulative handle data - properly account for parlay grouping
      const generateHandleOverTimeData = () => {
        const dailyStakes = new Map<string, number>()

        // Initialize all dates
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]!
          dailyStakes.set(dateKey, 0)
        }

        // Create filtered parlay groups for charts
        const filteredParlayGroups = new Map()
        filteredBets.forEach(bet => {
          if (bet.parlay_id) {
            if (!filteredParlayGroups.has(bet.parlay_id)) {
              filteredParlayGroups.set(bet.parlay_id, [])
            }
            filteredParlayGroups.get(bet.parlay_id)!.push(bet)
          }
        })

        // Sum stakes for single bets by date (use filtered bets)
        filteredBets
          .filter(bet => !bet.parlay_id)
          .forEach(bet => {
            if (bet.placed_at) {
              const betDate = new Date(bet.placed_at)
              const dateKey = betDate.toISOString().split('T')[0]!
              const existing = dailyStakes.get(dateKey) || 0
              dailyStakes.set(dateKey, existing + Number(bet.stake || 0))
            }
          })

        // Sum stakes for parlay bets by date (use first leg stake since it contains the total)
        filteredParlayGroups.forEach(parlayLegs => {
          const firstLeg = parlayLegs[0]
          if (firstLeg && firstLeg.placed_at) {
            const betDate = new Date(firstLeg.placed_at)
            const dateKey = betDate.toISOString().split('T')[0]!
            const existing = dailyStakes.get(dateKey) || 0
            dailyStakes.set(dateKey, existing + Number(firstLeg.stake || 0))
          }
        })

        let cumulative = 0
        return Array.from(dailyStakes.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, daily]) => {
            cumulative += daily
            return {
              date,
              dateLabel: new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              cumulative,
              daily,
            }
          })
      }

      // Generate cumulative profit data
      const generateProfitOverTimeData = () => {
        const dailyProfit = new Map<string, number>()

        // Initialize all dates
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]!
          dailyProfit.set(dateKey, 0)
        }

        // Group bets properly (same logic as basic metrics)
        const processedBets = new Map() // To track which parlays we've processed

        filteredBets.forEach(bet => {
          const dateToUse = bet.settled_at || bet.placed_at
          if (!dateToUse) return

          const betDate = new Date(dateToUse)
          const dateKey = betDate.toISOString().split('T')[0]!
          const existing = dailyProfit.get(dateKey) || 0

          if (bet.parlay_id) {
            // For parlay bets, only count profit once per parlay_id
            const parlayKey = `${dateKey}-${bet.parlay_id}`
            if (!processedBets.has(parlayKey) && bet.profit !== null) {
              processedBets.set(parlayKey, true)
              dailyProfit.set(dateKey, existing + Number(bet.profit || 0))
            }
          } else {
            // For single bets, count normally
            if (bet.profit !== null) {
              dailyProfit.set(dateKey, existing + Number(bet.profit || 0))
            }
          }
        })

        let cumulative = 0
        return Array.from(dailyProfit.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, daily]) => {
            cumulative += daily
            return {
              date,
              dateLabel: new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              cumulative,
              daily,
            }
          })
      }

      // Generate status breakdown over time
      const generateStatusBreakdownData = () => {
        const dailyStatus = new Map<
          string,
          { pending: number; won: number; lost: number; void: number; cancelled: number }
        >()

        // Initialize all dates
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]!
          dailyStatus.set(dateKey, { pending: 0, won: 0, lost: 0, void: 0, cancelled: 0 })
        }

        // Group bets properly (same logic as basic metrics)
        const processedBets = new Map() // To track which parlays we've processed

        filteredBets.forEach(bet => {
          if (bet.placed_at) {
            const betDate = new Date(bet.placed_at)
            const dateKey = betDate.toISOString().split('T')[0]!
            const existing = dailyStatus.get(dateKey) || {
              pending: 0,
              won: 0,
              lost: 0,
              void: 0,
              cancelled: 0,
            }
            const status = bet.status as 'pending' | 'won' | 'lost' | 'void' | 'cancelled'

            if (status && existing.hasOwnProperty(status)) {
              if (bet.parlay_id) {
                // For parlay bets, only count once per parlay_id
                const parlayKey = `${dateKey}-${bet.parlay_id}`
                if (!processedBets.has(parlayKey)) {
                  processedBets.set(parlayKey, true)
                  existing[status] += 1
                }
              } else {
                // For single bets, count normally
                existing[status] += 1
              }
            }
            dailyStatus.set(dateKey, existing)
          }
        })

        return Array.from(dailyStatus.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, counts]) => ({
            date,
            dateLabel: new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            ...counts,
          }))
      }

      // Bet type distribution
      const colors = [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#06b6d4',
        '#84cc16',
        '#f97316',
      ]
      const betTypeDistribution = Object.entries(betsByType).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length] || '#6b7280',
      }))

      // Sportsbook distribution (use all bets for overall stats)
      const sportsbookCounts: { [key: string]: number } = {}
      allBets.forEach(bet => {
        if (bet.sportsbook) {
          sportsbookCounts[bet.sportsbook] = (sportsbookCounts[bet.sportsbook] || 0) + 1
        }
      })
      const sportsbookDistribution = Object.entries(sportsbookCounts).map(
        ([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length] || '#6b7280',
        })
      )

      // Advanced analytics
      const settledBets = allBets.filter(bet => bet.settled_at && bet.placed_at)
      const avgSettlementTime =
        settledBets.length > 0
          ? settledBets.reduce((sum, bet) => {
              const settlementTime =
                new Date(bet.settled_at!).getTime() - new Date(bet.placed_at).getTime()
              return sum + settlementTime
            }, 0) /
            settledBets.length /
            (1000 * 60 * 60) // Convert to hours
          : 0

      // Parlay stats
      const parlayBets = allBets.filter(bet => bet.is_parlay === true)
      const parlayPercentage = totalBets > 0 ? (parlayBets.length / totalBets) * 100 : 0

      // Calculate average legs per parlay (simplified - would need parlay_legs table for accurate count)
      const avgLegs = 2.5 // Placeholder - would need to query parlay_legs or similar

      // Copy bet stats
      const copyBets = allBets.filter(bet => bet.is_copy_bet === true)
      const copyBetsPercentage = totalBets > 0 ? (copyBets.length / totalBets) * 100 : 0

      // Most copied count (simplified)
      const mostCopiedCount = 0 // Would need to group by copied_from_bet_id

      // Strategy bets
      const strategyBets = allBets.filter(bet => bet.strategy_id !== null)
      const strategyBetsWon = strategyBets.filter(bet => bet.status === 'won').length
      const strategyWinRate =
        strategyBets.length > 0 ? (strategyBetsWon / strategyBets.length) * 100 : 0

      // System health metrics
      const now24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const pendingBetsAging = allBets.filter(
        bet => bet.status === 'pending' && new Date(bet.placed_at) < now24hAgo
      ).length

      const settlementSuccessRate =
        allBets.length > 0 ? ((allBets.length - betsByStatus.pending) / allBets.length) * 100 : 0

      const largeStakeBets = allBets.filter(bet => Number(bet.stake || 0) > 1000).length

      setBetsAnalyticsData({
        totalBets,
        totalStakes,
        totalPotentialPayout,
        totalProfit,
        averageStakeSize,
        betsBySource,
        betsByStatus,
        betsByType,
        betsPerDayData: generateDailyBetsData(),
        handleOverTimeData: generateHandleOverTimeData(),
        profitOverTimeData: generateProfitOverTimeData(),
        statusBreakdownData: generateStatusBreakdownData(),
        sourceBreakdownData: generateDailyBetsData().map(item => ({
          date: item.date,
          dateLabel: item.dateLabel,
          manual: item.manual,
          sharpsports: item.sharpsports,
        })),
        betTypeDistribution,
        sportsbookDistribution,
        avgSettlementTime,
        parlay: { percentage: parlayPercentage, avgLegs },
        copyBets: { percentage: copyBetsPercentage, mostCopiedCount },
        strategyBets: { total: strategyBets.length, winRate: strategyWinRate },
        pendingBetsAging,
        settlementSuccessRate,
        largeStakeBets,
      })
    } catch (error) {
      console.error('Error fetching bets analytics data:', error)
    } finally {
      setIsLoadingBetsAnalytics(false)
    }
  }, [isAdmin, timeframe])

  // Initialize date safely after hydration
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
  }, [])

  // Fetch feedback function
  const fetchFeedback = useCallback(async () => {
    if (!isAdmin) return

    setIsFetchingFeedback(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching feedback:', error)
      } else {
        setFeedbackList(data || [])
      }
    } catch (error) {
      console.error('Unexpected error fetching feedback:', error)
    } finally {
      setIsFetchingFeedback(false)
    }
  }, [isAdmin])

  // Fetch strategy data
  const fetchStrategyData = useCallback(async () => {
    if (!isAdmin) return

    setIsLoadingStrategies(true)
    try {
      const supabase = createClient()

      console.log('🎯 Fetching strategy data from strategy_leaderboard table...')

      const { data, error } = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .order('overall_rank', { ascending: true })

      console.log('📊 Strategy data response:', {
        data: data?.length || 0,
        error,
        sampleData: data?.slice(0, 2),
      })

      if (error) {
        console.error('❌ Error fetching strategy data:', error)
        // Set empty state but don't fail completely
        setStrategyData([])
        setStrategyOverview({
          totalStrategies: 0,
          verifiedStrategies: 0,
          monetizedStrategies: 0,
          eligibleStrategies: 0,
          avgRoi: 0,
          avgWinRate: 0,
        })
      } else {
        const strategies = data || []
        setStrategyData(strategies)

        console.log('📈 Processing strategy metrics for', strategies.length, 'strategies')

        // Calculate overview metrics
        const totalStrategies = strategies.length
        const verifiedStrategies = strategies.filter(s => s.is_verified_seller).length
        const monetizedStrategies = strategies.filter(s => s.is_monetized).length
        const eligibleStrategies = strategies.filter(s => s.is_eligible).length
        const avgRoi =
          totalStrategies > 0
            ? strategies.reduce((sum, s) => sum + (parseFloat(s.roi_percentage) || 0), 0) /
              totalStrategies
            : 0
        const avgWinRate =
          totalStrategies > 0
            ? strategies.reduce((sum, s) => sum + (parseFloat(s.win_rate) || 0), 0) /
              totalStrategies
            : 0

        const overview = {
          totalStrategies,
          verifiedStrategies,
          monetizedStrategies,
          eligibleStrategies,
          avgRoi,
          avgWinRate,
        }

        console.log('📊 Strategy overview calculated:', overview)
        setStrategyOverview(overview)
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching strategy data:', error)
      // Set empty state on error
      setStrategyData([])
      setStrategyOverview({
        totalStrategies: 0,
        verifiedStrategies: 0,
        monetizedStrategies: 0,
        eligibleStrategies: 0,
        avgRoi: 0,
        avgWinRate: 0,
      })
    } finally {
      setIsLoadingStrategies(false)
    }
  }, [isAdmin])

  // Strategy helper functions
  const handleStrategySort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'
    if (
      strategySortConfig &&
      strategySortConfig.key === key &&
      strategySortConfig.direction === 'desc'
    ) {
      direction = 'asc'
    }
    setStrategySortConfig({ key, direction })
  }

  const getFilteredAndSortedStrategies = () => {
    let filtered = [...strategyData]

    // Apply search filter
    if (strategyFilters.search) {
      filtered = filtered.filter(
        strategy =>
          strategy.strategy_name.toLowerCase().includes(strategyFilters.search.toLowerCase()) ||
          strategy.username.toLowerCase().includes(strategyFilters.search.toLowerCase())
      )
    }

    // Apply sport filter
    if (strategyFilters.sport !== 'all') {
      filtered = filtered.filter(strategy => strategy.primary_sport === strategyFilters.sport)
    }

    // Apply verification filter
    if (strategyFilters.verification !== 'all') {
      if (strategyFilters.verification === 'verified') {
        filtered = filtered.filter(strategy => strategy.is_verified_seller)
      } else if (strategyFilters.verification === 'unverified') {
        filtered = filtered.filter(strategy => !strategy.is_verified_seller)
      } else if (strategyFilters.verification === 'premium') {
        filtered = filtered.filter(strategy => strategy.verification_status === 'premium')
      }
    }

    // Apply monetization filter
    if (strategyFilters.monetization !== 'all') {
      if (strategyFilters.monetization === 'monetized') {
        filtered = filtered.filter(strategy => strategy.is_monetized)
      } else if (strategyFilters.monetization === 'free') {
        filtered = filtered.filter(strategy => !strategy.is_monetized)
      }
    }

    // Apply sorting
    if (strategySortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[strategySortConfig.key]
        let bValue = b[strategySortConfig.key]

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return strategySortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return strategySortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }

  const getPaginatedStrategies = () => {
    const filtered = getFilteredAndSortedStrategies()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return {
      strategies: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
    }
  }

  // Fetch feedback and analytics on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchFeedback()
      fetchAnalyticsData()
      fetchBetsAnalyticsData()
      fetchStrategyData()
    }
  }, [isAdmin, fetchFeedback, fetchAnalyticsData, fetchBetsAnalyticsData, fetchStrategyData])

  // Cleanup effect to cancel any pending odds fetch requests
  useEffect(() => {
    return () => {
      if (currentFetchRequest.current) {
        currentFetchRequest.current.abort()
      }
    }
  }, [])

  // Handle fetch current odds - moved here to follow Rules of Hooks
  const handleFetchCurrentOdds = useCallback(async () => {
    const executionId = Math.random().toString(36).substr(2, 9)
    const startTime = new Date().toISOString()

    console.log(`🚀 [${executionId}] Starting odds fetch at ${startTime}`)

    // Enhanced early return checks
    if (!selectedDate) {
      console.log(`❌ [${executionId}] Early return: No selected date`)
      return
    }

    if (isFetching) {
      console.log(`❌ [${executionId}] Early return: Already fetching (isFetching=${isFetching})`)
      return
    }

    // Prevent rapid successive calls (10 second cooldown)
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime.current
    const cooldownPeriod = 10000 // 10 seconds

    if (timeSinceLastFetch < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastFetch) / 1000)
      console.log(
        `❌ [${executionId}] Early return: Cooldown active. Wait ${remainingTime} more seconds`
      )
      setFetchResult(`⏳ Please wait ${remainingTime} seconds before fetching again`)
      return
    }

    lastFetchTime.current = now

    // Cancel any existing request
    if (currentFetchRequest.current) {
      console.log(`🔄 [${executionId}] Cancelling existing request`)
      currentFetchRequest.current.abort()
    }

    // Create new abort controller for this request
    currentFetchRequest.current = new AbortController()

    setIsFetching(true)
    setFetchResult(null)

    try {
      console.log(
        `🔧 [${executionId}] Admin: Starting odds fetch for all sports on ${selectedDate.toISOString().split('T')[0]}`
      )

      const response = await fetch('/api/fetch-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: 'ALL', // Fetch all sports
          date: selectedDate.toISOString().split('T')[0],
        }),
        signal: currentFetchRequest.current.signal,
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ [${executionId}] Admin: Odds fetch completed:`, result)
        setFetchResult(
          `✅ Successfully fetched odds for all sports. Total games: ${result.totalGames || 0}. Completed at ${new Date().toLocaleTimeString()}`
        )
        setLastUpdated(new Date())
      } else {
        console.error(`❌ [${executionId}] Admin: Fetch failed:`, result)
        setFetchResult(`❌ Fetch failed: ${result.error || result.message || 'Unknown error'}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`🔄 [${executionId}] Admin: Odds fetch request was cancelled`)
        setFetchResult('⚠️ Request was cancelled')
      } else {
        console.error(`❌ [${executionId}] Admin: Error during fetch:`, error)
        setFetchResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      const endTime = new Date().toISOString()
      console.log(
        `🏁 [${executionId}] Odds fetch completed at ${endTime}. Duration: ${((new Date().getTime() - new Date(startTime).getTime()) / 1000).toFixed(1)}s`
      )
      setIsFetching(false)
      currentFetchRequest.current = null
    }
  }, [selectedDate, isFetching])

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Authentication Required</h2>
            <p className="text-slate-600">Please log in to access this page.</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Access Denied</h2>
            <p className="mb-4 text-slate-600">
              You don't have permission to access this admin page.
            </p>
            <p className="text-sm text-slate-500">User ID: {user.id}</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const handleSettleBets = async () => {
    setIsSettling(true)
    setSettleResult(null)

    try {
      console.log('🏆 Admin: Starting bet settlement process')

      const response = await fetch('/api/settle-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Admin: Bet settlement completed:', result)
        setSettleResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Settlement failed:', result)
        setSettleResult(`❌ Settlement failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during settlement:', error)
      setSettleResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSettling(false)
    }
  }

  const handleFetchBettors = async () => {
    setIsFetchingBettors(true)
    setBettorsResult(null)

    try {
      console.log('🔧 Admin: Fetching SharpSports bettors')

      const response = await fetch('/api/sharpsports/fetch-bettors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Admin: Bettors fetch completed:', result)
        setBettorsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setBettorsResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during bettors fetch:', error)
      setBettorsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingBettors(false)
    }
  }

  const handleFetchBettorProfiles = async () => {
    setIsFetchingBettorProfiles(true)
    setBettorProfilesResult(null)

    try {
      console.log('🔧 Admin: Fetching SharpSports bettor profiles and matching to user profiles')

      const response = await fetch('/api/sharpsports/fetch-bettor-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Admin: Bettor profiles fetch completed:', result)
        setBettorProfilesResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setBettorProfilesResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during bettor profiles fetch:', error)
      setBettorProfilesResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsFetchingBettorProfiles(false)
    }
  }

  const handleRefreshUserBets = async () => {
    if (!targetUserId) {
      setUserBetsResult('❌ User ID is required')
      return
    }

    setIsRefreshingUserBets(true)
    setUserBetsResult(null)

    try {
      console.log('🔧 Admin: Refreshing bets for user', targetUserId)

      const response = await fetch('/api/sharpsports/refresh-user-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Admin: User bets refresh completed:', result)
        setUserBetsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: User bets refresh failed:', result)
        setUserBetsResult(`❌ Refresh failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during user bets refresh:', error)
      setUserBetsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingUserBets(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <Shield className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">System management and analytics</p>
            </div>
          </div>
        </div>

        {/* Admin Status */}
        {lastUpdated && (
          <Card className="p-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>Last system action: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </Card>
        )}

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
          <div className="flex items-center space-x-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                fetchAnalyticsData()
                fetchBetsAnalyticsData()
              }}
              disabled={isLoadingAnalytics || isLoadingBetsAnalytics}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoadingAnalytics || isLoadingBetsAnalytics ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="bets" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Bets</span>
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Strategies</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">System Health</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoadingAnalytics ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 p-2"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-20 rounded bg-gray-200"></div>
                          <div className="h-6 w-16 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Users</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.totalUsers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Sellers</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.totalSellers.toLocaleString()}
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
                        <p className="text-sm font-medium text-slate-600">Verified Sellers</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.verifiedSellers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-yellow-100 p-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Subscribers</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.totalSubscribers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Pro Subscribers</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.totalProSubscribers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-teal-100 p-2">
                        <Link className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Linked Accounts</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.usersWithLinkedAccounts.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* New Users Per Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span>New Users Per Day</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.newUsersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* New Sellers Per Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <span>New Sellers Per Day</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.newSellersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* New Subscribers Per Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span>New Subscribers Per Day</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.newSubscribersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* New Pro Subscribers Per Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                        <span>New Pro Subscribers Per Day</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.newProSubscribersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#f97316"
                            fill="#f97316"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            {/* Odds Management */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <RefreshCw className="h-5 w-5" />
                    Fetch Odds
                  </h3>
                  <p className="mb-4 text-slate-600">
                    Fetch current odds from the SportsGameOdds API for all supported sports.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleFetchCurrentOdds}
                    disabled={isFetching || !selectedDate}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    {isFetching ? 'Fetching Current Odds...' : 'Fetch Current Odds'}
                  </Button>

                  {selectedDate && (
                    <div className="text-sm text-slate-600">
                      Target date: {selectedDate.toLocaleDateString()}
                    </div>
                  )}
                </div>

                {fetchResult && (
                  <div
                    className={`rounded-lg p-4 ${
                      fetchResult.startsWith('✅')
                        ? 'border border-green-200 bg-green-50 text-green-800'
                        : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    <p className="font-mono text-sm">{fetchResult}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Bet Settlement */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Target className="h-5 w-5" />
                    Settle Bets
                  </h3>
                  <p className="mb-4 text-slate-600">
                    Fetch completed game results for yesterday and today to settle bets by updating
                    score columns in the odds table.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleSettleBets}
                    disabled={isSettling}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSettling ? 'animate-spin' : ''}`} />
                    {isSettling ? 'Settling Bets...' : 'Settle Bets'}
                  </Button>

                  <div className="text-sm text-slate-600">
                    Processes completed games from yesterday and today
                  </div>
                </div>

                {settleResult && (
                  <div
                    className={`rounded-lg p-4 ${
                      settleResult.startsWith('✅')
                        ? 'border border-green-200 bg-green-50 text-green-800'
                        : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    <p className="font-mono text-sm">{settleResult}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* SharpSports Sync */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Users className="h-5 w-5" />
                      SharpSports Sync 1
                    </h3>
                    <p className="mb-4 text-sm text-slate-600">
                      Fetch all bettors from SharpSports API.
                    </p>
                  </div>

                  <Button
                    onClick={handleFetchBettors}
                    disabled={isFetchingBettors}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isFetchingBettors ? 'animate-spin' : ''}`}
                    />
                    {isFetchingBettors ? 'Syncing...' : 'Sync Bettors'}
                  </Button>

                  {bettorsResult && (
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        bettorsResult.startsWith('✅')
                          ? 'border border-green-200 bg-green-50 text-green-800'
                          : 'border border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="font-mono">{bettorsResult}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <User className="h-5 w-5" />
                      SharpSports Sync 2
                    </h3>
                    <p className="mb-4 text-sm text-slate-600">Match bettor profiles to users.</p>
                  </div>

                  <Button
                    onClick={handleFetchBettorProfiles}
                    disabled={isFetchingBettorProfiles}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isFetchingBettorProfiles ? 'animate-spin' : ''}`}
                    />
                    {isFetchingBettorProfiles ? 'Matching...' : 'Match Profiles'}
                  </Button>

                  {bettorProfilesResult && (
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        bettorProfilesResult.startsWith('✅')
                          ? 'border border-green-200 bg-green-50 text-green-800'
                          : 'border border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="font-mono">{bettorProfilesResult}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Target className="h-5 w-5" />
                      SharpSports Sync 3
                    </h3>
                    <p className="mb-4 text-sm text-slate-600">Refresh user bets data.</p>
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      value={targetUserId}
                      onChange={e => setTargetUserId(e.target.value)}
                      placeholder="User ID (UUID)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <Button
                    onClick={handleRefreshUserBets}
                    disabled={isRefreshingUserBets || !targetUserId}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isRefreshingUserBets ? 'animate-spin' : ''}`}
                    />
                    {isRefreshingUserBets ? 'Refreshing...' : 'Refresh Bets'}
                  </Button>

                  {userBetsResult && (
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        userBetsResult.startsWith('✅')
                          ? 'border border-green-200 bg-green-50 text-green-800'
                          : 'border border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="font-mono">{userBetsResult}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Bets Tab */}
          <TabsContent value="bets" className="space-y-6">
            {isLoadingBetsAnalytics ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-gray-200 p-2"></div>
                          <div className="h-3 w-16 flex-1 rounded bg-gray-200"></div>
                        </div>
                        <div className="h-5 w-12 rounded bg-gray-200"></div>
                        <div className="h-3 w-20 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Snapshot Metrics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2">
                          <Target className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Total Bets</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        {betsAnalyticsData.totalBets.toLocaleString()}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Total Stakes</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        $
                        {betsAnalyticsData.totalStakes >= 1000000
                          ? `${(betsAnalyticsData.totalStakes / 1000000).toFixed(1)}M`
                          : betsAnalyticsData.totalStakes >= 1000
                            ? `${(betsAnalyticsData.totalStakes / 1000).toFixed(0)}k`
                            : betsAnalyticsData.totalStakes.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-purple-100 p-2">
                          <Star className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">
                          Potential Payout
                        </p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        $
                        {betsAnalyticsData.totalPotentialPayout >= 1000000
                          ? `${(betsAnalyticsData.totalPotentialPayout / 1000000).toFixed(1)}M`
                          : betsAnalyticsData.totalPotentialPayout >= 1000
                            ? `${(betsAnalyticsData.totalPotentialPayout / 1000).toFixed(0)}k`
                            : betsAnalyticsData.totalPotentialPayout.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`flex-shrink-0 rounded-lg p-2 ${betsAnalyticsData.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
                        >
                          <DollarSign
                            className={`h-4 w-4 ${betsAnalyticsData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Total Profit</p>
                      </div>
                      <p
                        className={`text-xl font-semibold ${betsAnalyticsData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        ${betsAnalyticsData.totalProfit >= 0 ? '+' : ''}
                        {Math.abs(betsAnalyticsData.totalProfit) >= 1000000
                          ? `${(betsAnalyticsData.totalProfit / 1000000).toFixed(1)}M`
                          : Math.abs(betsAnalyticsData.totalProfit) >= 1000
                            ? `${(betsAnalyticsData.totalProfit / 1000).toFixed(0)}k`
                            : betsAnalyticsData.totalProfit.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-yellow-100 p-2">
                          <BarChart3 className="h-4 w-4 text-yellow-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Avg Stake</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        ${betsAnalyticsData.averageStakeSize.toFixed(0)}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-orange-100 p-2">
                          <Settings className="h-4 w-4 text-orange-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Manual Bets</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        {betsAnalyticsData.betsBySource.manual}
                      </p>
                      <p className="text-xs text-slate-500">
                        vs {betsAnalyticsData.betsBySource.sharpsports} SharpSports
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-teal-100 p-2">
                          <Activity className="h-4 w-4 text-teal-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Pending</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">
                        {betsAnalyticsData.betsByStatus.pending}
                      </p>
                      <p className="text-xs text-slate-500">
                        Won: {betsAnalyticsData.betsByStatus.won} | Lost:{' '}
                        {betsAnalyticsData.betsByStatus.lost}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 rounded-lg bg-indigo-100 p-2">
                          <Target className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="flex-1 text-xs font-medium text-slate-600">Top Bet Type</p>
                      </div>
                      <p className="text-xl font-semibold capitalize text-slate-900">
                        {(
                          Object.entries(betsAnalyticsData.betsByType).sort(
                            ([, a], [, b]) => b - a
                          )[0]?.[0] || 'N/A'
                        ).replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Object.entries(betsAnalyticsData.betsByType).sort(
                          ([, a], [, b]) => b - a
                        )[0]?.[1] || 0}{' '}
                        bets
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Bets Per Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Bets Per Day</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={betsAnalyticsData.betsPerDayData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="manual"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Manual"
                          />
                          <Line
                            type="monotone"
                            dataKey="sharpsports"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="SharpSports"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="Total"
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Handle Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Handle Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={betsAnalyticsData.handleOverTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={value => {
                              if (value >= 1000000) {
                                return `$${(value / 1000000).toFixed(1)}M`
                              } else if (value >= 1000) {
                                return `$${(value / 1000).toFixed(0)}k`
                              } else {
                                return `$${value.toFixed(0)}`
                              }
                            }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              `$${value.toLocaleString()}`,
                              'Cumulative Handle',
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Profit Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <span>Profit Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={betsAnalyticsData.profitOverTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={value => `$${value >= 0 ? '+' : ''}${value.toFixed(0)}`}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              `$${value >= 0 ? '+' : ''}${value.toFixed(2)}`,
                              'Cumulative Profit',
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Breakdown Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-orange-600" />
                        <span>Status Breakdown Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={betsAnalyticsData.statusBreakdownData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="won" stackId="status" fill="#10b981" name="Won" />
                          <Bar dataKey="lost" stackId="status" fill="#ef4444" name="Lost" />
                          <Bar dataKey="pending" stackId="status" fill="#f59e0b" name="Pending" />
                          <Bar dataKey="void" stackId="status" fill="#6b7280" name="Void" />
                          <Bar
                            dataKey="cancelled"
                            stackId="status"
                            fill="#9ca3af"
                            name="Cancelled"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Bet Type Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Bet Type Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={betsAnalyticsData.betTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {betsAnalyticsData.betTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Sportsbook Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <span>Sportsbook Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={betsAnalyticsData.sportsbookDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Analytics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg Settlement Time</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.avgSettlementTime.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <Link className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Parlay Bets</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.parlay.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">
                          Avg {betsAnalyticsData.parlay.avgLegs} legs
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-yellow-100 p-2">
                        <Users className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Copy Bets</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.copyBets.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">
                          Most copied: {betsAnalyticsData.copyBets.mostCopiedCount}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Strategy Bets</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.strategyBets.total}
                        </p>
                        <p className="text-xs text-slate-500">
                          Win rate: {betsAnalyticsData.strategyBets.winRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {isLoadingAnalytics ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
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
            ) : (
              <>
                {/* Account Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Link className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg Linked Accounts</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.avgLinkedAccountsPerUser.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">% With Linked Accounts</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.percentUsersWithLinkedAccounts.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-yellow-100 p-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Subscriber Ratio</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {(
                            (analyticsData.totalSubscribers / analyticsData.totalUsers) *
                            100
                          ).toFixed(1)}
                          %
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
                        <p className="text-sm font-medium text-slate-600">Verified Seller Ratio</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.totalSellers > 0
                            ? (
                                (analyticsData.verifiedSellers / analyticsData.totalSellers) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Account Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Linked Accounts Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-teal-600" />
                        <span>Linked Accounts Growth</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.linkedAccountsGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#14b8a6"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Subscribers vs Pro Subscribers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span>Subscribers Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.subscribersOverTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#f59e0b"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {isLoadingAnalytics ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 p-2"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-gray-200"></div>
                          <div className="h-6 w-20 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Revenue Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Users with Stripe Customers
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.usersWithStripeCustomers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Users with Connect Accounts
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.usersWithStripeConnectAccounts.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Sellers: Stripe but Not Verified
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.sellersWithStripeButNotVerified.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Revenue Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Subscribers Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span>Subscribers Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.subscribersOverTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Sellers with Connect Accounts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span>Connect Accounts Over Time</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.sellersWithConnectData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            {isLoadingStrategies ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse">
                      <div className="mb-2 h-4 w-16 rounded bg-slate-200"></div>
                      <div className="h-8 w-24 rounded bg-slate-200"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : strategyData.length === 0 ? (
              // Empty state when no data
              <div className="py-12 text-center">
                <Card className="mx-auto max-w-md p-12">
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    No Strategy Data Available
                  </h3>
                  <p className="mb-4 text-slate-600">
                    The strategy_leaderboard table appears to be empty. This could mean:
                  </p>
                  <ul className="mb-6 space-y-1 text-left text-sm text-slate-500">
                    <li>• No strategies have been added yet</li>
                    <li>• The leaderboard calculation hasn't run</li>
                    <li>• There might be a database connection issue</li>
                  </ul>
                  <Button onClick={fetchStrategyData} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>

                  {/* Debug Info - only show in development */}
                  <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left">
                    <p className="mb-2 text-xs font-medium text-slate-600">Debug Information:</p>
                    <div className="space-y-1 text-xs text-slate-500">
                      <div>• Strategy data length: {strategyData.length}</div>
                      <div>• Loading state: {isLoadingStrategies ? 'true' : 'false'}</div>
                      <div>• Admin status: {isAdmin ? 'true' : 'false'}</div>
                      <div>• Check browser console for detailed logs</div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
                        <Trophy className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">
                          Total Strategies
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.totalStrategies.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-green-100 p-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">Verified</p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.verifiedStrategies.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-purple-100 p-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">Monetized</p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.monetizedStrategies.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-orange-100 p-2">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">Eligible</p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.eligibleStrategies.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-red-100 p-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">Avg ROI %</p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.avgRoi.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 rounded-full bg-indigo-100 p-2">
                        <Target className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-600">Avg Win Rate</p>
                        <p className="text-lg font-bold text-slate-900">
                          {strategyOverview.avgWinRate.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* ROI Over Time Chart */}
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <TrendingUp className="h-5 w-5" />
                        ROI % Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                        <BarChart3 className="mb-3 h-12 w-12 text-slate-400" />
                        <p className="text-center font-medium text-slate-600">ROI Trend Analysis</p>
                        <p className="mt-1 text-center text-sm text-slate-500">
                          Line chart showing average ROI over time
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Ready for Recharts integration
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Win Rate Over Time Chart */}
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Target className="h-5 w-5" />
                        Win Rate % Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                        <Target className="mb-3 h-12 w-12 text-green-500" />
                        <p className="text-center font-medium text-green-700">Win Rate Trends</p>
                        <p className="mt-1 text-center text-sm text-green-600">
                          Track success rates over time periods
                        </p>
                        <p className="mt-2 text-xs text-green-500">
                          Ready for Recharts integration
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategies by Sport */}
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <BarChart3 className="h-5 w-5" />
                        Strategies by Sport
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <Trophy className="mb-3 h-12 w-12 text-blue-500" />
                        <p className="text-center font-medium text-blue-700">Sport Distribution</p>
                        <p className="mt-1 text-center text-sm text-blue-600">
                          Bar chart of strategies per sport category
                        </p>
                        <div className="mt-2 text-center text-xs text-blue-500">
                          <div>
                            Current sports:{' '}
                            {
                              [...new Set(strategyData.map(s => s.primary_sport).filter(Boolean))]
                                .length
                            }{' '}
                            types
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Pricing */}
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <DollarSign className="h-5 w-5" />
                        Subscription Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                        <DollarSign className="mb-3 h-12 w-12 text-purple-500" />
                        <p className="text-center font-medium text-purple-700">Pricing Breakdown</p>
                        <p className="mt-1 text-center text-sm text-purple-600">
                          Distribution of weekly/monthly/yearly prices
                        </p>
                        <div className="mt-2 text-center text-xs text-purple-500">
                          <div>Monetized strategies: {strategyOverview.monetizedStrategies}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <Card className="p-6">
                  <div className="mb-6 flex flex-wrap gap-4">
                    <div className="min-w-[200px] flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                        <Input
                          placeholder="Search strategies or users..."
                          value={strategyFilters.search}
                          onChange={e => {
                            setStrategyFilters({ ...strategyFilters, search: e.target.value })
                            setCurrentPage(1)
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select
                      value={strategyFilters.sport}
                      onValueChange={value => {
                        setStrategyFilters({ ...strategyFilters, sport: value })
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Sports" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sports</SelectItem>
                        {[...new Set(strategyData.map(s => s.primary_sport).filter(Boolean))].map(
                          sport => (
                            <SelectItem key={sport} value={sport}>
                              {sport}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    <Select
                      value={strategyFilters.verification}
                      onValueChange={value => {
                        setStrategyFilters({ ...strategyFilters, verification: value })
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={strategyFilters.monetization}
                      onValueChange={value => {
                        setStrategyFilters({ ...strategyFilters, monetization: value })
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Monetization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="monetized">Monetized</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Strategies Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('strategy_name')}
                          >
                            <div className="flex items-center gap-2">
                              Strategy Name
                              {strategySortConfig?.key === 'strategy_name' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('username')}
                          >
                            <div className="flex items-center gap-2">
                              Username
                              {strategySortConfig?.key === 'username' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('total_bets')}
                          >
                            <div className="flex items-center gap-2">
                              Total Bets
                              {strategySortConfig?.key === 'total_bets' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('win_rate')}
                          >
                            <div className="flex items-center gap-2">
                              Win Rate %
                              {strategySortConfig?.key === 'win_rate' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('roi_percentage')}
                          >
                            <div className="flex items-center gap-2">
                              ROI %
                              {strategySortConfig?.key === 'roi_percentage' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-slate-50"
                            onClick={() => handleStrategySort('overall_rank')}
                          >
                            <div className="flex items-center gap-2">
                              Overall Rank
                              {strategySortConfig?.key === 'overall_rank' &&
                                (strategySortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead>Sport Rank</TableHead>
                          <TableHead>Primary Sport</TableHead>
                          <TableHead>Strategy Type</TableHead>
                          <TableHead>Monetized</TableHead>
                          <TableHead>Subscription Prices</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedStrategies().strategies.map(strategy => (
                          <TableRow key={strategy.id}>
                            <TableCell className="font-medium">{strategy.strategy_name}</TableCell>
                            <TableCell>{strategy.username}</TableCell>
                            <TableCell>
                              {strategy.is_verified_seller ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Unverified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{strategy.total_bets.toLocaleString()}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  strategy.win_rate >= 50
                                    ? 'font-medium text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {strategy.win_rate?.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  strategy.roi_percentage >= 0
                                    ? 'font-medium text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                {strategy.roi_percentage >= 0 ? '+' : ''}
                                {strategy.roi_percentage?.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {strategy.overall_rank ? (
                                <Badge variant="outline">#{strategy.overall_rank}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {strategy.sport_rank ? (
                                <Badge variant="outline">#{strategy.sport_rank}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{strategy.primary_sport || '-'}</Badge>
                            </TableCell>
                            <TableCell>{strategy.strategy_type || '-'}</TableCell>
                            <TableCell>
                              {strategy.is_monetized ? (
                                <Badge className="bg-purple-100 text-purple-800">Yes</Badge>
                              ) : (
                                <Badge variant="secondary">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="space-y-1">
                                {strategy.subscription_price_weekly && (
                                  <div>W: ${strategy.subscription_price_weekly}</div>
                                )}
                                {strategy.subscription_price_monthly && (
                                  <div>M: ${strategy.subscription_price_monthly}</div>
                                )}
                                {strategy.subscription_price_yearly && (
                                  <div>Y: ${strategy.subscription_price_yearly}</div>
                                )}
                                {!strategy.subscription_price_weekly &&
                                  !strategy.subscription_price_monthly &&
                                  !strategy.subscription_price_yearly && <div>-</div>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {strategy.created_at
                                ? new Date(strategy.created_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {getPaginatedStrategies().totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, getPaginatedStrategies().totalCount)}{' '}
                        of {getPaginatedStrategies().totalCount} strategies
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex gap-1">
                          {[...Array(Math.min(5, getPaginatedStrategies().totalPages))].map(
                            (_, i) => {
                              const pageNum = i + 1
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8"
                                >
                                  {pageNum}
                                </Button>
                              )
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === getPaginatedStrategies().totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-6">
            {isLoadingAnalytics || isLoadingBetsAnalytics ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 p-2"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-40 rounded bg-gray-200"></div>
                          <div className="h-6 w-16 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* System Health Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
                  {/* Bets Health Metrics */}
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-lg p-2 ${
                          betsAnalyticsData.pendingBetsAging === 0
                            ? 'bg-green-100'
                            : betsAnalyticsData.pendingBetsAging < 10
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <Clock
                          className={`h-5 w-5 ${
                            betsAnalyticsData.pendingBetsAging === 0
                              ? 'text-green-600'
                              : betsAnalyticsData.pendingBetsAging < 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Pending Bets Aging</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.pendingBetsAging.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">Bets pending &gt;24h</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-lg p-2 ${
                          betsAnalyticsData.settlementSuccessRate >= 95
                            ? 'bg-green-100'
                            : betsAnalyticsData.settlementSuccessRate >= 85
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <Target
                          className={`h-5 w-5 ${
                            betsAnalyticsData.settlementSuccessRate >= 95
                              ? 'text-green-600'
                              : betsAnalyticsData.settlementSuccessRate >= 85
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Settlement Success Rate
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.settlementSuccessRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">Bets settled vs total</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-lg p-2 ${
                          betsAnalyticsData.largeStakeBets === 0
                            ? 'bg-green-100'
                            : betsAnalyticsData.largeStakeBets < 5
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            betsAnalyticsData.largeStakeBets === 0
                              ? 'text-green-600'
                              : betsAnalyticsData.largeStakeBets < 5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Large Stake Bets</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {betsAnalyticsData.largeStakeBets.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">Stakes &gt;$1,000</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-lg p-2 ${
                          analyticsData.usersWithStripeMissingSubscription === 0
                            ? 'bg-green-100'
                            : analyticsData.usersWithStripeMissingSubscription < 5
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            analyticsData.usersWithStripeMissingSubscription === 0
                              ? 'text-green-600'
                              : analyticsData.usersWithStripeMissingSubscription < 5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Stripe Customers Missing Subscription
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.usersWithStripeMissingSubscription.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {analyticsData.usersWithStripeCustomers > 0
                            ? `${((analyticsData.usersWithStripeMissingSubscription / analyticsData.usersWithStripeCustomers) * 100).toFixed(1)}% of Stripe customers`
                            : 'No Stripe customers'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-lg p-2 ${
                          analyticsData.sellersMissingStripeConnect === 0
                            ? 'bg-green-100'
                            : analyticsData.sellersMissingStripeConnect < 3
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${
                            analyticsData.sellersMissingStripeConnect === 0
                              ? 'text-green-600'
                              : analyticsData.sellersMissingStripeConnect < 3
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Verified Sellers Missing Connect
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {analyticsData.sellersMissingStripeConnect.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {analyticsData.verifiedSellers > 0
                            ? `${((analyticsData.sellersMissingStripeConnect / analyticsData.verifiedSellers) * 100).toFixed(1)}% of verified sellers`
                            : 'No verified sellers'}
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
                        <p className="text-sm font-medium text-slate-600">Overall Health Status</p>
                        <p
                          className={`text-2xl font-semibold ${
                            analyticsData.usersWithStripeMissingSubscription === 0 &&
                            analyticsData.sellersMissingStripeConnect === 0
                              ? 'text-green-600'
                              : analyticsData.usersWithStripeMissingSubscription < 5 &&
                                  analyticsData.sellersMissingStripeConnect < 3
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {analyticsData.usersWithStripeMissingSubscription === 0 &&
                          analyticsData.sellersMissingStripeConnect === 0
                            ? 'Excellent'
                            : analyticsData.usersWithStripeMissingSubscription < 5 &&
                                analyticsData.sellersMissingStripeConnect < 3
                              ? 'Good'
                              : 'Needs Attention'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* System Health Details */}
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span>Data Consistency Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              analyticsData.usersWithStripeMissingSubscription === 0
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          ></div>
                          <span className="font-medium">Payment Integration Consistency</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {analyticsData.usersWithStripeMissingSubscription === 0
                            ? 'All Stripe customers have valid subscriptions'
                            : `${analyticsData.usersWithStripeMissingSubscription} users have Stripe customer IDs but missing subscriptions`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              analyticsData.sellersMissingStripeConnect === 0
                                ? 'bg-green-500'
                                : 'bg-yellow-500'
                            }`}
                          ></div>
                          <span className="font-medium">Seller Account Consistency</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {analyticsData.sellersMissingStripeConnect === 0
                            ? 'All verified sellers have Stripe Connect accounts'
                            : `${analyticsData.sellersMissingStripeConnect} verified sellers missing Stripe Connect accounts`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              betsAnalyticsData.pendingBetsAging === 0
                                ? 'bg-green-500'
                                : 'bg-yellow-500'
                            }`}
                          ></div>
                          <span className="font-medium">Bet Settlement Health</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {betsAnalyticsData.pendingBetsAging === 0
                            ? 'No aging pending bets (&gt;24h)'
                            : `${betsAnalyticsData.pendingBetsAging} bets pending for &gt;24 hours`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              betsAnalyticsData.largeStakeBets === 0
                                ? 'bg-green-500'
                                : 'bg-orange-500'
                            }`}
                          ></div>
                          <span className="font-medium">Large Stakes Monitoring</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {betsAnalyticsData.largeStakeBets === 0
                            ? 'No unusually large stakes detected'
                            : `${betsAnalyticsData.largeStakeBets} bets with stakes &gt;$1,000`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">Platform Growth</span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {analyticsData.totalUsers} total users, {analyticsData.totalSellers}{' '}
                          sellers, {betsAnalyticsData.totalBets} total bets
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">User Feedback</h3>
                </div>
                <Button
                  onClick={fetchFeedback}
                  disabled={isFetchingFeedback}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isFetchingFeedback ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>

              {isFetchingFeedback ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-600">Loading feedback...</span>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-slate-500">No feedback submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="mb-4 text-sm text-slate-600">
                    Showing {feedbackList.length} most recent feedback submissions
                  </p>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Date Submitted
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Feedback
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {feedbackList.map(feedback => (
                            <tr key={feedback.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                {feedback.created_at
                                  ? new Date(feedback.created_at).toLocaleString()
                                  : 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900">
                                <div className="max-w-md">
                                  <p className="line-clamp-3">{feedback.feedback_text}</p>
                                  {feedback.feedback_text.length > 150 && (
                                    <button
                                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                      onClick={() => alert(feedback.feedback_text)}
                                    >
                                      Read more...
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
