import { Ionicons } from '@expo/vector-icons'
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

interface ViewStrategyModalProps {
  visible: boolean
  strategyId?: string
  onClose: () => void
}

export default function ViewStrategyModal({
  visible,
  strategyId,
  onClose,
}: ViewStrategyModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [strategyInfo, setStrategyInfo] = useState<StrategyInfo | null>(null)
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Load strategy data when modal opens
  const loadStrategyData = async () => {
    if (!strategyId) return

    try {
      setLoading(true)
      setError(null)

      // Check leaderboard first
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('strategy_leaderboard')
        .select('*')
        .eq('strategy_id', strategyId)

      // Fetch strategy data
      const { data: strategiesData, error: strategyError } = await supabase
        .from('strategies')
        .select('id, name, description, user_id, pricing_weekly, pricing_monthly, pricing_yearly')
        .eq('id', strategyId)

      if (strategyError) {
        throw new Error(`Failed to fetch strategy: ${strategyError.message}`)
      }

      let strategyData

      if (!strategiesData || strategiesData.length === 0) {
        // Use leaderboard data if strategy not found
        if (leaderboardData && leaderboardData.length > 0) {
          const leaderboard = leaderboardData[0]

          setStrategyInfo({
            id: leaderboard.strategy_id,
            name: leaderboard.strategy_name,
            description: `Strategy by ${leaderboard.username}`,
            pricing_weekly: leaderboard.subscription_price_weekly,
            pricing_monthly: leaderboard.subscription_price_monthly,
            pricing_yearly: leaderboard.subscription_price_yearly,
          })

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
          throw new Error('Strategy not found')
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
      if (!profileError && profileData && profileData.length > 0) {
        profile = profileData[0]
      }

      // Fetch seller profile data from seller_profiles table
      let sellerProfileData = null
      if (profile) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('seller_profiles')
          .select('profile_img, bio')
          .eq('user_id', strategyData.user_id)

        if (!sellerError && sellerData && sellerData.length > 0) {
          sellerProfileData = sellerData[0]
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

      // Fetch performance data
      const { data: performanceData, error: performanceError } = await supabase
        .from('strategy_leaderboard')
        .select('roi_percentage, win_rate, total_bets, winning_bets, losing_bets, push_bets')
        .eq('strategy_id', strategyId)

      if (performanceError || !performanceData || performanceData.length === 0) {
        setPerformanceInfo({
          roi_percentage: 0,
          win_rate: 0,
          total_bets: 0,
          winning_bets: 0,
          losing_bets: 0,
          push_bets: 0,
        })
      } else {
        setPerformanceInfo(performanceData[0])
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
      return <Image source={{ uri: imageUrl }} style={styles.profilePicture} />
    }

    // Show user initials as fallback
    const initials = sellerInfo?.username ? sellerInfo.username.substring(0, 2).toUpperCase() : '??'
    return (
      <View style={[styles.profilePicture, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    )
  }

  const renderPricingInfo = () => {
    if (!strategyInfo) return null

    const pricingOptions = [
      {
        type: 'weekly',
        price: strategyInfo.pricing_weekly,
        label: 'Weekly Plan',
        period: '/week',
      },
      {
        type: 'monthly',
        price: strategyInfo.pricing_monthly,
        label: 'Monthly Plan',
        period: '/month',
      },
      {
        type: 'yearly',
        price: strategyInfo.pricing_yearly,
        label: 'Yearly Plan',
        period: '/year',
      },
    ]

    const validOptions = pricingOptions.filter(
      option => option.price !== undefined && option.price !== null && option.price > 0
    )

    if (validOptions.length === 0) {
      return (
        <View style={styles.freePricingCard}>
          <View style={styles.freePricingHeader}>
            <Ionicons name="gift" size={24} color={theme.colors.primary} />
            <Text style={styles.freePricingTitle}>Free Strategy</Text>
          </View>
          <Text style={styles.freePricingDescription}>
            This strategy is available at no cost on our website
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.pricingInfoSection}>
        <Text style={styles.pricingInfoTitle}>Pricing Information</Text>
        <Text style={styles.pricingInfoSubtitle}>Set by creator • Available on truesharp.io</Text>

        <View style={styles.pricingGrid}>
          {validOptions.map((option, index) => (
            <View key={option.type} style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>{option.label}</Text>
              <Text style={styles.pricingAmount}>
                {formatCurrency(option.price!)}
                <Text style={styles.pricingPeriod}>{option.period}</Text>
              </Text>
            </View>
          ))}
        </View>
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
          <Text style={styles.errorTitle}>Unable to Load Strategy</Text>
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
          <Ionicons name="search" size={64} color={theme.colors.text.light} />
          <Text style={styles.errorTitle}>Strategy Not Found</Text>
          <Text style={styles.errorMessage}>This strategy could not be located.</Text>
        </View>
      )
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seller Information */}
        <View style={styles.sellerSection}>
          <View style={styles.sellerHeader}>
            {renderProfilePicture()}
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerDisplayName}>
                  {sellerInfo.display_name || `@${sellerInfo.username}`}
                </Text>
                {sellerInfo.verification_status !== 'unverified' && (
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                )}
              </View>
              <Text style={styles.sellerUsername}>@{sellerInfo.username}</Text>
              {sellerInfo.bio && (
                <Text style={styles.sellerBio} numberOfLines={2}>
                  {sellerInfo.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Strategy Information */}
        <View style={styles.strategySection}>
          <Text style={styles.strategyName}>{strategyInfo.name}</Text>
          {strategyInfo.description && (
            <Text style={styles.strategyDescription}>{strategyInfo.description}</Text>
          )}
        </View>

        {/* Performance Metrics */}
        {performanceInfo && (
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
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
                <Text style={styles.performanceLabel}>Total Bets</Text>
              </View>
            </View>
          </View>
        )}

        {/* Pricing Information */}
        {renderPricingInfo()}

        {/* What You Get Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="notifications" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Real-time pick notifications</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="analytics" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Detailed performance tracking</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="time" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Historical betting data</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
              <Text style={styles.benefitText}>Verified strategy creator</Text>
            </View>
          </View>
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
            <TrueSharpShield size={20} variant="default" />
            <Text style={styles.modalTitle}>Strategy Details</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}

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
            <Ionicons name="globe" size={16} color="white" />
            <Text style={styles.viewSellerButtonText}>View Seller Page</Text>
          </TouchableOpacity>
        </View>

        {/* Simple Footer */}
        <View style={styles.footerNotice}>
          <Text style={styles.footerText}>
            This app does not process payments. All transactions occur securely on our website.
          </Text>
        </View>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },

  // Loading & Error States
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

  // Seller Section
  sellerSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profilePicture: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  initialsText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sellerDisplayName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  sellerUsername: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  sellerBio: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Strategy Section
  strategySection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  strategyDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },

  // Performance Section
  performanceSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  performanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  performanceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Pricing Section
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

  // Benefits Section
  benefitsSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  benefitsList: {
    gap: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  benefitText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  copyLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  viewSellerButton: {
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
  viewSellerButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },

  // Footer Notice
  footerNotice: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
