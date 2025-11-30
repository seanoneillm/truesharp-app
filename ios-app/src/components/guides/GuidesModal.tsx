import React, { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../styles/theme'
import { globalStyles } from '../../styles/globalStyles'
import SportsBookConnectionGuide from './SportsBookConnectionGuide'
import BankrollManagementGuide from './BankrollManagementGuide'
import HowToSellPicksGuide from './HowToSellPicksGuide'

type GuideType = 'sportsbook' | 'bankroll' | 'sellpicks' | null

interface GuidesModalProps {
  onClose: () => void
}

const GuidesModal: React.FC<GuidesModalProps> = ({ onClose }) => {
  const [selectedGuide, setSelectedGuide] = useState<GuideType>(null)

  const guides = [
    {
      id: 'sportsbook' as const,
      title: 'How to Link Sportsbooks',
      subtitle: 'Connect your accounts to sync betting data',
      icon: 'link-outline' as keyof typeof Ionicons.glyphMap,
      description: 'Step-by-step guide to connect your sportsbook accounts and automatically sync your betting activity.',
    },
    {
      id: 'bankroll' as const,
      title: 'Bankroll Management',
      subtitle: 'Master responsible betting practices',
      icon: 'wallet-outline' as keyof typeof Ionicons.glyphMap,
      description: 'Learn essential bankroll management strategies, unit sizing, and long-term betting success principles.',
    },
    {
      id: 'sellpicks' as const,
      title: 'How to Sell Picks',
      subtitle: 'Monetize your betting expertise',
      icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap,
      description: 'Complete guide to creating, monetizing, and managing betting strategies for subscription revenue.',
    },
  ]

  const renderGuideContent = () => {
    switch (selectedGuide) {
      case 'sportsbook':
        return <SportsBookConnectionGuide onClose={() => setSelectedGuide(null)} />
      case 'bankroll':
        return <BankrollManagementGuide onClose={() => setSelectedGuide(null)} />
      case 'sellpicks':
        return <HowToSellPicksGuide onClose={() => setSelectedGuide(null)} />
      default:
        return null
    }
  }

  if (selectedGuide) {
    return (
      <View style={styles.container}>
        {renderGuideContent()}
      </View>
    )
  }

  return (
    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
      <View style={styles.guidesContainer}>
        {guides.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            onPress={() => setSelectedGuide(guide.id)}
          >
            <View style={styles.guideHeader}>
              <View style={styles.guideIconContainer}>
                <Ionicons name={guide.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.light} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          Need help? Contact{' '}
          <Text style={styles.emailLink}>
            info@truesharp.io
          </Text>
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  guidesContainer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  guideCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  guideSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  footerContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emailLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
})

export default GuidesModal