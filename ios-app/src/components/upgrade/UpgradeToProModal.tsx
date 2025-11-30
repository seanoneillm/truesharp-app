import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import TrueSharpShield from '../common/TrueSharpShield';
import LegalModals from '../auth/LegalModals';
import { modernStoreKitService, StoreProduct, PRODUCT_IDS } from '../../services/modern-storekit';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionActions } from '../../contexts/SubscriptionContext';

interface PricingTier {
  id: string;
  type: 'monthly' | 'yearly';
  name: string;
  price: number;
  period: string;
  productId: string; // Backend product ID for purchase flow
  storeProduct?: StoreProduct; // Apple App Store product info
  popular?: boolean;
}

interface UpgradeToProModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan?: (planType: 'monthly' | 'yearly', productId: string, price: number) => void;
}

export default function UpgradeToProModal({
  visible,
  onClose,
  onSelectPlan
}: UpgradeToProModalProps) {
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storeKitInitialized, setStoreKitInitialized] = useState(false);
  const [showLegalModals, setShowLegalModals] = useState(false);
  const [preparingSubscriptions, setPreparingSubscriptions] = useState(false);
  const { user } = useAuth();
  const { purchaseSubscription, restorePurchases } = useSubscriptionActions();

  // Base pricing tiers - will be updated with actual App Store prices on iOS
  const basePricingTiers: PricingTier[] = [
    {
      id: 'pro-monthly',
      type: 'monthly',
      name: 'TrueSharp Pro Monthly',
      price: 20,
      period: '/month',
      productId: PRODUCT_IDS.PRO_MONTHLY,
      popular: true,
    },
    {
      id: 'pro-yearly',
      type: 'yearly',
      name: 'TrueSharp Pro Yearly',
      price: 200,
      period: '/year',
      productId: PRODUCT_IDS.PRO_YEARLY,
    },
  ];

  // Get pricing tiers with store prices (iOS) or fallback prices
  const pricingTiers = basePricingTiers.map(tier => {
    if (Platform.OS === 'ios' && storeProducts.length > 0) {
      const storeProduct = storeProducts.find(p => p.productId === tier.productId);
      if (storeProduct) {
        return {
          ...tier,
          storeProduct,
          // Use actual App Store price
          price: storeProduct.priceAmountMicros / 1000000, // Convert from micros
        };
      }
    }
    return tier;
  });

  // Pro features list - condensed
  const proFeatures = [
    'Advanced analytics & detailed charts',
    'Custom chart creator for any model',
    'TrueSharp Analytics AI assistant (Coming Soon)',
    'Line movement & CLV analysis',
  ];

  // Initialize StoreKit immediately when component mounts (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      initializeStoreKit();
    }
  }, []);

  // Ensure prices are loaded when modal becomes visible
  useEffect(() => {
    if (visible && Platform.OS === 'ios' && storeKitInitialized && storeProducts.length === 0) {
      loadStoreProducts();
    }
  }, [visible, storeKitInitialized]);

  const initializeStoreKit = async () => {
    if (Platform.OS !== 'ios') return;
    
    try {
      setPreparingSubscriptions(true);
      const initialized = await modernStoreKitService.initialize();
      if (initialized) {
        setStoreKitInitialized(true);
        // Load products immediately after initialization
        await loadStoreProducts();
      } else {
        console.warn('📱 Modal: StoreKit failed to initialize');
      }
    } catch (error) {
      console.error('📱 Modal: Failed to initialize StoreKit:', error);
      // Don't show alert immediately - let the purchase flow handle initialization
    } finally {
      setPreparingSubscriptions(false);
    }
  };

  const loadStoreProducts = async () => {
    try {
      const products = await modernStoreKitService.getProducts();
      setStoreProducts(products);
    } catch (error) {
      console.error('📱 Modal: Failed to load store products:', error);
      // Products will be loaded during purchase if needed
    }
  };

  const formatCurrency = (amount: number, storeProduct?: StoreProduct) => {
    if (Platform.OS === 'ios' && storeProduct) {
      // Use the formatted price from App Store
      return storeProduct.price;
    }
    // Fallback for non-iOS or when store products not loaded
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSelectPlan = async (tier: PricingTier) => {
    if (loading) return;

    try {
      setLoading(true);
      
      if (Platform.OS === 'ios') {
        // Ensure StoreKit is initialized before attempting purchase
        if (!storeKitInitialized) {
          const initialized = await modernStoreKitService.initialize();
          if (initialized) {
            setStoreKitInitialized(true);
            await loadStoreProducts();
          } else {
            throw new Error('Unable to connect to App Store. Please check your internet connection and try again.');
          }
        }

        // Ensure products are loaded
        if (storeProducts.length === 0) {
          await loadStoreProducts();
        }
        
        // Use subscription context for iOS purchases (handles state updates)
        const result = await purchaseSubscription(tier.productId);
        
        if (result.success) {
          const isSimulatorPurchase = result.transactionId?.includes('dev_txn');
          
          if (result.serverValidated) {
            // Fully validated subscription
            const validationInfo = result.validationAttempts && result.validationAttempts > 1 
              ? `\n\n🔄 Transaction validated after ${result.validationAttempts} attempts` 
              : '';
            
            const message = isSimulatorPurchase 
              ? `Welcome to TrueSharp Pro ${tier.name}! Your subscription is now active.\n\n⚠️ Local Development: This was a mock purchase.`
              : `Welcome to TrueSharp Pro ${tier.name}! Your subscription is now active.\n\n✅ Apple transaction validated and processed successfully.${validationInfo}\n\nTransaction ID: ${result.transactionId?.substring(0, 12)}...`;
            
            Alert.alert(
              'Subscription Active! 🎉',
              message,
              [{ text: 'Continue', onPress: onClose }]
            );
          } else {
            // Optimistic success - validation happening in background
            const message = isSimulatorPurchase 
              ? `Welcome to TrueSharp Pro ${tier.name}! Your subscription is now active.\n\n⚠️ Local Development: This was a mock purchase.`
              : `Welcome to TrueSharp Pro ${tier.name}! Your subscription is being activated.\n\n✅ Purchase successful! Your subscription will be fully activated within a few moments.\n\nTransaction ID: ${result.transactionId?.substring(0, 12)}...`;
            
            Alert.alert(
              'Purchase Successful! 🎉',
              message,
              [{ text: 'Continue', onPress: onClose }]
            );
          }
        } else if (result.error?.includes('canceled') || result.error?.includes('cancelled')) {
          Alert.alert(
            'Purchase Canceled',
            'You canceled the purchase. Your subscription remains unchanged.',
            [{ text: 'OK' }]
          );
        } else if (result.error?.includes('timeout') || result.error?.includes('timed out')) {
          Alert.alert(
            'Purchase Processing',
            'Your purchase is being processed by Apple. This may take a few moments. If you don\'t see your subscription activated shortly, please use "Restore Purchases" below.',
            [
              { text: 'Try Restore', onPress: async () => {
                try {
                  const results = await restorePurchases();
                  Alert.alert('Success', 'Purchase restored successfully!', [{ text: 'OK', onPress: onClose }]);
                } catch (error) {
                  Alert.alert('Error', 'Could not restore purchase. Please contact support.');
                }
              }},
              { text: 'OK' }
            ]
          );
        } else if (result.error?.includes('not available')) {
          Alert.alert(
            'Purchases Unavailable',
            'In-app purchases are not available on this device or region. Please contact support for alternative options.',
            [{ text: 'OK' }]
          );
        } else {
          const errorMessage = result.error || 'Unable to complete purchase. Please try again.';
          Alert.alert(
            'Purchase Failed',
            `${errorMessage}\n\nIf this issue persists, please contact support.`,
            [{ text: 'OK' }]
          );
        }
      } else if (onSelectPlan) {
        // Use external payment handler (Stripe, etc.) for non-iOS
        onSelectPlan(tier.type, tier.productId, tier.price);
      } else {
        // Default behavior - show placeholder alert
        Alert.alert(
          'Upgrade to Pro',
          `You're about to upgrade to the ${tier.name} Pro Plan for ${formatCurrency(tier.price, tier.storeProduct)}${tier.period}.\n\nThis will integrate with your payment processing system.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => {
              Alert.alert('Success', `${tier.name} Pro upgrade initiated! Payment processing will be implemented here.`);
              onClose();
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      
      if (errorMessage.includes('StoreKit not available')) {
        Alert.alert(
          'Purchases Unavailable', 
          'In-app purchases are not available on this device. Please try again later or contact support.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('not initialized')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the App Store. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (restoreLoading) return;

    try {
      setRestoreLoading(true);
      
      // Ensure StoreKit is initialized before restoring
      if (Platform.OS === 'ios' && !storeKitInitialized) {
        const initialized = await modernStoreKitService.initialize();
        if (initialized) {
          setStoreKitInitialized(true);
          await loadStoreProducts();
        } else {
          throw new Error('Unable to connect to App Store. Please check your internet connection and try again.');
        }
      }

      const results = await restorePurchases();
      
      if (results.length > 0) {
        Alert.alert(
          'Purchases Restored! 🎉',
          'Your previous purchases have been restored successfully. Your Pro subscription is now active.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error restoring purchases in modal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      if (errorMessage.includes('StoreKit not available')) {
        Alert.alert(
          'Restore Unavailable',
          'Purchase restoration is not available on this device. Please try again later or contact support.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('not initialized')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the App Store. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Restore Failed',
          'Could not restore purchases. Please try again or contact support if the issue persists.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  const renderFeatureItem = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.bulletPoint}>
        <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
      </View>
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderPricingTier = (tier: PricingTier) => (
    <View key={tier.id} style={styles.pricingTierContainer}>
      {tier.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}
      
      <View style={styles.pricingTierCard}>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTierName}>{tier.name}</Text>
          <Text style={styles.subscriptionDuration}>
            {tier.type === 'monthly' ? 'Duration: 1 Month' : 'Duration: 1 Year'}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{formatCurrency(tier.price, tier.storeProduct)}</Text>
            <Text style={styles.pricePeriod}>{tier.period}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.selectPlanButtonContainer,
            tier.popular && styles.popularButtonContainer
          ]}
          onPress={() => handleSelectPlan(tier)}
          disabled={loading}
          accessibilityLabel={`Choose ${tier.name} Plan for ${formatCurrency(tier.price, tier.storeProduct)} ${tier.period}`}
        >
          <LinearGradient
            colors={['#007AFF', '#1E40AF', '#00B4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectPlanButton}
          >
            <Text style={styles.selectPlanButtonText}>
              Choose {tier.name} Plan
            </Text>
            {loading && <Ionicons name="hourglass" size={16} color="white" style={styles.loadingIcon} />}
          </LinearGradient>
        </TouchableOpacity>

        {tier.type === 'yearly' && (
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsText}>Save $40 per year</Text>
          </View>
        )}
      </View>
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
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <TrueSharpShield size={24} variant="default" />
            <Text style={styles.modalTitle}>Upgrade to Pro</Text>
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section with Icon */}
          <View style={styles.heroSection}>
            <View style={styles.titleRow}>
              <Ionicons name="diamond" size={24} color={theme.colors.primary} />
              <Text style={styles.proTitle}>Pro Plan</Text>
            </View>
            <Text style={styles.proDescription}>
              Advanced analytics and premium features for serious bettors
            </Text>
          </View>

          {/* Pricing Section - Moved to Top */}
          <View style={styles.pricingSection}>
            {preparingSubscriptions && Platform.OS === 'ios' ? (
              <View style={styles.preparingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.preparingText}>Loading subscription options from App Store...</Text>
                <Text style={styles.preparingSubtext}>This may take a moment for first-time setup</Text>
              </View>
            ) : (
              <View style={styles.pricingTiers}>
                {pricingTiers.map(renderPricingTier)}
              </View>
            )}
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.featuresList}>
              {proFeatures.map((feature, index) => renderFeatureItem(feature, index))}
            </View>
          </View>

          {/* Legal Links - Required by Apple */}
          <View style={styles.legalLinksSection}>
            <Text style={styles.legalLinksTitle}>Before subscribing, please review:</Text>
            <View style={styles.legalLinksContainer}>
              <TouchableOpacity
                style={styles.legalLinkButton}
                onPress={() => setShowLegalModals(true)}
              >
                <Text style={styles.legalLinkText}>Terms of Service (EULA)</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkSeparator}> • </Text>
              <TouchableOpacity
                style={styles.legalLinkButton}
                onPress={() => setShowLegalModals(true)}
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Disclaimer */}
          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerText}>
              {Platform.OS === 'ios' 
                ? 'Subscriptions automatically renew and can be managed in iOS Settings → Apple ID → Subscriptions.'
                : 'Subscription can be managed in Settings. Payment charged to card in Settings → Payment Methods.'
              }
            </Text>
          </View>

          {/* Restore Purchases Button - iOS Only */}
          {Platform.OS === 'ios' && (
            <View style={styles.restorePurchasesSection}>
              <TouchableOpacity
                style={styles.restorePurchasesButton}
                onPress={handleRestorePurchases}
                disabled={restoreLoading || loading}
                accessibilityLabel="Restore Previous Purchases"
              >
                {restoreLoading ? (
                  <View style={styles.restoreLoadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.restorePurchasesText}>Restoring...</Text>
                  </View>
                ) : (
                  <Text style={styles.restorePurchasesText}>Restore Purchases</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.restorePurchasesSubtext}>
                Already purchased? Tap here to restore your subscription
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Legal Modals */}
      <LegalModals
        isVisible={showLegalModals}
        onClose={() => setShowLegalModals(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
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
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  proTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  proDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },

  // Features Section
  featuresSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  featuresList: {
    gap: theme.spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bulletPoint: {
    marginTop: 2,
  },
  featureText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    flex: 1,
  },

  // Pricing Section
  pricingSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  pricingTiers: {
    gap: theme.spacing.sm,
  },
  preparingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  preparingText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  preparingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pricingTierContainer: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  pricingTierCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pricingTierName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subscriptionDuration: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  priceAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  pricePeriod: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  selectPlanButtonContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  popularButtonContainer: {
    elevation: 5,
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  selectPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: 40,
  },
  selectPlanButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  loadingIcon: {
    marginLeft: theme.spacing.xs,
  },
  savingsContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  savingsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.betting.won,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Legal Links Section
  legalLinksSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legalLinksTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legalLinkButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  legalLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    fontWeight: theme.typography.fontWeight.medium,
  },
  legalLinkSeparator: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Disclaimer Section
  disclaimerSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Restore Purchases Section
  restorePurchasesSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  restorePurchasesButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    marginBottom: theme.spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  restorePurchasesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  restorePurchasesSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});