'use client'

import { EnhancedAccountsTab } from '@/components/admin/accounts/EnhancedAccountsTab'
import { CleanBetsTab } from '@/components/admin/bets/CleanBetsTab'
import { CleanControlsTab } from '@/components/admin/controls/CleanControlsTab'
import { EnhancedOverviewTab } from '@/components/admin/overview/EnhancedOverviewTab'
import { RevenueTab } from '@/components/admin/revenue/RevenueTab'
import { EnhancedStrategiesTab } from '@/components/admin/strategies/EnhancedStrategiesTab'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient, createServiceRoleClient } from '@/lib/supabase'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  HelpCircle,
  Link,
  MessageSquare,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Target,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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

  // Feedback states
  const [feedbackList, setFeedbackList] = useState<
    { id: string; feedback_text: string; created_at: string | null }[]
  >([])
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState('overview')

  // Strategy states
  // const [strategyData, setStrategyData] = useState<unknown[]>([])
  const [, setIsLoadingStrategies] = useState(false)
  // const [strategyFilters] = useState({
  //   sport: 'all',
  //   verification: 'all',
  //   monetization: 'all',
  //   search: '',
  // })
  // const [strategySortConfig] = useState<{
  //   key: string
  //   direction: 'asc' | 'desc'
  // } | null>(null)
  // const [currentPage] = useState(1)
  // const itemsPerPage = 20
  // const [strategyOverview] = useState({
  //   totalStrategies: 0,
  //   verifiedStrategies: 0,
  //   monetizedStrategies: 0,
  //   eligibleStrategies: 0,
  //   avgRoi: 0,
  //   avgWinRate: 0,
  // })

  // Analytics data states
  /*
  const [analyticsData] = useState<{
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
  */
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

      // Calculate basic metrics - commented out as not currently used
      /*
      const totalUsers = profiles.length
      const totalSellers = profiles.filter(p => p.is_seller === true).length
      const verifiedSellers = profiles.filter(p => p.is_verified_seller === true).length
      const totalSubscribers = profiles.filter(p => p.pro === 'yes' || p.pro === 'pro').length
      const totalProSubscribers = profiles.filter(p => p.pro === 'pro').length
      */
      /*
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
      */

      // setAnalyticsData({
      //   totalUsers,
      //   totalSellers,
      //   verifiedSellers,
      //   totalSubscribers,
      //   totalProSubscribers,
      //   usersWithLinkedAccounts,
      //   avgLinkedAccountsPerUser,
      //   percentUsersWithLinkedAccounts,
      //   usersWithStripeCustomers,
      //   usersWithStripeConnectAccounts,
      //   sellersWithStripeButNotVerified,
      //   usersWithStripeMissingSubscription,
      //   sellersMissingStripeConnect,
      //   newUsersData,
      //   newSellersData,
      //   newSubscribersData,
      //   newProSubscribersData,
      //   linkedAccountsGrowthData,
      //   subscribersOverTimeData,
      //   sellersWithConnectData,
      // })
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
      // Try service role client first, fallback to regular client
      let supabase
      try {
        supabase = await createServiceRoleClient()
        console.log('✅ Using service role client for bets data')
      } catch (serviceRoleError) {
        console.warn(
          '⚠️ Service role client failed, falling back to regular client:',
          serviceRoleError
        )
        supabase = createClient()
      }

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
      console.log('🔍 Fetching bets data...')
      const { data: allBets, error } = await supabase
        .from('bets')
        .select('*')
        .order('placed_at', { ascending: true })

      console.log('📊 Bets query result:', {
        betsCount: allBets?.length || 0,
        error: error?.message,
        sampleBet: allBets?.[0],
      })

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
        // setStrategyData([])
        // setStrategyOverview({
        //   totalStrategies: 0,
        //   verifiedStrategies: 0,
        //   monetizedStrategies: 0,
        //   eligibleStrategies: 0,
        //   avgRoi: 0,
        //   avgWinRate: 0,
        // })
      } else {
        const strategies = data || []
        // setStrategyData(strategies)

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
        // setStrategyOverview(overview)
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching strategy data:', error)
      // Set empty state on error
      // setStrategyData([])
      // setStrategyOverview({
      //   totalStrategies: 0,
      //   verifiedStrategies: 0,
      //   monetizedStrategies: 0,
      //   eligibleStrategies: 0,
      //   avgRoi: 0,
      //   avgWinRate: 0,
      // })
    } finally {
      setIsLoadingStrategies(false)
    }
  }, [isAdmin])

  // Strategy helper functions
  // const handleStrategySort = (key: string) => {
  //   let direction: 'asc' | 'desc' = 'desc'
  //   if (
  //     strategySortConfig &&
  //     strategySortConfig.key === key &&
  //     strategySortConfig.direction === 'desc'
  //   ) {
  //     direction = 'asc'
  //   }
  //   setStrategySortConfig({ key, direction })
  // }

  /*
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
          return strategySortConfig?.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return strategySortConfig?.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }
  */

  // const getPaginatedStrategies = () => {
  //   const filtered = getFilteredAndSortedStrategies()
  //   const startIndex = (currentPage - 1) * itemsPerPage
  //   const endIndex = startIndex + itemsPerPage
  //   return {
  //     strategies: filtered.slice(startIndex, endIndex),
  //     totalCount: filtered.length,
  //     totalPages: Math.ceil(filtered.length / itemsPerPage),
  //   }
  // }

  // Fetch feedback and analytics on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchFeedback()
      fetchAnalyticsData()
      fetchBetsAnalyticsData()
      fetchStrategyData()
    }
  }, [isAdmin, fetchFeedback, fetchAnalyticsData, fetchBetsAnalyticsData, fetchStrategyData])

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
              You don&apos;t have permission to access this admin page.
            </p>
            <p className="text-sm text-slate-500">User ID: {user.id}</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
                Admin Dashboard
              </h1>
              <p className="mt-1 font-medium text-slate-600">System management and analytics</p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
            <div className="flex items-center space-x-3">
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
        </div>

        {/* Tabbed Content */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid h-14 w-full grid-cols-4 rounded-none border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 lg:grid-cols-7">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="controls"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Controls</span>
              </TabsTrigger>
              <TabsTrigger
                value="bets"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Target className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Bets</span>
              </TabsTrigger>
              <TabsTrigger
                value="accounts"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Accounts</span>
              </TabsTrigger>
              <TabsTrigger
                value="revenue"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Revenue</span>
              </TabsTrigger>
              <TabsTrigger
                value="strategies"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Strategies</span>
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden font-medium sm:inline">Feedback</span>
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Overview Tab */}
            <TabsContent value="overview" className="space-y-4 p-6">
              <EnhancedOverviewTab />
            </TabsContent>

            {/* Clean Controls Tab */}
            <TabsContent value="controls" className="space-y-4 p-6">
              <CleanControlsTab />
            </TabsContent>

            {/* Clean Bets Tab */}
            <TabsContent value="bets" className="space-y-4 p-6">
              <CleanBetsTab />
            </TabsContent>

            {/* Replaced old bets content - keeping for reference but commented out */}
            {false && (
              <TabsContent value="bets-old" className="space-y-6">
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
                            <p className="flex-1 text-xs font-medium text-slate-600">
                              Total Stakes
                            </p>
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
                            <p className="flex-1 text-xs font-medium text-slate-600">
                              Total Profit
                            </p>
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
                            <p className="flex-1 text-xs font-medium text-slate-600">
                              Top Bet Type
                            </p>
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
                                tickFormatter={value =>
                                  `$${value >= 0 ? '+' : ''}${value.toFixed(0)}`
                                }
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
                              <Bar
                                dataKey="pending"
                                stackId="status"
                                fill="#f59e0b"
                                name="Pending"
                              />
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
                            <p className="text-sm font-medium text-slate-600">
                              Avg Settlement Time
                            </p>
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
            )}

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4 p-6">
              <EnhancedAccountsTab />
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-4 p-6">
              <RevenueTab />
            </TabsContent>

            {/* Enhanced Strategies Tab */}
            <TabsContent value="strategies" className="space-y-4 p-6">
              <EnhancedStrategiesTab />
            </TabsContent>
            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-4 p-6">
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
      </div>
    </DashboardLayout>
  )
}
