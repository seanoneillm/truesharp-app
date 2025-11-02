import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import TrueSharpShield from '../../components/common/TrueSharpShield'
import { Environment } from '../../config/environment'
import { theme } from '../../styles/theme'
import { MainStackParamList } from '../../types'

type NavigationProp = StackNavigationProp<MainStackParamList>

interface FAQItem {
  question: string
  answer: string
}

interface FeatureItem {
  icon: string
  title: string
  description: string
  color: string
}

interface TroubleshootingItem {
  title: string
  description: string
  color: string
}

const faqItems: FAQItem[] = [
  {
    question: 'How do I connect my sportsbook?',
    answer: 'Go to Analytics → Link Sportsbooks and log in through SharpSports integration.',
  },
  {
    question: 'How do I refresh bets?',
    answer: 'In the Analytics screen, tap Refresh Bets to update your wager history.',
  },
  {
    question: 'Can I enter bets manually?',
    answer: 'No, but you can use the Mock Sportsbook in the Games screen to simulate bets.',
  },
  {
    question: 'Where can I update settings?',
    answer:
      'Tap your profile picture → Settings to manage your account, billing, and notifications.',
  },
  {
    question: 'Are my sportsbook logins safe?',
    answer:
      'Yes. TrueSharp never stores your sportsbook credentials. All syncing is handled securely through SharpSports.',
  },
  {
    question: 'How often do my bets update?',
    answer:
      'Bets update automatically, but you can always tap Refresh Bets in Analytics to fetch the latest.',
  },
]

const features: FeatureItem[] = [
  {
    icon: 'analytics',
    title: 'Automatic Bet Syncing',
    description: 'All wagers from linked sportsbooks update in Analytics',
    color: theme.colors.primary,
  },
  {
    icon: 'game-controller',
    title: 'Mock Sportsbook',
    description: 'Simulate bets to test strategies without risk',
    color: theme.colors.status.success,
  },
  {
    icon: 'trending-up',
    title: 'Performance Analytics',
    description: 'Charts for ROI, spreads, totals, moneylines, and line movement',
    color: theme.colors.accent,
  },
  {
    icon: 'storefront',
    title: 'Marketplace',
    description: "Discover and subscribe to independent sellers' strategies",
    color: theme.colors.status.warning,
  },
  {
    icon: 'people',
    title: 'Seller Tools',
    description: 'Profile pages, performance history, and subscription management',
    color: theme.colors.secondary,
  },
  {
    icon: 'card',
    title: 'Secure Payments',
    description: 'Subscriptions and payouts powered by Stripe',
    color: theme.colors.sports.mlb,
  },
]

const troubleshootingItems: TroubleshootingItem[] = [
  {
    title: "Sportsbook isn't syncing",
    description: 'Try unlinking and re-linking through Analytics → Link Sportsbooks.',
    color: theme.colors.status.warning,
  },
  {
    title: 'Bets are missing',
    description: 'Use Refresh Bets in Analytics screen.',
    color: theme.colors.primary,
  },
  {
    title: 'Payment issues',
    description: 'Update your details in Settings → Billing & Subscriptions.',
    color: theme.colors.accent,
  },
  {
    title: 'Still stuck?',
    description: 'Contact info@truesharp.io for additional support.',
    color: theme.colors.status.success,
  },
]

export default function HelpScreen() {
  const navigation = useNavigation<NavigationProp>()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const handleContactSupport = () => {
    const email = 'info@truesharp.io'
    const subject = 'TrueSharp iOS App Support Request'
    const body =
      'Hi TrueSharp team,\n\nI need help with:\n\n[Please describe your issue here]\n\nThanks!'

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    Linking.openURL(url).catch(() => {
      Alert.alert('Email Not Available', 'Please email us directly at info@truesharp.io', [
        { text: 'Copy Email', onPress: () => Linking.openURL('mailto:info@truesharp.io') },
        { text: 'OK' },
      ])
    })
  }

  const handleSubmitFeedback = () => {
    const email = 'info@truesharp.io'
    const subject = 'TrueSharp iOS App Feedback'
    const body =
      'Hi TrueSharp team,\n\nI have feedback about the iOS app:\n\n[Please share your feedback here]\n\nThanks!'

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    Linking.openURL(url).catch(() => {
      Alert.alert('Email Not Available', 'Please email us directly at info@truesharp.io', [
        { text: 'Copy Email', onPress: () => Linking.openURL('mailto:info@truesharp.io') },
        { text: 'OK' },
      ])
    })
  }

  const handleGamblingResourcesLink = () => {
    Linking.openURL(Environment.GAMBLING_HELP_URL).catch(() => {
      Alert.alert('Unable to open link', 'Please visit ncpgambling.org in your browser')
    })
  }

  const handleGamblingHotline = () => {
    Linking.openURL('tel:1-800-522-4700').catch(() => {
      Alert.alert('Call Not Available', 'Please dial 1-800-GAMBLER (1-800-522-4700)')
    })
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <View style={styles.backArrowContainer}>
        <TouchableOpacity 
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TrueSharpShield style={styles.shield} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Help Center</Text>
              <Text style={styles.headerSubtitle}>Your guide to TrueSharp</Text>
            </View>
          </View>
        </View>

        {/* Getting Started Section */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="rocket" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Getting Started</Text>
            <Text style={styles.sectionSubtitle}>Your first steps with TrueSharp</Text>
          </View>

          <View style={styles.gettingStartedGrid}>
            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="person-add" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Create an Account</Text>
              </View>
              <Text style={styles.stepDescription}>• Sign up with your email and password</Text>
              <Text style={styles.stepDescription}>
                • Verify your email to activate your account
              </Text>
            </View>

            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="link" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Sync Your Sportsbooks</Text>
              </View>
              <Text style={styles.stepDescription}>
                • Go to Analytics → Link Sportsbooks to connect via SharpSports
              </Text>
              <Text style={styles.stepDescription}>
                • Supported: DraftKings, FanDuel, Caesars, BetMGM, and more
              </Text>
              <Text style={styles.stepDescription}>
                • Your bets will automatically sync into TrueSharp
              </Text>
            </View>

            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Refresh Bets</Text>
              </View>
              <Text style={styles.stepDescription}>
                On the Analytics screen, tap Refresh Bets to pull in the latest wagers from your
                linked sportsbooks.
              </Text>
            </View>

            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="storefront" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Browse Strategies</Text>
              </View>
              <Text style={styles.stepDescription}>
                • Head to the Marketplace to discover betting strategies
              </Text>
              <Text style={styles.stepDescription}>
                • Each seller can list up to 5 active strategies at once
              </Text>
            </View>

            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="card" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Subscribe to a Strategy</Text>
              </View>
              <Text style={styles.stepDescription}>
                • Choose a plan (weekly / monthly / yearly)
              </Text>
              <Text style={styles.stepDescription}>• Payments handled securely through Stripe</Text>
              <Text style={styles.stepDescription}>
                • Instantly see the seller's picks once subscribed
              </Text>
            </View>

            <View style={styles.gettingStartedItem}>
              <View style={styles.stepHeader}>
                <Ionicons name="game-controller" size={16} color={theme.colors.primary} />
                <Text style={styles.stepTitle}>Place Mock Bets</Text>
              </View>
              <Text style={styles.stepDescription}>
                Test strategies without real money using the Mock Sportsbook in the Games screen.
                Mock bets are tracked alongside your synced wagers.
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="apps" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <Text style={styles.sectionSubtitle}>What makes TrueSharp powerful</Text>
          </View>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={[styles.featureCard, { borderLeftColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={16} color={feature.color} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.sectionSubtitle}>Quick answers to common questions</Text>
          </View>

          <View style={styles.faqContainer}>
            {faqItems.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <Ionicons
                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
                {expandedFAQ === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Troubleshooting Section */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="construct" size={20} color={theme.colors.status.warning} />
            </View>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>
            <Text style={styles.sectionSubtitle}>Solutions to common issues</Text>
          </View>

          <View style={styles.troubleshootingContainer}>
            {troubleshootingItems.map((item, index) => (
              <View
                key={index}
                style={[styles.troubleshootingItem, { borderLeftColor: item.color }]}
              >
                <Text style={styles.troubleshootingTitle}>{item.title}</Text>
                <Text style={styles.troubleshootingDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Support Actions */}
        <View style={styles.section}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="mail" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Contact & Support</Text>
            <Text style={styles.sectionSubtitle}>Get help when you need it</Text>
          </View>

          <View style={styles.supportActions}>
            <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
              <Ionicons name="mail" size={16} color={theme.colors.text.inverse} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.supportButton, styles.feedbackButton]}
              onPress={handleSubmitFeedback}
            >
              <Ionicons name="chatbubble" size={16} color={theme.colors.text.inverse} />
              <Text style={styles.supportButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Responsible Gaming Section */}
        <View style={styles.responsibleGamingSection}>
          <View style={styles.centeredSectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.status.error} />
            </View>
            <Text style={[styles.sectionTitle, styles.responsibleGamingTitle]}>
              Responsible Gaming
            </Text>
            <Text style={[styles.sectionSubtitle, styles.responsibleGamingSubtitle]}>
              Betting safely and responsibly
            </Text>
          </View>

          <View style={styles.responsibleGamingCard}>
            <Text style={styles.responsibleGamingText}>
              TrueSharp encourages responsible betting. If you feel your betting is out of control,
              visit{' '}
              <Text style={styles.linkText} onPress={handleGamblingResourcesLink}>
                NCPG
              </Text>{' '}
              or call{' '}
              <Text style={styles.linkText} onPress={handleGamblingHotline}>
                1-800-GAMBLER
              </Text>
              .
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={theme.colors.status.error} />
              <Text style={styles.warningText}>
                Remember: Betting should be fun and within your means. Never bet more than you can
                afford to lose.
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backArrowContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 10,
  },
  backArrow: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shield: {
    width: 32,
    height: 32,
    marginRight: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  centeredSectionHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  gettingStartedGrid: {
    gap: theme.spacing.sm,
  },
  gettingStartedItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
    lineHeight: 18,
  },
  featuresGrid: {
    gap: theme.spacing.xs,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
  },
  featureContent: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  faqContainer: {
    gap: theme.spacing.xs,
  },
  faqItem: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  faqQuestionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
    lineHeight: 20,
  },
  faqAnswer: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  faqAnswerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    paddingTop: theme.spacing.xs,
  },
  troubleshootingContainer: {
    gap: theme.spacing.xs,
  },
  troubleshootingItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
  },
  troubleshootingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  troubleshootingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  supportActions: {
    gap: theme.spacing.sm,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  feedbackButton: {
    backgroundColor: theme.colors.secondary,
  },
  supportButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    marginLeft: theme.spacing.xs,
  },
  responsibleGamingSection: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.status.error,
    ...theme.shadows.sm,
  },
  responsibleGamingTitle: {
    color: theme.colors.status.error,
  },
  responsibleGamingSubtitle: {
    color: theme.colors.status.error,
    fontStyle: 'italic',
  },
  responsibleGamingCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
  },
  responsibleGamingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.status.error,
  },
  warningText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.xs,
    flex: 1,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: theme.spacing.md,
  },
})
