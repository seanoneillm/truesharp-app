import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { theme } from '../../styles/theme'
import TrueSharpShield from '../common/TrueSharpShield'
import { StrategyBettingMetrics, fetchStrategyBettingMetrics } from '../../services/supabaseAnalytics'

interface SellerInfo {
  user_id: string
  username: string
  display_name?: string
  profile_picture_url?: string
  profile_img?: string
  bio?: string
  verification_status?: string
}

interface StrategyInfo {
  id: string
  name: string
  description?: string
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
}

interface PerformanceInfo {
  roi_percentage: number
  win_rate: number
  total_bets: number
  winning_bets: number
  losing_bets: number
  push_bets: number
}

interface SubscribeToStrategyModalProps {
  visible: boolean
  strategyId?: string
  onClose: () => void
}

export default function SubscribeToStrategyModal({
  visible,
  strategyId,
  onClose,
}: SubscribeToStrategyModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [strategyInfo, setStrategyInfo] = useState<StrategyInfo | null>(null)
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo | null>(null)
  const [bettingMetrics, setBettingMetrics] = useState<StrategyBettingMetrics | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Load strategy data when modal opens
  const loadStrategyData = async () => {
    if (!strategyId) return

    try {
      setLoading(true)
      setError(null)
      // First, let's check what's in the leaderboard for this ID
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .eq('strategy_id', strategyId)
      // Fetch strategy data from strategies table
      const { data: strategiesData, error: strategyError } = await supabase
        .from('strategies')
        .select('id, name, description, user_id, pricing_weekly, pricing_monthly, pricing_yearly')
        .eq('id', strategyId)

      if (strategyError) {
        console.error('Step 1 Error:', strategyError)
        throw new Error(`Failed to fetch strategy: ${strategyError.message}`)
      }

      let strategyData

      if (!strategiesData || strategiesData.length === 0) {
        console.error('Step 1 Error: No strategy found for ID:', strategyId)
        // Let's see what strategies do exist
        const { data: sampleStrategies } = await supabase
          .from('strategies')
          .select('id, name')
          .limit(5)
        // If we have leaderboard data but no strategy, let's try to use leaderboard data
        if (leaderboardData && leaderboardData.length > 0) {
          const leaderboard = leaderboardData[0]

          // Create strategy info from leaderboard data
          setStrategyInfo({
            id: leaderboard.strategy_id,
            name: leaderboard.strategy_name,
            description: `Strategy by ${leaderboard.username}`, // fallback description
            pricing_weekly: leaderboard.subscription_price_weekly,
            pricing_monthly: leaderboard.subscription_price_monthly,
            pricing_yearly: leaderboard.subscription_price_yearly,
          })

          // Continue with the user lookup using user_id from leaderboard
          strategyData = {
            id: leaderboard.strategy_id,
            name: leaderboard.strategy_name,
            description: `Strategy by ${leaderboard.username}`,
            user_id: leaderboard.user_id,
            pricing_weekly: leaderboard.subscription_price_weekly,
            pricing_monthly: leaderboard.subscription_price_monthly,
            pricing_yearly: leaderboard.subscription_price_yearly,
          }
        } else {
          throw new Error('Strategy not found in either table')
        }
      } else {
        strategyData = strategiesData[0]
        setStrategyInfo({
          id: strategyData.id,
          name: strategyData.name,
          description: strategyData.description,
          pricing_weekly: strategyData.pricing_weekly,
          pricing_monthly: strategyData.pricing_monthly,
          pricing_yearly: strategyData.pricing_yearly,
        })
      }

      // Fetch seller profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, profile_picture_url')
        .eq('id', strategyData.user_id)

      let profile = null
      if (profileError) {
      } else if (profileData && profileData.length > 0) {
        profile = profileData[0]
      } else {
      }

      // Fetch seller profile data from seller_profiles table
      let sellerProfileData = null
      if (profile) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('seller_profiles')
          .select('profile_img, bio')
          .eq('user_id', strategyData.user_id)

        if (sellerError) {
        } else if (sellerData && sellerData.length > 0) {
          sellerProfileData = sellerData[0]
        } else {
        }
      }

      if (profile) {
        setSellerInfo({
          user_id: strategyData.user_id,
          username: profile.username || 'anonymous',
          display_name: profile.display_name,
          profile_picture_url: profile.profile_picture_url,
          profile_img: sellerProfileData?.profile_img,
          bio: sellerProfileData?.bio,
        })
      }

      // Fetch performance data from strategy_leaderboard
      const { data: performanceData, error: performanceError } = await supabase
        .from('strategy_leaderboard')
        .select('roi_percentage, win_rate, total_bets, winning_bets, losing_bets, push_bets')
        .eq('strategy_id', strategyId)

      if (performanceError || !performanceData || performanceData.length === 0) {
        // Set default performance data if not found or error occurred
        setPerformanceInfo({
          roi_percentage: 0,
          win_rate: 0,
          total_bets: 0,
          winning_bets: 0,
          losing_bets: 0,
          push_bets: 0,
        })
      } else {
        // Use the first result if multiple rows exist
        setPerformanceInfo(performanceData[0])
      }

      // Fetch betting metrics
      try {
        const metrics = await fetchStrategyBettingMetrics(strategyId)
        setBettingMetrics(metrics)
      } catch (metricsError) {
        console.error('Error fetching betting metrics:', metricsError)
        // Set default values if metrics fetch fails
        setBettingMetrics({
          avgBetsPerWeek: 0,
          firstBetDate: null,
          totalWeeksActive: 0,
          mostActivePeriod: 'No data',
          recentActivity: 'low'
        })
      }
    } catch (err) {
      console.error('Error loading strategy data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load strategy data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible && strategyId) {
      loadStrategyData()
    }
  }, [visible, strategyId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatRecord = (wins: number, losses: number, pushes: number) => {
    return `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`
  }

  const formatFirstBetDate = (dateString: string | null) => {
    if (!dateString) return 'No data'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getSellerUrl = () => {
    if (!sellerInfo?.username) return ''
    return `https://truesharp.io/marketplace/${sellerInfo.username}`
  }

  const handleViewSellerPage = async () => {
    const url = getSellerUrl()
    if (!url) return

    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        throw new Error('Cannot open URL')
      }
    } catch (error) {
      Alert.alert(
        'Cannot Open Link',
        'Unable to open the seller page. Please copy the link and open it in Safari.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleCopyLink = () => {
    const url = getSellerUrl()
    if (!url) return

    Clipboard.setString(url)
    setLinkCopied(true)

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setLinkCopied(false)
    }, 2000)
  }

  const renderProfilePicture = () => {
    const imageUrl = sellerInfo?.profile_img || sellerInfo?.profile_picture_url

    if (imageUrl) {
      return <Image source={{ uri: imageUrl }} style={styles.profilePicture} onError={() => {}} />
    }

    // Show user initials as fallback
    const initials = sellerInfo?.username ? sellerInfo.username.substring(0, 2).toUpperCase() : '??'
    return (
      <View style={[styles.profilePicture, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading strategy details...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error Loading Strategy</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStrategyData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!strategyInfo || !sellerInfo) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color={theme.colors.text.light} />
          <Text style={styles.errorTitle}>Strategy Not Found</Text>
          <Text style={styles.errorMessage}>This strategy could not be found.</Text>
        </View>
      )
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Combined Seller & Strategy Section */}
        <View style={styles.mainSection}>
          {/* Seller Information */}
          <View style={styles.sellerContainer}>
            {renderProfilePicture()}
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerDisplayName}>
                  {sellerInfo.display_name || `@${sellerInfo.username}`}
                </Text>
                {sellerInfo.verification_status !== 'unverified' && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.sellerUsername}>@{sellerInfo.username}</Text>
            </View>
          </View>

          {/* Strategy Information */}
          <View style={styles.strategyContainer}>
            <Text style={styles.strategyName}>{strategyInfo.name}</Text>
            <Text style={styles.strategyDescription}>
              {strategyInfo.description || 'No description provided.'}
            </Text>
          </View>

          {/* Performance Metrics - Compact Grid */}
          {performanceInfo && (
            <View style={styles.performanceContainer}>
              <Text style={styles.sectionTitle}>Performance</Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceCard}>
                  <Text
                    style={[
                      styles.performanceValue,
                      {
                        color:
                          performanceInfo.roi_percentage >= 0
                            ? theme.colors.betting.won
                            : theme.colors.betting.lost,
                      },
                    ]}
                  >
                    {performanceInfo.roi_percentage >= 0 ? '+' : ''}
                    {performanceInfo.roi_percentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.performanceLabel}>ROI</Text>
                </View>

                <View style={styles.performanceCard}>
                  <Text style={styles.performanceValue}>
                    {(performanceInfo.win_rate * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.performanceLabel}>Win Rate</Text>
                </View>

                <View style={styles.performanceCard}>
                  <Text style={styles.performanceValue}>
                    {formatRecord(
                      performanceInfo.winning_bets,
                      performanceInfo.losing_bets,
                      performanceInfo.push_bets
                    )}
                  </Text>
                  <Text style={styles.performanceLabel}>Record</Text>
                </View>

                <View style={styles.performanceCard}>
                  <Text style={styles.performanceValue}>{performanceInfo.total_bets}</Text>
                  <Text style={styles.performanceLabel}>Bets</Text>
                </View>
              </View>
            </View>
          )}

          {/* Betting Activity Metrics */}
          {bettingMetrics && (
            <View style={styles.bettingMetricsContainer}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <View style={styles.bettingMetricsGrid}>
                <View style={styles.bettingMetricCard}>
                  <Text style={styles.bettingMetricValue}>{bettingMetrics.avgBetsPerWeek}</Text>
                  <Text style={styles.bettingMetricLabel}>Avg/Week</Text>
                </View>
                
                <View style={styles.bettingMetricCard}>
                  <Text style={styles.bettingMetricValue}>{formatFirstBetDate(bettingMetrics.firstBetDate)}</Text>
                  <Text style={styles.bettingMetricLabel}>Since</Text>
                </View>
                
                <View style={styles.bettingMetricCard}>
                  <View style={[styles.activityIndicator, 
                    { backgroundColor: 
                        bettingMetrics.recentActivity === 'high' ? theme.colors.betting.won :
                        bettingMetrics.recentActivity === 'medium' ? '#FFA500' :
                        theme.colors.text.light
                    }
                  ]}>
                    <Text style={styles.activityIndicatorText}>
                      {bettingMetrics.recentActivity.charAt(0).toUpperCase() + bettingMetrics.recentActivity.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.bettingMetricLabel}>Activity</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.copyLinkButton} onPress={handleCopyLink}>
            <Ionicons
              name={linkCopied ? 'checkmark' : 'copy'}
              size={16}
              color={linkCopied ? theme.colors.betting.won : theme.colors.text.secondary}
            />
            <Text style={[styles.copyLinkText, linkCopied && { color: theme.colors.betting.won }]}>
              {linkCopied ? 'Link Copied!' : 'Copy Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewSellerButton} onPress={handleViewSellerPage}>
            <LinearGradient
              colors={['#3B82F6', '#1E40AF', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.viewSellerButtonGradient}
            >
              <Ionicons name="globe" size={16} color="white" />
              <Text style={styles.viewSellerButtonText}>View Seller Page</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Plans Notice */}
        <View style={styles.plansNoticeContainer}>
          <Text style={styles.plansNoticeText}>
            Visit the seller page to see all picks for this strategy.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <TrueSharpShield size={24} variant="default" />
            <Text style={styles.modalTitle}>Strategy Details</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },

  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Main Section - Combined Layout
  mainSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  initialsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: theme.spacing.xs,
  },
  sellerDisplayName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  verifiedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerUsername: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Strategy Section - Compact
  strategyContainer: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  strategyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Performance Section - Compact
  performanceContainer: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  performanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    flex: 1,
    minHeight: 60,
  },
  performanceValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  performanceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Pricing Section - Streamlined
  pricingSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  pricingOptionsContainer: {
    gap: theme.spacing.sm,
  },

  // Informational price cards (non-clickable)
  pricingInfoCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  pricingInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  pricingInfoLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  pricingInfoBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  pricingInfoBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  pricingInfoPrice: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  pricingInfoNote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  freeDisplayText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  pricingButtonContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pricingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  pricingButtonLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  pricingButtonPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  freeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  freeText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  noPricingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  noPricingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  // Strategy Benefits
  benefitsContainer: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  benefitsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  benefitsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 46,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyLinkText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  viewSellerButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    minHeight: 46,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewSellerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minHeight: 46,
  },
  viewSellerButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    letterSpacing: 0.5,
  },
  plansNoticeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
  },
  plansNoticeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
  webSubscribeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  webSubscribeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },

  // Pricing Info Styles
  pricingInfoSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pricingInfoTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  pricingInfoSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  pricingGrid: {
    gap: theme.spacing.sm,
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pricingLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  pricingAmount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  pricingPeriod: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.secondary,
  },
  freePricingCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  freePricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  freePricingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  freePricingDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Betting Metrics Section
  bettingMetricsContainer: {
    marginTop: theme.spacing.md,
  },
  bettingMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  bettingMetricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    flex: 1,
    minHeight: 55,
  },
  bettingMetricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  bettingMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  activityIndicator: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  activityIndicatorText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
})
