import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { 
  SellerProfile, 
  StrategyLeaderboard, 
  fetchSellerProfile, 
  fetchSellerStrategies 
} from '../../services/supabaseAnalytics';
import TrueSharpShield from '../common/TrueSharpShield';
import SubscribeToStrategyModal from '../subscription/SubscribeToStrategyModal';

interface SellerProfileModalProps {
  visible: boolean;
  username: string;
  onClose: () => void;
  onSubscribe?: (strategy: StrategyLeaderboard) => void;
}

export default function SellerProfileModal({ 
  visible, 
  username, 
  onClose, 
  onSubscribe 
}: SellerProfileModalProps) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [strategies, setStrategies] = useState<(StrategyLeaderboard & { subscriber_count?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Load seller data
  const loadSellerData = async () => {
    if (!username) return;

    try {
      setLoading(true);
      setError(null);
      // Fetch profile and strategies in parallel
      const [profileData, strategiesData] = await Promise.all([
        fetchSellerProfile(username),
        fetchSellerStrategies(username)
      ]);
      setProfile(profileData);
      setStrategies(strategiesData);
    } catch (err) {
      console.error('Error loading seller data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && username) {
      loadSellerData();
    }
  }, [visible, username]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRecord = (wins: number, losses: number, pushes: number) => {
    return `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`;
  };

  const renderProfilePicture = () => {
    if (profile?.profile_img || profile?.profile_picture_url) {
      return (
        <Image 
          source={{ uri: profile.profile_img || profile.profile_picture_url }}
          style={styles.profilePicture}
          onError={() => {
          }}
        />
      );
    }
    
    // Show user initials as fallback
    const initials = profile?.username ? profile.username.substring(0, 2).toUpperCase() : '??';
    return (
      <View style={[styles.profilePicture, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  };

  const renderStrategyItem = ({ item: strategy, index }: { item: StrategyLeaderboard & { subscriber_count?: number }; index: number }) => {
    return (
      <View style={styles.strategyCard}>
      <View style={styles.strategyHeader}>
        <View style={styles.strategyTitleRow}>
          <Text style={styles.strategyName} numberOfLines={2}>
            {strategy.strategy_name}
          </Text>
          {strategy.is_monetized && (
            <TouchableOpacity 
              style={styles.subscribeButtonContainer} 
              onPress={() => {
                setSelectedStrategyId(strategy.strategy_id);
                setShowSubscribeModal(true);
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#1E40AF', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subscribeButton}
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text style={styles.subscribeButtonText}>Follow Picks</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.strategyMeta}>
          {strategy.primary_sport && (
            <View style={styles.sportTag}>
              <Text style={styles.sportText}>{strategy.primary_sport}</Text>
            </View>
          )}
          {strategy.verification_status !== 'unverified' && (
            <View style={[styles.verificationBadge, 
              { backgroundColor: strategy.verification_status === 'premium' ? theme.colors.primary : theme.colors.secondary }
            ]}>
              <Ionicons name="checkmark-circle" size={12} color="white" />
              <Text style={styles.verificationText}>
                {strategy.verification_status === 'premium' ? 'Premium' : 'Verified'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.strategyMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ROI</Text>
          <Text style={[
            styles.metricValue,
            { color: strategy.roi_percentage >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
          ]}>
            {strategy.roi_percentage >= 0 ? '+' : ''}{strategy.roi_percentage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Record</Text>
          <Text style={styles.metricValue}>
            {formatRecord(strategy.winning_bets, strategy.losing_bets, strategy.push_bets)}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Win Rate</Text>
          <Text style={styles.metricValue}>
            {(strategy.win_rate * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Bets</Text>
          <Text style={styles.metricValue}>
            {strategy.total_bets}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Subs</Text>
          <Text style={styles.metricValue}>
            {strategy.subscriber_count || 0}
          </Text>
        </View>
      </View>

      {strategy.is_monetized && (
        <View style={styles.pricingRow}>
          {strategy.subscription_price_weekly && (
            <View style={styles.pricingOption}>
              <Text style={styles.pricingLabel}>Weekly</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(strategy.subscription_price_weekly)}
              </Text>
            </View>
          )}
          {strategy.subscription_price_monthly && (
            <View style={styles.pricingOption}>
              <Text style={styles.pricingLabel}>Monthly</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(strategy.subscription_price_monthly)}
              </Text>
            </View>
          )}
          {strategy.subscription_price_yearly && (
            <View style={styles.pricingOption}>
              <Text style={styles.pricingLabel}>Yearly</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(strategy.subscription_price_yearly)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading seller profile...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSellerData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.text.light} />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorMessage}>This seller profile could not be found.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        {profile.banner_img && (
          <Image
            source={{ uri: profile.banner_img }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            {renderProfilePicture()}
            <View style={styles.profileDetails}>
              <View style={styles.usernameRow}>
                <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
                <Text style={styles.displayName}>
                  {profile.display_name || `@${profile.username}`}
                </Text>
              </View>
              <Text style={styles.username}>@{profile.username}</Text>
              {profile.verified_seller && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                  <Text style={styles.verifiedText}>Verified Seller</Text>
                </View>
              )}
            </View>
          </View>
          
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>
                {profile.overall_roi >= 0 ? '+' : ''}{profile.overall_roi.toFixed(1)}%
              </Text>
              <Text style={styles.metricCardLabel}>Overall ROI</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>
                {(profile.overall_win_rate * 100).toFixed(1)}%
              </Text>
              <Text style={styles.metricCardLabel}>Win Rate</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>{profile.total_bets}</Text>
              <Text style={styles.metricCardLabel}>Total Bets</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>{profile.total_strategies}</Text>
              <Text style={styles.metricCardLabel}>Strategies</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>{profile.monetized_strategies}</Text>
              <Text style={styles.metricCardLabel}>Monetized</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricCardValue}>{profile.total_subscribers}</Text>
              <Text style={styles.metricCardLabel}>Subscribers</Text>
            </View>
          </View>
        </View>

        {/* Strategies Section */}
        <View style={styles.strategiesSection}>
          <Text style={styles.sectionTitle}>
            Monetized Strategies ({strategies.filter(s => s.is_monetized).length})
          </Text>
          {strategies.filter(s => s.is_monetized).length > 0 ? (
            <FlatList
              data={strategies.filter(s => s.is_monetized)}
              renderItem={renderStrategyItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noStrategiesContainer}>
              <Ionicons name="document-outline" size={48} color={theme.colors.text.light} />
              <Text style={styles.noStrategiesText}>No monetized strategies found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

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
          <Text style={styles.modalTitle}>Seller Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}
      </View>

      {/* Subscribe to Strategy Modal */}
      <SubscribeToStrategyModal
        visible={showSubscribeModal}
        strategyId={selectedStrategyId || undefined}
        onClose={() => {
          setShowSubscribeModal(false);
          setSelectedStrategyId(null);
        }}
        onSubscribe={(strategyId, priceType, price) => {
          // Handle the subscription logic here
          setShowSubscribeModal(false);
          setSelectedStrategyId(null);
          // You can call the original onSubscribe prop if needed
        }}
      />
    </Modal>
  );
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
  bannerImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.surface,
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
  profileHeader: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  profileDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  shieldIcon: {
    marginRight: theme.spacing.xs,
    opacity: 0.8,
  },
  displayName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  username: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bio: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  metricsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  metricCardValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  metricCardLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  strategiesSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    marginTop: theme.spacing.sm,
  },
  strategyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  strategyHeader: {
    marginBottom: theme.spacing.sm,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  subscribeButtonContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    minHeight: 36,
  },
  subscribeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  strategyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sportTag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  sportText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.medium,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: 2,
  },
  verificationText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.medium,
  },
  strategyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pricingOption: {
    alignItems: 'center',
    flex: 1,
  },
  pricingLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  pricingValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  noStrategiesContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  noStrategiesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});