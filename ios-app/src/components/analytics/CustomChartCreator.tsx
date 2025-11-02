import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import TrueSharpShield from '../common/TrueSharpShield';
import CustomChartModal from './CustomChartModal';
import CustomChartRenderer from './CustomChartRenderer';

export interface ChartConfig {
  id: string;
  title: string;
  chartType: 'line' | 'bar' | 'pie';
  xAxis: 'placed_at' | 'league' | 'bet_type' | 'sportsbook' | 'sport' | 'side' | 'prop_type' | 'player_name' | 'home_team' | 'away_team' | 'game_date' | 'placed_at_day_of_week' | 'placed_at_time_of_day' | 'stake_size_bucket' | 'odds_range_bucket' | 'bet_source' | 'parlay_vs_straight';
  yAxis: 'count' | 'wins_count' | 'losses_count' | 'win_rate' | 'profit' | 'roi' | 'total_staked' | 'average_stake' | 'average_odds' | 'median_odds' | 'void_count' | 'longshot_hit_rate' | 'chalk_hit_rate' | 'max_win' | 'max_loss' | 'profit_variance' | 'stake';
  filters: {
    leagues?: string[];
    status?: ('won' | 'lost' | 'pending' | 'void' | 'cancelled')[];
    bet_types?: string[];
    date_range?: {
      start: Date | null;
      end: Date | null;
    };
    sportsbooks?: string[];
  };
}

interface CustomChartCreatorProps {
  onChartCreate: (config: ChartConfig) => void;
  savedCharts: ChartConfig[];
  onDeleteChart: (chartId: string) => void;
  onUpgradePress?: () => void;
}

export default function CustomChartCreator({ 
  onChartCreate, 
  savedCharts, 
  onDeleteChart,
  onUpgradePress
}: CustomChartCreatorProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isPro = user?.profile?.pro === 'yes';

  const handleCreateChart = () => {
    if (!isPro) {
      if (onUpgradePress) {
        onUpgradePress();
      } else {
        Alert.alert(
          'Pro Feature',
          'Custom Chart Creator is only available for Pro users. Upgrade to Pro to unlock this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Learn More', onPress: () => {
            }},
          ]
        );
      }
      return;
    }
    setShowModal(true);
  };

  const handleSaveChart = (config: ChartConfig) => {
    onChartCreate(config);
    setShowModal(false);
  };

  const renderCustomChartCard = () => (
    <View style={[styles.chartCard, !isPro && styles.blurredCard]}>
      <View style={styles.cardHeader}>
        <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
        <Text style={styles.cardTitle}>Custom Chart Creator</Text>
      </View>
      
      {!isPro && (
        <View style={styles.proOverlay}>
          <Ionicons name="lock-closed" size={24} color={theme.colors.status.warning} />
          <Text style={styles.proText}>Upgrade to Pro to unlock Custom Chart Creator</Text>
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={() => onUpgradePress && onUpgradePress()}
          >
            <Text style={styles.upgradeButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.createButton, !isPro && styles.disabledButton]} 
        onPress={handleCreateChart}
        disabled={!isPro}
      >
        <Ionicons name="add" size={20} color={isPro ? "white" : theme.colors.text.secondary} />
        <Text style={[styles.createButtonText, !isPro && styles.disabledButtonText]}>
          Create Custom Chart
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSavedChart = (chart: ChartConfig) => (
    <View key={chart.id} style={styles.savedChartContainer}>
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDeleteChart(chart.id)}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.status.error} />
        </TouchableOpacity>
      </View>
      <CustomChartRenderer config={chart} />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCustomChartCard()}
      
      {savedCharts.length > 0 && (
        <ScrollView style={styles.savedChartsContainer} showsVerticalScrollIndicator={false}>
          {savedCharts.map(renderSavedChart)}
        </ScrollView>
      )}

      <CustomChartModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveChart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  blurredCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  proOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
    zIndex: 1,
  },
  proText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  upgradeButton: {
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  upgradeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  disabledButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  disabledButtonText: {
    color: theme.colors.text.secondary,
  },
  savedChartsContainer: {
    maxHeight: 600,
  },
  savedChartContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
});