import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { AnalyticsData, BetData, AnalyticsFilters } from '../../services/supabaseAnalytics';
import { groupBetsByParlay, ParlayGroup } from '../../services/parlayGrouping';
import ProfitOverTimeChart from './ProfitOverTimeChart';
import ConnectedSportsbooks from './ConnectedSportsbooks';
import { getTwoLineBetDescription, getStatusColor } from '../../lib/betFormatting';
import UnifiedBetCard from './UnifiedBetCard';
import AnalyticsSettingsRow from './AnalyticsSettingsRow';
import AnalyticsSettingsModal, { AnalyticsSettings } from './AnalyticsSettingsModal';
import { calculateBankroll, BettorAccount } from '../../lib/bankrollCalculation';
import { fetchAnalyticsSettings, saveAnalyticsSettings, fetchBettorAccounts } from '../../services/analyticsSettingsService';
import { UnitDisplayOptions, formatCurrencyOrUnits, formatProfitLoss } from '../../utils/unitCalculations';

interface OverviewTabProps {
  analyticsData: AnalyticsData;
  loading: boolean;
  onRefresh: () => Promise<void>;
  filters: AnalyticsFilters;
  onBetPress?: (betId: string, parlayGroup?: ParlayGroup) => void;
  userId?: string;
  showUnits: boolean;
  onToggleUnits: () => void;
  onAnalyticsSettingsUpdate?: (settings: AnalyticsSettings) => void;
}

const screenWidth = Dimensions.get('window').width;

export default function OverviewTab({ analyticsData, loading, onRefresh, filters, onBetPress, userId, showUnits, onToggleUnits, onAnalyticsSettingsUpdate }: OverviewTabProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings | null>(null);
  const [bettorAccounts, setBettorAccounts] = useState<BettorAccount[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [bankrollLoading, setBankrollLoading] = useState(true);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    // Also refresh analytics settings and bettor accounts
    if (userId) {
      await Promise.all([
        loadAnalyticsSettings(userId),
        loadBettorAccounts(userId)
      ]);
    }
    setRefreshing(false);
  };

  const loadAnalyticsSettings = async (userId: string) => {
    try {
      const settings = await fetchAnalyticsSettings(userId);
      setAnalyticsSettings(settings);
    } catch (error) {
      console.error('Error loading analytics settings:', error);
    }
  };

  const loadBettorAccounts = async (userId: string) => {
    try {
      setBankrollLoading(true);
      const accounts = await fetchBettorAccounts(userId);
      setBettorAccounts(accounts);
    } catch (error) {
      console.error('Error loading bettor accounts:', error);
    } finally {
      setBankrollLoading(false);
    }
  };

  const handleSettingsPress = () => {
    setShowSettingsModal(true);
  };

  const handleSettingsSave = async (settings: AnalyticsSettings) => {
    setSettingsLoading(true);
    try {
      const savedSettings = await saveAnalyticsSettings({
        ...settings,
        user_id: userId || '',
      });
      setAnalyticsSettings(savedSettings);
      setShowSettingsModal(false);
      
      // Notify parent component about the settings update
      if (onAnalyticsSettingsUpdate) {
        onAnalyticsSettingsUpdate(savedSettings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error alert to user
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsClose = () => {
    setShowSettingsModal(false);
  };

  // Load initial data when userId is available
  React.useEffect(() => {
    if (userId) {
      loadAnalyticsSettings(userId);
      loadBettorAccounts(userId);
    }
  }, [userId]);

  // Calculate bankroll from bettor accounts
  const bankroll = useMemo(() => {
    return calculateBankroll(bettorAccounts);
  }, [bettorAccounts]);

  // Note: TrueSharp filtering is now handled in the parent AnalyticsScreen
  // analyticsData passed here is already filtered

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Using imported getStatusColor function for consistent colors

  // Group recent bets into parlays and singles, then sort by game time
  const groupedRecentBets = useMemo(() => {
    if (!analyticsData.recentBets || analyticsData.recentBets.length === 0) {
      return [];
    }

    // Group bets into parlays and singles
    const grouped = groupBetsByParlay(analyticsData.recentBets);
    
    // Create unified list for rendering
    const allBets: (BetData | ParlayGroup)[] = [
      ...grouped.parlays,
      ...grouped.singles
    ];
    
    // Sort by game time (or placed_at as fallback) - most recent first
    return allBets.sort((a, b) => {
      // Get game time for sorting
      const getGameTime = (bet: BetData | ParlayGroup): string => {
        if ('legs' in bet) {
          // For parlays, use the earliest game date from legs
          const legGameDates = bet.legs
            .map(leg => leg.game_date)
            .filter(Boolean)
            .sort();
          return legGameDates[0] || bet.placed_at || '';
        } else {
          // For single bets, use game_date or fall back to placed_at
          return bet.game_date || bet.placed_at || '';
        }
      };
      
      const aDate = getGameTime(a);
      const bDate = getGameTime(b);
      return bDate.localeCompare(aDate);
    }).slice(0, 20); // Take first 20 after grouping and sorting
  }, [analyticsData.recentBets]);

  const renderMetricsCards = () => {
    const { metrics } = analyticsData;
    
    // Safely format numbers to prevent NaN display
    const safeNumber = (num: number, fallback: number = 0): number => {
      return (typeof num === 'number' && !isNaN(num) && isFinite(num)) ? num : fallback;
    };
    
    const totalBets = safeNumber(metrics.totalBets);
    const winRate = safeNumber(metrics.winRate);
    const roi = safeNumber(metrics.roi);
    const totalProfit = safeNumber(metrics.totalProfit);
    
    // Create unit display options
    const unitOptions: UnitDisplayOptions = {
      showUnits,
      unitSize: analyticsSettings?.unit_size || 1000, // Default $10
    };
    
    const cards = [
      {
        title: 'Total Bets',
        value: totalBets.toString(),
        icon: 'layers-outline',
        color: theme.colors.primary,
        bgColor: `${theme.colors.primary}15`,
      },
      {
        title: 'ROI',
        value: `${roi.toFixed(1)}%`,
        icon: 'trending-up',
        color: roi >= 0 ? theme.colors.status.success : theme.colors.status.error,
        bgColor: roi >= 0 ? `${theme.colors.status.success}15` : `${theme.colors.status.error}15`,
      },
      {
        title: 'Win Rate',
        value: `${winRate.toFixed(1)}%`,
        icon: 'analytics-outline',
        color: theme.colors.status.success,
        bgColor: `${theme.colors.status.success}15`,
      },
      {
        title: 'Total Profit',
        value: formatProfitLoss(totalProfit * 100, unitOptions), // Convert dollars to cents
        icon: 'cash-outline',
        color: totalProfit >= 0 ? theme.colors.status.success : theme.colors.status.error,
        bgColor: totalProfit >= 0 ? `${theme.colors.status.success}15` : `${theme.colors.status.error}15`,
      },
    ];

    return (
      <View style={styles.metricsContainer}>
        {cards.map((card, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: card.bgColor }]}>
              <Ionicons name={card.icon as any} size={16} color={card.color} />
            </View>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {card.value}
            </Text>
            <Text style={styles.metricTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {card.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProfitChart = () => {
    const unitOptions: UnitDisplayOptions = {
      showUnits,
      unitSize: analyticsSettings?.unit_size || 1000, // Default $10
    };

    return (
      <ProfitOverTimeChart
        chartData={analyticsData.dailyProfitData}
        filters={filters}
        loading={loading}
        unitOptions={unitOptions}
      />
    );
  };

  const renderRecentBets = () => {
    if (groupedRecentBets.length === 0) {
      return (
        <View style={styles.recentBetsContainer}>
          <Text style={styles.sectionTitle}>Recent Bets</Text>
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={32} color={theme.colors.text.light} />
            <Text style={styles.emptyStateText}>No bets found</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.recentBetsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bets</Text>
          <Text style={styles.sectionSubtitle}>{groupedRecentBets.length} items shown</Text>
        </View>
        
        <ScrollView 
          style={styles.betsScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {groupedRecentBets.map((bet) => {
            const unitOptions: UnitDisplayOptions = {
              showUnits,
              unitSize: analyticsSettings?.unit_size || 1000, // Default $10
            };
            return (
              <UnifiedBetCard 
                key={'legs' in bet ? bet.parlay_id : bet.id} 
                bet={bet} 
                onPress={onBetPress} 
                unitOptions={unitOptions}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderConnectedSportsbooks = () => (
    <ConnectedSportsbooks
      loading={loading}
      onRefresh={onRefresh}
    />
  );

  const renderAnalyticsSettingsRow = () => (
    <AnalyticsSettingsRow
      bankroll={bankroll}
      settings={analyticsSettings}
      onSettingsPress={handleSettingsPress}
      loading={bankrollLoading}
      showUnits={showUnits}
      onToggleUnits={onToggleUnits}
    />
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {renderAnalyticsSettingsRow()}
      {renderMetricsCards()}
      {renderProfitChart()}
      {renderRecentBets()}
      {renderConnectedSportsbooks()}
      
      {/* Analytics Settings Modal */}
      <AnalyticsSettingsModal
        visible={showSettingsModal}
        onClose={handleSettingsClose}
        settings={analyticsSettings}
        onSave={handleSettingsSave}
        loading={settingsLoading}
        bankroll={bankroll}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    minHeight: 80,
    maxHeight: 90, // Add max height to prevent expansion
    justifyContent: 'space-between', // Better spacing distribution
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
    flexShrink: 1, // Allow shrinking to fit
    maxWidth: '100%', // Ensure it doesn't overflow
  },
  metricTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    flexShrink: 1, // Allow shrinking to fit
    maxWidth: '100%', // Ensure it doesn't overflow
  },
  recentBetsContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  betsScrollView: {
    maxHeight: 300,
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
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  // Connected Sportsbooks styles moved to component
});