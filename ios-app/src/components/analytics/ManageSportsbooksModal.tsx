import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import TrueSharpShield from '../common/TrueSharpShield';

interface ManageSportsbooksModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export default function ManageSportsbooksModal({ 
  visible, 
  onClose, 
  onConnected 
}: ManageSportsbooksModalProps) {
  
  const renderContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        {/* Step 1 */}
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Open the Manage Sportsbooks Menu</Text>
            <Text style={styles.stepText}>
              • On the Analytics → Overview tab, look for the <Text style={styles.bold}>Manage Sportsbooks</Text> button{'\n'}
              • Tap it to open the SharpSports interface
            </Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Your Sportsbooks</Text>
            <Text style={styles.stepText}>
              • In the SharpSports interface, you will see a list of supported sportsbooks{'\n'}
              • Sign in to as many as you'd like{'\n'}
              • Some sportsbooks may require additional authentication steps
            </Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Refresh Your Accounts</Text>
            <Text style={styles.stepText}>
              • To fetch new bets, you must first re-open <Text style={styles.bold}>Manage Sportsbooks</Text> and refresh your accounts{'\n'}
              • Make sure all books show as up to date{'\n'}
              • Once finished, you can close the interface
            </Text>
          </View>
        </View>

        {/* Step 4 */}
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Refresh Bets in Analytics</Text>
            <Text style={styles.stepText}>
              • Go back to the Analytics page, and tap <Text style={styles.bold}>Refresh Bets</Text>{'\n'}
              • Accept the confirmation and wait — this may take up to a minute{'\n'}
              • Once complete, your latest bets will appear in Analytics
            </Text>
          </View>
        </View>

        {/* Important Warning */}
        <View style={styles.warningContainer}>
          <View style={styles.warningHeader}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>Important</Text>
          </View>
          <Text style={styles.warningText}>
            You cannot just tap <Text style={styles.bold}>Refresh Bets</Text> directly — you must refresh your accounts in SharpSports first, then tap Refresh Bets in Analytics.
          </Text>
        </View>

        {/* Quick Reference */}
        <View style={styles.quickRefContainer}>
          <Text style={styles.sectionTitle}>Quick Reference</Text>
          <View style={styles.quickRefGrid}>
            <View style={styles.quickRefItem}>
              <Text style={styles.quickRefTitle}>To Link New Sportsbooks:</Text>
              <Text style={styles.quickRefText}>Manage Sportsbooks → Sign in to accounts → Close interface</Text>
            </View>
            <View style={styles.quickRefItem}>
              <Text style={styles.quickRefTitle}>To Sync New Bets:</Text>
              <Text style={styles.quickRefText}>Manage Sportsbooks → Refresh accounts → Close → Refresh Bets</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TrueSharpShield size={24} variant="default" style={styles.shieldIcon} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>How to Link Your Sportsbooks</Text>
              <Text style={styles.headerSubtitle}>Step-by-step guide to connect your accounts</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {renderContent()}
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
    flex: 1,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  stepContent: {
    flex: 1,
    paddingBottom: theme.spacing.md,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  stepText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tipContainer: {
    backgroundColor: '#FEF3C7', // amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // amber-300
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#92400E', // amber-800
  },
  warningContainer: {
    backgroundColor: '#FEF2F2', // red-50
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444', // red-500
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  warningIcon: {
    fontSize: theme.typography.fontSize.xl,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#991B1B', // red-800
  },
  warningText: {
    fontSize: theme.typography.fontSize.base,
    color: '#991B1B', // red-800
    lineHeight: 22,
  },
  quickRefContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  quickRefGrid: {
    gap: theme.spacing.md,
  },
  quickRefItem: {
    
  },
  quickRefTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  quickRefText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});