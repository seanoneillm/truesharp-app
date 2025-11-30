import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import BankrollManagementGuide from '../guides/BankrollManagementGuide';

export interface AnalyticsSettings {
  id?: string;
  user_id: string;
  unit_size: number; // In cents
  show_truesharp_bets: boolean;
  odds_format: 'american' | 'decimal' | 'fractional';
  created_at?: string;
  updated_at?: string;
}

interface AnalyticsSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AnalyticsSettings | null;
  onSave: (settings: AnalyticsSettings) => void;
  loading?: boolean;
  bankroll?: number;
}

const DEFAULT_SETTINGS: Omit<AnalyticsSettings, 'user_id'> = {
  unit_size: 1000, // $10 in cents
  show_truesharp_bets: true,
  odds_format: 'american',
};

export default function AnalyticsSettingsModal({
  visible,
  onClose,
  settings,
  onSave,
  loading = false,
  bankroll = 0,
}: AnalyticsSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AnalyticsSettings | null>(null);
  const [unitSizeInput, setUnitSizeInput] = useState('');
  const [showBankrollGuide, setShowBankrollGuide] = useState(false);

  // Initialize local settings when modal opens or settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setUnitSizeInput((settings.unit_size / 100).toString()); // Convert cents to dollars
    } else if (visible) {
      // Use default settings if no existing settings
      const defaultSettings = {
        ...DEFAULT_SETTINGS,
        user_id: '', // Will be set by parent
      };
      setLocalSettings(defaultSettings);
      setUnitSizeInput((DEFAULT_SETTINGS.unit_size / 100).toString());
    }
  }, [settings, visible]);

  const handleUnitSizeChange = (text: string) => {
    setUnitSizeInput(text);
    
    // Update local settings if valid number
    const value = parseFloat(text);
    if (!isNaN(value) && value >= 0 && localSettings) {
      setLocalSettings({
        ...localSettings,
        unit_size: Math.round(value * 100), // Convert dollars to cents
      });
    }
  };

  const handleToggleChange = (field: keyof AnalyticsSettings, value: boolean) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [field]: value,
    });
  };

  const handleOddsFormatChange = (format: 'american' | 'decimal' | 'fractional') => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      odds_format: format,
    });
  };

  const handleSave = () => {
    if (!localSettings) return;

    // Validate unit size
    const unitSizeValue = parseFloat(unitSizeInput);
    if (isNaN(unitSizeValue) || unitSizeValue <= 0) {
      Alert.alert('Invalid Unit Size', 'Please enter a valid unit size greater than $0.');
      return;
    }

    // Update unit size with the latest input value
    const finalSettings = {
      ...localSettings,
      unit_size: Math.round(unitSizeValue * 100), // Convert to cents
    };

    onSave(finalSettings);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getSuggestedUnitSize = () => {
    if (bankroll <= 0) return '';
    const onePercent = bankroll * 0.01;
    const fivePercent = bankroll * 0.05;
    return `Suggested: $${onePercent.toFixed(0)} - $${fivePercent.toFixed(0)} (1-5% of bankroll)`;
  };

  if (!localSettings) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics Settings</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#9ca3af', '#6b7280'] : [theme.colors.primary, theme.colors.primaryDark]}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Unit Size Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit Size</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.textInput}
                value={unitSizeInput}
                onChangeText={handleUnitSizeChange}
                placeholder="10.00"
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
            
            {bankroll > 0 && (
              <Text style={styles.suggestionText}>
                {getSuggestedUnitSize()}
              </Text>
            )}
          </View>

          {/* Display Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Settings</Text>
            
            {/* TrueSharp Bets Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show TrueSharp Bets</Text>
                <Text style={styles.settingDescription}>
                  Display theoretical bets placed in TrueSharp
                </Text>
              </View>
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleLabel, !localSettings.show_truesharp_bets && styles.toggleLabelActive]}>
                  No
                </Text>
                <Switch
                  value={localSettings.show_truesharp_bets}
                  onValueChange={(value) => handleToggleChange('show_truesharp_bets', value)}
                  trackColor={{ false: '#e5e7eb', true: theme.colors.primary }}
                  thumbColor='#ffffff'
                  ios_backgroundColor="#e5e7eb"
                />
                <Text style={[styles.toggleLabel, localSettings.show_truesharp_bets && styles.toggleLabelActive]}>
                  Yes
                </Text>
              </View>
            </View>
          </View>

          {/* Odds Format Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odds Format</Text>
            <Text style={styles.sectionDescription}>
              Choose your preferred odds display format
            </Text>
            
            {/* American Odds */}
            <TouchableOpacity
              style={[
                styles.oddsFormatOption,
                localSettings.odds_format === 'american' && styles.oddsFormatOptionSelected,
              ]}
              onPress={() => handleOddsFormatChange('american')}
            >
              <View style={styles.oddsFormatInfo}>
                <Text style={styles.oddsFormatLabel}>American</Text>
                <Text style={styles.oddsFormatExample}>Example: -110, +150</Text>
              </View>
              <Ionicons
                name={localSettings.odds_format === 'american' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={localSettings.odds_format === 'american' ? theme.colors.primary : theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {/* Decimal Odds */}
            <TouchableOpacity
              style={[
                styles.oddsFormatOption,
                localSettings.odds_format === 'decimal' && styles.oddsFormatOptionSelected,
                styles.comingSoonOption,
              ]}
              disabled
            >
              <View style={styles.oddsFormatInfo}>
                <Text style={[styles.oddsFormatLabel, styles.comingSoonText]}>Decimal</Text>
                <Text style={[styles.oddsFormatExample, styles.comingSoonText]}>Coming Soon</Text>
              </View>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </TouchableOpacity>

            {/* Fractional Odds */}
            <TouchableOpacity
              style={[
                styles.oddsFormatOption,
                localSettings.odds_format === 'fractional' && styles.oddsFormatOptionSelected,
                styles.comingSoonOption,
              ]}
              disabled
            >
              <View style={styles.oddsFormatInfo}>
                <Text style={[styles.oddsFormatLabel, styles.comingSoonText]}>Fractional</Text>
                <Text style={[styles.oddsFormatExample, styles.comingSoonText]}>Coming Soon</Text>
              </View>
              <Text style={styles.comingSoonBadge}>Soon</Text>
            </TouchableOpacity>
          </View>

          {/* Bankroll Management Help */}
          <View style={styles.helpSection}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setShowBankrollGuide(true)}
            >
              <View style={styles.helpButtonContent}>
                <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.helpButtonText}>Bankroll Management Guide</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.light} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bankroll Guide Modal */}
      {showBankrollGuide && (
        <Modal
          visible={showBankrollGuide}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.bankrollGuideContainer}>
            <BankrollManagementGuide onClose={() => setShowBankrollGuide(false)} />
          </SafeAreaView>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  currencySymbol: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    padding: 0,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  toggleLabelActive: {
    color: theme.colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  oddsFormatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  oddsFormatOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  oddsFormatInfo: {
    flex: 1,
  },
  oddsFormatLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  oddsFormatExample: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  comingSoonOption: {
    opacity: 0.6,
  },
  comingSoonText: {
    color: theme.colors.text.light,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.border,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    fontWeight: theme.typography.fontWeight.medium,
  },
  helpSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  helpButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  bankrollGuideContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});