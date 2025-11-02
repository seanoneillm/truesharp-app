import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BettorAccount, 
  fetchBettorAccounts
} from '../../services/sportsbooksService';
import TrueSharpShield from '../common/TrueSharpShield';
import ManageSportsbooksModal from './ManageSportsbooksModal';

interface ConnectedSportsbooksProps {
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

export default function ConnectedSportsbooks({ loading, onRefresh }: ConnectedSportsbooksProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BettorAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);

  // Load bettor accounts
  const loadBettorAccounts = async () => {
    if (!user?.id) return;

    try {
      setAccountsLoading(true);
      const data = await fetchBettorAccounts(user.id);
      setAccounts(data);
    } catch (error) {
      console.error('Error loading bettor accounts:', error);
      Alert.alert('Error', 'Failed to load connected sportsbooks');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Handle refresh (removed - no refresh functionality in web app)

  useEffect(() => {
    loadBettorAccounts();
  }, [user?.id]);

  // Group accounts by book_name and handle duplicate recognition
  const groupAccountsByBook = (accounts: BettorAccount[]) => {
    const grouped = accounts.reduce((acc, account) => {
      const bookName = account.book_name;
      if (!acc[bookName]) {
        acc[bookName] = [];
      }
      acc[bookName].push(account);
      return acc;
    }, {} as Record<string, BettorAccount[]>);

    return Object.entries(grouped).map(([bookName, bookAccounts]) => ({
      bookName,
      accounts: bookAccounts,
      hasMultipleStates: bookAccounts.length > 1,
      states: bookAccounts.map(acc => (acc.region_abbr || 'Unknown').toUpperCase()).join(', ')
    }));
  };

  const renderAccountCard = (groupedAccount: { bookName: string; accounts: BettorAccount[]; hasMultipleStates: boolean; states: string }) => {
    const { bookName, accounts, hasMultipleStates, states } = groupedAccount;
    const mainAccount = accounts[0]; // Use first account for main display
    
    return (
      <View key={bookName} style={styles.accountCard}>
        <View style={styles.accountContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={16} color={theme.colors.primary} />
            </View>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.bookName} numberOfLines={1}>{bookName}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.stateText}>
                {hasMultipleStates ? `${accounts.length} states: ${states}` : states}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: mainAccount.verified && mainAccount.access && !mainAccount.paused 
                ? theme.colors.status.success 
                : theme.colors.status.error 
              }
            ]} />
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="link-outline" size={24} color={theme.colors.text.light} />
      </View>
      <Text style={styles.emptyStateTitle}>No Sportsbooks Connected</Text>
      <Text style={styles.emptyStateSubtitle}>
        Link your sportsbook accounts to start tracking your betting activity automatically.
      </Text>
    </View>
  );

  const renderAccountsList = () => {
    const groupedAccounts = groupAccountsByBook(accounts);
    
    return (
      <View style={styles.accountsGrid}>
        {groupedAccounts.map(renderAccountCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
          <View style={styles.titleContent}>
            <Text style={styles.title}>Connected Sportsbooks</Text>
            <Text style={styles.subtitle}>
              {accountsLoading ? 'Loading accounts...' : 
               accounts.length === 0 ? 'No accounts linked yet' :
               (() => {
                 const groupedAccounts = groupAccountsByBook(accounts);
                 const uniqueBooks = groupedAccounts.length;
                 const totalAccounts = accounts.length;
                 return totalAccounts === uniqueBooks 
                   ? `${uniqueBooks} ${uniqueBooks === 1 ? 'sportsbook' : 'sportsbooks'} connected`
                   : `${uniqueBooks} ${uniqueBooks === 1 ? 'sportsbook' : 'sportsbooks'} • ${totalAccounts} accounts`;
               })()}
            </Text>
          </View>
        </View>
        
        {accounts.length > 0 && (
          <View style={styles.accountsBadge}>
            <Text style={styles.accountsBadgeText}>{groupAccountsByBook(accounts).length}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {accountsLoading ? (
          <View style={styles.loadingState}>
            <View style={styles.loadingCard}>
              <View style={styles.loadingIcon} />
              <View style={styles.loadingTextContainer}>
                <View style={styles.loadingTextLine} />
                <View style={styles.loadingTextLineSmall} />
              </View>
            </View>
            <View style={styles.loadingCard}>
              <View style={styles.loadingIcon} />
              <View style={styles.loadingTextContainer}>
                <View style={styles.loadingTextLine} />
                <View style={styles.loadingTextLineSmall} />
              </View>
            </View>
          </View>
        ) : accounts.length === 0 ? (
          renderEmptyState()
        ) : (
          renderAccountsList()
        )}
      </View>

      {/* Management button at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => setShowManageModal(true)}
        >
          <Ionicons name="settings-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.helpButtonText}>Manage Connections</Text>
        </TouchableOpacity>
      </View>

      <ManageSportsbooksModal
        visible={showManageModal}
        onClose={() => setShowManageModal(false)}
        onConnected={loadBettorAccounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md, // Less right padding to fit badge
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  accountsBadge: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  loadingState: {
    gap: theme.spacing.sm,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  loadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
  },
  loadingTextContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  loadingTextLine: {
    height: 16,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    width: '60%',
  },
  loadingTextLineSmall: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    width: '40%',
  },
  emptyState: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  accountsGrid: {
    marginBottom: theme.spacing.sm,
  },
  accountCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  accountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    minWidth: 0, // Prevent overflow
  },
  bookName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusContainer: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  helpButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});