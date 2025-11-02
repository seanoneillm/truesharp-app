import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../styles/theme';
import TrueSharpShield from '../common/TrueSharpShield';
import { Strategy } from '../../services/supabaseAnalytics';
import { stripeService, StrategyMonetizationData } from '../../services/stripeService';
import { sellerService, SellerStatus } from '../../services/sellerService';
import { useAuth } from '../../contexts/AuthContext';

interface MonetizeStrategyModalProps {
  visible: boolean;
  strategy: Strategy | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function MonetizeStrategyModal({
  visible,
  strategy,
  onClose,
  onSuccess,
  onError,
}: MonetizeStrategyModalProps) {
  const { user } = useAuth();
  
  // Form state
  const [weeklyPrice, setWeeklyPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [isMonetized, setIsMonetized] = useState(false);
  
  // Status state
  const [loading, setLoading] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Initialize form when strategy changes
  useEffect(() => {
    if (strategy) {
      setWeeklyPrice(strategy.pricing_weekly?.toString() || '');
      setMonthlyPrice(strategy.pricing_monthly?.toString() || '');
      setYearlyPrice(strategy.pricing_yearly?.toString() || '');
      setIsMonetized(strategy.monetized || false);
    }
  }, [strategy]);

  // Check seller status when modal opens
  useEffect(() => {
    if (visible && user?.id) {
      checkSellerStatus();
    }
  }, [visible, user?.id]);

  const checkSellerStatus = async () => {
    if (!user?.id) return;

    setCheckingStatus(true);
    try {
      const status = await sellerService.getSellerStatus(user.id);
      setSellerStatus(status);
      
      if (status.errors && status.errors.length > 0) {
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
      onError('Failed to check seller status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!strategy || !sellerStatus) return false;

    const strategyData: StrategyMonetizationData = {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      monetized: isMonetized,
      pricing_weekly: weeklyPrice ? parseFloat(weeklyPrice) : null,
      pricing_monthly: monthlyPrice ? parseFloat(monthlyPrice) : null,
      pricing_yearly: yearlyPrice ? parseFloat(yearlyPrice) : null,
    };

    const validation = stripeService.validateStrategyForMonetization(
      strategyData,
      sellerStatus.hasStripeAccount,
      sellerStatus.stripeAccountReady
    );

    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    return validation.isValid;
  };

  // Handle monetization toggle
  const handleMonetizationToggle = () => {
    const newValue = !isMonetized;
    setIsMonetized(newValue);
    
    // Show warning when enabling monetization
    if (newValue && (!sellerStatus?.canMonetizeStrategies)) {
      Alert.alert(
        'Setup Required',
        'You need to complete seller onboarding before you can monetize strategies. Would you like to start the setup process?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Setup', onPress: handleStartOnboarding },
        ]
      );
      setIsMonetized(false); // Reset until setup is complete
    }
  };

  // Start seller onboarding
  const handleStartOnboarding = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await sellerService.startSellerOnboarding(user.id);
      
      if (result.success && result.onboardingUrl) {
        Alert.alert(
          'Complete Setup',
          'You will be redirected to Stripe to complete your seller account setup. Return to the app when finished.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                Linking.openURL(result.onboardingUrl!);
              }
            },
          ]
        );
      } else {
        onError(result.error || 'Failed to start onboarding process');
      }
    } catch (error) {
      onError('Failed to start seller onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Save strategy changes
  const handleSave = async () => {
    if (!strategy || !user?.id) return;

    // Validate form
    if (!validateForm()) {
      return; // Errors are displayed in UI
    }

    setLoading(true);
    try {
      const strategyData: StrategyMonetizationData = {
        id: strategy.id,
        name: strategy.name,
        description: strategy.description,
        monetized: isMonetized,
        pricing_weekly: weeklyPrice ? parseFloat(weeklyPrice) : null,
        pricing_monthly: monthlyPrice ? parseFloat(monthlyPrice) : null,
        pricing_yearly: yearlyPrice ? parseFloat(yearlyPrice) : null,
      };

      const result = await stripeService.monetizeStrategy(strategyData);

      if (result.success) {
        onSuccess(isMonetized ? 'Strategy monetized successfully!' : 'Strategy updated successfully!');
        onClose();
      } else {
        onError(result.error || 'Failed to update strategy');
        
        // Handle specific Stripe Connect errors
        if (result.details?.includes('Stripe Connect account required')) {
          Alert.alert(
            'Stripe Account Required',
            result.details,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Setup Account', onPress: handleStartOnboarding },
            ]
          );
        }
      }
    } catch (error) {
      onError('Failed to update strategy');
    } finally {
      setLoading(false);
    }
  };

  // Calculate earnings preview
  const calculateEarningsPreview = () => {
    const weekly = weeklyPrice ? parseFloat(weeklyPrice) : 0;
    const monthly = monthlyPrice ? parseFloat(monthlyPrice) : 0;
    const yearly = yearlyPrice ? parseFloat(yearlyPrice) : 0;

    // Example with 10 subscribers each
    const subscribers = 10;
    const weeklyGross = weekly * subscribers * 4.33; // ~4.33 weeks per month
    const monthlyGross = monthly * subscribers;
    const yearlyGross = (yearly * subscribers) / 12; // Monthly equivalent

    const totalGross = weeklyGross + monthlyGross + yearlyGross;
    
    if (totalGross > 0) {
      return stripeService.calculateEstimatedEarnings(totalGross);
    }
    
    return null;
  };

  if (!strategy) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <TrueSharpShield size={20} variant="default" />
              <Text style={styles.title}>Monetize Strategy</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Strategy Info */}
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
            </View>

            {/* Seller Status Check */}
            {checkingStatus ? (
              <View style={styles.statusCard}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.statusText}>Checking seller status...</Text>
              </View>
            ) : sellerStatus && !sellerStatus.canMonetizeStrategies ? (
              <View style={[styles.statusCard, styles.warningCard]}>
                <Ionicons name="warning" size={20} color={theme.colors.status.warning} />
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Setup Required</Text>
                  <Text style={styles.statusText}>
                    {!sellerStatus.isSeller ? 'Enable seller status and ' : ''}
                    {!sellerStatus.hasStripeAccount ? 'create a Stripe account ' : ''}
                    {sellerStatus.hasStripeAccount && !sellerStatus.stripeAccountReady ? 'complete Stripe onboarding ' : ''}
                    to monetize strategies.
                  </Text>
                  <TouchableOpacity style={styles.setupButton} onPress={handleStartOnboarding}>
                    <Text style={styles.setupButtonText}>Start Setup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.statusCard, styles.successCard]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.success} />
                <Text style={styles.statusText}>Ready to monetize strategies!</Text>
              </View>
            )}

            {/* Monetization Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleTitle}>Enable Monetization</Text>
                  <Text style={styles.toggleSubtitle}>
                    Make this strategy public and start earning revenue
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, isMonetized && styles.toggleActive]}
                  onPress={handleMonetizationToggle}
                  disabled={loading || checkingStatus}
                >
                  <View style={[styles.toggleButton, isMonetized && styles.toggleButtonActive]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pricing Options */}
            {isMonetized && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subscription Pricing</Text>
                <Text style={styles.sectionSubtitle}>
                  Set at least one pricing option. Leave empty to disable that tier.
                </Text>

                <View style={styles.pricingGrid}>
                  {/* Weekly */}
                  <View style={styles.pricingCard}>
                    <Text style={styles.pricingLabel}>Weekly</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={weeklyPrice}
                        onChangeText={setWeeklyPrice}
                        placeholder="0"
                        placeholderTextColor={theme.colors.text.light}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Monthly */}
                  <View style={styles.pricingCard}>
                    <Text style={styles.pricingLabel}>Monthly</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={monthlyPrice}
                        onChangeText={setMonthlyPrice}
                        placeholder="0"
                        placeholderTextColor={theme.colors.text.light}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Yearly */}
                  <View style={styles.pricingCard}>
                    <Text style={styles.pricingLabel}>Yearly</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={yearlyPrice}
                        onChangeText={setYearlyPrice}
                        placeholder="0"
                        placeholderTextColor={theme.colors.text.light}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Earnings Preview */}
            {isMonetized && (() => {
              const earningsPreview = calculateEarningsPreview();
              return earningsPreview ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Earnings Preview</Text>
                  <Text style={styles.sectionSubtitle}>
                    Estimated monthly earnings with 10 subscribers each
                  </Text>
                  <View style={styles.earningsCard}>
                    <View style={styles.earningsRow}>
                      <Text style={styles.earningsLabel}>Estimated Revenue</Text>
                      <Text style={styles.earningsValue}>${earningsPreview.gross.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              ) : null;
            })()}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <View style={styles.validationSection}>
                <View style={styles.validationHeader}>
                  <Ionicons name="warning" size={16} color={theme.colors.status.error} />
                  <Text style={styles.validationTitle}>Please fix the following issues:</Text>
                </View>
                {validationErrors.map((error, index) => (
                  <Text key={index} style={styles.validationError}>• {error}</Text>
                ))}
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerSection}>
              <Text style={styles.disclaimerText}>
                By monetizing your strategy, you agree to share your betting picks with subscribers.
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (loading || validationErrors.length > 0 || !sellerStatus?.canMonetizeStrategies) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={loading || validationErrors.length > 0 || !sellerStatus?.canMonetizeStrategies}
            >
              <LinearGradient
                colors={loading || validationErrors.length > 0 || !sellerStatus?.canMonetizeStrategies 
                  ? [theme.colors.text.light, theme.colors.text.light] 
                  : [theme.colors.primary, '#0056b3']
                }
                style={styles.saveButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isMonetized ? 'Monetize Strategy' : 'Save Changes'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginVertical: theme.spacing.md,
  },
  strategyHeader: {
    marginVertical: theme.spacing.sm,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },
  warningCard: {
    backgroundColor: '#FEF3CD',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  statusTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  setupButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  setupButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  toggleSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.text.light,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  toggleButtonActive: {
    transform: [{ translateX: 20 }],
  },
  pricingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pricingLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  priceInput: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  },
  earningsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  earningsLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  earningsValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  earningsTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  earningsTotalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  earningsTotalValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.status.success,
  },
  validationSection: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  validationTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.xs,
  },
  validationError: {
    fontSize: theme.typography.fontSize.sm,
    color: '#DC2626',
    marginBottom: theme.spacing.xs,
  },
  validationWarning: {
    fontSize: theme.typography.fontSize.sm,
    color: '#D97706',
    marginBottom: theme.spacing.xs,
  },
  disclaimerSection: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});