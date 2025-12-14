import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import TrueSharpShield from '../../components/common/TrueSharpShield'
import StripeConnectBrowser from '../../components/webview/StripeConnectBrowser'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { groupBetsByParlay, ParlayGroup } from '../../services/parlayGrouping'
import { stripeService } from '../../services/stripeService'
import { BetData } from '../../services/supabaseAnalytics'
import { globalStyles } from '../../styles/globalStyles'
import { theme } from '../../styles/theme'
import { TabParamList } from '../../types'
import { formatOddsWithFallback } from '../../utils/oddsCalculation'
import { parseMultiStatOddid } from '../../lib/betFormatting'

const { width } = Dimensions.get('window')

interface SubscriptionData {
  id: string
  subscriber_id: string
  seller_id: string
  strategy_id: string
  status: 'active' | 'cancelled' | 'past_due'
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  currency: string
  created_at: string
  updated_at: string
  cancelled_at?: string
  current_period_start?: string
  current_period_end?: string
  next_billing_date?: string
  stripe_subscription_id?: string
  // Joined data
  strategy_name?: string
  strategy_description?: string
  seller_username?: string
  seller_display_name?: string
  seller_avatar_url?: string
  // Strategy leaderboard data
  roi_percentage?: number
  win_rate?: number
  total_bets?: number
  winning_bets?: number
  losing_bets?: number
  open_bets?: any[]
  open_bets_count?: number
  todays_bets?: any[]
  todays_bets_count?: number
}

type TabType = 'subscriptions' | 'billing'
type SubscriptionsScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Subscriptions'>

export default function SubscriptionsScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<SubscriptionsScreenNavigationProp>()
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions')
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<SubscriptionData | null>(null)
  const [betsModalVisible, setBetsModalVisible] = useState(false)
  const [showBillingBrowser, setShowBillingBrowser] = useState(false)
  const [billingBrowserUrl, setBillingBrowserUrl] = useState<string | null>(null)

  const handleBrowseStrategies = () => {
    navigation.navigate('Marketplace')
  }

  const handleManageBilling = async () => {
    try {
      const result = await stripeService.getCustomerBillingPortalUrl()

      if (!result.success) {
        // Handle specific error cases with user-friendly messages
        if (
          result.error?.includes('No payment account') ||
          result.error?.includes('payment account')
        ) {
          Alert.alert(
            'No Active Subscriptions',
            'You currently have no active subscriptions to manage.\n\nDiscover profitable betting strategies and subscribe to top-performing bettors on our marketplace at truesharp.io',
            [
              { text: 'Browse Marketplace', onPress: () => navigation.navigate('Marketplace') },
              { text: 'OK', style: 'cancel' },
            ]
          )
        } else if (result.error?.includes('not found')) {
          Alert.alert(
            'Billing Information Not Available',
            "Your billing information could not be found. This usually means you haven't made any purchases yet.\n\nExplore our marketplace to find profitable betting strategies.",
            [
              { text: 'Browse Marketplace', onPress: () => navigation.navigate('Marketplace') },
              { text: 'OK', style: 'cancel' },
            ]
          )
        } else {
          // Generic error fallback
          Alert.alert('Unable to Open Billing Portal', result.error || 'Please try again later.', [
            { text: 'OK' },
          ])
        }
      } else {
        // Open in-app browser
        setBillingBrowserUrl(result.url!)
        setShowBillingBrowser(true)
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      Alert.alert('Error', 'Failed to open billing portal. Please try again later.', [
        { text: 'OK' },
      ])
    }
  }

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return

    try {
      setError(null)

      // Fetch subscriptions with joined data from strategy_leaderboard
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(
          `
          *,
          strategies:strategy_id (
            id,
            name,
            description,
            user_id,
            strategy_leaderboard (
              roi_percentage,
              win_rate,
              total_bets,
              winning_bets,
              losing_bets
            )
          ),
          seller:seller_id (
            id,
            username,
            display_name,
            profile_picture_url
          )
        `
        )
        .eq('subscriber_id', user.id)
        .order('created_at', { ascending: false })

      if (subscriptionsError) {
        throw new Error(subscriptionsError.message)
      }

      // Format the data to match expected structure
      const formattedSubscriptions: SubscriptionData[] = (subscriptionsData || []).map(
        (sub: any) => {
          const leaderboardData = sub.strategies?.strategy_leaderboard?.[0] || {}

          return {
            id: sub.id,
            subscriber_id: sub.subscriber_id,
            seller_id: sub.seller_id,
            strategy_id: sub.strategy_id,
            status: sub.status,
            frequency: sub.frequency,
            price: sub.price,
            currency: sub.currency,
            created_at: sub.created_at,
            updated_at: sub.updated_at,
            cancelled_at: sub.cancelled_at,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            next_billing_date: sub.next_billing_date,
            stripe_subscription_id: sub.stripe_subscription_id,
            strategy_name: sub.strategies?.name,
            strategy_description: sub.strategies?.description,
            seller_username: sub.seller?.username,
            seller_display_name: sub.seller?.display_name,
            seller_avatar_url: sub.seller?.profile_picture_url,
            roi_percentage: leaderboardData.roi_percentage,
            win_rate: leaderboardData.win_rate,
            total_bets: leaderboardData.total_bets,
            winning_bets: leaderboardData.winning_bets,
            losing_bets: leaderboardData.losing_bets,
            open_bets: [],
            open_bets_count: 0,
            todays_bets: [],
            todays_bets_count: 0,
          }
        }
      )

      // Fetch open bets and today's bets for each strategy using strategy_bets table
      const today = new Date().toISOString().split('T')[0]

      for (const subscription of formattedSubscriptions) {
        if (subscription.strategy_id) {
          // Fetch open bets via strategy_bets table
          // Fetch all pending bets (including those with past game dates for proper parlay filtering)
          const { data: strategyBets } = await supabase
            .from('strategy_bets')
            .select(
              `
              bet_id,
              bets!inner (
                id,
                sport,
                league,
                home_team,
                away_team,
                bet_type,
                bet_description,
                line_value,
                odds,
                stake,
                potential_payout,
                status,
                placed_at,
                game_date,
                sportsbook,
                side,
                parlay_id,
                is_parlay,
                profit,
                player_name,
                bet_source,
                odd_source,
                prop_type,
                oddid
              )
            `
            )
            .eq('strategy_id', subscription.strategy_id)
            .eq('bets.status', 'pending')
            .order('bets(placed_at)', { ascending: false })

          // Fetch today's bets via strategy_bets table
          const { data: todaysStrategyBets } = await supabase
            .from('strategy_bets')
            .select(
              `
              bet_id,
              bets!inner (
                id,
                sport,
                league,
                home_team,
                away_team,
                bet_type,
                bet_description,
                line_value,
                odds,
                stake,
                potential_payout,
                status,
                placed_at,
                game_date,
                sportsbook,
                side,
                parlay_id,
                is_parlay,
                profit,
                player_name,
                bet_source,
                odd_source,
                prop_type,
                oddid
              )
            `
            )
            .eq('strategy_id', subscription.strategy_id)
            .gte('bets.placed_at', `${today}T00:00:00.000Z`)
            .lt('bets.placed_at', `${today}T23:59:59.999Z`)
            .order('bets(placed_at)', { ascending: false })

          // Transform the strategy_bets data to extract bets
          const allPendingBets = (strategyBets || []).map((sb: any) => ({
            ...sb.bets,
            strategy_id: subscription.strategy_id,
          }))

          // Filter bets to only include those that should be shown as "open"
          const currentTime = new Date().toISOString()
          const openBets = allPendingBets.filter((bet: any) => {
            // For single bets, only include if game_date is in the future (or null)
            if (!bet.is_parlay || !bet.parlay_id) {
              return !bet.game_date || bet.game_date > currentTime
            }
            
            // For parlay legs, we'll filter them later by parlay
            // For now, include all parlay legs so we can analyze complete parlays
            return true
          })

          // Now filter out entire parlays if any leg has started
          const parlayIds = new Set(
            openBets
              .filter((bet: any) => bet.is_parlay && bet.parlay_id)
              .map((bet: any) => bet.parlay_id)
          )

          const validParlayIds = new Set()
          for (const parlayId of Array.from(parlayIds)) {
            const parlayLegs = allPendingBets.filter((bet: any) => bet.parlay_id === parlayId)
            const allLegsHaveFutureGameDates = parlayLegs.every((leg: any) => 
              !leg.game_date || leg.game_date > currentTime
            )
            
            if (allLegsHaveFutureGameDates) {
              validParlayIds.add(parlayId)
            }
          }

          // Final filter: include single bets and only legs from valid parlays
          const filteredOpenBets = openBets.filter((bet: any) => {
            if (!bet.is_parlay || !bet.parlay_id) {
              return true // Single bet already filtered above
            }
            return validParlayIds.has(bet.parlay_id)
          })

          const todaysBets = (todaysStrategyBets || []).map((sb: any) => ({
            ...sb.bets,
            strategy_id: subscription.strategy_id,
          }))

          subscription.open_bets = filteredOpenBets
          // Group open bets to get accurate count (parlays count as 1, not individual legs)
          const groupedOpenBets = groupBetsByParlay(filteredOpenBets)
          subscription.open_bets_count =
            groupedOpenBets.parlays.length + groupedOpenBets.singles.length

          subscription.todays_bets = todaysBets
          // Group today's bets to get accurate count (parlays count as 1, not individual legs)
          const groupedTodaysBets = groupBetsByParlay(todaysBets)
          subscription.todays_bets_count =
            groupedTodaysBets.parlays.length + groupedTodaysBets.singles.length
        }
      }

      setSubscriptions(formattedSubscriptions)
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      setError('Failed to load subscriptions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    }
  }, [user, fetchSubscriptions])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSubscriptions()
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real implementation, this would call your API
              // For now, we'll just show an alert
              Alert.alert('Success', 'Subscription cancelled successfully')
              fetchSubscriptions()
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription')
            }
          },
        },
      ]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0.0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleOpenBetsModal = (subscription: SubscriptionData) => {
    setSelectedStrategy(subscription)
    setBetsModalVisible(true)
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
  const totalMonthlySpend = activeSubscriptions.reduce((total, sub) => {
    const monthlyPrice =
      sub.frequency === 'weekly'
        ? sub.price * 4.33
        : sub.frequency === 'yearly'
          ? sub.price / 12
          : sub.price
    return total + monthlyPrice
  }, 0)

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header matching marketplace design */}
        <View style={styles.marketplaceHeader}>
          {/* Title Row */}
          <View style={styles.marketplaceTitleRow}>
            <View style={styles.marketplaceTitleContainer}>
              <TrueSharpShield size={20} variant="default" style={styles.marketplaceShieldIcon} />
              <Text style={styles.marketplaceTitle}>My Subscriptions</Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.marketplaceRefreshButton}
              disabled={refreshing}
            >
              <Icon
                name={refreshing ? 'hourglass-outline' : 'refresh-outline'}
                size={16}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Tab Row (replacing search row) */}
          <View style={styles.marketplaceTabRow}>
            <View style={styles.marketplaceTabContainer}>
              <TouchableOpacity
                style={[
                  styles.marketplaceTab,
                  activeTab === 'subscriptions' && styles.marketplaceActiveTab,
                ]}
                onPress={() => setActiveTab('subscriptions')}
              >
                <Text
                  style={[
                    styles.marketplaceTabText,
                    activeTab === 'subscriptions' && styles.marketplaceActiveTabText,
                  ]}
                >
                  Subscriptions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.marketplaceTab,
                  activeTab === 'billing' && styles.marketplaceActiveTab,
                ]}
                onPress={() => setActiveTab('billing')}
              >
                <Text
                  style={[
                    styles.marketplaceTabText,
                    activeTab === 'billing' && styles.marketplaceActiveTabText,
                  ]}
                >
                  Manage Billing
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {activeTab === 'subscriptions' ? (
            <SubscriptionsTab
              subscriptions={subscriptions}
              activeSubscriptions={activeSubscriptions}
              totalMonthlySpend={totalMonthlySpend}
              onCancelSubscription={handleCancelSubscription}
              onOpenBets={handleOpenBetsModal}
              onManageBilling={handleManageBilling}
              onBrowseStrategies={handleBrowseStrategies}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
              error={error}
            />
          ) : (
            <BillingTab
              subscriptions={subscriptions}
              formatCurrency={formatCurrency}
              onManageBilling={handleManageBilling}
            />
          )}
        </ScrollView>

        {/* Open Bets Modal */}
        <OpenBetsModal
          visible={betsModalVisible}
          onClose={() => setBetsModalVisible(false)}
          subscription={selectedStrategy}
        />

        <StripeConnectBrowser
          visible={showBillingBrowser}
          url={billingBrowserUrl}
          onClose={() => {
            setShowBillingBrowser(false)
            setBillingBrowserUrl(null)
          }}
        />
      </View>
    </SafeAreaView>
  )
}

// Subscriptions Tab Component
interface SubscriptionsTabProps {
  subscriptions: SubscriptionData[]
  activeSubscriptions: SubscriptionData[]
  totalMonthlySpend: number
  onCancelSubscription: (id: string) => void
  onOpenBets: (subscription: SubscriptionData) => void
  onManageBilling: () => void
  onBrowseStrategies: () => void
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number | null | undefined) => string
  error: string | null
}

function SubscriptionsTab({
  subscriptions,
  activeSubscriptions,
  totalMonthlySpend,
  onCancelSubscription,
  onOpenBets,
  onManageBilling,
  onBrowseStrategies,
  formatCurrency,
  formatPercentage,
  error,
}: SubscriptionsTabProps) {
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="warning-outline" size={48} color={theme.colors.status.error} />
        <Text style={styles.errorTitle}>Error Loading Subscriptions</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (activeSubscriptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="card-outline" size={64} color={theme.colors.text.light} />
        <Text style={styles.emptyTitle}>No subscriptions yet</Text>
        <Text style={styles.emptyText}>
          Start following top-performing strategies from verified sellers
        </Text>
        <TouchableOpacity style={styles.browseButton} onPress={onBrowseStrategies}>
          <Text style={styles.browseButtonText}>Browse Strategies</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.tabContent}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.statValue}>{activeSubscriptions.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <Icon name="cash" size={20} color={theme.colors.status.success} />
            <Text style={styles.statValue}>{formatCurrency(totalMonthlySpend)}</Text>
            <Text style={styles.statLabel}>Monthly</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardContent}>
            <Icon name="trending-up" size={20} color={theme.colors.accent} />
            <Text style={styles.statValue}>
              {activeSubscriptions.length > 0
                ? formatPercentage(
                    activeSubscriptions.reduce((sum, sub) => sum + (sub.roi_percentage || 0), 0) /
                      activeSubscriptions.length
                  )
                : '0%'}
            </Text>
            <Text style={styles.statLabel}>Avg ROI</Text>
          </View>
        </View>
      </View>

      {/* Active Subscriptions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Subscriptions</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{activeSubscriptions.length} active</Text>
        </View>
      </View>

      {activeSubscriptions.map(subscription => (
        <SubscriptionCard
          key={subscription.id}
          subscription={subscription}
          onCancel={onCancelSubscription}
          onOpenBets={onOpenBets}
          onManageBilling={onManageBilling}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      ))}
    </View>
  )
}

// Billing Tab Component
interface BillingTabProps {
  subscriptions: SubscriptionData[]
  formatCurrency: (amount: number) => string
  onManageBilling: () => void
}

function BillingTab({ subscriptions, formatCurrency, onManageBilling }: BillingTabProps) {
  return (
    <View style={styles.tabContent}>
      {/* Subscription History */}
      <View style={styles.billingSection}>
        <Text style={styles.billingSectionTitle}>Subscription History</Text>
        {subscriptions.length > 0 ? (
          <View style={styles.historyCard}>
            {subscriptions.map(subscription => (
              <View key={subscription.id} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <TrueSharpShield size={20} />
                  <View style={styles.historyItemText}>
                    <Text style={styles.historyItemTitle}>
                      {subscription.strategy_name || 'Strategy'}
                    </Text>
                    <Text style={styles.historyItemSubtitle}>
                      @{subscription.seller_username || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyItemMeta}>
                  <View
                    style={[
                      styles.statusBadge,
                      subscription.status === 'active'
                        ? styles.statusActive
                        : styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        subscription.status === 'active'
                          ? styles.statusActiveText
                          : styles.statusCancelledText,
                      ]}
                    >
                      {subscription.status === 'active' ? 'Active' : 'Cancelled'}
                    </Text>
                  </View>
                  <Text style={styles.historyItemPrice}>
                    {formatCurrency(subscription.price)} / {subscription.frequency}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistoryCard}>
            <Icon name="bar-chart" size={48} color={theme.colors.text.light} />
            <Text style={styles.emptyHistoryTitle}>No subscription history</Text>
            <Text style={styles.emptyHistoryText}>
              Your subscription history will appear here once you subscribe to strategies
            </Text>
          </View>
        )}
      </View>

      {/* Customer Portal Access */}
      <View style={styles.billingSection}>
        <Text style={styles.billingSectionTitle}>Customer Portal</Text>
        <View style={styles.portalCard}>
          <Text style={styles.portalDescription}>
            Access your Stripe customer portal to manage payment methods, view detailed billing
            history, and update billing information.
          </Text>
          <TouchableOpacity style={styles.portalButton} onPress={onManageBilling}>
            <Icon name="open-outline" size={16} color="white" />
            <Text style={styles.portalButtonText}>Open Customer Portal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// Helper function for rendering profile pictures
function renderProfilePicture(url?: string, username?: string, enhanced?: boolean) {
  const pictureStyle = enhanced ? styles.enhancedProfilePicture : styles.profilePicture
  const initialsStyle = enhanced ? styles.enhancedInitialsContainer : styles.initialsContainer
  const textStyle = enhanced ? styles.enhancedInitialsText : styles.initialsText
  
  if (url && url.trim() !== '') {
    return <Image source={{ uri: url }} style={pictureStyle} onError={error => {}} />
  }

  // Show user initials as fallback
  const initials = username ? username.substring(0, 2).toUpperCase() : '??'
  return (
    <View style={[pictureStyle, initialsStyle]}>
      <Text style={textStyle}>{initials}</Text>
    </View>
  )
}

// Helper function to format market line like UnifiedBetCard (without monetary values)
const formatMarketLineForShare = (bet: BetData): string => {
  // Special handling for SharpSports bets - use parsed bet_description
  if (bet.bet_source === 'sharpsports' && bet.bet_description) {
    const parts = bet.bet_description.split(' - ')
    if (parts.length < 2) {
      return bet.bet_description
    }
    const betDetails = parts.slice(1).join(' - ')

    // Apply reordering rules for better readability
    const moneylineMatch = betDetails.match(/^Moneyline - (.+)$/)
    if (moneylineMatch) {
      return `${moneylineMatch[1]} Moneyline`
    }

    const homeRunMatch = betDetails.match(/^To Hit A Home Run - (.+)$/)
    if (homeRunMatch) {
      return `${homeRunMatch[1]} To Hit A Home Run`
    }

    const generalMatch = betDetails.match(/^([^-]+) - (.+)$/)
    if (generalMatch) {
      const market = generalMatch[1].trim()
      const entity = generalMatch[2].trim()

      const marketKeywords = ['to hit', 'to score', 'to record', 'moneyline', 'spread', 'total']
      const shouldReorder = marketKeywords.some(keyword => market.toLowerCase().includes(keyword))

      if (shouldReorder) {
        return `${entity} ${market}`
      }
    }

    return betDetails
  }

  // Default logic for all other bet sources
  const betType = bet.bet_type || 'Unknown'
  const side = bet.side
  const lineValue = bet.line_value
  const playerName = bet.player_name

  if (betType.toLowerCase() === 'moneyline') {
    const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side
    return `${teamName || 'Team'} Moneyline`
  }

  if (betType.toLowerCase() === 'spread') {
    const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side
    const formattedLine =
      lineValue !== null && lineValue !== undefined
        ? lineValue > 0
          ? `+${lineValue}`
          : `${lineValue}`
        : ''
    return `${teamName || 'Team'} ${formattedLine} Point Spread`
  }

  // Enhanced handling for TrueSharp/manual bets with proper prop type detection
  // This MUST come before generic total/prop handling to override default behavior
  const isTrueSharpOrManual =
    bet.bet_source === 'manual' ||
    bet.sportsbook === 'TrueSharp' ||
    (bet as any).odd_source === 'TrueSharp'

  if (isTrueSharpOrManual && playerName) {
    // Try to determine prop type from prop_type column first, then oddid, fallback to 'Prop'
    let propType = null

    if (bet.prop_type) {
      // Convert prop_type from database format to display format
      const propTypeStr = bet.prop_type.toString()
      if (propTypeStr === 'home_runs') propType = 'Home Runs'
      else if (propTypeStr === 'total_bases') propType = 'Total Bases'
      else if (propTypeStr === 'passing_yards') propType = 'Passing Yards'
      else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards'
      else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards'
      else if (propTypeStr === 'stolen_bases') propType = 'Stolen Bases'
      else if (propTypeStr === 'passing_touchdowns') propType = 'Passing TDs'
      else if (propTypeStr === 'rushing_touchdowns') propType = 'Rushing TDs'
      else if (propTypeStr === 'receiving_touchdowns') propType = 'Receiving TDs'
      else if (propTypeStr === 'touchdowns') propType = 'Touchdowns'
      else if (propTypeStr === 'field_goals') propType = 'Field Goals'
      else if (propTypeStr === 'three_pointers') propType = '3-Pointers'
      else if (propTypeStr === 'free_throws') propType = 'Free Throws'
      else {
        // For other prop types, replace underscores and capitalize
        propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    }

    // Always check oddid for multi-stat combinations (takes priority)
    if ((bet as any).oddid) {
      const oddid = (bet as any).oddid
      const parsedFromOddid = parseMultiStatOddid(oddid)
      // Use oddid parsing if it contains multiple stats (indicated by '+' in the result)
      if (parsedFromOddid && parsedFromOddid.includes('+')) {
        propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase())
      } else if (!propType) {
        // Fallback to oddid parsing for single stats only if prop_type is empty
        propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase())
      }
    }

    // If we found a prop type, this is a player prop
    if (propType) {
      const overUnder = side ? side.toUpperCase() : 'OVER'
      const result =
        lineValue && (overUnder === 'OVER' || overUnder === 'UNDER')
          ? `${overUnder} ${lineValue} ${propType}`
          : `${playerName || 'Player'} ${propType}`

      return result
    }
  }

  if (
    betType.toLowerCase() === 'total' ||
    betType.toLowerCase() === 'over' ||
    betType.toLowerCase() === 'under'
  ) {
    const overUnder = side
      ? side.toUpperCase()
      : betType.toLowerCase() === 'over'
        ? 'OVER'
        : betType.toLowerCase() === 'under'
          ? 'UNDER'
          : 'OVER'
    const getSportTotalType = (sport: string): string => {
      const sportTotals: { [key: string]: string } = {
        mlb: 'Runs',
        nfl: 'Points',
        nba: 'Points',
        ncaab: 'Points',
        ncaaf: 'Points',
        nhl: 'Goals',
        soccer: 'Goals',
      }
      return sportTotals[sport?.toLowerCase()] || 'Points'
    }
    const totalType = getSportTotalType(bet.sport)
    return `${overUnder} ${lineValue || ''} Total ${totalType}`
  }

  if (betType.toLowerCase().includes('prop') && playerName) {
    const overUnder = side ? side.toUpperCase() : 'OVER'
    const propType = bet.prop_type || 'Points'
    return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`
  }

  // Only use bet_description parsing for complex cases where structured data isn't sufficient
  if (bet.bet_description && (!betType || betType === 'Unknown')) {
    const description = bet.bet_description.toLowerCase()

    // Handle team + over/under patterns like "baltimore ravens over 29.5 total points"
    const teamOverPattern = /(.+?)\s+(over|under)\s+(\d+\.?\d*)\s+(total\s+)?(points|runs|goals)/
    const teamOverMatch = description.match(teamOverPattern)

    if (teamOverMatch) {
      const [, teamName, overUnder, lineValue, , totalType] = teamOverMatch
      return `${teamName.trim().replace(/\b\w/g, l => l.toUpperCase())} ${overUnder.toUpperCase()} ${lineValue} Total ${totalType.charAt(0).toUpperCase() + totalType.slice(1)}`
    }

    // Handle other patterns like "over total runs", "under total points"
    const overUnderPattern = /(over|under)\s+(\d+\.?\d*)\s+(total\s+)?(points|runs|goals)/
    const overUnderMatch = description.match(overUnderPattern)

    if (overUnderMatch) {
      const [, overUnder, lineValue, , totalType] = overUnderMatch
      return `${overUnder.toUpperCase()} ${lineValue} Total ${totalType.charAt(0).toUpperCase() + totalType.slice(1)}`
    }

    // Clean up the description as fallback
    return bet.bet_description
      .replace(/\b(over|under)\b/gi, match => match.toUpperCase())
      .replace(/\b\w/g, match => match.toUpperCase())
  }

  // Final fallback
  return (
    bet.bet_description ||
    `${betType} ${lineValue ? (lineValue > 0 ? `+${lineValue}` : lineValue) : ''}`
  )
}

// Helper function to format team matchup like UnifiedBetCard
const formatTeamMatchupForShare = (bet: BetData): string => {
  if (bet.bet_source === 'sharpsports' && bet.bet_description) {
    const parts = bet.bet_description.split(' - ')
    if (parts.length >= 2) {
      const matchup = parts[0].trim()
      if (matchup.includes(' @ ')) {
        return matchup
      }
    }
  }

  // For TrueSharp/manual bets, handle cases where team names might be generic
  const isTrueSharpOrManual =
    bet.bet_source === 'manual' ||
    bet.sportsbook === 'TrueSharp' ||
    (bet as any).odd_source === 'TrueSharp'

  if (isTrueSharpOrManual) {
    // For player props, prioritize showing player name
    if (bet.player_name) {
      return bet.player_name
    }

    // Check if we have proper team names (not generic "Home"/"Away")
    const hasProperTeams =
      bet.home_team &&
      bet.away_team &&
      bet.home_team !== 'Home' &&
      bet.away_team !== 'Away' &&
      bet.home_team !== 'Home Team' &&
      bet.away_team !== 'Away Team'

    if (hasProperTeams) {
      return `${bet.away_team} @ ${bet.home_team}`
    } else {
      // For other cases, show sport/league info
      const sport = bet.sport && bet.sport !== 'unknown' ? bet.sport : bet.league
      return sport ? `${sport} Game` : ''
    }
  }

  if (!bet.home_team || !bet.away_team) {
    return bet.bet_description || ''
  }
  return `${bet.away_team} @ ${bet.home_team}`
}

// Helper function to format placement info like UnifiedBetCard (without monetary values)
const formatPlacementInfoForShare = (bet: BetData): string => {
  if (bet.game_date) {
    try {
      const date = new Date(bet.game_date)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Game Date'
    }
  }

  if (bet.placed_at) {
    try {
      const date = new Date(bet.placed_at)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Placed'
    }
  }

  const sportsbook = bet.sportsbook || 'TrueSharp'
  const league = bet.league || bet.sport
  return `${sportsbook}${league ? ` • ${league.toUpperCase()}` : ''}`
}

// ShareableUnifiedBetCard - version without monetary values for subscriptions modal
const ShareableUnifiedBetCard = ({ bet }: { bet: BetData | ParlayGroup }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    if (odds === undefined || odds === null) return '0'
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds
    return formatOddsWithFallback(numericOdds, stake, potentialPayout) || '0'
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  if ('legs' in bet) {
    // It's a parlay - match EnhancedParlayCard format
    const parlay = bet as ParlayGroup

    // Format sport/league info (Line 2)
    const formatSportInfo = (): string => {
      const sports = [...new Set(parlay.legs.map(leg => leg.sport))].filter(Boolean)
      return sports.join(', ') || ''
    }

    // Format placement info (Line 3)
    const formatPlacementInfo = (): string => {
      // Try to find the earliest game_date from parlay legs
      const legGameDates = parlay.legs
        .map(leg => leg.game_date)
        .filter(Boolean)
        .sort()

      if (legGameDates.length > 0) {
        try {
          const date = new Date(legGameDates[0]!)
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        } catch {
          // Fall back to placed_at if game_date is invalid
        }
      }

      // Fall back to placed_at if no game_time is available
      if (parlay.placed_at) {
        try {
          const date = new Date(parlay.placed_at)
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        } catch {
          return 'Placed'
        }
      }

      return `${parlay.legs.length} legs • ${parlay.sport}`
    }

    // Format individual leg market line (same logic as EnhancedParlayCard)
    const formatLegMarketLine = (leg: any): string => {
      if (leg.bet_source === 'sharpsports' && leg.bet_description) {
        const parts = leg.bet_description.split(' - ')
        if (parts.length >= 2) {
          return parts.slice(1).join(' - ')
        }
      }

      const betType = leg.bet_type || 'Unknown'
      const side = leg.side
      const lineValue = leg.line_value
      const playerName = leg.player_name

      if (betType.toLowerCase() === 'moneyline') {
        const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side
        return `${teamName || 'Team'} ML`
      }

      if (betType.toLowerCase() === 'spread') {
        const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side
        const formattedLine =
          lineValue !== null && lineValue !== undefined
            ? lineValue > 0
              ? `+${lineValue}`
              : `${lineValue}`
            : ''
        return `${teamName || 'Team'} ${formattedLine}`
      }

      if (
        betType.toLowerCase() === 'total' ||
        betType.toLowerCase() === 'over' ||
        betType.toLowerCase() === 'under'
      ) {
        const overUnder = side
          ? side.toUpperCase()
          : betType.toLowerCase() === 'over'
            ? 'OVER'
            : betType.toLowerCase() === 'under'
              ? 'UNDER'
              : 'OVER'
        return `${overUnder} ${lineValue || ''}`
      }

      if (betType.toLowerCase().includes('prop') && playerName) {
        const overUnder = side ? side.toUpperCase() : 'OVER'
        let propType = 'Points'

        if (leg.prop_type) {
          const propTypeStr = leg.prop_type.toString()
          if (propTypeStr === 'home_runs') propType = 'Home Runs'
          else if (propTypeStr === 'total_bases') propType = 'Total Bases'
          else if (propTypeStr === 'passing_yards') propType = 'Passing Yards'
          else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards'
          else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards'
          else propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }

        return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`
      }

      return leg.bet_description || `${betType} ${lineValue || ''}`
    }

    const formatLegTeamMatchup = (leg: any): string => {
      if (leg.bet_source === 'sharpsports' && leg.bet_description) {
        const parts = leg.bet_description.split(' - ')
        if (parts.length >= 2) {
          const matchup = parts[0].trim()
          if (matchup.includes(' @ ')) {
            return matchup
          }
        }
      }

      if (!leg.home_team || !leg.away_team) {
        return ''
      }
      return `${leg.away_team} @ ${leg.home_team}`
    }

    return (
      <View style={styles.shareableBetCard}>
        {/* Main Parlay Card */}
        <TouchableOpacity
          style={styles.shareableBetContent}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.shareableBetLeft}>
            <Text style={styles.shareableBetMainLine}>{parlay.legs.length}-Leg Parlay</Text>
            <Text style={styles.shareableBetSubLine}>{formatSportInfo()}</Text>
            <Text style={styles.shareableBetTertiaryLine}>{formatPlacementInfo()}</Text>
          </View>
          <View style={styles.shareableBetRight}>
            <Text style={styles.shareableBetOdds}>{formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}</Text>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text.secondary}
              style={styles.shareableExpandIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Legs Section */}
        {isExpanded && (
          <View style={styles.shareableLegsContainer}>
            <View style={styles.shareableLegsHeader}>
              <Text style={styles.shareableLegsHeaderText}>Parlay Legs ({parlay.legs.length})</Text>
            </View>

            {parlay.legs.map((leg, index) => (
              <View key={leg.id} style={styles.shareableLegRow}>
                <View style={styles.shareableLegNumber}>
                  <Text style={styles.shareableLegNumberText}>{index + 1}</Text>
                </View>

                <View style={styles.shareableLegContent}>
                  <Text style={styles.shareableLegMarketLine} numberOfLines={1}>
                    {formatLegMarketLine(leg)}
                  </Text>
                  <Text style={styles.shareableLegTeamMatchup} numberOfLines={1}>
                    {formatLegTeamMatchup(leg)}
                  </Text>
                  <Text style={styles.shareableLegInfo} numberOfLines={1}>
                    {leg.bet_type || 'Unknown'} • {leg.league || leg.sport || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.shareableLegRight}>
                  <Text style={styles.shareableLegOdds}>{formatOdds(leg.odds, leg.stake, leg.potential_payout)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  } else {
    // It's a single bet - match EnhancedBetCard format exactly
    const singleBet = bet as BetData

    return (
      <View style={styles.shareableBetCard}>
        <View style={styles.shareableBetContent}>
          <View style={styles.shareableBetLeft}>
            {/* Line 1: Market description (matches UnifiedBetCard format) */}
            <Text style={styles.shareableBetMainLine}>{formatMarketLineForShare(singleBet)}</Text>
            {/* Line 2: Team matchup (matches UnifiedBetCard format) */}
            <Text style={styles.shareableBetSubLine}>{formatTeamMatchupForShare(singleBet)}</Text>
            {/* Line 3: Placement info (matches UnifiedBetCard format) */}
            <Text style={styles.shareableBetTertiaryLine}>
              {formatPlacementInfoForShare(singleBet)}
            </Text>
          </View>
          <View style={styles.shareableBetRight}>
            <Text style={styles.shareableBetOdds}>{formatOdds(singleBet.odds, singleBet.stake, singleBet.potential_payout)}</Text>
          </View>
        </View>
      </View>
    )
  }
}

// Custom bet card for modal (no monetary info, teams first, description second, odds where payout was)
function ModalBetCard({ bet }: { bet: BetData | any }) {
  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds
    return formatOddsWithFallback(numericOdds, stake, potentialPayout) || odds.toString()
  }

  // Create teams display (first line)
  const teamsDisplay =
    bet.home_team && bet.away_team
      ? `${bet.away_team} @ ${bet.home_team}`
      : bet.bet_description || 'Game'

  // Create description (second line) - market, line, side
  const createDescription = () => {
    const betType = bet.bet_type || 'Unknown'
    const line =
      bet.line_value !== null && bet.line_value !== undefined
        ? bet.line_value > 0
          ? `+${bet.line_value}`
          : `${bet.line_value}`
        : ''
    const side = bet.side || ''

    // Check if this is a TrueSharp player prop
    const isTrueSharpOrManual =
      bet.bet_source === 'manual' ||
      bet.sportsbook === 'TrueSharp' ||
      (bet as any).odd_source === 'TrueSharp'

    if (isTrueSharpOrManual && bet.player_name) {
      // Try to determine prop type from prop_type column first, then oddid, fallback to 'Prop'
      let propType = null

      if (bet.prop_type) {
        // Convert prop_type from database format to display format
        const propTypeStr = bet.prop_type.toString()
        if (propTypeStr === 'home_runs') propType = 'Home Runs'
        else if (propTypeStr === 'total_bases') propType = 'Total Bases'
        else if (propTypeStr === 'passing_yards') propType = 'Passing Yards'
        else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards'
        else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards'
        else if (propTypeStr === 'stolen_bases') propType = 'Stolen Bases'
        else if (propTypeStr === 'passing_touchdowns') propType = 'Passing TDs'
        else if (propTypeStr === 'rushing_touchdowns') propType = 'Rushing TDs'
        else if (propTypeStr === 'receiving_touchdowns') propType = 'Receiving TDs'
        else if (propTypeStr === 'touchdowns') propType = 'Touchdowns'
        else if (propTypeStr === 'field_goals') propType = 'Field Goals'
        else if (propTypeStr === 'three_pointers') propType = '3-Pointers'
        else if (propTypeStr === 'free_throws') propType = 'Free Throws'
        else {
          // For other prop types, replace underscores and capitalize
          propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      }

      // Always check oddid for multi-stat combinations (takes priority)
      if ((bet as any).oddid) {
        const oddid = (bet as any).oddid
        const parsedFromOddid = parseMultiStatOddid(oddid)
        // Use oddid parsing if it contains multiple stats (indicated by '+' in the result)
        if (parsedFromOddid && parsedFromOddid.includes('+')) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase())
        } else if (!propType) {
          // Fallback to oddid parsing for single stats only if prop_type is empty
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase())
        }
      }

      // Final fallback if nothing worked
      if (!propType) {
        propType = 'Prop'
      }

      const overUnder = side ? side.toUpperCase() : 'OVER'
      if (line && (overUnder === 'OVER' || overUnder === 'UNDER')) {
        return `${overUnder} ${line} ${propType}`
      } else {
        return `${bet.player_name} ${propType}`
      }
    }

    // For moneylines and spreads, show team name instead of home/away
    const getTeamName = () => {
      if (side.toLowerCase() === 'home') {
        return bet.home_team || 'Home'
      } else if (side.toLowerCase() === 'away') {
        return bet.away_team || 'Away'
      }
      return side // For other cases like 'over', 'under', etc.
    }

    if (betType.toLowerCase() === 'moneyline') {
      return `Moneyline - ${getTeamName()}`
    } else if (
      betType.toLowerCase().includes('spread') ||
      betType.toLowerCase().includes('point_spread')
    ) {
      return `Spread - ${getTeamName()} ${line}`
    } else if (
      betType.toLowerCase().includes('total') ||
      betType.toLowerCase().includes('over_under')
    ) {
      return `Total - ${side} ${line}`
    } else {
      return `${betType} - ${getTeamName()} ${line}`.trim()
    }
  }

  return (
    <View style={styles.modalBetCard}>
      <View style={styles.modalBetRow}>
        <View style={styles.modalBetMainInfo}>
          <Text style={styles.modalBetTeams} numberOfLines={1}>
            {teamsDisplay}
          </Text>
          <Text style={styles.modalBetDescription} numberOfLines={1}>
            {createDescription()}
          </Text>
          <Text style={styles.modalBetLeague} numberOfLines={1}>
            {bet.league || bet.sport || 'Unknown League'}
          </Text>
        </View>

        <View style={styles.modalBetOdds}>
          <Text style={styles.modalBetOddsText}>{formatOdds(bet.odds, bet.stake, bet.potential_payout)}</Text>
          <Icon name="chevron-forward" size={14} color="white" style={styles.modalBetOddsIcon} />
        </View>
      </View>
    </View>
  )
}

// Subscription Card Component
interface SubscriptionCardProps {
  subscription: SubscriptionData
  onCancel: (id: string) => void
  onOpenBets: (subscription: SubscriptionData) => void
  onManageBilling: () => void
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number | null | undefined) => string
}

function SubscriptionCard({
  subscription,
  onCancel,
  onOpenBets,
  onManageBilling,
  formatCurrency,
  formatPercentage,
}: SubscriptionCardProps) {
  return (
    <View style={styles.enhancedSubscriptionCard}>
      {/* Clean Header - No Gradient */}
      <View style={styles.enhancedSubscriptionHeader}>
        <View style={styles.enhancedHeaderContent}>
          <View style={styles.enhancedHeaderLeft}>
            {renderProfilePicture(subscription.seller_avatar_url, subscription.seller_username, true)}
            <View style={styles.enhancedHeaderText}>
              <Text style={styles.enhancedSubscriptionTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
                {subscription.strategy_name || 'Strategy'}
              </Text>
              <Text style={styles.enhancedSellerText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                by @{subscription.seller_username || subscription.seller_display_name || 'Unknown'}
              </Text>
              {subscription.strategy_description && (
                <Text style={styles.enhancedDescription} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {subscription.strategy_description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.enhancedStatusBadge}>
            <Icon name="checkmark-circle" size={12} color={theme.colors.status.success} />
            <Text style={styles.enhancedStatusText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Active</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Performance Metrics - Financial Card Style */}
      <View style={styles.enhancedMetricsSection}>
        <View style={styles.enhancedMetricsContainer}>
          <View style={[
            styles.enhancedMetricCard, 
            (subscription.roi_percentage || 0) >= 0 ? styles.enhancedMetricCardGreen : styles.enhancedMetricCardRed
          ]}>
            <Text style={styles.enhancedMetricLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>ROI</Text>
            <Text style={styles.enhancedMetricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {formatPercentage(subscription.roi_percentage)}
            </Text>
          </View>
          
          <View style={[styles.enhancedMetricCard, styles.enhancedMetricCardWhite]}>
            <Text style={styles.enhancedMetricLabelBlack} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Win Rate</Text>
            <Text style={styles.enhancedMetricValueBlack} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {subscription.win_rate !== null && subscription.win_rate !== undefined
                ? `${(subscription.win_rate * 100).toFixed(0)}%`
                : 'N/A'}
            </Text>
          </View>
          
          <View style={[styles.enhancedMetricCard, styles.enhancedMetricCardWhite]}>
            <Text style={styles.enhancedMetricLabelBlack} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Total Bets</Text>
            <Text style={styles.enhancedMetricValueBlack} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {subscription.total_bets || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Open Bets Banner - More Prominent */}
      <TouchableOpacity
        style={styles.enhancedOpenBetsSection}
        onPress={() => onOpenBets(subscription)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.enhancedOpenBetsGradient}
        >
          <View style={styles.enhancedOpenBetsContent}>
            <View style={styles.enhancedOpenBetsLeft}>
              <View style={styles.enhancedOpenBetsIconContainer}>
                <Icon name="notifications" size={20} color="white" />
              </View>
              <View style={styles.enhancedOpenBetsText}>
                <Text style={styles.enhancedOpenBetsTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {subscription.open_bets_count || 0} Open Bets Available
                </Text>
                <Text style={styles.enhancedOpenBetsSubtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                  Tap to view strategy bets
                </Text>
              </View>
            </View>
            <View style={styles.enhancedOpenBetsRight}>
              <Icon name="chevron-forward" size={20} color="white" />
            </View>
          </View>
          {/* Enhanced Notification Badge */}
          {(subscription.open_bets_count || 0) > 0 && (
            <View style={styles.enhancedNotificationBadge}>
              <Text style={styles.enhancedNotificationText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{subscription.open_bets_count}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Enhanced Subscription Details - Compact */}
      <View style={styles.enhancedDetailsSection}>
        <View style={styles.enhancedDetailsGrid}>
          <View style={styles.enhancedDetailRow}>
            <View style={styles.enhancedDetailRowContent}>
              <Icon name="cash" size={16} color={theme.colors.status.success} />
              <Text style={styles.enhancedDetailLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Price</Text>
            </View>
            <View style={styles.enhancedPriceTag}>
              <Text style={styles.enhancedPriceText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatCurrency(subscription.price)} / {subscription.frequency}
              </Text>
            </View>
          </View>
          
          {subscription.next_billing_date && (
            <View style={styles.enhancedDetailRow}>
              <View style={styles.enhancedDetailRowContent}>
                <Icon name="calendar" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.enhancedDetailLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Next Billing</Text>
              </View>
              <Text style={styles.enhancedDetailValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {new Date(subscription.next_billing_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {subscription.status === 'active' && (
          <View style={styles.enhancedActionsRow}>
            <TouchableOpacity style={styles.enhancedManageButton} onPress={onManageBilling}>
              <Icon name="card" size={14} color={theme.colors.primary} />
              <Text style={styles.enhancedManageButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Manage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.enhancedCancelButton} onPress={() => onCancel(subscription.id)}>
              <Icon name="close" size={14} color={theme.colors.status.error} />
              <Text style={styles.enhancedCancelButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

// Open Bets Modal Component
interface OpenBetsModalProps {
  visible: boolean
  onClose: () => void
  subscription: SubscriptionData | null
}

function OpenBetsModal({ visible, onClose, subscription }: OpenBetsModalProps) {
  if (!subscription) return null

  const groupedBets = useMemo(() => {
    if (!subscription.open_bets || subscription.open_bets.length === 0) {
      return { parlays: [], singles: [] }
    }

    // Group the open bets (already properly filtered for parlays with started games)
    return groupBetsByParlay(subscription.open_bets)
  }, [subscription.open_bets])

  const unifiedBetsList = useMemo(() => {
    const allBets: (BetData | ParlayGroup)[] = [...groupedBets.parlays, ...groupedBets.singles]

    return allBets.sort((a, b) => {
      const aDate = 'legs' in a ? a.placed_at : a.placed_at || ''
      const bDate = 'legs' in b ? b.placed_at : b.placed_at || ''
      return bDate.localeCompare(aDate)
    })
  }, [groupedBets])

  const renderBetItem = ({ item }: { item: BetData | ParlayGroup }) => (
    <View style={styles.modalBetCardWrapper}>
      <ShareableUnifiedBetCard bet={item} />
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <View style={styles.modalHeaderLeft}>
              {renderProfilePicture(subscription.seller_avatar_url, subscription.seller_username)}
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  {subscription.strategy_name || 'Strategy'} - Open Bets
                </Text>
                <Text style={styles.modalSubtitle}>
                  by @{subscription.seller_username || 'Unknown'} • {unifiedBetsList.length} open
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalContent}>
          {unifiedBetsList.length > 0 ? (
            <FlatList
              data={unifiedBetsList}
              renderItem={renderBetItem}
              keyExtractor={item => ('legs' in item ? item.parlay_id : item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            />
          ) : (
            <View style={styles.modalEmptyState}>
              <Icon name="time-outline" size={64} color={theme.colors.text.light} />
              <Text style={styles.modalEmptyTitle}>No open bets</Text>
              <Text style={styles.modalEmptyText}>
                All bets for this strategy have either settled or games have started.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeAreaContainer: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  marketplaceHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  marketplaceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  marketplaceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  marketplaceShieldIcon: {
    opacity: 0.8,
  },
  marketplaceTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  marketplaceRefreshButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  marketplaceTabRow: {
    marginBottom: 0,
  },
  marketplaceTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
  },
  marketplaceTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  marketplaceActiveTab: {
    backgroundColor: theme.colors.primary,
  },
  marketplaceTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  marketplaceActiveTabText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.error,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  browseButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  statCardContent: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#047857',
    fontWeight: theme.typography.fontWeight.medium,
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  subscriptionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subscriptionHeaderGradient: {
    padding: theme.spacing.lg,
  },
  subscriptionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  subscriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionHeaderText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  initialsText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  subscriptionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subscriptionSellerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusActiveText: {
    color: '#047857',
  },
  statusCancelledText: {
    color: '#DC2626',
  },
  subscriptionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  performanceSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  performanceMetrics: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  performanceMetric: {
    flex: 1,
  },
  performanceMetricCard: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  performanceMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  performanceMetricValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  todaysBetsSection: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  todaysBetsGradient: {
    padding: theme.spacing.lg,
  },
  todaysBetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  todaysBetsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#2563EB',
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  todaysBetsDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: '#1E40AF',
  },
  subscriptionDetails: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subscriptionDetailsLeft: {
    flex: 1,
  },
  subscriptionDetailsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  subscriptionDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subscriptionDetailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  subscriptionDetailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  priceTag: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  priceTagText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  subscriptionActions: {
    marginLeft: theme.spacing.md,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  manageBillingButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.sm,
  },
  // Billing Tab Styles
  billingSection: {
    marginBottom: theme.spacing.xl,
  },
  billingSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: theme.spacing.md,
  },
  paymentMethodTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  paymentMethodSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  manageButton: {
    backgroundColor: '#EBF4FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  manageButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemText: {
    marginLeft: theme.spacing.md,
  },
  historyItemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  historyItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  historyItemMeta: {
    alignItems: 'flex-end',
  },
  historyItemPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  emptyHistoryCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyHistoryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyHistoryText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  portalCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  portalDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  portalButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  portalButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  // Modal Styles
  modalBetCardWrapper: {
    marginHorizontal: -theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  modalContent: {
    flex: 1,
  },
  modalListContent: {
    paddingBottom: theme.spacing.xl,
  },
  modalEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalEmptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  modalEmptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  // Modal Bet Card Styles (no monetary info)
  modalBetCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  modalBetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBetMainInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  modalBetTeams: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalBetDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modalBetLeague: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  modalBetOdds: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  modalBetOddsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  modalBetOddsIcon: {
    marginLeft: theme.spacing.xs,
  },
  // ShareableUnifiedBetCard styles (matches SellScreen)
  shareableBetCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  shareableBetContent: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    alignItems: 'center',
    minHeight: 60,
  },
  shareableBetLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 45,
  },
  shareableBetMainLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 3,
    lineHeight: 17,
  },
  shareableBetSubLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    lineHeight: 15,
  },
  shareableBetTertiaryLine: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.light,
    lineHeight: 13,
  },
  shareableBetRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 60,
  },
  shareableBetOdds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'right',
  },
  shareableExpandIcon: {
    marginLeft: theme.spacing.xs,
  },
  shareableLegsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  shareableLegsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  shareableLegsHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  shareableLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 50,
  },
  shareableLegNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  shareableLegNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  shareableLegContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 36,
  },
  shareableLegMarketLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
    lineHeight: 15,
  },
  shareableLegTeamMatchup: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 1,
    lineHeight: 13,
  },
  shareableLegInfo: {
    fontSize: 9,
    color: theme.colors.text.light,
    lineHeight: 11,
  },
  shareableLegRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  shareableLegOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  // Notification Badge Styles
  notificationBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  // Enhanced Subscription Card Styles (based on BetDetailsModal theme)
  enhancedSubscriptionCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
    elevation: 8,
    // Enhanced floating effect
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.15,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  // Clean Header - No Gradient
  enhancedSubscriptionHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  enhancedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  enhancedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  enhancedHeaderText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  enhancedSubscriptionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  enhancedSellerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  enhancedDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  enhancedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  enhancedStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Enhanced Metrics Section
  enhancedMetricsSection: {
    padding: theme.spacing.md,
    backgroundColor: 'white',
  },
  enhancedMetricsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  enhancedMetricCard: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
    elevation: 3,
  },
  enhancedMetricCardWhite: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  enhancedMetricCardGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#14532d',
  },
  enhancedMetricCardRed: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  enhancedMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedMetricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  enhancedMetricLabelBlack: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enhancedMetricValueBlack: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Enhanced Open Bets Section
  enhancedOpenBetsSection: {
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
    elevation: 4,
  },
  enhancedOpenBetsGradient: {
    position: 'relative',
  },
  enhancedOpenBetsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  enhancedOpenBetsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedOpenBetsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  enhancedOpenBetsText: {
    flex: 1,
  },
  enhancedOpenBetsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  enhancedOpenBetsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  enhancedOpenBetsRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedNotificationBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'white',
  },
  enhancedNotificationText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: 'white',
  },

  // Enhanced Details Section
  enhancedDetailsSection: {
    padding: theme.spacing.md,
    backgroundColor: 'white',
  },
  enhancedDetailsGrid: {
    marginBottom: theme.spacing.md,
  },
  enhancedDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  enhancedDetailRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  enhancedDetailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  enhancedDetailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  enhancedPriceTag: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  enhancedPriceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Enhanced Actions Row
  enhancedActionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  enhancedManageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  enhancedManageButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  enhancedCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.status.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.status.error + '30',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  enhancedCancelButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    fontWeight: '600',
  },

  // Enhanced Profile Picture Styles
  enhancedProfilePicture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  enhancedInitialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  enhancedInitialsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
})
