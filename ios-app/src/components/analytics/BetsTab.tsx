import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { BetData } from '../../services/supabaseAnalytics';
import { groupBetsByParlay, ParlayGroup } from '../../services/parlayGrouping';
import UnifiedBetCard from './UnifiedBetCard';
import { UnitDisplayOptions } from '../../utils/unitCalculations';

interface BetsTabProps {
  bets: BetData[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onBetPress?: (betId: string, parlayGroup?: ParlayGroup) => void;
  unitOptions?: UnitDisplayOptions;
}

export default function BetsTab({ bets, loading, onRefresh, onBetPress, unitOptions }: BetsTabProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Group bets into parlays and singles
  const groupedBets = useMemo(() => {
    return groupBetsByParlay(bets);
  }, [bets]);

  // Create unified list for rendering, sorted by game time (most recent first)
  const unifiedBetsList = useMemo(() => {
    const allBets: (BetData | ParlayGroup)[] = [
      ...groupedBets.parlays,
      ...groupedBets.singles
    ];
    
    // Sort all bets by game_time (or placed_at as fallback) - most recent first
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
    });
  }, [groupedBets]);

  // Calculate total count for header
  const totalBetsCount = groupedBets.parlays.length + groupedBets.singles.length;

  const renderBetItem = ({ item }: { item: BetData | ParlayGroup }) => (
    <UnifiedBetCard bet={item} onPress={onBetPress} unitOptions={unitOptions} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        All Bets ({totalBetsCount})
      </Text>
      {groupedBets.parlays.length > 0 && (
        <Text style={styles.headerSubtitle}>
          {groupedBets.parlays.length} parlay{groupedBets.parlays.length !== 1 ? 's' : ''} • {groupedBets.singles.length} single bet{groupedBets.singles.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color={theme.colors.text.light} />
      <Text style={styles.emptyStateTitle}>No Bets Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Your bets will appear here once you start tracking them
      </Text>
    </View>
  );

  if (unifiedBetsList.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={unifiedBetsList}
        renderItem={renderBetItem}
        keyExtractor={(item) => 'legs' in item ? item.parlay_id : item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: 100, // Space for floating buttons
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
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
  },
});