import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { formatBankroll } from '../../lib/bankrollCalculation';
import { AnalyticsSettings } from './AnalyticsSettingsModal';

interface AnalyticsSettingsRowProps {
  bankroll: number;
  settings: AnalyticsSettings | null;
  onSettingsPress: () => void;
  loading?: boolean;
  showUnits: boolean;
  onToggleUnits: () => void;
}

export default function AnalyticsSettingsRow({
  bankroll,
  settings,
  onSettingsPress,
  loading = false,
  showUnits,
  onToggleUnits,
}: AnalyticsSettingsRowProps) {
  const formatUnitSize = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const unitSize = settings?.unit_size || 1000; // Default $10

  return (
    <View style={styles.container}>
      <View style={styles.mainCard}>
        {/* Bankroll Section */}
        <View style={styles.valueSection}>
          <Text style={styles.cardValue}>
            {loading ? '--' : formatBankroll(bankroll)}
          </Text>
          <Text style={styles.cardLabel}>Bankroll</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Unit Size Section */}
        <View style={styles.valueSection}>
          <Text style={styles.cardValue}>
            {formatUnitSize(unitSize)}
          </Text>
          <Text style={styles.cardLabel}>Unit Size</Text>
        </View>

        {/* Units Toggle */}
        <View style={styles.unitsToggleContainer}>
          <TouchableOpacity
            style={[styles.unitsToggleOption, !showUnits && styles.unitsToggleOptionActive]}
            onPress={() => !showUnits || onToggleUnits()}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitsToggleOptionText, !showUnits && styles.unitsToggleOptionTextActive]}>
              $
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitsToggleOption, showUnits && styles.unitsToggleOptionActive]}
            onPress={() => showUnits || onToggleUnits()}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitsToggleOptionText, showUnits && styles.unitsToggleOptionTextActive]}>
              U
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  valueSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  unitsToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 2,
    marginLeft: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitsToggleOption: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitsToggleOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  unitsToggleOptionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  unitsToggleOptionTextActive: {
    color: theme.colors.text.inverse,
  },
  settingsButton: {
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  cardValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: theme.typography.fontSize.xxs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
});