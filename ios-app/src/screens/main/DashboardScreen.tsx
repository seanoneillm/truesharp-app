import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { captureRef } from 'react-native-view-shot'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, Path, Line as SvgLine, Text as SvgText } from 'react-native-svg'
import UnifiedBetCard from '../../components/analytics/UnifiedBetCard'
import PerformanceCalendar, { DailyPnL } from '../../components/analytics/PerformanceCalendar'
import DailyBetsModal from '../../components/analytics/DailyBetsModal'
import { groupBetsByParlay } from '../../services/parlayGrouping'
import TrueSharpShield from '../../components/common/TrueSharpShield'
import SellerProfileModal from '../../components/marketplace/SellerProfileModal'
import UpgradeToProModal from '../../components/upgrade/UpgradeToProModal'
import ReferralWelcomeModal from '../../components/common/ReferralWelcomeModal'
import { useAuth } from '../../contexts/AuthContext'
import {
  DashboardStats,
  fetchDashboardStats,
  fetchProfitData,
  fetchTodaysBets,
  ProcessedBets,
  ProfitData,
} from '../../lib/dashboardApi'
import { supabase } from '../../lib/supabase'
import {
  FinancialMetrics,
  StripeSellerData,
  stripeSellerDataService,
} from '../../services/stripeSellerDataService'
import { MarketplaceStrategy, fetchMarketplaceLeaderboard } from '../../services/supabaseAnalytics'
import { globalStyles } from '../../styles/globalStyles'
import { theme } from '../../styles/theme'

/**
 * Dashboard Screen - Enhanced UI Implementation
 *
 * Key Improvements:
 * 1. Consistent 12px corner radius, subtle shadows, 16px padding across all cards
 * 2. TrueSharp shield logos positioned in top-left corner of each card
 * 3. Fixed header text overlap issues with proper responsive layout
 * 4. Replaced purple accents with TrueSharp blue throughout Performance Overview
 * 5. Corrected win % calculation to exclude pushes: wins / (wins + losses) * 100
 * 6. Enhanced profile image display with avatar_url fallback and error handling
 * 7. Added navigation wiring for Games, Marketplace, and Subscriptions
 * 8. Improved data integrity with safe fallbacks for missing values
 * 9. Cleaned up chart styling and reduced visual noise
 * 10. Responsive design optimizations for various iPhone screen sizes
 */

interface ProfileData {
  profile_picture_url: string | null
  display_name: string | null
  username: string | null
  pro: string
  is_seller: boolean
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    roi: 0,
    todaysBets: 0,
    activeBets: 0,
  })
  const [todaysBets, setTodaysBets] = useState<ProcessedBets>({
    straight_bets: [],
    parlay_groups: [],
  })
  const [profitData, setProfitData] = useState<ProfitData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [dailyPnLData, setDailyPnLData] = useState<DailyPnL[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [timeframeStats, setTimeframeStats] = useState({ winRate: 0, totalBets: 0, totalProfit: 0 })
  const [marketplaceStrategies, setMarketplaceStrategies] = useState<MarketplaceStrategy[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true)
  const [selectedSellerUsername, setSelectedSellerUsername] = useState<string | null>(null)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDailyBetsModal, setShowDailyBetsModal] = useState(false)
  const [selectedDayData, setSelectedDayData] = useState<any>(null)
  const [stripeData, setStripeData] = useState<StripeSellerData | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null)
  const [monetizedStrategiesCount, setMonetizedStrategiesCount] = useState(0)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [userUnitSize, setUserUnitSize] = useState<number>(1000) // Default to $10 (1000 cents)

  // Referral welcome modal state
  const [showReferralWelcome, setShowReferralWelcome] = useState(false)
  const [referralCreatorInfo, setReferralCreatorInfo] = useState<{
    username: string
    profile_picture_url: string | null
  } | null>(null)

  // Refs for performance cards
  const performanceCardRef = useRef<View>(null)
  const shareTemplateRef = useRef<View>(null)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    Promise.all([
      fetchProfileData(),
      loadDashboardData(),
      fetchMarketplaceData(),
      fetchSubscriptionsData(),
      fetchStripeData(),
    ]).finally(() => setRefreshing(false))
  }, [])

  const fetchProfileData = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture_url, display_name, username, pro, is_seller')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile data:', error)
        return
      }

      setProfileData(data)
    } catch (error) {
      console.error('Error fetching profile data:', error)
    }
  }

  const loadDashboardData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const [dashboardStats, todaysData, profitAnalytics] = await Promise.all([
        fetchDashboardStats(user.id),
        fetchTodaysBets(user.id),
        fetchProfitData(user.id, selectedPeriod),
      ])

      setStats(dashboardStats)
      setTodaysBets(todaysData)
      setProfitData(profitAnalytics.profitData)
      setTimeframeStats({
        winRate: profitAnalytics.winRate,
        totalBets: profitAnalytics.totalBets,
        totalProfit: profitAnalytics.totalProfit,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyticsData = async (period: 'month' | 'year') => {
    if (!user?.id) return

    try {
      setAnalyticsLoading(true)
      const profitAnalytics = await fetchProfitData(user.id, period)
      setProfitData(profitAnalytics.profitData)
      setTimeframeStats({
        winRate: profitAnalytics.winRate,
        totalBets: profitAnalytics.totalBets,
        totalProfit: profitAnalytics.totalProfit,
      })
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handlePeriodChange = (period: 'month' | 'year') => {
    setSelectedPeriod(period)
    loadAnalyticsData(period)
  }

  // Fetch daily P/L data and update metrics for calendar with parlay awareness
  const fetchDailyPnLData = async (month: number, year: number) => {
    if (!user?.id) return

    try {
      // Get start and end of the selected month in local timezone
      const startDate = new Date(year, month, 1, 0, 0, 0, 0)
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999) // End of last day of month
      
      // Fetch all bets for the month using placed_at like analytics screen
      const { data: bets, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .gte('placed_at', startDate.toISOString())
        .lte('placed_at', endDate.toISOString())
        .order('placed_at', { ascending: true })

      if (error) {
        console.error('Error fetching daily P/L data:', error)
        return
      }

      if (!bets || bets.length === 0) {
        setDailyPnLData([])
        return
      }

      // Process bets exactly like analytics screen using the same logic
      const { parlays, singles } = processAnalyticsBets(bets)
      const dailyPnLMap = new Map<string, number>()
      const dailyStakeMap = new Map<string, number>()

      // Process single bets like analytics screen
      singles.forEach(bet => {
        const betDate = bet.placed_at || bet.game_date
        if (!betDate) return
        
        // Handle timezone properly to avoid date offset issues
        const betDateObj = new Date(betDate)
        const dateKey = betDateObj.getFullYear() + '-' + 
          String(betDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
          String(betDateObj.getDate()).padStart(2, '0')
        
        // Initialize maps if needed
        if (!dailyPnLMap.has(dateKey)) {
          dailyPnLMap.set(dateKey, 0)
        }
        if (!dailyStakeMap.has(dateKey)) {
          dailyStakeMap.set(dateKey, 0)
        }
        
        // Add stake for all bets (settled and pending)
        dailyStakeMap.set(dateKey, dailyStakeMap.get(dateKey)! + (bet.stake || 0))
        
        // Add profit only for settled bets
        if (bet.status === 'won' || bet.status === 'lost') {
          // Use actual profit field from database, fall back to calculation only if null
          let profit = 0
          if (bet.profit !== null && bet.profit !== undefined) {
            profit = bet.profit
          } else if (bet.status === 'won') {
            profit = (bet.potential_payout || 0) - (bet.stake || 0)
          } else if (bet.status === 'lost') {
            profit = -(bet.stake || 0)
          }
          
          dailyPnLMap.set(dateKey, dailyPnLMap.get(dateKey)! + profit)
        }
      })

      // Process parlay bets like analytics screen
      parlays.forEach(parlay => {
        const parlayDate = parlay.legs[0]?.placed_at || parlay.legs[0]?.game_date
        if (!parlayDate) return
        
        // Handle timezone properly to avoid date offset issues
        const parlayDateObj = new Date(parlayDate)
        const dateKey = parlayDateObj.getFullYear() + '-' + 
          String(parlayDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
          String(parlayDateObj.getDate()).padStart(2, '0')
        
        // Initialize maps if needed
        if (!dailyPnLMap.has(dateKey)) {
          dailyPnLMap.set(dateKey, 0)
        }
        if (!dailyStakeMap.has(dateKey)) {
          dailyStakeMap.set(dateKey, 0)
        }
        
        // Add stake for all parlays (settled and pending)
        dailyStakeMap.set(dateKey, dailyStakeMap.get(dateKey)! + (parlay.stake || 0))
        
        // Add profit only for settled parlays
        if (parlay.status === 'won' || parlay.status === 'lost') {
          // Use parlay profit directly (already calculated in processAnalyticsBets)
          dailyPnLMap.set(dateKey, dailyPnLMap.get(dateKey)! + parlay.profit)
        }
      })

      // Convert maps to array, combining profit and stake data
      const allDates = new Set([...dailyPnLMap.keys(), ...dailyStakeMap.keys()])
      const dailyData: DailyPnL[] = Array.from(allDates).map(date => ({
        date,
        profit: dailyPnLMap.get(date) || 0,
        stake: dailyStakeMap.get(date) || 0
      }))

      setDailyPnLData(dailyData)

      // Update timeframe stats to reflect the selected month/year using analytics logic
      const { parlays: processedParlays, singles: processedSingles } = processAnalyticsBets(bets)
      
      // Count bets like analytics screen - parlays count as 1 bet, not per leg
      const totalBets = processedParlays.length + processedSingles.length
      
      // Calculate settled bets and win rate using parlay-aware logic
      const settledParlays = processedParlays.filter(parlay => parlay.status === 'won' || parlay.status === 'lost')
      const settledSingles = processedSingles.filter(single => single.status === 'won' || single.status === 'lost')
      const wonParlays = processedParlays.filter(parlay => parlay.status === 'won').length
      const wonSingles = processedSingles.filter(single => single.status === 'won').length
      
      const totalSettled = settledParlays.length + settledSingles.length
      const totalWon = wonParlays + wonSingles
      const winRate = totalSettled > 0 ? (totalWon / totalSettled) * 100 : 0
      
      // Calculate total profit for the selected period
      const totalProfit = dailyData.reduce((sum, day) => sum + day.profit, 0)
      
      setTimeframeStats({
        winRate,
        totalBets,
        totalProfit,
      })
    } catch (error) {
      console.error('Error calculating daily P/L:', error)
      setDailyPnLData([])
      setTimeframeStats({ winRate: 0, totalBets: 0, totalProfit: 0 })
    }
  }

  // Helper function to process bets exactly like analytics screen
  const processAnalyticsBets = (bets: any[]): { parlays: any[], singles: any[] } => {
    const parlayGroups = new Map<string, any[]>()
    const singles: any[] = []

    // Group bets by parlay_id or treat as singles
    bets.forEach(bet => {
      if (bet.parlay_id && bet.is_parlay) {
        if (!parlayGroups.has(bet.parlay_id)) {
          parlayGroups.set(bet.parlay_id, [])
        }
        parlayGroups.get(bet.parlay_id)!.push(bet)
      } else {
        singles.push(bet)
      }
    })

    // Process parlays to determine outcomes
    const parlays: any[] = Array.from(parlayGroups.entries()).map(([parlay_id, legs]) => {
      const firstLeg = legs[0]
      const stake = firstLeg.stake || 0
      const potential_payout = firstLeg.potential_payout || 0

      // For parlays, use the profit field from the database if available
      let profit = 0
      let status: 'won' | 'lost' | 'pending' | 'void' | 'push'

      // Check if we have a profit value from the database
      if (firstLeg.profit !== null && firstLeg.profit !== undefined) {
        profit = firstLeg.profit
        // Determine status based on profit value
        if (profit > 0) {
          status = 'won'
        } else if (profit < 0) {
          status = 'lost'
        } else {
          status = (firstLeg.status as any) || 'pending'
        }
      } else {
        // Fall back to leg-by-leg analysis if no profit field
        const settledLegs = legs.filter(
          leg =>
            leg.status === 'won' ||
            leg.status === 'lost' ||
            leg.status === 'void' ||
            leg.status === 'push'
        )
        const wonLegs = legs.filter(leg => leg.status === 'won')
        const lostLegs = legs.filter(leg => leg.status === 'lost')
        const voidLegs = legs.filter(leg => leg.status === 'void')

        // Determine parlay status based on leg results
        if (settledLegs.length === legs.length) {
          if (lostLegs.length > 0) {
            status = 'lost'
            profit = -stake
          } else if (voidLegs.length === legs.length) {
            status = 'void'
            profit = 0
          } else if (wonLegs.length === legs.length - voidLegs.length) {
            status = 'won'
            profit = potential_payout - stake
          } else {
            status = 'pending'
            profit = 0
          }
        } else {
          status = 'pending'
          profit = 0
        }
      }

      // Calculate parlay odds from potential payout and stake
      const calculateOddsFromPayout = (payout: number, stake: number): number => {
        if (stake === 0) return 0;
        const profit = payout - stake;
        if (profit === 0) return 0;
        
        // Convert to American odds
        if (profit > 0) {
          return Math.round((profit / stake) * 100);
        } else {
          return Math.round((stake / Math.abs(profit)) * -100);
        }
      };

      const odds = calculateOddsFromPayout(potential_payout, stake);

      return {
        parlay_id,
        legs: legs.sort((a: any, b: any) => new Date(a.placed_at || '').getTime() - new Date(b.placed_at || '').getTime()),
        stake,
        potential_payout,
        odds,
        status,
        profit,
      }
    })

    return { parlays, singles }
  }

  // Handle day press to show daily bets modal
  const handleDayPress = async (dateString: string) => {
    try {
      if (!user?.id) return;

      // Fetch bets for a wider date range to ensure we get all parlay legs
      // Then filter to exact date after grouping
      const startDate = new Date(dateString);
      startDate.setDate(startDate.getDate() - 1); // Start from day before
      const endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 2); // End day after

      const { data: allBets, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .gte('placed_at', startDate.toISOString())
        .lt('placed_at', endDate.toISOString())
        .order('placed_at', { ascending: true });

      if (error) {
        console.error('Error fetching bets for daily modal:', error);
        return;
      }

      if (!allBets || allBets.length === 0) {
        setSelectedDayData({
          date: dateString,
          bets: [],
          profit: 0,
          totalBets: 0,
          winRate: 0,
          totalStake: 0,
        });
        setShowDailyBetsModal(true);
        return;
      }

      // Group bets into parlays and singles FIRST (like analytics screen)
      const { parlays, singles } = groupBetsByParlay(allBets);
      
      // Filter by the selected date AFTER grouping
      const selectedDateKey = dateString; // YYYY-MM-DD format
      
      const filteredSingles = singles.filter(bet => {
        if (!bet.placed_at) return false;
        const betDate = new Date(bet.placed_at);
        const betDateKey = betDate.getFullYear() + '-' + 
          String(betDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(betDate.getDate()).padStart(2, '0');
        return betDateKey === selectedDateKey;
      });
      
      const filteredParlays = parlays.filter(parlay => {
        if (!parlay.placed_at) return false;
        const parlayDate = new Date(parlay.placed_at);
        const parlayDateKey = parlayDate.getFullYear() + '-' + 
          String(parlayDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(parlayDate.getDate()).padStart(2, '0');
        return parlayDateKey === selectedDateKey;
      });

      const dayBets = [...filteredSingles, ...filteredParlays];
      
      if (dayBets.length === 0) {
        setSelectedDayData({
          date: dateString,
          bets: [],
          profit: 0,
          totalBets: 0,
          winRate: 0,
          totalStake: 0,
        });
        setShowDailyBetsModal(true);
        return;
      }
      
      // Calculate metrics
      const settledBets = dayBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
      const wonBets = settledBets.filter(bet => bet.status === 'won');
      const totalProfit = settledBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
      const totalStake = dayBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
      const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;

      setSelectedDayData({
        date: dateString,
        bets: dayBets,
        profit: totalProfit,
        totalBets: dayBets.length,
        winRate: winRate,
        totalStake: totalStake,
      });
      
      setShowDailyBetsModal(true);
    } catch (error) {
      console.error('Error handling day press:', error);
    }
  };

  // Helper function to process bets (adapted from dashboardApi.ts)
  const processBets = (bets: any[]): { straight_bets: any[], parlay_groups: any[] } => {
    const straightBets: any[] = []
    const parlayMap = new Map<string, any[]>()

    bets.forEach(bet => {
      if (bet.is_parlay && bet.parlay_id) {
        if (!parlayMap.has(bet.parlay_id)) {
          parlayMap.set(bet.parlay_id, [])
        }
        parlayMap.get(bet.parlay_id)!.push(bet)
      } else {
        straightBets.push(bet)
      }
    })

    const parlayGroups: any[] = []
    parlayMap.forEach((legs, parlayId) => {
      const wonLegs = legs.filter(leg => leg.status === 'won').length
      const lostLegs = legs.filter(leg => leg.status === 'lost').length
      const voidLegs = legs.filter(leg => leg.status === 'void').length
      const pendingLegs = legs.filter(leg => leg.status === 'pending').length

      let parlayStatus = 'pending'
      if (lostLegs > 0) {
        parlayStatus = 'lost'
      } else if (voidLegs === legs.length) {
        parlayStatus = 'void'
      } else if (wonLegs === legs.length) {
        parlayStatus = 'won'
      }

      const legWithStake = legs.find(leg => leg.stake && leg.stake > 0) || legs[0]

      parlayGroups.push({
        parlay_id: parlayId,
        legs: legs.sort((a: any, b: any) => new Date(a.placed_at || '').getTime() - new Date(b.placed_at || '').getTime()),
        total_stake: legWithStake?.stake || 0,
        total_potential_payout: legWithStake?.potential_payout || 0,
        status: parlayStatus,
        placed_at: legs[0]?.placed_at || '',
      })
    })

    return { straight_bets: straightBets, parlay_groups: parlayGroups }
  }

  const fetchMarketplaceData = async () => {
    try {
      setMarketplaceLoading(true)
      
      // Use the same algorithm as MarketplaceScreen - fetch top 3 strategies using marketplace ranking
      const data = await fetchMarketplaceLeaderboard(3)
      setMarketplaceStrategies(data)
    } catch (error) {
      console.error('Error fetching marketplace data:', error)
      setMarketplaceStrategies([])
    } finally {
      setMarketplaceLoading(false)
    }
  }

  const fetchSubscriptionsData = async () => {
    if (!user?.id) {
      setSubscriptionsLoading(false)
      return
    }

    try {
      setSubscriptionsLoading(true)

      // Fetch active subscriptions directly from Supabase like the web app
      const { data, error } = await supabase
        .from('subscriptions')
        .select(
          `
          id,
          subscriber_id,
          seller_id,
          strategy_id,
          status,
          frequency,
          price,
          currency,
          created_at,
          updated_at,
          cancelled_at,
          current_period_start,
          current_period_end,
          next_billing_date,
          stripe_subscription_id,
          strategies!subscriptions_strategy_id_fkey (
            name,
            description
          ),
          seller_profiles:profiles!subscriptions_seller_id_fkey (
            username,
            display_name,
            profile_picture_url,
            is_verified_seller
          )
        `
        )
        .eq('subscriber_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching subscriptions data:', error)
        setSubscriptions([])
      } else {
        // Transform data to match expected format
        const transformedData = (data || []).map((sub: any) => ({
          ...sub,
          strategy_name: sub.strategies?.name || 'Strategy',
          strategy_description: sub.strategies?.description || '',
          seller_username: sub.seller_profiles?.username || '',
          seller_display_name: sub.seller_profiles?.display_name || '',
          seller_profile: sub.seller_profiles,
        }))
        setSubscriptions(transformedData)
      }
    } catch (error) {
      console.error('Error fetching subscriptions data:', error)
      setSubscriptions([])
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  const fetchStripeData = async () => {
    if (!user?.id) {
      setStripeLoading(false)
      return
    }

    try {
      setStripeLoading(true)

      // Fetch Stripe data using the same service as SellScreen
      const stripeSellerData = await stripeSellerDataService.fetchSellerStripeData(user.id)
      setStripeData(stripeSellerData)

      // Get fallback subscription data for metrics calculation
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select(
          `
          id,
          price,
          frequency,
          strategies (
            name
          )
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Convert to financial metrics using the same logic as SellScreen
      const metrics = stripeSellerDataService.convertStripeDataToFinancialMetrics(
        stripeSellerData,
        subscriptionData || []
      )
      setFinancialMetrics(metrics)

      // Get count of monetized strategies
      const { count: strategiesCount } = await supabase
        .from('strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('monetized', true)

      setMonetizedStrategiesCount(strategiesCount || 0)
    } catch (error) {
      console.error('Error fetching Stripe data:', error)
      setStripeData(null)
      setFinancialMetrics(null)
    } finally {
      setStripeLoading(false)
    }
  }

  const SimpleLineChart = ({
    data,
    selectedPeriod,
  }: {
    data: ProfitData[]
    selectedPeriod: 'week' | 'month' | 'year'
  }) => {
    if (data.length === 0) return null

    const width = 300 // Optimized width to fit screen better
    const height = 160 // Reduced height for better card proportions
    const leftPadding = 45 // Optimized space for Y-axis labels
    const rightPadding = 15 // Reduced right padding
    const topPadding = 15 // Reduced top padding
    const bottomPadding = 30 // Reduced bottom padding
    const chartWidth = width - leftPadding - rightPadding
    const chartHeight = height - topPadding - bottomPadding

    // Find min and max values for scaling (ensure 0 is always included)
    const profits = data.map(d => d.profit)
    const minProfit = Math.min(0, ...profits)
    const maxProfit = Math.max(0, ...profits)
    const profitRange = maxProfit - minProfit || 100 // Minimum range of 100 for visibility

    // Add some padding to the range for better visualization
    const paddedMin = minProfit - profitRange * 0.1
    const paddedMax = maxProfit + profitRange * 0.1
    const paddedRange = paddedMax - paddedMin

    // Scale functions
    const scaleX = (index: number) =>
      (index / Math.max(data.length - 1, 1)) * chartWidth + leftPadding
    const scaleY = (profit: number) =>
      topPadding + ((paddedMax - profit) / paddedRange) * chartHeight

    // Generate Y-axis labels
    const getYAxisLabels = () => {
      const labelCount = 5
      const labels: { y: number; label: string }[] = []

      for (let i = 0; i < labelCount; i++) {
        const value = paddedMin + (i / (labelCount - 1)) * paddedRange
        const displayValue =
          value >= 1000
            ? `$${(value / 1000).toFixed(1)}k`
            : value <= -1000
              ? `-$${Math.abs(value / 1000).toFixed(1)}k`
              : `$${Math.round(value)}`

        labels.push({
          y: scaleY(value),
          label: displayValue,
        })
      }

      return labels.reverse() // Reverse to show highest at top
    }

    // Generate X-axis labels based on timeframe and data
    const getXAxisLabels = () => {
      const labels: { x: number; label: string }[] = []
      const labelCount = Math.min(5, data.length)

      for (let i = 0; i < labelCount; i++) {
        const dataIndex =
          labelCount === 1 ? 0 : Math.floor((i / (labelCount - 1)) * (data.length - 1))
        const point = data[dataIndex]
        if (!point || !point.date) continue // Skip if point or date is undefined
        const date = new Date(point.date)
        if (isNaN(date.getTime())) continue // Skip if date is invalid

        let label = ''
        if (selectedPeriod === 'week') {
          label = date.toLocaleDateString('en-US', { weekday: 'short' })
        } else if (selectedPeriod === 'month') {
          label = date.getDate().toString()
        } else {
          label = date.toLocaleDateString('en-US', { month: 'short' })
        }

        labels.push({
          x: scaleX(dataIndex),
          label,
        })
      }

      return labels
    }

    // Generate path string for the line with smooth curves
    const pathData = data
      .map((point, index) => {
        const x = scaleX(index)
        const y = scaleY(point.profit)
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })
      .join(' ')

    // Add gradient area under the line
    const areaData =
      data.length > 0
        ? `M ${scaleX(0)} ${scaleY(0)} ` +
          data.map((point, index) => `L ${scaleX(index)} ${scaleY(point.profit)}`).join(' ') +
          ` L ${scaleX(data.length - 1)} ${scaleY(0)} Z`
        : ''

    const zeroY = scaleY(0)
    const yAxisLabels = getYAxisLabels()
    const xAxisLabels = getXAxisLabels()
    const lineColor = timeframeStats.totalProfit >= 0 ? '#059669' : '#DC2626'
    const areaColor = timeframeStats.totalProfit >= 0 ? '#05966920' : '#DC262620'

    return (
      <View style={styles.chartContainer}>
        <Svg width={width} height={height} style={styles.chartSvg}>
          {/* Background grid lines */}
          {yAxisLabels.map((label, index) => (
            <SvgLine
              key={`grid-${index}`}
              x1={leftPadding}
              y1={label.y}
              x2={width - rightPadding}
              y2={label.y}
              stroke="#F3F4F6"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}

          {/* Zero line (highlighted) */}
          <SvgLine
            x1={leftPadding}
            y1={zeroY}
            x2={width - rightPadding}
            y2={zeroY}
            stroke="#9CA3AF"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.8"
          />

          {/* Y-axis */}
          <SvgLine
            x1={leftPadding}
            y1={topPadding}
            x2={leftPadding}
            y2={topPadding + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="1"
          />

          {/* X-axis */}
          <SvgLine
            x1={leftPadding}
            y1={topPadding + chartHeight}
            x2={width - rightPadding}
            y2={topPadding + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="1"
          />

          {/* Area under the line */}
          {areaData && <Path d={areaData} fill={areaColor} />}

          {/* Profit line */}
          <Path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points - smaller for smoother appearance */}
          {data.map((point, index) => {
            // Make points smaller for month/year views, slightly larger for week
            const pointRadius = selectedPeriod === 'week' ? 3 : 2
            const strokeWidth = selectedPeriod === 'week' ? 1.5 : 1

            return (
              <Circle
                key={index}
                cx={scaleX(index)}
                cy={scaleY(point.profit)}
                r={pointRadius}
                fill={lineColor}
                stroke="white"
                strokeWidth={strokeWidth}
              />
            )
          })}

          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => (
            <SvgText
              key={`y-${index}`}
              x={leftPadding - 6}
              y={label.y + 3}
              fontSize="9"
              fill="#6B7280"
              textAnchor="end"
              fontWeight="500"
            >
              {label.label}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {xAxisLabels.map((label, index) => (
            <SvgText
              key={`x-${index}`}
              x={label.x}
              y={topPadding + chartHeight + 20}
              fontSize="9"
              fill="#6B7280"
              textAnchor="middle"
              fontWeight="500"
            >
              {label.label}
            </SvgText>
          ))}
        </Svg>
      </View>
    )
  }

  useEffect(() => {
    fetchProfileData()
    loadDashboardData()
    fetchMarketplaceData()
    fetchSubscriptionsData()
    fetchStripeData()
    if (user?.id) {
      fetchDailyPnLData(selectedMonth, selectedYear)
    }
  }, [user?.id])

  // Load daily P/L data when month/year changes
  useEffect(() => {
    if (user?.id) {
      fetchDailyPnLData(selectedMonth, selectedYear)
    }
  }, [selectedMonth, selectedYear, user?.id])

  // Fetch user's unit size from analytics_settings
  useEffect(() => {
    const fetchUserUnitSize = async () => {
      if (!user?.id) {
        setUserUnitSize(1000) // Default to $10
        return
      }

      try {
        const { data, error } = await supabase
          .from('analytics_settings')
          .select('unit_size')
          .eq('user_id', user.id)
          .single()

        if (error) {
          // Default unit size is $10 (1000 cents)
          setUserUnitSize(1000)
          return
        }

        // Unit size is already in cents in the database
        setUserUnitSize(data?.unit_size || 1000)
      } catch {
        // Default unit size is $10 (1000 cents)
        setUserUnitSize(1000)
      }
    }

    fetchUserUnitSize()
  }, [user?.id])

  // Check for referral welcome popup
  useEffect(() => {
    const checkReferralWelcome = async (retryCount = 0) => {
      if (!user?.id) return

      try {
        const { Environment } = await import('../../config/environment')
        const response = await fetch(
          `${Environment.API_BASE_URL}/api/creator-codes/welcome-info?user_id=${user.id}`
        )
        const data = await response.json()

        if (data.success && data.show_welcome && data.creator) {
          setReferralCreatorInfo({
            username: data.creator.username,
            profile_picture_url: data.creator.profile_picture_url,
          })
          setShowReferralWelcome(true)
        } else if (retryCount < 2) {
          // Retry after delay in case grant-pro hasn't completed yet
          setTimeout(() => checkReferralWelcome(retryCount + 1), 2000)
        }
      } catch (error) {
        console.error('Error checking referral welcome:', error)
      }
    }

    // Initial delay to allow grant-pro API to complete after signup
    const timer = setTimeout(() => checkReferralWelcome(), 1500)
    return () => clearTimeout(timer)
  }, [user?.id])

  const handleReferralWelcomeClose = async () => {
    setShowReferralWelcome(false)

    // Mark as seen on the server
    if (user?.id) {
      try {
        const { Environment } = await import('../../config/environment')
        await fetch(`${Environment.API_BASE_URL}/api/creator-codes/welcome-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        })
      } catch (error) {
        console.error('Error marking welcome as seen:', error)
      }
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getDisplayName = () => {
    if (profileData?.display_name) return profileData.display_name
    if (profileData?.username) return profileData.username
    if (user?.username) return user.username
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const isProUser = () => {
    return profileData?.pro === 'yes'
  }

  const getProfilePicture = () => {
    return profileData?.profile_picture_url
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleSharePerformance = async () => {
    try {
      setIsGeneratingImage(true)
      
      // Delay to ensure the card is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Capture the shareable performance card as an image
      const uri = await captureRef(shareTemplateRef.current, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
        width: Math.min(400, Dimensions.get('window').width - 32),
      })

      const shareMessage = `Check out my performance on TrueSharp! 🎯\n\nTotal P/L: ${formatProfitLossInUnits(timeframeStats.totalProfit, userUnitSize)}\nWin Rate: ${timeframeStats.winRate.toFixed(1)}%\nTotal Bets: ${timeframeStats.totalBets}\n\nDownload TrueSharp: truesharp.io`

      await Share.share({
        url: uri,
        message: shareMessage,
      })
    } catch (error) {
      console.error('Error generating share image:', error)
      Alert.alert('Error', 'Failed to generate share image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const totalBetsToday = todaysBets.straight_bets.length + todaysBets.parlay_groups.length

  // Calculate combined parlay odds from individual leg odds
  const calculateParlayOdds = (legs: any[]): string => {
    // Convert American odds to decimal and multiply
    let combinedDecimal = 1

    for (const leg of legs) {
      const odds = typeof leg.odds === 'string' ? parseFloat(leg.odds) : leg.odds
      if (isNaN(odds)) continue

      // Convert American to decimal
      let decimal: number
      if (odds > 0) {
        decimal = odds / 100 + 1
      } else {
        decimal = 100 / Math.abs(odds) + 1
      }

      combinedDecimal *= decimal
    }

    // Convert back to American odds
    const americanOdds =
      combinedDecimal >= 2
        ? Math.round((combinedDecimal - 1) * 100)
        : Math.round(-100 / (combinedDecimal - 1))

    return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`
  }

  // Group today's bets for enhanced display
  const groupedTodaysBets = useMemo(() => {
    // Convert ProcessedBets format to the format expected by UnifiedBetCard
    const convertedParlays = todaysBets.parlay_groups.map(parlayGroup => ({
      parlay_id: parlayGroup.parlay_id,
      legs: parlayGroup.legs,
      sport: parlayGroup.legs.length > 0 ? parlayGroup.legs[0].sport : 'Unknown',
      stake: parlayGroup.total_stake,
      potential_payout: parlayGroup.total_potential_payout,
      odds: calculateParlayOdds(parlayGroup.legs),
      status: parlayGroup.status,
      profit:
        parlayGroup.status === 'won'
          ? parlayGroup.total_potential_payout - parlayGroup.total_stake
          : parlayGroup.status === 'lost'
            ? -parlayGroup.total_stake
            : 0,
      placed_at: parlayGroup.placed_at,
    }))

    return {
      singles: todaysBets.straight_bets,
      parlays: convertedParlays,
    }
  }, [todaysBets])

  // Create unified list for rendering
  const unifiedTodaysBetsList = useMemo(() => {
    const allBets = [...groupedTodaysBets.parlays, ...groupedTodaysBets.singles]

    return allBets
      .sort((a, b) => {
        const aDate = 'legs' in a ? a.placed_at : a.placed_at || ''
        const bDate = 'legs' in b ? b.placed_at : b.placed_at || ''
        return bDate.localeCompare(aDate)
      })
      .slice(0, 3) // Show only first 3 bets for dashboard preview
  }, [groupedTodaysBets])

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
        <LinearGradient colors={['#EBF4FF', '#FFFFFF', '#E0F7FA']} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  // Utility functions for unit formatting in shared images
  const formatUnits = (valueInDollars: number, unitSizeInCents: number): string => {
    // Convert unit size from cents to dollars
    const unitSizeInDollars = unitSizeInCents / 100
    // Calculate units
    const units = valueInDollars / unitSizeInDollars
    
    if (Math.abs(units) >= 1000) {
      // Format as 1.0ku for values over 1000
      return `${(units / 1000).toFixed(1)}ku`
    } else {
      // Format as XXX.X for values under 1000
      return `${units.toFixed(1)}U`
    }
  }

  const formatProfitLossInUnits = (profitLoss: number, unitSizeInCents: number): string => {
    const unitsString = formatUnits(Math.abs(profitLoss), unitSizeInCents)
    return profitLoss >= 0 ? `+${unitsString}` : `-${unitsString}`
  }

  // Shareable Performance Card component for image generation
  const ShareablePerformanceCard = () => (
    <View ref={shareTemplateRef} style={styles.shareableCard}>
      <View style={styles.shareableHeader}>
        <View style={styles.shareableHeaderLeft}>
          <View style={styles.titleWithShield}>
            {getProfilePicture() ? (
              <Image
                source={{ uri: getProfilePicture()! }}
                style={styles.shareableProfileImage}
              />
            ) : (
              <View style={styles.shareableProfileImagePlaceholder}>
                <Text style={styles.shareableProfileInitial}>
                  {getDisplayName().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.titleTextContainer}>
              <Text style={styles.analyticsTitle}>Performance Overview</Text>
              <Text style={styles.analyticsSubtitle}>Your betting performance</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.primaryMetric}>
          <View
            style={[
              styles.metricIconContainer,
              {
                backgroundColor: timeframeStats.totalProfit >= 0 ? '#059669' : '#DC2626',
              },
            ]}
          >
            <Ionicons
              name={timeframeStats.totalProfit >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color="white"
            />
          </View>
          <View style={styles.metricContent}>
            <Text
              style={[
                styles.primaryMetricValue,
                {
                  color: timeframeStats.totalProfit >= 0 ? '#059669' : '#DC2626',
                },
              ]}
            >
              {formatProfitLossInUnits(timeframeStats.totalProfit, userUnitSize)}
            </Text>
            <Text style={styles.primaryMetricLabel}>
              Total P/L
            </Text>
          </View>
        </View>

        <View style={styles.secondaryMetrics}>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>
              {timeframeStats.winRate.toFixed(1)}%
            </Text>
            <Text style={styles.secondaryMetricLabel}>Win Rate</Text>
          </View>
          <View style={styles.secondaryMetric}>
            <Text style={styles.secondaryMetricValue}>{timeframeStats.totalBets}</Text>
            <Text style={styles.secondaryMetricLabel}>Total Bets</Text>
          </View>
        </View>
      </View>

      {/* Performance Calendar */}
      <View style={styles.calendarContainer}>
        <PerformanceCalendar
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          dailyPnL={dailyPnLData}
          onDayPress={() => {}} // Disable interaction in share template
          unitSize={userUnitSize}
          showUnits={true} // Always show units in shared image
        />
      </View>
    </View>
  )

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
      <LinearGradient colors={['#EBF4FF', '#FFFFFF', '#E0F7FA']} style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Welcome Banner */}
          <LinearGradient
            colors={theme.colors.gradient.welcome as any}
            style={styles.welcomeSection}
          >
            <View style={styles.welcomeContent}>
              <View style={styles.profileContainer}>
                {getProfilePicture() ? (
                  <Image
                    source={{ uri: getProfilePicture()! }}
                    style={styles.profileImage}
                    defaultSource={require('../../../assets/icon.png')}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileInitial}>
                      {getDisplayName().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                </View>
              </View>

              <View style={styles.welcomeInfo}>
                <View style={styles.welcomeHeader}>
                  <Text style={styles.welcomeTitle}>
                    {getGreeting()}, {getDisplayName()}!
                  </Text>

                  {/* Pro Member Badge */}
                  {isProUser() && (
                    <View style={styles.proBadge}>
                      <TrueSharpShield size={14} variant="light" />
                      <Text style={styles.proBadgeText}>Pro Member</Text>
                    </View>
                  )}
                </View>

                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.dateText}>{getCurrentDate()}</Text>
                </View>

                {/* Status badges */}
                <View style={styles.badgesContainer}>
                  {profileData?.is_seller && (
                    <View style={styles.sellerBadge}>
                      <Ionicons name="star" size={12} color="#10B981" />
                      <Text style={styles.badgeText}>Seller</Text>
                    </View>
                  )}

                  {/* Subscribe to Pro CTA if not pro */}
                  {!isProUser() && (
                    <TouchableOpacity
                      style={styles.upgradeProButton}
                      onPress={() => setShowUpgradeModal(true)}
                    >
                      <LinearGradient
                        colors={['rgba(59, 130, 246, 0.9)', 'rgba(37, 99, 235, 0.9)']}
                        style={styles.upgradeProGradient}
                      >
                        <Ionicons name="star" size={12} color="#FCD34D" />
                        <Text style={styles.upgradeProText}>Subscribe to Pro</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Dashboard Content */}
          <View style={styles.dashboardContent}>
            {/* Today's Bets - Shield Next to Text */}
            <View style={styles.todaysBetsCard}>
              <View style={styles.todaysBetsHeader}>
                <View style={styles.todaysBetsHeaderContent}>
                  <View style={styles.todaysBetsHeaderLeft}>
                    <View style={styles.titleWithShield}>
                      <TrueSharpShield
                        size={20}
                        variant="light"
                        style={{ accessibilityLabel: 'TrueSharp Dashboard Card' }}
                      />
                      <View style={styles.titleTextContainer}>
                        <Text style={styles.todaysBetsTitle}>Today's Bets</Text>
                        <Text style={styles.todaysBetsSubtitle}>Your betting activity today</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.todaysBetsHeaderRight}>
                    <View style={styles.todaysBetsCounter}>
                      <Text style={styles.todaysBetsCounterNumber}>{totalBetsToday}</Text>
                      <Text style={styles.todaysBetsCounterLabel}>
                        {totalBetsToday === 1 ? 'Bet' : 'Bets'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {totalBetsToday === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={40} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No bets placed today</Text>
                  <Text style={styles.emptySubtitle}>
                    Ready to make some winning picks? Browse today's games and start building your
                    strategy.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAction}
                    onPress={() => {
                      // Navigate to Games screen with today's date
                      try {
                        navigation.navigate(
                          'Games' as never,
                          {
                            date: new Date().toISOString().split('T')[0],
                          } as never
                        )
                      } catch (error) {}
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.primaryDark]}
                      style={styles.emptyButton}
                    >
                      <Text style={styles.emptyButtonText}>View Today's Games</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.betsContainer}>
                  <View style={styles.betsScrollView}>
                    {unifiedTodaysBetsList.slice(0, 3).map((item) => (
                      <View 
                        key={'legs' in item ? item.parlay_id : item.id}
                        style={styles.dashboardBetCardWrapper}
                      >
                        <UnifiedBetCard bet={item} />
                      </View>
                    ))}
                  </View>

                  {totalBetsToday > 3 && (
                    <TouchableOpacity
                      style={styles.viewAllBets}
                      onPress={() => {
                        try {
                          navigation.navigate(
                            'Analytics' as never,
                            {
                              initialTab: 'bets',
                            } as never
                          )
                        } catch (error) {}
                      }}
                    >
                      <Text style={styles.viewAllText}>View all {totalBetsToday} bets →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Performance Analytics - Shield Next to Text */}
            <View ref={performanceCardRef} style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <View style={styles.analyticsHeaderContent}>
                  <View style={styles.analyticsHeaderLeft}>
                    <View style={styles.titleWithShield}>
                      <TrueSharpShield
                        size={20}
                        variant="light"
                        style={{ accessibilityLabel: 'TrueSharp Performance Card' }}
                      />
                      <View style={styles.titleTextContainer}>
                        <Text style={styles.analyticsTitle}>Performance Overview</Text>
                        <Text style={styles.analyticsSubtitle}>Your betting performance</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.analyticsHeaderRight}>
                    <TouchableOpacity
                      style={[styles.shareButton, isGeneratingImage && styles.shareButtonDisabled]}
                      onPress={handleSharePerformance}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <Ionicons 
                          name="share-outline" 
                          size={20} 
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Removed period toggles - now handled by calendar dropdown */}

              {/* Streamlined Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.primaryMetric}>
                  <View
                    style={[
                      styles.metricIconContainer,
                      {
                        backgroundColor: timeframeStats.totalProfit >= 0 ? '#059669' : '#DC2626',
                      },
                    ]}
                  >
                    <Ionicons
                      name={timeframeStats.totalProfit >= 0 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color="white"
                    />
                  </View>
                  <View style={styles.metricContent}>
                    <Text
                      style={[
                        styles.primaryMetricValue,
                        {
                          color: timeframeStats.totalProfit >= 0 ? '#059669' : '#DC2626',
                        },
                      ]}
                    >
                      {timeframeStats.totalProfit >= 0 
                        ? `+$${Math.abs(timeframeStats.totalProfit) >= 1000
                            ? (timeframeStats.totalProfit / 1000).toFixed(1) + 'k'
                            : timeframeStats.totalProfit.toFixed(2)}`
                        : `-$${Math.abs(timeframeStats.totalProfit) >= 1000
                            ? (Math.abs(timeframeStats.totalProfit) / 1000).toFixed(1) + 'k'
                            : Math.abs(timeframeStats.totalProfit).toFixed(2)}`
                      }
                    </Text>
                    <Text style={styles.primaryMetricLabel}>
                      Total P/L
                    </Text>
                  </View>
                </View>

                <View style={styles.secondaryMetrics}>
                  <View style={styles.secondaryMetric}>
                    <Text style={styles.secondaryMetricValue}>
                      {timeframeStats.winRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.secondaryMetricLabel}>Win Rate</Text>
                  </View>
                  <View style={styles.secondaryMetric}>
                    <Text style={styles.secondaryMetricValue}>{timeframeStats.totalBets}</Text>
                    <Text style={styles.secondaryMetricLabel}>Total Bets</Text>
                  </View>
                </View>
              </View>

              {/* Performance Calendar */}
              <View style={styles.calendarContainer}>
                <PerformanceCalendar
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  dailyPnL={dailyPnLData}
                  onDayPress={handleDayPress}
                />
              </View>

              {/* View Analytics Button */}
              <View style={styles.analyticsButtonContainer}>
                <TouchableOpacity
                  style={styles.analyticsButton}
                  onPress={() => navigation.navigate('Analytics' as never)}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={styles.analyticsButtonGradient}
                  >
                    <Ionicons name="analytics" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.analyticsButtonText}>View Detailed Analytics</Text>
                    <Text style={styles.analyticsButtonArrow}>→</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Row - Three Column Grid */}
            <View style={styles.bottomRow}>
              {/* Marketplace Preview - Shield Next to Text */}
              <View style={[styles.previewCard, styles.thirdCard]}>
                <View style={styles.marketplaceHeader}>
                  <View style={styles.titleWithShield}>
                    <TrueSharpShield
                      size={20}
                      variant="light"
                      style={{ accessibilityLabel: 'TrueSharp Marketplace Card' }}
                    />
                    <View style={styles.titleTextContainer}>
                      <Text style={styles.marketplaceTitle}>Handicapper Spotlight</Text>
                      <Text style={styles.marketplaceSubtitle}>Top performing strategies</Text>
                    </View>
                  </View>
                </View>

                {/* Strategy Cards - Cleaner Design */}
                <View style={styles.strategyList}>
                  {marketplaceLoading ? (
                    [1, 2, 3].map(item => (
                      <View key={item} style={styles.strategyCardLoading}>
                        <ActivityIndicator size="small" color="#059669" />
                      </View>
                    ))
                  ) : marketplaceStrategies.length === 0 ? (
                    <View style={styles.emptyMarketplace}>
                      <Ionicons name="trophy" size={32} color="#D1D5DB" />
                      <Text style={styles.emptyMarketplaceText}>No strategies available</Text>
                    </View>
                  ) : (
                    marketplaceStrategies.slice(0, 3).map((strategy, index) => (
                      <TouchableOpacity
                        key={strategy.id}
                        style={styles.strategyCardClean}
                        onPress={() => {
                          setSelectedSellerUsername(strategy.username)
                          setShowSellerModal(true)
                        }}
                      >
                        <View style={styles.strategyLeftClean}>
                          <View style={styles.strategyAvatarSection}>
                            {strategy.profile_picture_url || strategy.avatar_url ? (
                              <Image
                                source={{
                                  uri: strategy.profile_picture_url || strategy.avatar_url,
                                }}
                                style={styles.strategyProfileImage}
                                defaultSource={require('../../../assets/icon.png')}
                                onError={() => {}}
                              />
                            ) : (
                              <View style={styles.strategyProfileImagePlaceholder}>
                                <Text style={styles.strategyProfileInitial}>
                                  {(strategy.username || strategy.display_name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                styles.strategyRankBadge,
                                {
                                  backgroundColor: index === 0 ? '#059669' : '#3B82F6',
                                },
                              ]}
                            >
                              <Text style={styles.strategyRankText}>#{index + 1}</Text>
                              {index === 0 && (
                                <View style={styles.crownIcon}>
                                  <Ionicons name="star" size={6} color="#FCD34D" />
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.strategyInfoClean}>
                            <Text style={styles.strategyNameClean} numberOfLines={1}>
                              {strategy.strategy_name || 'Unnamed Strategy'}
                            </Text>
                            <View style={styles.strategyMetrics}>
                              <View style={styles.roiTagClean}>
                                <Ionicons name="trending-up" size={10} color="#059669" />
                                <Text style={styles.roiTextClean}>
                                  {(strategy.roi_percentage || 0).toFixed(1)}%
                                </Text>
                              </View>
                              <Text style={styles.strategyUsernameClean}>
                                @{strategy.username || strategy.display_name || 'anonymous'}
                              </Text>
                            </View>
                            <View style={styles.strategyStatsClean}>
                              <Text style={styles.winRateTextClean}>
                                {strategy.corrected_win_rate !== undefined
                                  ? `${strategy.corrected_win_rate.toFixed(0)}% win`
                                  : strategy.win_rate
                                    ? `${(strategy.win_rate * 100).toFixed(0)}% win`
                                    : '—% win'}
                              </Text>
                              <Text style={styles.statsSeperator}>•</Text>
                              <Text style={styles.betsTextClean}>
                                {strategy.total_bets || 0} bets
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.strategyRightClean}>
                          <Text style={styles.strategyPriceClean}>
                            ${strategy.pricing_monthly || strategy.price || 25}
                          </Text>
                          <Text style={styles.strategyPeriodClean}>/mo</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* Browse All Button - Simplified */}
                <TouchableOpacity
                  style={styles.browseAllButtonClean}
                  onPress={() => {
                    // Navigate to Marketplace screen
                    try {
                      navigation.navigate('Marketplace' as never)
                    } catch (error) {}
                  }}
                >
                  <Text style={styles.browseAllTextClean}>Discover All Strategies →</Text>
                </TouchableOpacity>
              </View>

              {/* Subscriptions Preview - Shield Next to Text */}
              <View style={[styles.previewCard, styles.thirdCard]}>
                <View style={styles.subscriptionsHeader}>
                  <View style={styles.subscriptionsHeaderContent}>
                    <View style={styles.subscriptionsHeaderLeft}>
                      <View style={styles.titleWithShield}>
                        <TrueSharpShield
                          size={20}
                          variant="light"
                          style={{ accessibilityLabel: 'TrueSharp Subscriptions Card' }}
                        />
                        <View style={styles.titleTextContainer}>
                          <Text style={styles.subscriptionsTitle}>Active Subscriptions</Text>
                          <Text style={styles.subscriptionsSubtitle}>
                            Your strategy subscriptions
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.subscriptionsCount}>
                      <Text style={styles.subscriptionsCountNumber}>
                        {subscriptionsLoading ? '...' : subscriptions.length}
                      </Text>
                      <Text style={styles.subscriptionsCountLabel}>Active</Text>
                    </View>
                  </View>
                </View>

                {/* Subscription List */}
                <View style={styles.subscriptionsList}>
                  {subscriptionsLoading ? (
                    [1, 2].map(item => (
                      <View key={item} style={styles.subscriptionItemLoading}>
                        <ActivityIndicator size="small" color="#EC4899" />
                        <Text style={styles.loadingTextSecondary}>Loading subscriptions...</Text>
                      </View>
                    ))
                  ) : subscriptions.length === 0 ? (
                    <View style={styles.emptySubscriptions}>
                      <Ionicons name="heart" size={32} color="#D1D5DB" />
                      <Text style={styles.emptySubscriptionsText}>No active subscriptions</Text>
                      <Text style={styles.emptySubscriptionsSubtext}>
                        Discover winning strategies in our marketplace
                      </Text>
                    </View>
                  ) : (
                    subscriptions.slice(0, 2).map((sub, index) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.subscriptionItem}
                        onPress={() => {
                          // Navigate to Subscriptions screen or specific strategy
                          try {
                            navigation.navigate(
                              'Subscriptions' as never,
                              {
                                strategyId: sub.strategy_id,
                              } as never
                            )
                          } catch (error) {}
                        }}
                      >
                        <View style={styles.subscriptionLeft}>
                          <View style={styles.subscriptionAvatar}>
                            {sub.seller_profiles?.profile_picture_url ||
                            sub.seller_profiles?.avatar_url ? (
                              <Image
                                source={{
                                  uri:
                                    sub.seller_profiles.profile_picture_url ||
                                    sub.seller_profiles.avatar_url,
                                }}
                                style={styles.subscriptionProfileImage}
                                defaultSource={require('../../../assets/icon.png')}
                                onError={() => {}}
                              />
                            ) : (
                              <View style={styles.subscriptionProfileImagePlaceholder}>
                                <Text style={styles.subscriptionProfileInitial}>
                                  {(sub.seller_username || sub.seller_display_name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.subscriptionInfo}>
                            <Text style={styles.subscriptionName} numberOfLines={1}>
                              {sub.strategy_name || 'Strategy'}
                            </Text>
                            <Text style={styles.subscriptionSeller} numberOfLines={1}>
                              by @{sub.seller_username || sub.seller_display_name || 'seller'}
                            </Text>
                            {sub.next_billing_date && (
                              <View style={styles.subscriptionBilling}>
                                <Ionicons name="calendar" size={12} color="#9CA3AF" />
                                <Text style={styles.subscriptionBillingText}>
                                  Next:{' '}
                                  {new Date(sub.next_billing_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.subscriptionRight}>
                          <View
                            style={[
                              styles.subscriptionPriceTag,
                              {
                                backgroundColor:
                                  sub.frequency === 'weekly'
                                    ? '#FED7AA'
                                    : sub.frequency === 'yearly'
                                      ? '#F3E8FF'
                                      : '#DBEAFE',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.subscriptionPrice,
                                {
                                  color:
                                    sub.frequency === 'weekly'
                                      ? '#C2410C'
                                      : sub.frequency === 'yearly'
                                        ? '#7C3AED'
                                        : '#1E40AF',
                                },
                              ]}
                            >
                              ${sub.price || 0}/
                              {sub.frequency === 'weekly'
                                ? 'wk'
                                : sub.frequency === 'yearly'
                                  ? 'yr'
                                  : 'mo'}
                            </Text>
                          </View>
                          <TouchableOpacity>
                            <Ionicons name="open-outline" size={16} color="#3B82F6" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {/* Monthly Spend Summary */}
                {subscriptions.length > 0 && (
                  <View style={styles.monthlySpendContainer}>
                    <View style={styles.monthlySpendContent}>
                      <View style={styles.monthlySpendLeft}>
                        <Ionicons name="card" size={16} color="#3B82F6" />
                        <Text style={styles.monthlySpendLabel}>Monthly Spend:</Text>
                      </View>
                      <Text style={styles.monthlySpendAmount}>
                        $
                        {subscriptions
                          .reduce((total, sub) => {
                            const price = sub.price || 0
                            // Convert all frequencies to monthly cost
                            switch (sub.frequency) {
                              case 'weekly':
                                return total + price * 4.33 // Average weeks per month
                              case 'monthly':
                                return total + price
                              case 'yearly':
                                return total + price / 12
                              default:
                                return total + price
                            }
                          }, 0)
                          .toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.monthlySpendSubtext}>
                      Across {subscriptions.length} active{' '}
                      {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Seller Preview - Shield Next to Text */}
              <View style={[styles.previewCard, styles.thirdCard]}>
                <View style={styles.sellerHeader}>
                  <View style={styles.titleWithShield}>
                    <TrueSharpShield
                      size={20}
                      variant="light"
                      style={{ accessibilityLabel: 'TrueSharp Seller Card' }}
                    />
                    <View style={styles.titleTextContainer}>
                      <Text style={styles.sellerTitle}>Seller Overview</Text>
                      <Text style={styles.sellerSubtitle}>Your selling performance</Text>
                    </View>
                  </View>
                </View>

                {/* Revenue Stats */}
                <View style={styles.revenueSection}>
                  <View style={styles.monthlyRevenueCard}>
                    <View style={styles.revenueCardContent}>
                      <View style={styles.revenueCardLeft}>
                        <View style={styles.revenueIconContainer}>
                          <Ionicons name="cash" size={16} color={theme.colors.primary} />
                        </View>
                        <View style={styles.revenueInfo}>
                          <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                          <Text style={styles.revenueSubtext}>Current month estimate</Text>
                        </View>
                      </View>
                      <View style={styles.revenueCardRight}>
                        {stripeLoading ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <Text style={styles.revenueAmount}>
                            {stripeSellerDataService.formatCurrency(
                              financialMetrics?.revenueByFrequency.monthly || 0
                            )}
                          </Text>
                        )}
                        <View style={styles.revenueStatus}>
                          {stripeData?.hasStripeAccount ? (
                            <View
                              style={[
                                styles.noStripeTag,
                                { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
                              ]}
                            >
                              <Text style={[styles.noStripeText, { color: '#065F46' }]}>
                                {stripeData.subscriptions && stripeData.subscriptions.length > 0
                                  ? 'Live Data'
                                  : 'Stripe Ready'}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.noStripeTag}>
                              <Text style={styles.noStripeText}>No Stripe Connect</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.sellerStatsGrid}>
                    <View style={styles.sellerStatCard}>
                      <View style={styles.sellerStatIconContainer}>
                        <Ionicons name="people" size={16} color="#1E40AF" />
                      </View>
                      <Text style={styles.sellerStatNumber}>
                        {stripeLoading ? '...' : financialMetrics?.totalSubscribers || 0}
                      </Text>
                      <Text style={styles.sellerStatLabel}>Subscribers</Text>
                    </View>

                    <View style={styles.sellerStatCard}>
                      <View style={styles.sellerStatIconContainer}>
                        <Ionicons name="trending-up" size={16} color="#7C3AED" />
                      </View>
                      <Text style={styles.sellerStatNumber}>
                        {stripeLoading ? '...' : monetizedStrategiesCount}
                      </Text>
                      <Text style={styles.sellerStatLabel}>Strategies</Text>
                    </View>
                  </View>
                </View>

                {/* Call to Action */}
                <TouchableOpacity
                  style={styles.sellerCTA}
                  onPress={() => {
                    try {
                      navigation.navigate('Sell' as never)
                    } catch (error) {}
                  }}
                  accessibilityLabel="Go to Sell Dashboard"
                  accessibilityHint="Navigate to the selling dashboard to manage your strategies"
                >
                  <LinearGradient
                    colors={[theme.colors.primary, '#1E40AF', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sellerCTAGradient}
                  >
                    <Text style={styles.sellerCTAText}>Go to Sell Dashboard</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pro Upgrade Prompt - Only show if not already pro */}
            {!isProUser() && (
              <TouchableOpacity
                style={styles.proPrompt}
                onPress={() => {
                  setShowUpgradeModal(true)
                }}
                accessibilityLabel="Upgrade to Pro"
                accessibilityHint="Upgrade to unlock advanced analytics and premium features"
              >
                <LinearGradient
                  colors={['#007AFF', '#1E40AF', '#00B4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proPromptGradient}
                >
                  <TrueSharpShield size={24} variant="light" />
                  <View style={styles.proPromptText}>
                    <Text style={styles.proPromptTitle}>Upgrade to Pro</Text>
                    <Text style={styles.proPromptSubtitle}>
                      Unlock advanced analytics and premium features
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Seller Profile Modal */}
      <SellerProfileModal
        visible={showSellerModal}
        username={selectedSellerUsername || ''}
        onClose={() => {
          setShowSellerModal(false)
          setSelectedSellerUsername(null)
        }}
        onSubscribe={strategy => {
          alert(`Subscribe to "${strategy.strategy_name}" by @${strategy.username}?`)
        }}
      />

      {/* Upgrade to Pro Modal */}
      <UpgradeToProModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(planType, productId, price) => {
          // Handle the upgrade logic here - integrate with payment processing
          setShowUpgradeModal(false)
        }}
      />
      
      {/* Daily Bets Modal */}
      <DailyBetsModal
        visible={showDailyBetsModal}
        onClose={() => {
          setShowDailyBetsModal(false)
          setSelectedDayData(null)
        }}
        data={selectedDayData}
        onBetPress={(betId, parlayGroup) => {
          // Handle bet press - could navigate to bet details
        }}
      />

      {/* Referral Welcome Modal */}
      {referralCreatorInfo && (
        <ReferralWelcomeModal
          visible={showReferralWelcome}
          onClose={handleReferralWelcomeClose}
          creatorUsername={referralCreatorInfo.username}
          creatorProfilePicture={referralCreatorInfo.profile_picture_url}
        />
      )}

      {/* Off-screen shareable performance card for image generation */}
      <View style={styles.offscreenContainer}>
        <ShareablePerformanceCard />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  profileContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700' as const,
    color: 'white',
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  proBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#DDD6FE',
    marginLeft: theme.spacing.xs,
    fontWeight: '600' as const,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: theme.spacing.xs,
    fontWeight: '500' as const,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  sellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  upgradeProButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  upgradeProGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  upgradeProText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    marginLeft: theme.spacing.xs,
    fontWeight: '600' as const,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#A7F3D0',
    marginLeft: theme.spacing.xs,
    fontWeight: '500' as const,
  },
  dashboardContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  todaysBetsCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg, // 12px corners as requested
    padding: theme.spacing.md, // 16px padding as requested
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md, // Subtle shadow as requested
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md, // Space for top-left shield
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
    minWidth: 0, // Prevents text overflow
  },
  cardIconContainer: {
    backgroundColor: '#EBF4FF',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.lg,
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    flexShrink: 1, // Allows text to shrink on smaller screens
  },
  cardStats: {
    alignItems: 'flex-end',
  },
  cardStatsNumber: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  cardStatsLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 22,
  },
  emptyAction: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  emptyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: 'white',
  },
  betsContainer: {
    flex: 1,
  },
  dashboardBetCardWrapper: {
    marginHorizontal: -theme.spacing.md,
  },
  betsScrollView: {
    maxHeight: 300,
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: theme.spacing.sm,
  },
  betsScrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xs,
  },
  betItemCompact: {
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  parlayItemCompact: {
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  betCompactContent: {
    padding: theme.spacing.md,
  },
  betCompactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  betCompactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  betCompactRight: {
    alignItems: 'flex-end',
  },
  sportTagCompact: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  parlayTagCompact: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  betTypeTagCompact: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F3E8FF',
  },
  tagTextCompact: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: 'white',
  },
  betTypeTextCompact: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: '#7C3AED',
  },
  betDescriptionCompact: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  betDetailsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  betDetailTextCompact: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500' as const,
  },
  profitAmountCompact: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700' as const,
  },
  betItem: {
    position: 'relative',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  betStatusLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  betMainContent: {
    padding: theme.spacing.md,
  },
  betHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  betStatusIndicator: {
    marginRight: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  betContentLeft: {
    flex: 1,
  },
  betTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sportTag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  betTypeTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  sportsbookTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusTag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500' as const,
    color: 'white',
  },
  betDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  betDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  betDetailText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500' as const,
  },
  teamsDisplay: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  betRight: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600' as const,
  },
  profitAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.xs,
  },
  stakeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  viewAllBets: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    alignItems: 'flex-end',
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg, // 12px corners as requested
    padding: theme.spacing.md, // 16px padding as requested
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md, // Subtle shadow as requested
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  analyticsHeader: {
    marginBottom: theme.spacing.md,
  },
  analyticsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  analyticsHeaderLeft: {
    flex: 1,
  },
  analyticsIconContainer: {
    backgroundColor: '#F3E8FF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  analyticsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xl,
  },
  analyticsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  liveText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  periodToggleContainer: {
    marginBottom: theme.spacing.lg,
  },
  periodToggleWrapper: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xl,
    padding: 4,
  },
  periodToggle: {
    flex: 1,
  },
  periodToggleActive: {},
  periodToggleButton: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  periodToggleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
  },
  periodToggleTextActive: {
    color: 'white',
  },
  profitDisplayContainer: {
    marginBottom: theme.spacing.lg,
  },
  profitDisplayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: 'white',
    ...theme.shadows.lg,
  },
  profitDisplayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendIconContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginRight: theme.spacing.md,
    ...theme.shadows.lg,
  },
  profitInfo: {
    flex: 1,
  },
  profitLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500' as const,
    marginBottom: theme.spacing.xs,
  },
  profitValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
  },
  profitDisplayRight: {
    alignItems: 'flex-end',
  },
  periodLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  trendEmoji: {
    fontSize: theme.typography.fontSize['2xl'],
  },
  chartContainer: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    alignItems: 'center',
  },
  chartSvg: {
    width: '100%',
  },
  chartHeader: {
    marginBottom: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
  },
  chartPlaceholder: {
    height: 120,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  chartPlaceholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  chartPlaceholderSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
  analyticsButtonContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  analyticsButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  analyticsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  analyticsButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600' as const,
    color: 'white',
  },
  analyticsButtonArrow: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg, // 12px corners as requested
    padding: theme.spacing.md, // 16px padding as requested
    ...theme.shadows.md, // Subtle shadow as requested
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  thirdCard: {
    marginBottom: theme.spacing.md,
  },
  // Marketplace-specific styles
  marketplaceHeader: {
    marginBottom: theme.spacing.md,
  },
  marketplaceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marketplaceIconContainer: {
    backgroundColor: '#DCFCE7',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  marketplaceStarIcon: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 2,
  },
  marketplaceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  marketplaceContent: {
    marginBottom: theme.spacing.lg,
  },
  marketplaceTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xl,
  },
  marketplaceSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  strategyList: {
    marginBottom: theme.spacing.lg,
  },
  strategyCardLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.md,
  },
  loadingTextSecondary: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  emptyMarketplace: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyMarketplaceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  emptyMarketplaceSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.md,
  },
  strategyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  strategyRank: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  strategyRankText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700' as const,
    color: 'white',
  },
  crownIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FCD34D',
    borderRadius: 8,
    padding: 2,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  roiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  roiText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600' as const,
    color: '#059669',
    marginLeft: 2,
  },
  strategyUsername: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  strategyStats: {
    gap: theme.spacing.xs,
  },
  winRateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  winRateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: theme.spacing.xs,
  },
  winRateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  betsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: 2,
  },
  strategyRight: {
    alignItems: 'flex-end',
  },
  strategyPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  strategyPeriod: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  subscriberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600' as const,
    color: '#F97316',
    marginLeft: 2,
  },
  browseAllButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  browseAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.lg,
  },
  browseAllText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600' as const,
    color: 'white',
  },
  // Clean marketplace card styles
  strategyCardClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.sm,
  },
  strategyLeftClean: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  strategyRankClean: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  strategyInfoClean: {
    flex: 1,
    minWidth: 0, // Prevents text overflow on small screens
  },
  strategyNameClean: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  strategyMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  roiTagClean: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  roiTextClean: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600' as const,
    color: '#059669',
    marginLeft: 2,
  },
  strategyUsernameClean: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  strategyStatsClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  winRateTextClean: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statsSeperator: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  betsTextClean: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  strategyRightClean: {
    alignItems: 'flex-end',
  },
  strategyPriceClean: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  strategyPeriodClean: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  browseAllButtonClean: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  browseAllTextClean: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  // Subscriptions-specific styles
  subscriptionsHeader: {
    marginBottom: theme.spacing.md,
  },
  subscriptionsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subscriptionsHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  subscriptionsIconContainer: {
    backgroundColor: '#FCE7F3',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
  },
  subscriptionsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xl,
  },
  subscriptionsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  subscriptionsCount: {
    alignItems: 'flex-end',
  },
  subscriptionsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  subscriptionsCountNumber: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  subscriptionsCountLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  subscriptionsList: {
    marginBottom: theme.spacing.lg,
  },
  subscriptionItemLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.md,
  },
  emptySubscriptions: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptySubscriptionsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  emptySubscriptionsSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.md,
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionAvatar: {
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subscriptionSeller: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  subscriptionBilling: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionBillingText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#9CA3AF',
    marginLeft: theme.spacing.xs,
  },
  subscriptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  subscriptionPriceTag: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  subscriptionPrice: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500' as const,
  },
  monthlySpendContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  monthlySpendContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlySpendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlySpendLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  monthlySpendAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  monthlySpendSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  // Seller-specific styles
  sellerHeader: {
    marginBottom: theme.spacing.md,
  },
  sellerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerIconContainer: {
    backgroundColor: '#D1FAE5',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
  },
  sellerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xl,
  },
  sellerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  revenueSection: {
    marginBottom: theme.spacing.lg,
  },
  monthlyRevenueCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  revenueCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  revenueIconContainer: {
    backgroundColor: '#A7F3D0',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  revenueSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: '#059669',
  },
  revenueCardRight: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700' as const,
    color: '#059669',
    marginBottom: theme.spacing.xs,
  },
  revenueStatus: {
    alignItems: 'flex-end',
  },
  noStripeTag: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  noStripeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#C2410C',
    fontWeight: '500' as const,
  },
  sellerStatsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sellerStatCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  sellerStatIconContainer: {
    backgroundColor: '#BFDBFE',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  sellerStatNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: theme.spacing.xs,
  },
  sellerStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500' as const,
    color: '#1E40AF',
    textAlign: 'center',
  },
  sellerCTA: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sellerCTAGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 48,
  },
  sellerCTAText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  // Standard preview card styles
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  previewTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  previewSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  previewValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  previewAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  proPrompt: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  proPromptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    minHeight: 72,
  },
  proPromptText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  proPromptTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700' as const,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  proPromptSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardShieldContainer: {
    opacity: 0.7,
  },
  // New shield positioning for top-left placement
  cardWithShield: {
    position: 'relative',
  },
  cardShieldTopLeft: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 1,
    opacity: 0.9,
  },
  // Today's Bets specific header styling
  todaysBetsHeader: {
    marginBottom: theme.spacing.md,
  },
  todaysBetsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  todaysBetsHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  todaysBetsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xl,
  },
  todaysBetsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  todaysBetsHeaderRight: {
    alignItems: 'flex-end',
  },
  todaysBetsCounter: {
    alignItems: 'center',
    minWidth: 60,
  },
  todaysBetsCounterNumber: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['2xl'],
  },
  todaysBetsCounterLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Shield and title layout styling
  titleWithShield: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  // Compact period toggle styles
  compactPeriodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  compactPeriodToggle: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  compactPeriodToggleActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  compactPeriodToggleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  compactPeriodToggleTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // Streamlined metrics styles
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  primaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  metricContent: {
    flex: 1,
  },
  primaryMetricValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.lg,
  },
  primaryMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  secondaryMetric: {
    alignItems: 'center',
  },
  secondaryMetricValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.lg,
  },
  secondaryMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  // Calendar container styles
  calendarContainer: {
    marginTop: 0,
    marginBottom: 0,
  },
  // Strategy profile image styles
  strategyAvatarSection: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  strategyProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  strategyProfileImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  strategyProfileInitial: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  strategyRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  // Subscription profile image styles
  subscriptionProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  subscriptionProfileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  subscriptionProfileInitial: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  // Share button styles
  analyticsHeaderRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  // Off-screen container styles
  offscreenContainer: {
    position: 'absolute',
    top: -10000, // Move off-screen
    left: 0,
    opacity: 0, // Make invisible
  },
  // Shareable card styles
  shareableCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12, // Reduced from 16
    margin: 8, // Reduced from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 350, // Fixed width for consistent images
  },
  shareableHeader: {
    marginBottom: 12, // Reduced from 16
  },
  shareableHeaderLeft: {
    flex: 1,
  },
  shareableProfileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10, // Reduced from 12
  },
  shareableProfileImagePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Reduced from 12
  },
  shareableProfileInitial: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
})
