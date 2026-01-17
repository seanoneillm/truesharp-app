import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import TrueSharpShield from './TrueSharpShield';

interface ReferralWelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  creatorUsername: string;
  creatorProfilePicture?: string | null;
}

export default function ReferralWelcomeModal({
  visible,
  onClose,
  creatorUsername,
  creatorProfilePicture,
}: ReferralWelcomeModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Gradient Header */}
          <LinearGradient
            colors={['#007AFF', '#1E40AF', '#00B4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TrueSharpShield size={40} variant="white" />
            <Text style={styles.headerTitle}>Welcome to Pro!</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Creator Profile */}
            <View style={styles.creatorSection}>
              <View style={styles.creatorAvatar}>
                {creatorProfilePicture ? (
                  <Image
                    source={{ uri: creatorProfilePicture }}
                    style={styles.creatorImage}
                  />
                ) : (
                  <View style={styles.creatorPlaceholder}>
                    <Ionicons name="person" size={32} color={theme.colors.text.secondary} />
                  </View>
                )}
              </View>
              <Text style={styles.courtesyText}>
                Courtesy of
              </Text>
              <Text style={styles.creatorName}>
                {creatorUsername}
              </Text>
            </View>

            {/* Message */}
            <View style={styles.messageSection}>
              <View style={styles.giftIcon}>
                <Ionicons name="gift" size={28} color={theme.colors.primary} />
              </View>
              <Text style={styles.messageTitle}>
                Enjoy 1 Month Free!
              </Text>
              <Text style={styles.messageText}>
                You've received a free month of TrueSharp Pro. Explore advanced analytics, custom charts, and premium features.
              </Text>
            </View>

            {/* Features Preview */}
            <View style={styles.featuresSection}>
              <View style={styles.featureItem}>
                <Ionicons name="analytics" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Advanced Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="bar-chart" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Custom Charts</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>CLV Analysis</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButtonContainer}
              onPress={onClose}
              accessibilityLabel="Get Started"
            >
              <LinearGradient
                colors={['#007AFF', '#1E40AF', '#00B4FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  content: {
    padding: theme.spacing.lg,
  },
  creatorSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  creatorAvatar: {
    marginBottom: theme.spacing.sm,
  },
  creatorImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  creatorPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  courtesyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  creatorName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  giftIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  messageTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  featureItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  ctaButtonContainer: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  ctaButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
});
