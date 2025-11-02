import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ChartConfig } from './CustomChartCreator';
import Dropdown from '../common/Dropdown';
import TrueSharpShield from '../common/TrueSharpShield';
import CustomChartPreview from './CustomChartPreview';

const screenWidth = Dimensions.get('window').width;

interface CustomChartModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (config: ChartConfig) => void;
}

const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line Chart', icon: 'trending-up' },
  { value: 'bar', label: 'Bar Chart', icon: 'bar-chart' },
  { value: 'pie', label: 'Pie Chart', icon: 'pie-chart' },
];

const X_AXIS_OPTIONS = [
  { value: 'placed_at', label: 'Time (Date Placed)' },
  { value: 'league', label: 'League' },
  { value: 'bet_type', label: 'Bet Type' },
  { value: 'sportsbook', label: 'Sportsbook' },
  { value: 'sport', label: 'Sport' },
  { value: 'side', label: 'Side' },
  { value: 'prop_type', label: 'Prop Type' },
  { value: 'player_name', label: 'Player Name' },
  { value: 'home_team', label: 'Home Team' },
  { value: 'away_team', label: 'Away Team' },
  { value: 'game_date', label: 'Game Date' },
  { value: 'placed_at_day_of_week', label: 'Day of Week' },
  { value: 'placed_at_time_of_day', label: 'Time of Day' },
  { value: 'stake_size_bucket', label: 'Stake Size Bucket' },
  { value: 'odds_range_bucket', label: 'Odds Range Bucket' },
  { value: 'bet_source', label: 'Bet Source' },
  { value: 'parlay_vs_straight', label: 'Parlay vs Straight' },
];

const Y_AXIS_OPTIONS = [
  { value: 'count', label: 'Count of Bets' },
  { value: 'wins_count', label: 'Count of Wins' },
  { value: 'losses_count', label: 'Count of Losses' },
  { value: 'win_rate', label: 'Win Rate (%)' },
  { value: 'profit', label: 'Total Profit' },
  { value: 'roi', label: 'ROI (%)' },
  { value: 'total_staked', label: 'Total Staked' },
  { value: 'average_stake', label: 'Average Stake' },
  { value: 'average_odds', label: 'Average Odds' },
  { value: 'median_odds', label: 'Median Odds' },
  { value: 'void_count', label: 'Count of Voids' },
  { value: 'longshot_hit_rate', label: 'Longshot Hit Rate (%)' },
  { value: 'chalk_hit_rate', label: 'Chalk Hit Rate (%)' },
  { value: 'max_win', label: 'Maximum Win' },
  { value: 'max_loss', label: 'Maximum Loss' },
  { value: 'profit_variance', label: 'Profit Variance' },
  // Legacy support
  { value: 'stake', label: 'Total Stake' },
];

export default function CustomChartModal({ visible, onClose, onSave }: CustomChartModalProps) {
  const [config, setConfig] = useState<Partial<ChartConfig>>({
    chartType: 'bar',
    xAxis: 'league',
    yAxis: 'count',
    filters: {},
  });
  const [showPreview, setShowPreview] = useState(false);

  const generateChartTitle = () => {
    const yAxisLabel = Y_AXIS_OPTIONS.find(opt => opt.value === config.yAxis)?.label || 'Data';
    const xAxisLabel = X_AXIS_OPTIONS.find(opt => opt.value === config.xAxis)?.label || 'Category';
    return `${yAxisLabel} by ${xAxisLabel}`;
  };

  const handleSave = () => {
    if (!config.chartType || !config.xAxis || !config.yAxis) {
      Alert.alert('Error', 'Please select chart type, X-axis, and Y-axis');
      return;
    }

    const chartConfig: ChartConfig = {
      id: `custom-${Date.now()}`,
      title: config.title || generateChartTitle(),
      chartType: config.chartType,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      filters: config.filters || {},
    };

    onSave(chartConfig);
  };

  const handleClose = () => {
    setConfig({
      chartType: 'bar',
      xAxis: 'league',
      yAxis: 'count',
      filters: {},
    });
    setShowPreview(false);
    onClose();
  };

  const renderChartTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chart Type</Text>
      <View style={styles.chartTypeGrid}>
        {CHART_TYPE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chartTypeButton,
              config.chartType === option.value && styles.selectedChartType,
            ]}
            onPress={() => setConfig(prev => ({ ...prev, chartType: option.value as any }))}
          >
            <Ionicons
              name={option.icon as any}
              size={24}
              color={config.chartType === option.value ? 'white' : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.chartTypeText,
                config.chartType === option.value && styles.selectedChartTypeText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAxisSelectors = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chart Axes</Text>
      <View style={styles.axisContainer}>
        <View style={styles.axisSelector}>
          <Text style={styles.axisLabel}>X-Axis (Categories)</Text>
          <Dropdown
            label="X-Axis"
            options={X_AXIS_OPTIONS}
            selectedValue={config.xAxis}
            onSelectionChange={(values: string | string[]) => {
              const value = Array.isArray(values) ? values[0] : values;
              setConfig(prev => ({ ...prev, xAxis: value as any }));
            }}
            placeholder="Select X-axis"
          />
        </View>
        <View style={styles.axisSelector}>
          <Text style={styles.axisLabel}>Y-Axis (Values)</Text>
          <Dropdown
            label="Y-Axis"
            options={Y_AXIS_OPTIONS}
            selectedValue={config.yAxis}
            onSelectionChange={(values: string | string[]) => {
              const value = Array.isArray(values) ? values[0] : values;
              setConfig(prev => ({ ...prev, yAxis: value as any }));
            }}
            placeholder="Select Y-axis"
          />
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TrueSharpShield size={20} variant="default" />
            <Text style={styles.headerTitle}>Create Custom Chart</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Chart Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chart Title (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={generateChartTitle()}
              value={config.title || ''}
              onChangeText={(text) => setConfig(prev => ({ ...prev, title: text }))}
              placeholderTextColor={theme.colors.text.light}
            />
          </View>

          {renderChartTypeSelector()}
          {renderAxisSelectors()}

          {/* Preview Button */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setShowPreview(!showPreview)}
          >
            <Ionicons name="eye" size={20} color={theme.colors.primary} />
            <Text style={styles.previewButtonText}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Text>
          </TouchableOpacity>

          {/* Chart Preview */}
          {showPreview && (
            <View style={styles.previewContainer}>
              <CustomChartPreview config={config as ChartConfig} />
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!config.chartType || !config.xAxis || !config.yAxis) && styles.disabledSaveButton
            ]}
            onPress={handleSave}
            disabled={!config.chartType || !config.xAxis || !config.yAxis}
          >
            <Text style={styles.saveButtonText}>Create Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.card,
  },
  chartTypeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chartTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  selectedChartType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chartTypeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  selectedChartTypeText: {
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  axisContainer: {
    gap: theme.spacing.md,
  },
  axisSelector: {
    gap: theme.spacing.xs,
  },
  axisLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.md,
  },
  previewButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  previewContainer: {
    marginBottom: theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  disabledSaveButton: {
    backgroundColor: theme.colors.border,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
});