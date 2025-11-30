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

interface BankrollManagementGuideProps {
  onClose: () => void
}

const BankrollManagementGuide: React.FC<BankrollManagementGuideProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Bankroll Management</Text>
            <Text style={styles.headerSubtitle}>Responsible betting practices</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={20} color="white" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* What is a Bankroll? */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>What is a Bankroll?</Text>
            <Text style={styles.sectionText}>
              Money set aside strictly for sports betting. <Text style={styles.bold}>Never bet money you can't afford to lose.</Text> Keep it separate from bills and savings.
            </Text>
          </View>

          {/* How Big Should Your Bankroll Be? */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>How Much Should You Start With?</Text>
            <Text style={styles.sectionText}>
              No universal amount—depends on your comfort level. Start small and grow with discipline.
            </Text>
          </View>

          {/* Units & Bet Sizing */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Units & Bet Sizing</Text>
            <Text style={styles.sectionText}>
              1 unit = 1-2% of bankroll. $1,000 bankroll = $10-20 per unit.
            </Text>
          </View>

          {/* Why Small Bets Win Long-Term */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Why Small Bets Win</Text>
            <Text style={styles.sectionText}>
              Stick to 1-3 units per bet. Protects during losing streaks and compounds wins over time.
            </Text>
          </View>

          {/* Tracking = Finding Your Edge */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Track Everything</Text>
            <Text style={styles.sectionText}>
              Track ROI and patterns. Find what works, eliminate what doesn't.
            </Text>
          </View>

          {/* Bottom Line */}
          <View style={styles.bottomLineContainer}>
            <View style={styles.bottomLineHeader}>
              <Text style={styles.bottomLineIcon}>💡</Text>
              <Text style={styles.bottomLineTitle}>Key Takeaway</Text>
            </View>
            <Text style={styles.bottomLineText}>
              <Text style={styles.bold}>Bankroll + Units + Data</Text> = Smart betting success.
            </Text>
          </View>

          {/* Gambling Help Resources */}
          <View style={styles.helpResourcesContainer}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpIcon}>🆘</Text>
              <Text style={styles.helpTitle}>Need Help?</Text>
            </View>
            <Text style={styles.helpText}>
              If gambling is no longer fun, help is available:
            </Text>
            <View style={styles.helpLinksContainer}>
              <Text style={styles.helpLink}>• National Problem Gambling Helpline: 1-800-522-4700</Text>
              <Text style={styles.helpLink}>• ncpgambling.org</Text>
              <Text style={styles.helpLink}>• gamblersanonymous.org</Text>
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
    backgroundColor: '#10B981', // emerald-500
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
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
    gap: theme.spacing.md,
  },
  sectionBlock: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
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
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#92400E', // amber-800
    lineHeight: 20,
  },
  bulletContainer: {
    marginTop: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  bulletText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.xs,
  },
  bottomLineContainer: {
    backgroundColor: '#F0FDF4', // green-50
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#10B981', // emerald-500
  },
  bottomLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  bottomLineIcon: {
    fontSize: theme.typography.fontSize.xl,
  },
  bottomLineTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#065F46', // emerald-800
  },
  bottomLineText: {
    fontSize: theme.typography.fontSize.base,
    color: '#065F46', // emerald-800
    lineHeight: 24,
  },
  helpResourcesContainer: {
    backgroundColor: '#FEF2F2', // red-50
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5', // red-300
    marginTop: theme.spacing.md,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  helpIcon: {
    fontSize: theme.typography.fontSize.lg,
  },
  helpTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#991B1B', // red-800
  },
  helpText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#991B1B', // red-800
    marginBottom: theme.spacing.sm,
  },
  helpLinksContainer: {
    gap: theme.spacing.xs,
  },
  helpLink: {
    fontSize: theme.typography.fontSize.sm,
    color: '#991B1B', // red-800
    lineHeight: 18,
  },
  bottomPadding: {
    height: 80,
  },
})

export default BankrollManagementGuide