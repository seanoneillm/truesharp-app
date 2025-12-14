import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { StrategyLeaderboard, fetchUserStrategiesFromLeaderboard, createStrategy, AnalyticsFilters } from '../../services/supabaseAnalytics';
import { 
  validateStrategyFilters, 
  convertFiltersToWebFormat, 
  StrategyValidationResult 
} from '../../utils/strategyValidation';
import { useAuth } from '../../contexts/AuthContext';
import TrueSharpShield from '../common/TrueSharpShield';

interface StrategiesTabProps {
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  filters?: AnalyticsFilters;
}

export default function StrategiesTab({ loading = false, onRefresh, filters }: StrategiesTabProps) {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<StrategyLeaderboard[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStrategyDetails, setShowStrategyDetails] = useState<StrategyLeaderboard | null>(null);

  // Load strategies
  const loadStrategies = async () => {
    if (!user?.id) return;

    try {
      setStrategiesLoading(true);
      const data = await fetchUserStrategiesFromLeaderboard(user.id);
      setStrategies(data);
    } catch (error) {
      console.error('Error loading strategies:', error);
      Alert.alert('Error', 'Failed to load strategies');
    } finally {
      setStrategiesLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, [user?.id]);
  
  // Create strategy form state
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [validation, setValidation] = useState<StrategyValidationResult | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStrategies();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setStrategyName('');
    setStrategyDescription('');
    setValidation(null);
    setShowValidationAlert(false);
  };

  // Validate current filters when modal opens or filters change
  const validateCurrentFilters = () => {
    if (filters) {
      const webFilters = convertFiltersToWebFormat(filters);
      const result = validateStrategyFilters(webFilters);
      setValidation(result);
      return result;
    }
    return null;
  };

  const handleCreateStrategy = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!strategyName.trim()) {
      Alert.alert('Error', 'Please enter a strategy name');
      return;
    }

    if (!strategyDescription.trim()) {
      Alert.alert('Error', 'Please enter a strategy description');
      return;
    }

    // Validate filters before creating
    const validationResult = validateCurrentFilters();
    if (!validationResult?.isValid) {
      setShowValidationAlert(true);
      return;
    }

    setCreating(true);
    try {
      await createStrategy(user.id, {
        name: strategyName.trim(),
        description: strategyDescription.trim(),
        filters: filters || {
          timeframe: 'all',
          sports: [],
          leagues: [],
          betTypes: [],
          sportsbooks: [],
          results: ['won', 'lost', 'pending', 'void', 'cancelled'],
          dateRange: { start: null, end: null },
          minOdds: null,
          maxOdds: null,
          minStake: null,
          maxStake: null,
          minSpread: null,
          maxSpread: null,
          minTotal: null,
          maxTotal: null,
          startDate: null,
          endDate: null,
          isParlay: null,
          side: null,
          oddsType: null,
        }, // Use current smart filters with fallback
        monetized: false, // Users cannot monetize here
        pricing_weekly: undefined,
        pricing_monthly: undefined,
        pricing_yearly: undefined,
      });
      
      resetForm();
      setShowCreateModal(false);
      setValidation(null);
      Alert.alert('Success', 'Strategy created successfully! Your strategy will automatically track bets that match your selected filters.');
      await loadStrategies(); // Reload strategies
    } catch (error) {
      console.error('Error creating strategy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create strategy';
      Alert.alert('Error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    validateCurrentFilters();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format current filters for display
  const getActiveFiltersDisplay = () => {
    if (!filters) return [];
    
    const activeFilters = [];
    
    // Timeframe
    if (filters.timeframe && filters.timeframe !== 'all') {
      const timeframeLabels = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days', 
        '90d': 'Last 90 Days',
        'ytd': 'Year to Date',
        'custom': 'Custom Date Range'
      };
      activeFilters.push({
        label: 'Timeframe',
        value: timeframeLabels[filters.timeframe as keyof typeof timeframeLabels] || filters.timeframe
      });
    }

    // Sports
    if (filters.sports && filters.sports.length > 0) {
      activeFilters.push({
        label: 'Sports',
        value: filters.sports.slice(0, 3).join(', ') + (filters.sports.length > 3 ? `... (+${filters.sports.length - 3} more)` : '')
      });
    }

    // Leagues
    if (filters.leagues && filters.leagues.length > 0) {
      activeFilters.push({
        label: 'Leagues',
        value: filters.leagues.slice(0, 2).join(', ') + (filters.leagues.length > 2 ? `... (+${filters.leagues.length - 2} more)` : '')
      });
    }

    // Bet Types
    if (filters.betTypes && filters.betTypes.length > 0) {
      activeFilters.push({
        label: 'Bet Types',
        value: filters.betTypes.slice(0, 2).join(', ') + (filters.betTypes.length > 2 ? `... (+${filters.betTypes.length - 2} more)` : '')
      });
    }

    // Sportsbooks
    if (filters.sportsbooks && filters.sportsbooks.length > 0) {
      activeFilters.push({
        label: 'Sportsbooks',
        value: filters.sportsbooks.slice(0, 2).join(', ') + (filters.sportsbooks.length > 2 ? `... (+${filters.sportsbooks.length - 2} more)` : '')
      });
    }

    // Results
    if (filters.results && filters.results.length > 0 && filters.results.length < 4) {
      activeFilters.push({
        label: 'Results',
        value: filters.results.join(', ')
      });
    }

    // Odds Range
    if (filters.minOdds !== null || filters.maxOdds !== null) {
      const minOdds = filters.minOdds !== null ? filters.minOdds.toString() : 'Any';
      const maxOdds = filters.maxOdds !== null ? filters.maxOdds.toString() : 'Any';
      activeFilters.push({
        label: 'Odds Range',
        value: `${minOdds} to ${maxOdds}`
      });
    }

    // Stake Range
    if (filters.minStake !== null || filters.maxStake !== null) {
      const minStake = filters.minStake !== null ? `$${filters.minStake}` : 'Any';
      const maxStake = filters.maxStake !== null ? `$${filters.maxStake}` : 'Any';
      activeFilters.push({
        label: 'Stake Range',
        value: `${minStake} to ${maxStake}`
      });
    }

    return activeFilters;
  };

  const renderStrategyItem = ({ item: strategy }: { item: StrategyLeaderboard }) => (
    <View style={styles.strategyCard}>
      <View style={styles.strategyHeader}>
        <View style={styles.strategyInfo}>
          <Text style={styles.strategyName} numberOfLines={1}>
            {strategy.strategy_name}
          </Text>
          <View style={styles.strategyMetaInfo}>
            <Text style={styles.strategyType}>
              {strategy.strategy_type || 'General Strategy'}
            </Text>
            {strategy.primary_sport && (
              <Text style={styles.strategySport}>
                • {strategy.primary_sport}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowStrategyDetails(strategy)}
        >
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.strategyMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ROI</Text>
          <Text 
            style={[
              styles.metricValue,
              { color: strategy.roi_percentage >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
            ]}
          >
            {strategy.roi_percentage >= 0 ? '+' : ''}{strategy.roi_percentage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Win Rate</Text>
          <Text style={styles.metricValue}>
            {(strategy.win_rate * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Bets</Text>
          <Text style={styles.metricValue}>
            {strategy.total_bets}
          </Text>
        </View>

        {strategy.overall_rank && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Rank</Text>
            <Text style={styles.metricValue}>
              #{strategy.overall_rank}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.strategyFooter}>
        <View style={styles.strategyStatus}>
          {strategy.is_monetized && (
            <View style={styles.monetizedBadge}>
              <Ionicons name="cash" size={12} color="white" />
              <Text style={styles.monetizedBadgeText}>Monetized</Text>
            </View>
          )}
          
          {strategy.verification_status !== 'unverified' && (
            <View style={[styles.verificationBadge, 
              { backgroundColor: strategy.verification_status === 'premium' ? theme.colors.primary : theme.colors.secondary }
            ]}>
              <Ionicons name="checkmark-circle" size={12} color="white" />
              <Text style={styles.verificationBadgeText}>
                {strategy.verification_status === 'premium' ? 'Premium' : 'Verified'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.createdDate}>
          Created {formatDate(strategy.created_at)}
        </Text>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <TrueSharpShield size={20} variant="default" style={styles.modalShieldIcon} />
            <Text style={styles.modalTitle}>Create Strategy</Text>
          </View>
          <TouchableOpacity 
            onPress={handleCreateStrategy} 
            disabled={creating || !strategyName.trim() || validation?.isValid === false}
          >
            <Text style={[
              styles.modalCreateButton, 
              (creating || !strategyName.trim() || validation?.isValid === false) && styles.disabledButton
            ]}>
              {creating ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
          {/* Validation Alert with Explanation */}
          {validation?.isValid === false && (
            <View style={styles.validationAlert}>
              <View style={styles.validationHeader}>
                <Ionicons name="warning" size={20} color={theme.colors.status.error} />
                <Text style={styles.validationTitle}>Filter Validation Required</Text>
              </View>
              
              <View style={styles.disclaimerSection}>
                <Text style={styles.disclaimerTitle}>Why These Restrictions?</Text>
                <Text style={styles.disclaimerText}>
                  Strategies need consistent, long-term filters to provide reliable performance tracking. 
                  Certain filter types can skew results or make strategies less useful:
                </Text>
              </View>

              <View style={styles.validationErrors}>
                {validation.errors.map((error, index) => {
                  let explanation = '';
                  
                  if (error.includes('status')) {
                    explanation = 'Filtering by bet outcomes (won/lost) would create biased strategies that don\'t reflect real betting performance.';
                  } else if (error.includes('range')) {
                    explanation = 'Odds, stake, and line ranges are too specific and limit strategy applicability over time.';
                  } else if (error.includes('league') && error.includes('exactly one')) {
                    explanation = 'Strategies work best when focused on either all leagues or one specific league to maintain consistency.';
                  } else if (error.includes('bet type') && error.includes('exactly one')) {
                    explanation = 'Mixing multiple bet types can dilute strategy focus. Choose one type or include all for broader coverage.';
                  }
                  
                  return (
                    <View key={index} style={styles.validationErrorContainer}>
                      <Text style={styles.validationError}>• {error}</Text>
                      {explanation && (
                        <Text style={styles.validationExplanation}>  💡 {explanation}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Strategy Name *</Text>
            <TextInput
              style={styles.textInput}
              value={strategyName}
              onChangeText={setStrategyName}
              placeholder="Enter strategy name"
              placeholderTextColor={theme.colors.text.light}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={strategyDescription}
              onChangeText={setStrategyDescription}
              placeholder="Describe your betting strategy"
              placeholderTextColor={theme.colors.text.light}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.formLabel}>Selected Filters</Text>
            <Text style={styles.filtersDescription}>
              This strategy will automatically track bets matching your current smart filters
            </Text>
            
            {/* Filter Guidelines */}
            <View style={styles.filterGuidelines}>
              <Text style={styles.guidelinesTitle}>Strategy Filter Requirements:</Text>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.status.success} />
                <Text style={styles.guidelineText}>✅ Sports & Leagues: All or 1 specific</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.status.success} />
                <Text style={styles.guidelineText}>✅ Bet Types: All or 1 specific market</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="close-circle" size={14} color={theme.colors.status.error} />
                <Text style={styles.guidelineText}>❌ No outcome filters (won/lost)</Text>
              </View>
              <View style={styles.guidelineItem}>
                <Ionicons name="close-circle" size={14} color={theme.colors.status.error} />
                <Text style={styles.guidelineText}>❌ No odds/stake ranges</Text>
              </View>
            </View>
            {getActiveFiltersDisplay().length > 0 ? (
              <View style={styles.activeFiltersContainer}>
                {getActiveFiltersDisplay().map((filter, index) => (
                  <View key={index} style={styles.filterItem}>
                    <Text style={styles.filterLabel}>{filter.label}:</Text>
                    <Text style={styles.filterValue}>{filter.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noFiltersContainer}>
                <Text style={styles.noFiltersText}>No filters selected - strategy will include all bets</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderStrategyDetailsModal = () => (
    <Modal
      visible={!!showStrategyDetails}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStrategyDetails(null)}
    >
      {showStrategyDetails && (
        <View style={styles.detailsModalContainer}>
          {/* Enhanced Modal Header with Gradient - Similar to BetDetailsModal */}
          <LinearGradient
            colors={[theme.colors.primary, '#1e40af', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.detailsModalHeader}
          >
            <TouchableOpacity onPress={() => setShowStrategyDetails(null)} style={styles.detailsCloseButton}>
              <View style={styles.detailsCloseButtonContainer}>
                <Ionicons name="close" size={22} color="white" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.detailsHeaderCenter}>
              <View style={styles.detailsTitleContainer}>
                <Text style={styles.detailsModalTitle}>Strategy Details</Text>
                <Text style={styles.detailsModalSubtitle}>Performance & Analysis</Text>
              </View>
            </View>
            
            <View style={styles.detailsHeaderSpacer} />
          </LinearGradient>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            {/* Strategy Header - Compact Design */}
            <View style={styles.detailsSection}>
              <View style={styles.detailsSectionHeader}>
                <View style={styles.detailsSectionHeaderContent}>
                  <View style={styles.detailsSectionIconContainer}>
                    <TrueSharpShield size={18} variant="default" />
                  </View>
                  <Text style={styles.detailsSectionTitle}>Strategy Information</Text>
                </View>
              </View>
              
              <View style={styles.detailsStrategyInfo}>
                <Text style={styles.detailsStrategyName}>{showStrategyDetails.strategy_name}</Text>
                <View style={styles.detailsMetaContainer}>
                  <View style={styles.detailsMetaRow}>
                    <Ionicons name="options" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailsMetaLabel}>Type</Text>
                    <Text style={styles.detailsMetaValue}>{showStrategyDetails.strategy_type || 'General Strategy'}</Text>
                  </View>
                  {showStrategyDetails.primary_sport && (
                    <View style={styles.detailsMetaRow}>
                      <Ionicons name="basketball" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.detailsMetaLabel}>Sport</Text>
                      <Text style={styles.detailsMetaValue}>{showStrategyDetails.primary_sport}</Text>
                    </View>
                  )}
                  {showStrategyDetails.overall_rank && (
                    <View style={styles.detailsMetaRow}>
                      <Ionicons name="trophy" size={16} color={theme.colors.primary} />
                      <Text style={styles.detailsMetaLabel}>Rank</Text>
                      <Text style={[styles.detailsMetaValue, { color: theme.colors.primary, fontWeight: '700' }]}>#{showStrategyDetails.overall_rank}</Text>
                    </View>
                  )}
                  {showStrategyDetails.is_monetized && (
                    <View style={styles.detailsMetaRow}>
                      <Ionicons name="cash" size={16} color={theme.colors.status.success} />
                      <Text style={styles.detailsMetaLabel}>Status</Text>
                      <Text style={[styles.detailsMetaValue, { color: theme.colors.status.success, fontWeight: '600' }]}>Monetized</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Performance Metrics - Enhanced Cards */}
            <View style={styles.detailsSection}>
              <View style={[styles.detailsSectionHeader, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.detailsSectionHeaderContent}>
                  <View style={[styles.detailsSectionIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="analytics" size={18} color="white" />
                  </View>
                  <Text style={[styles.detailsSectionTitle, { color: 'white', fontWeight: '700' }]}>Performance Metrics</Text>
                </View>
              </View>
              
              <View style={styles.detailsMetricsContainer}>
                {/* Primary Metrics */}
                <View style={styles.detailsFinancialCardsContainer}>
                  <View style={[
                    styles.detailsFinancialCard, 
                    showStrategyDetails.roi_percentage >= 0 ? styles.detailsFinancialCardGreen : styles.detailsFinancialCardRed
                  ]}>
                    <Text style={styles.detailsCardLabel}>ROI</Text>
                    <Text style={styles.detailsCardValue}>
                      {showStrategyDetails.roi_percentage >= 0 ? '+' : ''}{showStrategyDetails.roi_percentage.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={[styles.detailsFinancialCard, styles.detailsFinancialCardWhite]}>
                    <Text style={styles.detailsCardLabelBlack}>Win Rate</Text>
                    <Text style={styles.detailsCardValueBlack}>
                      {(showStrategyDetails.win_rate * 100).toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={[styles.detailsFinancialCard, styles.detailsFinancialCardWhite]}>
                    <Text style={styles.detailsCardLabelBlack}>Total Bets</Text>
                    <Text style={styles.detailsCardValueBlack}>
                      {showStrategyDetails.total_bets}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailsFinancialCard, styles.detailsFinancialCardWhite]}>
                    <Text style={styles.detailsCardLabelBlack}>Won</Text>
                    <Text style={[styles.detailsCardValueBlack, { color: theme.colors.betting.won }]}>
                      {showStrategyDetails.winning_bets}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailsFinancialCard, styles.detailsFinancialCardWhite]}>
                    <Text style={styles.detailsCardLabelBlack}>Lost</Text>
                    <Text style={[styles.detailsCardValueBlack, { color: theme.colors.betting.lost }]}>
                      {showStrategyDetails.losing_bets}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailsFinancialCard, styles.detailsFinancialCardWhite]}>
                    <Text style={styles.detailsCardLabelBlack}>Push/Void</Text>
                    <Text style={styles.detailsCardValueBlack}>
                      {showStrategyDetails.total_bets - showStrategyDetails.winning_bets - showStrategyDetails.losing_bets}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pricing Details (if monetized) */}
            {showStrategyDetails.is_monetized && (
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <View style={styles.detailsSectionHeaderContent}>
                    <View style={styles.detailsSectionIconContainer}>
                      <Ionicons name="cash" size={18} color={theme.colors.status.success} />
                    </View>
                    <Text style={styles.detailsSectionTitle}>Subscription Pricing</Text>
                  </View>
                </View>
                <View style={styles.detailsPricingContainer}>
                  {showStrategyDetails.subscription_price_weekly && (
                    <View style={styles.detailsPricingCard}>
                      <Text style={styles.detailsPricingPeriod}>Weekly</Text>
                      <Text style={styles.detailsPricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_weekly)}
                      </Text>
                    </View>
                  )}
                  {showStrategyDetails.subscription_price_monthly && (
                    <View style={styles.detailsPricingCard}>
                      <Text style={styles.detailsPricingPeriod}>Monthly</Text>
                      <Text style={styles.detailsPricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_monthly)}
                      </Text>
                    </View>
                  )}
                  {showStrategyDetails.subscription_price_yearly && (
                    <View style={styles.detailsPricingCard}>
                      <Text style={styles.detailsPricingPeriod}>Yearly</Text>
                      <Text style={styles.detailsPricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_yearly)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Timeline Information - Simplified */}
            <View style={styles.detailsSection}>
              <View style={styles.detailsSectionHeader}>
                <View style={styles.detailsSectionHeaderContent}>
                  <View style={styles.detailsSectionIconContainer}>
                    <Ionicons name="time" size={18} color={theme.colors.text.secondary} />
                  </View>
                  <Text style={styles.detailsSectionTitle}>Timeline</Text>
                </View>
              </View>
              <View style={styles.detailsTimelineContainer}>
                <View style={styles.detailsTimelineRow}>
                  <Text style={styles.detailsTimelineLabel}>Created</Text>
                  <Text style={styles.detailsTimelineValue}>{formatDate(showStrategyDetails.created_at)}</Text>
                </View>
                <View style={styles.detailsTimelineRow}>
                  <Text style={styles.detailsTimelineLabel}>Last Updated</Text>
                  <Text style={styles.detailsTimelineValue}>{formatDate(showStrategyDetails.updated_at)}</Text>
                </View>
                <View style={styles.detailsTimelineRow}>
                  <Text style={styles.detailsTimelineLabel}>Last Calculated</Text>
                  <Text style={styles.detailsTimelineValue}>{formatDate(showStrategyDetails.last_calculated_at)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bulb-outline" size={64} color={theme.colors.text.light} />
      <Text style={styles.emptyStateTitle}>No Strategies Created</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first betting strategy to track and monetize your performance
      </Text>
      <TouchableOpacity style={styles.createFirstButton} onPress={handleOpenCreateModal}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createFirstButtonText}>Create Strategy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Your Strategies ({strategies.length})</Text>
      <TouchableOpacity style={styles.createButton} onPress={handleOpenCreateModal}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createButtonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );

  if (strategiesLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading strategies...</Text>
        </View>
        {renderCreateModal()}
      </View>
    );
  }

  if (strategies.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderEmptyState()}
        {renderCreateModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={strategies}
        renderItem={renderStrategyItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      {renderCreateModal()}
      {renderStrategyDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  strategyCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  strategyInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  strategyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  infoButton: {
    padding: theme.spacing.xs,
  },
  strategyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  strategyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  strategyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monetizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  monetizedBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  subscriberCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  createdDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createFirstButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  modalShieldIcon: {
    opacity: 0.8,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  modalCancelButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  modalCreateButton: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  detailsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  detailsDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  detailsMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  detailsMetricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    margin: theme.spacing.xs,
  },
  detailsMetricLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  detailsMetricValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  pricingDetails: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  pricingDetailsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  pricingDetailsRow: {
    gap: theme.spacing.sm,
  },
  pricingDetailsItem: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailsFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  detailsDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
  },
  // New styles for strategy leaderboard
  strategyMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  strategyType: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  strategySport: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  verificationBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  strategyMetaDetails: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  detailsMetaLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  },
  // Filters section styles
  filtersSection: {
    marginBottom: theme.spacing.lg,
  },
  filtersDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  activeFiltersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  filterValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  noFiltersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noFiltersText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  noFiltersSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  // Validation styles
  validationAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  validationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.xs,
  },
  validationErrors: {
    marginBottom: theme.spacing.sm,
  },
  validationError: {
    fontSize: theme.typography.fontSize.sm,
    color: '#DC2626',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  validationSuccessText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.success,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  formHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  formHintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
  filtersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  filterBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  // Enhanced validation styles
  disclaimerSection: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  disclaimerTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#92400E',
    marginBottom: theme.spacing.xs,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#92400E',
    lineHeight: 16,
  },
  validationErrorContainer: {
    marginBottom: theme.spacing.sm,
  },
  validationExplanation: {
    fontSize: theme.typography.fontSize.xs,
    color: '#7F1D1D',
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.md,
    lineHeight: 16,
  },
  // Filter guidelines styles
  filterGuidelines: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  guidelinesTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  guidelineText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  // New styles for improved strategy details modal
  strategyDetailHeader: {
    marginBottom: theme.spacing.lg,
  },
  strategyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  rankBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  metaLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metaValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  performanceSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  primaryMetricCard: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  primaryMetricValue: {
    fontSize: theme.typography.fontSize.xl,
  },
  pricingSection: {
    marginBottom: theme.spacing.lg,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pricingCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    margin: theme.spacing.xs,
  },
  pricingPeriod: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  pricingAmount: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.status.success,
    fontWeight: theme.typography.fontWeight.bold,
  },
  timelineSection: {
    marginBottom: theme.spacing.lg,
  },
  timelineDetails: {
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timelineDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  // Enhanced Strategy Details Modal Styles (based on BetDetailsModal)
  detailsModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.lg,
    elevation: 8,
  },
  detailsHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsHeaderSpacer: {
    width: 44,
  },
  detailsTitleContainer: {
    alignItems: 'center',
  },
  detailsModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  detailsModalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  detailsCloseButton: {
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  detailsCloseButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  
  // Enhanced Section Styles
  detailsSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    overflow: 'hidden',
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#ffffff',
  },
  detailsSectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailsSectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  
  // Strategy Info
  detailsStrategyInfo: {
    padding: theme.spacing.md,
  },
  detailsStrategyName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  detailsMetaContainer: {
    gap: 2,
  },
  detailsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
    gap: theme.spacing.xs,
  },
  detailsMetaLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  detailsMetaValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  
  // Financial Cards Container
  detailsMetricsContainer: {
    padding: theme.spacing.md,
  },
  detailsFinancialCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  detailsFinancialCard: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
    elevation: 3,
  },
  detailsFinancialCardWhite: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsFinancialCardGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#14532d',
  },
  detailsFinancialCardRed: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  detailsCardLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCardValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  detailsCardLabelBlack: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCardValueBlack: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  // Pricing Styles
  detailsPricingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  detailsPricingCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  detailsPricingPeriod: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  detailsPricingAmount: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.status.success,
    fontWeight: theme.typography.fontWeight.bold,
  },
  
  // Timeline Styles
  detailsTimelineContainer: {
    padding: theme.spacing.md,
    gap: 2,
  },
  detailsTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  detailsTimelineLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailsTimelineValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});