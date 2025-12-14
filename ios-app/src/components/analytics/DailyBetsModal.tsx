import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { BetData } from '../../services/supabaseAnalytics';
import { ParlayGroup } from '../../services/parlayGrouping';
import UnifiedBetCard from './UnifiedBetCard';

const { width: screenWidth } = Dimensions.get('window');

interface DailyBetsData {
  date: string;
  bets: (BetData | ParlayGroup)[];
  profit: number;
  totalBets: number;
  winRate: number;
  totalStake: number;
}

interface DailyBetsModalProps {
  visible: boolean;
  onClose: () => void;
  data: DailyBetsData | null;
  onBetPress?: (betId: string, parlayGroup?: ParlayGroup) => void;
}

export default function DailyBetsModal({
  visible,
  onClose,
  data,
  onBetPress,
}: DailyBetsModalProps) {
  if (!data) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return '#16a34a';
    if (profit < 0) return '#dc2626';
    return theme.colors.text.secondary;
  };

  const getProfitIcon = (profit: number): string => {
    if (profit > 0) return 'trending-up';
    if (profit < 0) return 'trending-down';
    return 'remove';
  };

  const renderStatCard = (label: string, value: string, valueColor?: string) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor || theme.colors.text.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderBetItem = ({ item }: { item: BetData | ParlayGroup }) => (
    <View style={styles.betCardContainer}>
      <UnifiedBetCard bet={item} onPress={onBetPress} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <LinearGradient
          colors={[theme.colors.primary, '#1e40af', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalHeader}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.closeButtonContainer}>
              <Ionicons name="close" size={22} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>Daily Performance</Text>
              <Text style={styles.modalSubtitle}>{formatDate(data.date)}</Text>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Daily Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsContainer}>
              {renderStatCard(
                'P/L',
                formatCurrency(data.profit),
                getProfitColor(data.profit)
              )}
              {renderStatCard(
                'Win Rate',
                `${data.winRate.toFixed(1)}%`,
                data.winRate >= 50 ? '#16a34a' : '#dc2626'
              )}
              {renderStatCard(
                'Total Bets',
                data.totalBets.toString()
              )}
              {renderStatCard(
                'Total Stake',
                formatCurrency(data.totalStake)
              )}
            </View>
          </View>

          {/* Bets Section */}
          <View style={styles.betsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="list" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>
                  Bets ({data.bets.length})
                </Text>
              </View>
            </View>
            
            {data.bets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Bets Found</Text>
                <Text style={styles.emptySubtitle}>
                  No bets were placed on this day
                </Text>
              </View>
            ) : (
              <FlatList
                data={data.bets}
                renderItem={renderBetItem}
                keyExtractor={(item) => 
                  'legs' in item ? item.parlay_id : item.id
                }
                style={styles.betsList}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.lg,
    elevation: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as close button for balanced layout
  },
  titleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  
  // Stats Section
  statsSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Bets Section
  betsSection: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#ffffff',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Bets List
  betsList: {
    flexGrow: 0,
  },
  betCardContainer: {
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
});