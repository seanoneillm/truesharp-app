import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../styles/theme';
import { sellerService } from '../../services/sellerService';
import { useAuth } from '../../contexts/AuthContext';

interface SellerOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function SellerOnboardingModal({
  visible,
  onClose,
  onSuccess,
  onError,
}: SellerOnboardingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartOnboarding = async () => {
    if (!user?.id) {
      onError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const result = await sellerService.startSellerOnboarding(user.id);
      
      if (result.success && result.onboardingUrl) {
        Alert.alert(
          'Complete Setup',
          'You will be redirected to Stripe to complete your seller account setup. Please return to the app when finished to start monetizing your strategies.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue to Stripe', 
              onPress: async () => {
                try {
                  await Linking.openURL(result.onboardingUrl!);
                  onClose();
                  // Note: We can't automatically detect when they return, 
                  // so they'll need to refresh or reopen the modal
                } catch (linkError) {
                  onError('Failed to open Stripe onboarding');
                }
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
          <Text style={styles.title}>Become a Seller</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[theme.colors.primary, '#0056b3']}
                style={styles.iconGradient}
              >
                <Ionicons name="cash" size={32} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Start Monetizing Your Strategies</Text>
            <Text style={styles.heroSubtitle}>
              Turn your betting expertise into a sustainable income stream by sharing 
              your successful strategies with other bettors.
            </Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Become a Seller?</Text>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="trending-up" size={20} color={theme.colors.status.success} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Earn Recurring Revenue</Text>
                <Text style={styles.benefitDescription}>
                  Set weekly, monthly, or yearly subscription prices and earn passive income 
                  from your proven strategies.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="people" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Build Your Following</Text>
                <Text style={styles.benefitDescription}>
                  Attract subscribers who want to follow your betting approach and 
                  grow your reputation in the community.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.status.info} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Transparent Performance</Text>
                <Text style={styles.benefitDescription}>
                  Your track record is automatically verified and displayed, 
                  building trust with potential subscribers.
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="card" size={20} color={theme.colors.status.warning} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Secure Payments</Text>
                <Text style={styles.benefitDescription}>
                  Payments are processed securely through Stripe with automatic 
                  payouts directly to your bank account.
                </Text>
              </View>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Complete Stripe Setup</Text>
                <Text style={styles.stepDescription}>
                  Connect your bank account through Stripe to receive payments securely.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Monetize Your Strategies</Text>
                <Text style={styles.stepDescription}>
                  Set subscription prices for your proven betting strategies.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Picks</Text>
                <Text style={styles.stepDescription}>
                  Subscribers automatically see your bets that match your strategy filters.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Paid</Text>
                <Text style={styles.stepDescription}>
                  Receive automatic payouts from subscriptions directly to your bank account.
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startButton, loading && styles.startButtonDisabled]}
            onPress={handleStartOnboarding}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [theme.colors.text.light, theme.colors.text.light] : [theme.colors.primary, '#0056b3']}
              style={styles.startButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="white" />
                  <Text style={styles.startButtonText}>Start Seller Setup</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  benefitDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepNumberText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  feeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  feeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  feeValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  feeTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  feeTotalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  feeTotalValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.status.success,
  },
  feeNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  startButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  startButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});