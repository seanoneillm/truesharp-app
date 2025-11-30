import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ParlayGroup, formatBetForDisplay } from '../../services/parlayGrouping';
import { getTwoLineBetDescription, getStatusColor } from '../../lib/betFormatting';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ParlayCardProps {
  parlay: ParlayGroup;
}

export default function ParlayCard({ parlay }: ParlayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = () => {
    // Configure the layout animation for smooth expand/collapse
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setIsExpanded(!isExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
    return formatOddsWithFallback(numericOdds, stake, potentialPayout);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'won':
        return '#10B981'; // green
      case 'lost':
        return '#EF4444'; // red
      case 'pending':
        return '#F59E0B'; // yellow/amber
      case 'void':
      case 'push':
        return '#6B7280'; // gray
      default:
        return '#6B7280';
    }
  };

  const getLegStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return { text: '✓', color: '#10B981', bgColor: '#D1FAE5' };
      case 'lost':
        return { text: '✗', color: '#EF4444', bgColor: '#FEE2E2' };
      case 'pending':
        return { text: '⏳', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'void':
      case 'push':
        return { text: '—', color: '#6B7280', bgColor: '#F3F4F6' };
      default:
        return { text: '?', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const renderParlayHeader = () => {
    const statusColor = getStatusBadgeColor(parlay.status);
    
    return (
      <TouchableOpacity style={styles.betCard} onPress={toggleExpanded} activeOpacity={0.7}>
        <View style={styles.betRow}>
          <View style={styles.betMainInfo}>
            <View style={styles.teamAndType}>
              <View style={styles.betDescriptionContainer}>
                <Text style={styles.betTeamMatchup} numberOfLines={1}>
                  {parlay.legs.length} leg parlay
                </Text>
                <Text style={styles.betDescription} numberOfLines={1}>
                  {parlay.sport}
                </Text>
              </View>
              <View style={styles.parlayBadge}>
                <Text style={styles.parlayBadgeText}>PARLAY</Text>
              </View>
            </View>
            <Text style={styles.betTypeLeague} numberOfLines={1}>
              {parlay.legs.length} legs • {parlay.sport}
            </Text>
          </View>

          <View style={styles.betDetails}>
            <Text style={styles.betOdds}>
              {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
            </Text>
            <Text style={styles.betStake}>{formatCurrency(parlay.stake)}</Text>
          </View>

          <View style={styles.betStatus}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {parlay.status === 'won' ? 'W' : 
                 parlay.status === 'lost' ? 'L' : 
                 parlay.status === 'pending' ? 'P' : 
                 parlay.status.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.profitValue, { color: statusColor }]}>
              {parlay.status === 'pending' 
                ? formatCurrency(parlay.potential_payout - parlay.stake)
                : formatCurrency(parlay.profit)}
            </Text>
          </View>

          <View style={styles.expandIcon}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderParlayLegs = () => {
    if (!isExpanded) return null;

    return (
      <View style={styles.legsContainer}>
        <View style={styles.legsHeader}>
          <Text style={styles.legsHeaderText}>Parlay Legs ({parlay.legs.length})</Text>
        </View>
        
        {parlay.legs.map((leg, index) => {
          const { line1, line2 } = getTwoLineBetDescription(leg);
          const legBadge = getLegStatusBadge(leg.status);
          
          return (
            <View key={leg.id} style={styles.legRow}>
              <View style={styles.legNumber}>
                <Text style={styles.legNumberText}>{index + 1}</Text>
              </View>
              
              <View style={styles.legMainInfo}>
                <View style={styles.legDescriptionContainer}>
                  <Text style={styles.legTeamMatchup} numberOfLines={1}>
                    {line1}
                  </Text>
                  <Text style={styles.legDescription} numberOfLines={1}>
                    {line2}
                  </Text>
                </View>
                <Text style={styles.legTypeLeague} numberOfLines={1}>
                  {leg.bet_type || 'Unknown'} • {leg.league || leg.sport || 'Unknown'}
                </Text>
              </View>

              <View style={styles.legOdds}>
                <Text style={styles.legOddsText}>
                  {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                </Text>
              </View>

              <View style={styles.legStatus}>
                <View style={[styles.legStatusBadge, { backgroundColor: legBadge.bgColor }]}>
                  <Text style={[styles.legStatusText, { color: legBadge.color }]}>
                    {legBadge.text}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.parlayTotals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Odds:</Text>
            <Text style={styles.totalValue}>{formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Stake:</Text>
            <Text style={styles.totalValue}>{formatCurrency(parlay.stake)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Potential Payout:</Text>
            <Text style={styles.totalValue}>{formatCurrency(parlay.potential_payout)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderParlayHeader()}
      {renderParlayLegs()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  betCard: {
    padding: theme.spacing.md,
  },
  betRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  betMainInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  teamAndType: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
    flex: 1,
  },
  betDescriptionContainer: {
    flex: 1,
    minWidth: 0,
  },
  betTeamMatchup: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  betDescription: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  parlayBadge: {
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  parlayBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  betTypeLeague: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  betDetails: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  betOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  betStake: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  betStatus: {
    alignItems: 'center',
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  profitValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  expandIcon: {
    marginLeft: theme.spacing.xs,
    justifyContent: 'center',
  },
  
  // Expanded legs styles
  legsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  legsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legsHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  legNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  legMainInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  legDescriptionContainer: {
    marginBottom: 2,
  },
  legTeamMatchup: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 1,
  },
  legDescription: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  legTypeLeague: {
    fontSize: 9,
    color: theme.colors.text.secondary,
  },
  legOdds: {
    marginRight: theme.spacing.sm,
  },
  legOddsText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  legStatus: {
    alignItems: 'center',
  },
  legStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  legStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  parlayTotals: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
});