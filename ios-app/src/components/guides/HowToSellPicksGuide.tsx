import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../styles/theme'

interface HowToSellPicksGuideProps {
  onClose: () => void
}

const HowToSellPicksGuide: React.FC<HowToSellPicksGuideProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>How to Sell Picks</Text>
            <Text style={styles.headerSubtitle}>Monetize your expertise</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={20} color="white" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Step 1: Create Your Strategy */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Your Strategy</Text>
              <Text style={styles.stepText}>
                Go to <Text style={styles.bold}>Analytics → Strategies tab</Text> to create your betting strategy based on current filters.
              </Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• Strategy matches your selected filters (NBA, dates, etc.)</Text>
                <Text style={styles.bulletText}>• Only open bets (before game starts) can be added</Text>
              </View>
            </View>
          </View>

          {/* Step 2: Complete Seller Setup */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Seller Setup</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• Set up seller account</Text>
                <Text style={styles.bulletText}>• Complete Stripe onboarding (required for payments)</Text>
              </View>
            </View>
          </View>

          {/* Step 3: Monetize Your Strategy */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Monetize Your Strategy</Text>
              <Text style={styles.stepText}>
                Go to <Text style={styles.bold}>Sell screen → Strategies tab</Text> to set prices and activate.
              </Text>
            </View>
          </View>

          {/* Step 4: Meet Verification Requirements */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Meet Verification Requirements</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• 5+ bets for leaderboard</Text>
                <Text style={styles.bulletText}>• 30+ bets in last 30 days while profitable for verification</Text>
              </View>
            </View>
          </View>

          {/* Step 5: Customize Seller Profile */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Customize Seller Profile</Text>
              <Text style={styles.stepText}>
                Set up your public seller page where users subscribe.
              </Text>
            </View>
          </View>

          {/* Step 6: Manage Your Strategy */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>6</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Manage Your Strategy</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• Use <Text style={styles.bold}>Sell screen</Text> to manage picks and subscribers</Text>
                <Text style={styles.bulletText}>• Access payouts via "Manage Account"</Text>
              </View>
            </View>
          </View>

          {/* Step 7: Add Picks */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>7</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add Picks</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• Add open bets via Sell screen or Analytics</Text>
                <Text style={styles.bulletText}>• Subscribers get notifications for new picks</Text>
              </View>
            </View>
          </View>

          {/* Step 8: Performance Tracking */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>8</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Performance Tracking</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• All picks verified by TrueSharp</Text>
                <Text style={styles.bulletText}>• Public metrics: ROI, win rate, total bets</Text>
                <Text style={styles.bulletText}>• Bet history/filters stay private</Text>
              </View>
            </View>
          </View>

          {/* Step 9: Scale Your Business */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>9</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Scale Your Business</Text>
              <View style={styles.bulletContainer}>
                <Text style={styles.bulletText}>• Create unlimited strategies</Text>
                <Text style={styles.bulletText}>• Each strategy tracks independently</Text>
              </View>
            </View>
          </View>

        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
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
    paddingVertical: theme.spacing.lg,
    backgroundColor: '#3B82F6', // blue-500
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  backButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  iconContainer: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
    paddingBottom: theme.spacing.sm,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  stepText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  bold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  bulletContainer: {
    paddingLeft: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  bulletText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  principlesContainer: {
    backgroundColor: '#EFF6FF', // blue-50
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#3B82F6', // blue-500
    marginTop: theme.spacing.md,
  },
  principlesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  principlesIcon: {
    fontSize: theme.typography.fontSize.xl,
  },
  principlesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#1E3A8A', // blue-800
  },
  bottomPadding: {
    height: 80,
  },
})

export default HowToSellPicksGuide