import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStrategyDetails(null)}
    >
      {showStrategyDetails && (
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStrategyDetails(null)}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <TrueSharpShield size={20} variant="default" style={styles.modalShieldIcon} />
              <Text style={styles.modalTitle}>Strategy Details</Text>
            </View>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {/* Strategy Header */}
            <View style={styles.strategyDetailHeader}>
              <Text style={styles.detailsTitle}>{showStrategyDetails.strategy_name}</Text>
              <View style={styles.strategyBadges}>
                {showStrategyDetails.is_monetized && (
                  <View style={styles.monetizedBadge}>
                    <Ionicons name="cash" size={12} color="white" />
                    <Text style={styles.monetizedBadgeText}>Monetized</Text>
                  </View>
                )}
                
                {showStrategyDetails.verification_status !== 'unverified' && (
                  <View style={[styles.verificationBadge, 
                    { backgroundColor: showStrategyDetails.verification_status === 'premium' ? theme.colors.primary : theme.colors.secondary }
                  ]}>
                    <Ionicons name="checkmark-circle" size={12} color="white" />
                    <Text style={styles.verificationBadgeText}>
                      {showStrategyDetails.verification_status === 'premium' ? 'Premium' : 'Verified'}
                    </Text>
                  </View>
                )}
                
                {showStrategyDetails.overall_rank && (
                  <View style={styles.rankBadge}>
                    <Ionicons name="trophy" size={12} color={theme.colors.primary} />
                    <Text style={styles.rankBadgeText}>#{showStrategyDetails.overall_rank}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Strategy Meta Information */}
            <View style={styles.strategyMetaDetails}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Strategy Type:</Text>
                <Text style={styles.metaValue}>{showStrategyDetails.strategy_type || 'General Strategy'}</Text>
              </View>
              {showStrategyDetails.primary_sport && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Primary Sport:</Text>
                  <Text style={styles.metaValue}>{showStrategyDetails.primary_sport}</Text>
                </View>
              )}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Verification Status:</Text>
                <Text style={[styles.metaValue, { 
                  color: showStrategyDetails.verification_status === 'premium' ? theme.colors.primary : 
                         showStrategyDetails.verification_status === 'verified' ? theme.colors.secondary : 
                         theme.colors.text.secondary 
                }]}>
                  {(() => {
                    if (showStrategyDetails.verification_status === 'premium') return 'Premium Verified';
                    if (showStrategyDetails.verification_status === 'verified') return 'Verified';
                    return 'Unverified';
                  })()}
                </Text>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.performanceSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics" size={16} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Performance Metrics</Text>
              </View>
              
              <View style={styles.detailsMetrics}>
                <View style={[styles.detailsMetricCard, styles.primaryMetricCard]}>
                  <Text style={styles.detailsMetricLabel}>ROI</Text>
                  <Text 
                    style={[
                      styles.detailsMetricValue,
                      styles.primaryMetricValue,
                      { color: showStrategyDetails.roi_percentage >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
                    ]}
                  >
                    {showStrategyDetails.roi_percentage >= 0 ? '+' : ''}{showStrategyDetails.roi_percentage.toFixed(2)}%
                  </Text>
                </View>

                <View style={[styles.detailsMetricCard, styles.primaryMetricCard]}>
                  <Text style={styles.detailsMetricLabel}>Win Rate</Text>
                  <Text style={[styles.detailsMetricValue, styles.primaryMetricValue]}>
                    {(showStrategyDetails.win_rate * 100).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.detailsMetricCard}>
                  <Text style={styles.detailsMetricLabel}>Total Bets</Text>
                  <Text style={styles.detailsMetricValue}>
                    {showStrategyDetails.total_bets}
                  </Text>
                </View>

                <View style={styles.detailsMetricCard}>
                  <Text style={styles.detailsMetricLabel}>Winning Bets</Text>
                  <Text style={[styles.detailsMetricValue, { color: theme.colors.betting.won }]}>
                    {showStrategyDetails.winning_bets}
                  </Text>
                </View>

                <View style={styles.detailsMetricCard}>
                  <Text style={styles.detailsMetricLabel}>Losing Bets</Text>
                  <Text style={[styles.detailsMetricValue, { color: theme.colors.betting.lost }]}>
                    {showStrategyDetails.losing_bets}
                  </Text>
                </View>

                <View style={styles.detailsMetricCard}>
                  <Text style={styles.detailsMetricLabel}>Push/Void Bets</Text>
                  <Text style={styles.detailsMetricValue}>
                    {showStrategyDetails.total_bets - showStrategyDetails.winning_bets - showStrategyDetails.losing_bets}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pricing Details (if monetized) */}
            {showStrategyDetails.is_monetized && (
              <View style={styles.pricingSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cash" size={16} color={theme.colors.status.success} />
                  <Text style={styles.sectionTitle}>Subscription Pricing</Text>
                </View>
                <View style={styles.pricingGrid}>
                  {showStrategyDetails.subscription_price_weekly && (
                    <View style={styles.pricingCard}>
                      <Text style={styles.pricingPeriod}>Weekly</Text>
                      <Text style={styles.pricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_weekly)}
                      </Text>
                    </View>
                  )}
                  {showStrategyDetails.subscription_price_monthly && (
                    <View style={styles.pricingCard}>
                      <Text style={styles.pricingPeriod}>Monthly</Text>
                      <Text style={styles.pricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_monthly)}
                      </Text>
                    </View>
                  )}
                  {showStrategyDetails.subscription_price_yearly && (
                    <View style={styles.pricingCard}>
                      <Text style={styles.pricingPeriod}>Yearly</Text>
                      <Text style={styles.pricingAmount}>
                        {formatCurrency(showStrategyDetails.subscription_price_yearly)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Timeline Information */}
            <View style={styles.timelineSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.sectionTitle}>Timeline</Text>
              </View>
              <View style={styles.timelineDetails}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Created</Text>
                    <Text style={styles.timelineDate}>{formatDate(showStrategyDetails.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Last Updated</Text>
                    <Text style={styles.timelineDate}>{formatDate(showStrategyDetails.updated_at)}</Text>
                  </View>
                </View>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Last Calculated</Text>
                    <Text style={styles.timelineDate}>{formatDate(showStrategyDetails.last_calculated_at)}</Text>
                  </View>
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
});